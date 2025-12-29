import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventType, Severity } from '@prisma/client';
import { CasesService } from '../cases/cases.service';
import { CreateTimelineEventInput } from './dto/timeline.dto';

@Injectable()
export class TimelineService {
  constructor(
    private prisma: PrismaService,
    private casesService: CasesService,
  ) {}

  async create(input: CreateTimelineEventInput) {
    const event = await this.prisma.timelineEvent.create({
      data: {
        timestamp: new Date(input.timestamp),
        type: input.type as EventType,
        source: input.source,
        severity: input.severity as Severity,
        title: input.title,
        description: input.description,
        metadata: input.metadata || {},
        ipAddresses: input.ipAddresses || [],
        usernames: input.usernames || [],
        files: input.files || [],
        devices: input.devices || [],
        caseId: input.caseId,
      },
    });

    // Update case stats
    await this.casesService.updateStats(input.caseId);

    return event;
  }

  async findAll(caseId?: string, severity?: string) {
    return this.prisma.timelineEvent.findMany({
      where: {
        ...(caseId && { caseId }),
        ...(severity && { severity: severity as Severity }),
      },
      include: {
        case: {
          select: { id: true, title: true },
        },
      },
      orderBy: { timestamp: 'desc' },
    });
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

    return event;
  }

  async delete(id: string) {
    await this.findOne(id); // Check exists
    return this.prisma.timelineEvent.delete({ where: { id } });
  }
}