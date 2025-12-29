import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EvidenceType, CustodyAction } from '@prisma/client';
import { CasesService } from '../cases/cases.service';
import { CreateEvidenceInput } from './dto/evidence.dto';
import * as crypto from 'crypto';

@Injectable()
export class EvidenceService {
  constructor(
    private prisma: PrismaService,
    private casesService: CasesService,
  ) {}

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
        type: input.type as EvidenceType,
        description: input.description,
        filePath: file?.path,
        fileSize: file?.size,
        md5Hash,
        sha256Hash,
        metadata: input.metadata || {},
        caseId: input.caseId,
        uploadedById: userId,
        chainOfCustody: {
          create: {
            action: CustodyAction.COLLECTED,
            notes: 'Evidence collected and uploaded',
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

    return evidence;
  }

  async findAll(caseId?: string) {
    return this.prisma.evidence.findMany({
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
      throw new NotFoundException('Evidence not found');
    }

    return evidence;
  }

  async delete(id: string) {
    await this.findOne(id); // Check exists
    return this.prisma.evidence.delete({ where: { id } });
  }
}