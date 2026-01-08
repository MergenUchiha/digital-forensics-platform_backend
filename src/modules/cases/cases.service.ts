// src/modules/cases/cases.service.ts
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCaseInput, UpdateCaseInput } from './dto/case.dto';
import { CaseStatus, Severity } from '@prisma/client';

@Injectable()
export class CasesService {
  private readonly logger = new Logger(CasesService.name);

  constructor(private prisma: PrismaService) {}

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
        `Invalid ${enumName}: ${value}. Valid values are: ${validValues.join(', ')}`,
      );
    }

    return normalized;
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

    return this.prisma.case.create({
      data: {
        title: dto.title.trim(),
        description: dto.description.trim(),
        severity: severity!,
        status: status!,
        tags: dto.tags?.map((tag) => tag.trim()) || [],
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
  }

  async findAll(status?: string) {
    this.logger.debug(`Finding all cases with status: ${status || 'all'}`);

    const normalizedStatus = status
      ? this.normalizeEnum(
          status,
          ['OPEN', 'IN_PROGRESS', 'CLOSED', 'ARCHIVED'] as const,
          'status',
        )
      : undefined;

    return this.prisma.case.findMany({
      where: normalizedStatus ? { status: normalizedStatus } : undefined,
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
  }

  async findOne(id: string) {
    this.logger.debug(`Finding case: ${id}`);

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
      throw new NotFoundException(`Case with ID ${id} not found`);
    }

    return caseData;
  }

  async update(id: string, dto: UpdateCaseInput) {
    this.logger.log(`Updating case: ${id}`);
    this.logger.debug(`Update data: ${JSON.stringify(dto)}`);

    // Check if case exists
    await this.findOne(id);

    // Build update object
    const updateData: any = {};

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
      updateData.tags = dto.tags.map((tag) => tag.trim());
    }

    if (dto.assignedToId !== undefined) {
      updateData.assignedToId = dto.assignedToId;
    }

    // If no fields to update
    if (Object.keys(updateData).length === 0) {
      this.logger.warn(`No fields to update for case: ${id}`);
      return this.findOne(id);
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
    return updatedCase;
  }

  async delete(id: string) {
    this.logger.log(`Deleting case: ${id}`);

    // Check if case exists
    await this.findOne(id);

    // Use transaction to delete case and all related data
    return this.prisma.$transaction(async (tx) => {
      // Delete related timeline events
      await tx.timelineEvent.deleteMany({ where: { caseId: id } });

      // Delete chain of custody entries for related evidence
      const evidence = await tx.evidence.findMany({
        where: { caseId: id },
        select: { id: true },
      });

      for (const ev of evidence) {
        await tx.chainOfCustodyEntry.deleteMany({
          where: { evidenceId: ev.id },
        });
      }

      // Delete evidence
      await tx.evidence.deleteMany({ where: { caseId: id } });

      // Delete case
      return tx.case.delete({ where: { id } });
    });
  }

  /**
   * Update case statistics based on related data
   */
  async updateStats(caseId: string) {
    this.logger.debug(`Updating stats for case: ${caseId}`);

    const [evidenceCount, eventsCount, suspiciousActivities] = await Promise.all([
      this.prisma.evidence.count({ where: { caseId } }),
      this.prisma.timelineEvent.count({ where: { caseId } }),
      this.prisma.timelineEvent.count({
        where: {
          caseId,
          severity: { in: [Severity.HIGH, Severity.CRITICAL] },
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