import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CasesService } from '../cases/cases.service';
import { CreateEvidenceInput } from './dto/evidence.dto';
import * as crypto from 'crypto';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class EvidenceService {
  constructor(
    private prisma: PrismaService,
    private casesService: CasesService,
    private readonly i18n: I18nService,
  ) {}

  private parseMetadata(data: any) {
    if (!data) return data;
    if (Array.isArray(data)) return data.map((item) => this.parseMetadata(item));
    if (typeof data.metadata === 'string') {
      try { data.metadata = JSON.parse(data.metadata); } catch { data.metadata = null; }
    }
    return data;
  }

  async create(input: CreateEvidenceInput, userId: string, file?: Express.Multer.File) {
    // Generate hashes
    const md5Hash = file 
      ? crypto.createHash('md5').update(file.buffer).digest('hex')
      : crypto.randomBytes(16).toString('hex');
    
    const sha256Hash = file 
      ? crypto.createHash('sha256').update(file.buffer).digest('hex')
      : crypto.randomBytes(32).toString('hex');

    // Create evidence
    const evidence = await this.prisma.evidence.create({
      data: {
        name: input.name,
        type: input.type,
        description: input.description,
        filePath: file?.path,
        fileSize: file?.size,
        md5Hash,
        sha256Hash,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        caseId: input.caseId,
        uploadedById: userId,
        chainOfCustody: {
          create: {
            action: 'COLLECTED',
            notes: this.i18n.t('common.evidence.collected_notes'),
            performedById: userId,
          },
        },
      },
      include: {
        uploadedBy: { 
          select: { id: true, name: true, email: true } 
        },
        chainOfCustody: {
          include: {
            performedBy: {
              select: { id: true, name: true }
            }
          }
        },
      },
    });

    // Update case stats
    await this.casesService.updateStats(input.caseId);

    return this.parseMetadata(evidence);
  }

  async findAll(caseId?: string) {
    const results = await this.prisma.evidence.findMany({
      where: caseId ? { caseId } : undefined,
      include: {
        uploadedBy: { 
          select: { id: true, name: true, email: true } 
        },
        case: { 
          select: { id: true, title: true } 
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return this.parseMetadata(results);
  }

  async findOne(id: string) {
    const evidence = await this.prisma.evidence.findUnique({
      where: { id },
      include: {
        uploadedBy: { 
          select: { id: true, name: true, email: true } 
        },
        case: { 
          select: { id: true, title: true } 
        },
        chainOfCustody: {
          include: {
            performedBy: { 
              select: { id: true, name: true } 
            },
          },
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    if (!evidence) {
      throw new NotFoundException(this.i18n.t('common.errors.evidence_not_found'));
    }

    return this.parseMetadata(evidence);
  }

  async delete(id: string) {
    await this.findOne(id); // Check exists
    return this.prisma.evidence.delete({ where: { id } });
  }
}