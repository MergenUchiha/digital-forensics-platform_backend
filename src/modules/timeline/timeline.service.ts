import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CasesService } from '../cases/cases.service';
import {
  CreateTimelineEventInput,
  TimelineFilterInput,
} from './dto/timeline.dto';
import { decodeTimelineEvent } from '../../common/utils/json-columns';
import type { RequestUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class TimelineService {
  constructor(
    private prisma: PrismaService,
    private casesService: CasesService,
  ) {}

  async create(input: CreateTimelineEventInput, user: RequestUser) {
    // An event belongs to a case, so the case decides who may add to it.
    await this.casesService.findOne(input.caseId, user);

    const event = await this.prisma.timelineEvent.create({
      data: {
        timestamp: new Date(input.timestamp),
        type: input.type,
        source: input.source,
        severity: input.severity,
        title: input.title,
        description: input.description,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        ipAddresses: JSON.stringify(input.ipAddresses ?? []),
        usernames: JSON.stringify(input.usernames ?? []),
        files: JSON.stringify(input.files ?? []),
        devices: JSON.stringify(input.devices ?? []),
        caseId: input.caseId,
      },
    });

    await this.casesService.updateStats(input.caseId);

    return decodeTimelineEvent(event);
  }

  /**
   * An unknown `severity` used to fall through to a branch that returned every
   * event regardless — a filter that silently did nothing. It is rejected by
   * the schema now.
   */
  async findAll(user: RequestUser, filter: TimelineFilterInput) {
    if (filter.caseId) {
      await this.casesService.findOne(filter.caseId, user);
    }

    const where: Prisma.TimelineEventWhereInput = {
      ...(filter.caseId ? { caseId: filter.caseId } : {}),
      ...(filter.severity ? { severity: filter.severity } : {}),
      ...(user.role === 'ADMIN'
        ? {}
        : {
            case: {
              OR: [{ createdById: user.id }, { assignedToId: user.id }],
            },
          }),
    };

    const results = await this.prisma.timelineEvent.findMany({
      where,
      include: { case: { select: { id: true, title: true } } },
      orderBy: { timestamp: 'desc' },
      take: filter.limit,
    });

    return results.map((row) => decodeTimelineEvent(row));
  }

  async findOne(id: string, user: RequestUser) {
    const event = await this.prisma.timelineEvent.findUnique({
      where: { id },
      include: {
        case: {
          select: {
            id: true,
            title: true,
            createdById: true,
            assignedToId: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Timeline event not found');
    }

    // Reuse the case's access rules rather than restating them.
    await this.casesService.findOne(event.caseId, user);

    return decodeTimelineEvent(event);
  }

  async delete(id: string, user: RequestUser) {
    const event = await this.findOne(id, user);

    const deleted = await this.prisma.timelineEvent.delete({ where: { id } });

    await this.casesService.updateStats(event.caseId);

    return deleted;
  }
}
