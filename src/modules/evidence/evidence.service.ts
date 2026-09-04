import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { createReadStream } from 'fs';
import { rm } from 'fs/promises';
import { basename, extname } from 'path';
import { PrismaService } from '../../prisma/prisma.service';
import { CasesService } from '../cases/cases.service';
import { CreateEvidenceInput } from './dto/evidence.dto';
import { I18nService } from 'nestjs-i18n';
import type { RequestUser } from '../../common/decorators/current-user.decorator';
import { decodeEvidence } from '../../common/utils/json-columns';

@Injectable()
export class EvidenceService {
  private readonly logger = new Logger(EvidenceService.name);

  constructor(
    private prisma: PrismaService,
    private casesService: CasesService,
    private readonly i18n: I18nService,
  ) {}

  async create(
    input: CreateEvidenceInput,
    user: RequestUser,
    file?: Express.Multer.File,
  ) {
    // Evidence belongs to a case, so the case decides who may add to it.
    await this.casesService.findOne(input.caseId, user);

    const { md5Hash, sha256Hash } = file
      ? await hashFile(file.path)
      : {
          md5Hash: '',
          sha256Hash: '',
        };

    const evidence = await this.prisma.evidence.create({
      data: {
        name: input.name,
        type: input.type,
        description: input.description,
        filePath: file?.path ?? null,
        fileSize: file?.size ?? null,
        // Hashes are what makes a piece of evidence verifiable. When there is
        // no file there is nothing to hash — this used to store 16 random
        // bytes, which looks exactly like a real digest and proves nothing.
        md5Hash,
        sha256Hash,
        originalFilename: file?.originalname ?? null,
        iotDeviceType: input.iotDeviceType ?? null,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        caseId: input.caseId,
        uploadedById: user.id,
        chainOfCustody: {
          create: {
            action: 'COLLECTED',
            notes: this.i18n.t('common.evidence.collected_notes'),
            performedById: user.id,
          },
        },
      },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true } },
        chainOfCustody: {
          include: { performedBy: { select: { id: true, name: true } } },
        },
      },
    });

    await this.casesService.updateStats(input.caseId);

    return decodeEvidence(evidence);
  }

  async findAll(user: RequestUser, caseId?: string) {
    if (caseId) {
      await this.casesService.findOne(caseId, user);
    }

    const results = await this.prisma.evidence.findMany({
      where: {
        ...(caseId ? { caseId } : {}),
        ...(user.role === 'ADMIN'
          ? {}
          : {
              case: {
                OR: [{ createdById: user.id }, { assignedToId: user.id }],
              },
            }),
      },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true } },
        case: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return results.map((row) => decodeEvidence(row));
  }

  async findOne(id: string, user: RequestUser) {
    const evidence = await this.prisma.evidence.findUnique({
      where: { id },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true } },
        case: {
          select: {
            id: true,
            title: true,
            createdById: true,
            assignedToId: true,
          },
        },
        chainOfCustody: {
          include: { performedBy: { select: { id: true, name: true } } },
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    if (!evidence) {
      throw new NotFoundException(
        this.i18n.t('common.errors.evidence_not_found'),
      );
    }

    if (
      user.role !== 'ADMIN' &&
      evidence.case.createdById !== user.id &&
      evidence.case.assignedToId !== user.id
    ) {
      throw new ForbiddenException(
        this.i18n.t('common.errors.case_access_denied'),
      );
    }

    return decodeEvidence(evidence);
  }

  /** Returns the on-disk path and the name to present to the downloader. */
  async resolveFile(id: string, user: RequestUser) {
    const evidence = (await this.findOne(id, user)) as {
      filePath: string | null;
      originalFilename: string | null;
      name: string;
    };

    if (!evidence.filePath) {
      throw new NotFoundException('No file is stored for this evidence');
    }

    const stored = basename(evidence.filePath);
    const suggested =
      evidence.originalFilename ?? `${evidence.name}${extname(stored)}`;

    return { path: evidence.filePath, filename: sanitiseFilename(suggested) };
  }

  async delete(id: string, user: RequestUser) {
    const evidence = (await this.findOne(id, user)) as {
      id: string;
      caseId: string;
      filePath: string | null;
    };

    const deleted = await this.prisma.evidence.delete({ where: { id } });

    // The row used to be deleted while the file stayed on disk: the artefact
    // outlived the chain of custody that documented it.
    if (evidence.filePath) {
      await rm(evidence.filePath, { force: true }).catch((error: Error) =>
        this.logger.error(
          `Could not remove evidence file ${evidence.filePath}: ${error.message}`,
        ),
      );
    }

    await this.casesService.updateStats(evidence.caseId);

    return deleted;
  }
}

/**
 * Streams the file through both digests. `readFileSync` held the entire
 * artefact in memory — a disk image is not a thing to buffer.
 */
async function hashFile(path: string) {
  const md5 = createHash('md5');
  const sha256 = createHash('sha256');

  await new Promise<void>((resolve, reject) => {
    const stream = createReadStream(path);
    stream.on('data', (chunk) => {
      md5.update(chunk);
      sha256.update(chunk);
    });
    stream.on('error', reject);
    stream.on('end', () => resolve());
  });

  return { md5Hash: md5.digest('hex'), sha256Hash: sha256.digest('hex') };
}

function sanitiseFilename(name: string): string {
  return (
    basename(name)
      .replace(/[^\w.\- ]+/g, '_')
      .slice(0, 200) || 'evidence'
  );
}
