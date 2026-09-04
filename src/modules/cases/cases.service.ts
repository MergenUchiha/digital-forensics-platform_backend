// src/modules/cases/cases.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { rm } from 'fs/promises';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCaseInput, UpdateCaseInput } from './dto/case.dto';
import { I18nService } from 'nestjs-i18n';
import type { RequestUser } from '../../common/decorators/current-user.decorator';
import { decodeCase } from '../../common/utils/json-columns';

@Injectable()
export class CasesService {
  private readonly logger = new Logger(CasesService.name);

  constructor(
    private prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Normalize enum value to match Prisma schema
   */
  private normalizeEnum<T extends string>(
    value: string | undefined,
    validValues: readonly T[],
    enumName: string,
  ): T | undefined {
    if (!value) return undefined;

    const normalized = value.toUpperCase() as T;

    if (!validValues.includes(normalized)) {
      throw new BadRequestException(
        this.i18n.t('common.errors.invalid_enum', {
          args: { enumName, value, validValues: validValues.join(', ') },
        }),
      );
    }

    return normalized;
  }

  /**
   * An analyst sees the cases they opened and the ones assigned to them; an
   * administrator sees everything.
   *
   * Before this, every authenticated user could read, edit and delete every
   * case in the system — and deleting one cascades through its evidence, chain
   * of custody and timeline.
   */
  private scopeFor(user: RequestUser): Prisma.CaseWhereInput | undefined {
    if (user.role === 'ADMIN') return undefined;
    return {
      OR: [{ createdById: user.id }, { assignedToId: user.id }],
    };
  }

  private assertAccess(
    caseData: { createdById: string; assignedToId: string | null },
    user: RequestUser,
  ) {
    if (user.role === 'ADMIN') return;
    if (caseData.createdById === user.id || caseData.assignedToId === user.id) {
      return;
    }
    throw new ForbiddenException(
      this.i18n.t('common.errors.case_access_denied'),
    );
  }

  async create(dto: CreateCaseInput, userId: string) {
    this.logger.log(`Creating case: ${dto.title}`);

    const severity = this.normalizeEnum(
      dto.severity,
      ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const,
      'severity',
    );

    const status = this.normalizeEnum(
      dto.status || 'OPEN',
      ['OPEN', 'IN_PROGRESS', 'CLOSED', 'ARCHIVED'] as const,
      'status',
    );

    const result = await this.prisma.case.create({
      data: {
        title: dto.title.trim(),
        description: dto.description.trim(),
        severity: severity!,
        status: status!,
        tags: JSON.stringify(dto.tags?.map((tag) => tag.trim()) || []),
        locationCity: dto.location?.city?.trim(),
        locationCountry: dto.location?.country?.trim(),
        locationLat: dto.location?.lat,
        locationLng: dto.location?.lng,
        createdById: userId,
        assignedToId: dto.assignedToId,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });
    return decodeCase(result);
  }

  async findAll(user: RequestUser, status?: string) {
    const normalizedStatus = status
      ? this.normalizeEnum(
          status,
          ['OPEN', 'IN_PROGRESS', 'CLOSED', 'ARCHIVED'] as const,
          'status',
        )
      : undefined;

    const scope = this.scopeFor(user);
    const where: Prisma.CaseWhereInput = {
      ...(scope ?? {}),
      ...(normalizedStatus ? { status: normalizedStatus } : {}),
    };

    const results = await this.prisma.case.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return results.map((row) => decodeCase(row));
  }

  async findOne(id: string, user?: RequestUser) {
    const caseData = await this.prisma.case.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true, role: true },
        },
        evidence: {
          include: {
            uploadedBy: {
              select: { id: true, name: true, email: true },
            },
            chainOfCustody: {
              include: {
                performedBy: {
                  select: { id: true, name: true },
                },
              },
              orderBy: { timestamp: 'desc' },
            },
          },
        },
        timelineEvents: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!caseData) {
      throw new NotFoundException(
        this.i18n.t('common.errors.case_not_found', { args: { id } }),
      );
    }

    if (user) this.assertAccess(caseData, user);

    return decodeCase(caseData);
  }

  async update(id: string, dto: UpdateCaseInput, user: RequestUser) {
    await this.findOne(id, user);

    const updateData: Prisma.CaseUpdateInput = {};

    if (dto.title !== undefined) {
      updateData.title = dto.title.trim();
    }

    if (dto.description !== undefined) {
      updateData.description = dto.description.trim();
    }

    if (dto.severity !== undefined) {
      updateData.severity = this.normalizeEnum(
        dto.severity,
        ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const,
        'severity',
      );
    }

    if (dto.status !== undefined) {
      updateData.status = this.normalizeEnum(
        dto.status,
        ['OPEN', 'IN_PROGRESS', 'CLOSED', 'ARCHIVED'] as const,
        'status',
      );
    }

    if (dto.tags !== undefined) {
      updateData.tags = JSON.stringify(dto.tags.map((tag) => tag.trim()));
    }

    if (dto.assignedToId !== undefined) {
      updateData.assignedTo = dto.assignedToId
        ? { connect: { id: dto.assignedToId } }
        : { disconnect: true };
    }

    // If no fields to update
    if (Object.keys(updateData).length === 0) {
      this.logger.warn(`No fields to update for case: ${id}`);
      return this.findOne(id, user);
    }

    this.logger.debug(`Final update data: ${JSON.stringify(updateData)}`);

    const updatedCase = await this.prisma.case.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    this.logger.log(`Case updated successfully: ${id}`);
    return decodeCase(updatedCase);
  }

  async delete(id: string, user: RequestUser) {
    await this.findOne(id, user);

    this.logger.warn(`Case ${id} deleted by ${user.email}`);

    // Collect the file paths before the rows go, so the uploads can be removed
    // afterwards. Deleting a case cascades through its evidence; leaving the
    // files behind means orphaned artefacts with no chain of custody at all.
    const files = await this.prisma.evidence.findMany({
      where: { caseId: id, filePath: { not: null } },
      select: { filePath: true },
    });

    const deleted = await this.prisma.$transaction(async (tx) => {
      await tx.timelineEvent.deleteMany({ where: { caseId: id } });

      const evidence = await tx.evidence.findMany({
        where: { caseId: id },
        select: { id: true },
      });

      for (const ev of evidence) {
        await tx.chainOfCustodyEntry.deleteMany({
          where: { evidenceId: ev.id },
        });
      }

      await tx.evidence.deleteMany({ where: { caseId: id } });

      return tx.case.delete({ where: { id } });
    });

    for (const { filePath } of files) {
      if (!filePath) continue;
      await rm(filePath, { force: true }).catch((error: Error) =>
        this.logger.error(
          `Could not remove evidence file ${filePath}: ${error.message}`,
        ),
      );
    }

    return deleted;
  }

  /**
   * Update case statistics based on related data
   */
  async updateStats(caseId: string) {
    this.logger.debug(`Updating stats for case: ${caseId}`);

    const [evidenceCount, eventsCount, suspiciousActivities] =
      await Promise.all([
        this.prisma.evidence.count({ where: { caseId } }),
        this.prisma.timelineEvent.count({ where: { caseId } }),
        this.prisma.timelineEvent.count({
          where: {
            caseId,
            severity: { in: ['HIGH', 'CRITICAL'] },
          },
        }),
      ]);

    return this.prisma.case.update({
      where: { id: caseId },
      data: {
        evidenceCount,
        eventsCount,
        suspiciousActivities,
      },
    });
  }
}
