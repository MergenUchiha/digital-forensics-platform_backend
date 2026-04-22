import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CasesService } from '../cases/cases.service';
import { CreateTimelineEventInput } from './dto/timeline.dto';

@Injectable()
export class TimelineService {
  constructor(
    private prisma: PrismaService,
    private casesService: CasesService,
  ) {}

  private parseJsonFields(data: any) {
    if (!data) return data;
    if (Array.isArray(data)) return data.map((item) => this.parseJsonFields(item));
    for (const field of ['ipAddresses', 'usernames', 'files', 'devices', 'metadata']) {
      if (typeof data[field] === 'string') {
        try { data[field] = JSON.parse(data[field]); } catch { data[field] = field === 'metadata' ? null : []; }
      }
    }
    return data;
  }

  async create(input: CreateTimelineEventInput) {
    const event = await this.prisma.timelineEvent.create({
      data: {
        timestamp: new Date(input.timestamp),
        type: input.type,
        source: input.source,
        severity: input.severity,
        title: input.title,
        description: input.description,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        ipAddresses: JSON.stringify(input.ipAddresses || []),
        usernames: JSON.stringify(input.usernames || []),
        files: JSON.stringify(input.files || []),
        devices: JSON.stringify(input.devices || []),
        caseId: input.caseId,
      },
    });

    // Update case stats
    await this.casesService.updateStats(input.caseId);

    return this.parseJsonFields(event);
  }

  async findAll(caseId?: string, severity?: string) {
    // Нормализуем severity к верхнему регистру если передан
    const normalizedSeverity = severity ? severity.toUpperCase() : undefined;

    // Проверяем валидность severity
    const validSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    if (normalizedSeverity && !validSeverities.includes(normalizedSeverity)) {
      const results = await this.prisma.timelineEvent.findMany({
        where: {
          ...(caseId && { caseId }),
        },
        include: {
          case: {
            select: { id: true, title: true },
          },
        },
        orderBy: { timestamp: 'desc' },
      });
      return this.parseJsonFields(results);
    }

    const results = await this.prisma.timelineEvent.findMany({
      where: {
        ...(caseId && { caseId }),
        ...(normalizedSeverity && { severity: normalizedSeverity }),
      },
      include: {
        case: {
          select: { id: true, title: true },
        },
      },
      orderBy: { timestamp: 'desc' },
    });
    return this.parseJsonFields(results);
  }

  async findOne(id: string) {
    const event = await this.prisma.timelineEvent.findUnique({
      where: { id },
      include: {
        case: {
          select: { id: true, title: true },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Timeline event not found');
    }

    return this.parseJsonFields(event);
  }

  async delete(id: string) {
    await this.findOne(id); // Check exists
    return this.prisma.timelineEvent.delete({ where: { id } });
  }
}
