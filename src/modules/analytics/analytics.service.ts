import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { RequestUser } from '../../common/decorators/current-user.decorator';

export interface DashboardStats {
  totalCases: number;
  activeCases: number;
  criticalCases: number;
  evidenceCollected: number;
  eventsAnalyzed: number;
  suspiciousEvents: number;
  lastUpdate: string;
}

export interface TimeSeriesPoint {
  time: string;
  timestamp: string;
  events: number;
  critical: number;
  suspicious: number;
}

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  /** Analysts see figures for their own cases; an admin sees the whole system. */
  private scope(user: RequestUser): Prisma.CaseWhereInput | undefined {
    if (user.role === 'ADMIN') return undefined;
    return { OR: [{ createdById: user.id }, { assignedToId: user.id }] };
  }

  private eventScope(user: RequestUser): Prisma.TimelineEventWhereInput {
    const scope = this.scope(user);
    return scope ? { case: scope } : {};
  }

  private evidenceScope(user: RequestUser): Prisma.EvidenceWhereInput {
    const scope = this.scope(user);
    return scope ? { case: scope } : {};
  }

  /**
   * Every figure here is counted from the database.
   *
   * Two of these counts were computed and then dropped on the floor, the
   * security score was the literal 87, and "threats blocked" was the event
   * count multiplied by 0.3.
   */
  async getDashboard(user: RequestUser): Promise<DashboardStats> {
    const caseScope = this.scope(user);

    const [
      totalCases,
      activeCases,
      criticalCases,
      evidenceCollected,
      eventsAnalyzed,
      suspiciousEvents,
    ] = await Promise.all([
      this.prisma.case.count({ where: caseScope }),
      this.prisma.case.count({
        where: { ...caseScope, status: { in: ['OPEN', 'IN_PROGRESS'] } },
      }),
      this.prisma.case.count({ where: { ...caseScope, severity: 'CRITICAL' } }),
      this.prisma.evidence.count({ where: this.evidenceScope(user) }),
      this.prisma.timelineEvent.count({ where: this.eventScope(user) }),
      this.prisma.timelineEvent.count({
        where: {
          ...this.eventScope(user),
          severity: { in: ['HIGH', 'CRITICAL'] },
        },
      }),
    ]);

    return {
      totalCases,
      activeCases,
      criticalCases,
      evidenceCollected,
      eventsAnalyzed,
      suspiciousEvents,
      lastUpdate: new Date().toISOString(),
    };
  }

  /**
   * Hourly buckets of real timeline events. This used to return
   * `Math.random()` shaped into a plausible daily curve — the chart on the
   * dashboard was an animation, not a measurement.
   */
  async getTimeSeries(
    user: RequestUser,
    hours: number,
  ): Promise<TimeSeriesPoint[]> {
    const now = Date.now();
    const start = new Date(now - hours * 3_600_000);

    const events = await this.prisma.timelineEvent.findMany({
      where: { ...this.eventScope(user), timestamp: { gte: start } },
      select: { timestamp: true, severity: true },
      orderBy: { timestamp: 'asc' },
    });

    const buckets = new Map<string, TimeSeriesPoint>();

    for (let i = 0; i <= hours; i++) {
      const at = new Date(start.getTime() + i * 3_600_000);
      buckets.set(hourKey(at), {
        time: at.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        timestamp: at.toISOString(),
        events: 0,
        critical: 0,
        suspicious: 0,
      });
    }

    for (const event of events) {
      const bucket = buckets.get(hourKey(event.timestamp));
      if (!bucket) continue;

      bucket.events++;
      if (event.severity === 'CRITICAL') bucket.critical++;
      if (event.severity === 'CRITICAL' || event.severity === 'HIGH') {
        bucket.suspicious++;
      }
    }

    return [...buckets.values()];
  }

  async getSeverityDistribution(user: RequestUser) {
    const distribution = await this.prisma.timelineEvent.groupBy({
      by: ['severity'],
      where: this.eventScope(user),
      _count: true,
    });

    return distribution.map((item) => ({
      severity: item.severity,
      count: item._count,
    }));
  }

  async getSourceDistribution(user: RequestUser) {
    const where = this.eventScope(user);

    const [distribution, total] = await Promise.all([
      this.prisma.timelineEvent.groupBy({
        by: ['source'],
        where,
        _count: true,
        orderBy: { _count: { source: 'desc' } },
        take: 10,
      }),
      this.prisma.timelineEvent.count({ where }),
    ]);

    return distribution.map((item) => ({
      source: item.source,
      count: item._count,
      // Division by zero on an empty database produced the string "NaN".
      percentage:
        total === 0 ? '0.00' : ((item._count / total) * 100).toFixed(2),
    }));
  }
}

function hourKey(date: Date): string {
  return date.toISOString().slice(0, 13);
}
