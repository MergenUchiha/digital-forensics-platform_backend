import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCaseInput, UpdateCaseInput } from './dto/case.dto';
import { CaseStatus, Severity } from '@prisma/client';

@Injectable()
export class CasesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCaseInput, userId: string) {
    return this.prisma.case.create({
      data: {
        title: dto.title,
        description: dto.description,
        severity: dto.severity as Severity,
        status: (dto.status as CaseStatus) || CaseStatus.OPEN,
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
          select: { id: true, name: true, email: true, role: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });
  }

  async findAll(status?: string) {
    const normalizedStatus = status ? status.toUpperCase() : undefined;
    const validStatuses = ['OPEN', 'IN_PROGRESS', 'CLOSED', 'ARCHIVED'];
    
    if (normalizedStatus && !validStatuses.includes(normalizedStatus)) {
      return this.prisma.case.findMany({
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

    return this.prisma.case.findMany({
      where: normalizedStatus ? { status: normalizedStatus as CaseStatus } : undefined,
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
      throw new NotFoundException('Case not found');
    }

    return caseData;
  }

  async update(id: string, dto: UpdateCaseInput) {
    console.log('📝 CasesService.update called');
    console.log('Case ID:', id);
    console.log('DTO received:', JSON.stringify(dto, null, 2));
    
    // Проверяем существование кейса
    const existingCase = await this.prisma.case.findUnique({
      where: { id },
    });

    if (!existingCase) {
      console.error('❌ Case not found:', id);
      throw new NotFoundException('Case not found');
    }

    console.log('✅ Existing case found:', existingCase.title);

    // Подготавливаем данные для обновления
    const updateData: any = {};

    if (dto.title !== undefined) {
      console.log('Updating title:', dto.title);
      updateData.title = dto.title;
    }
    if (dto.description !== undefined) {
      console.log('Updating description');
      updateData.description = dto.description;
    }
    if (dto.severity !== undefined) {
      // Нормализуем severity
      const normalizedSeverity = dto.severity.toString().toUpperCase();
      console.log('Normalizing severity:', dto.severity, '->', normalizedSeverity);
      
      if (['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(normalizedSeverity)) {
        updateData.severity = normalizedSeverity as Severity;
      } else {
        console.warn('⚠️ Invalid severity value:', normalizedSeverity);
      }
    }
    if (dto.status !== undefined) {
      // Нормализуем status
      const normalizedStatus = dto.status.toString().toUpperCase();
      console.log('Normalizing status:', dto.status, '->', normalizedStatus);
      
      if (['OPEN', 'IN_PROGRESS', 'CLOSED', 'ARCHIVED'].includes(normalizedStatus)) {
        updateData.status = normalizedStatus as CaseStatus;
      } else {
        console.warn('⚠️ Invalid status value:', normalizedStatus);
      }
    }
    if (dto.tags !== undefined) {
      console.log('Updating tags:', dto.tags);
      updateData.tags = dto.tags;
    }
    if (dto.assignedToId !== undefined) {
      console.log('Updating assignedToId:', dto.assignedToId);
      updateData.assignedToId = dto.assignedToId;
    }

    console.log('📦 Final update data:', JSON.stringify(updateData, null, 2));

    if (Object.keys(updateData).length === 0) {
      console.log('⚠️ No fields to update');
      return existingCase;
    }

    try {
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
      
      console.log('✅ Case updated successfully');
      return updatedCase;
    } catch (error) {
      console.error('❌ Database error during update:', error);
      throw error;
    }
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