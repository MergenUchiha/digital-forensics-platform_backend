import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCaseDto, UpdateCaseDto } from './dto/case.dto';
import { CaseStatus, Severity } from '@prisma/client';

@Injectable()
export class CasesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCaseDto, userId: string) {
    return this.prisma.case.create({
      data: {
        title: dto.title,
        description: dto.description,
        severity: dto.severity as Severity,
        status: dto.status as CaseStatus || CaseStatus.OPEN,
        tags: dto.tags || [],
        locationCity: dto.location?.city,
        locationCountry: dto.location?.country,
        locationLat: dto.location?.lat,
        locationLng: dto.location?.lng,
        createdById: userId,
        assignedToId: dto.assignedToId,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async findAll(status?: string) {
    return this.prisma.case.findMany({
      where: status ? { status: status as CaseStatus } : undefined,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const caseData = await this.prisma.case.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        evidence: true,
        timelineEvents: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!caseData) {
      throw new NotFoundException('Case not found');
    }

    return caseData;
  }

  async update(id: string, dto: UpdateCaseDto) {
    await this.findOne(id); // Check if exists

    return this.prisma.case.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        severity: dto.severity as Severity,
        status: dto.status as CaseStatus,
        tags: dto.tags,
        assignedToId: dto.assignedToId,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.case.delete({ where: { id } });
  }

  async updateStats(caseId: string) {
    const evidenceCount = await this.prisma.evidence.count({
      where: { caseId },
    });

    const eventsCount = await this.prisma.timelineEvent.count({
      where: { caseId },
    });

    const suspiciousActivities = await this.prisma.timelineEvent.count({
      where: {
        caseId,
        severity: { in: [Severity.HIGH, Severity.CRITICAL] },
      },
    });

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