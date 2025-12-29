import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Severity, CaseStatus } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboard() {
    const [
      totalCases,
      activeCases,
      criticalCases,
      evidenceCollected,
      eventsAnalyzed,
    ] = await Promise.all([
      this.prisma.case.count(),
      this.prisma.case.count({
        where: {
          status: {
            in: [CaseStatus.OPEN, CaseStatus.IN_PROGRESS],
          },
        },
      }),
      this.prisma.case.count({
        where: { severity: Severity.CRITICAL },
      }),
      this.prisma.evidence.count(),
      this.prisma.timelineEvent.count(),
    ]);

    return {
      totalEvents: eventsAnalyzed,
      criticalAlerts: criticalCases,
      activeIncidents: activeCases,
      securityScore: 87,
      threatsBlocked: Math.floor(eventsAnalyzed * 0.3),
      lastUpdate: new Date().toISOString(),
    };
  }

  async getTimeSeries(hours: number = 24) {
    const data: any[] = [];
    const now = Date.now();

    for (let i = hours; i >= 0; i--) {
      const timestamp = new Date(now - i * 3600000);
      const hour = timestamp.getHours();

      // Simulate realistic traffic patterns
      const baseTraffic = hour >= 8 && hour <= 18 ? 400 : 200;
      const variance = Math.random() * 150;

      data.push({
        time: timestamp.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        timestamp: timestamp.toISOString(),
        events: Math.floor(baseTraffic + variance),
        threats: Math.floor(Math.random() * 50) + 10,
        critical: Math.floor(Math.random() * 20) + 5,
      });
    }

    return data;
  }

  async getSeverityDistribution() {
    const distribution = await this.prisma.timelineEvent.groupBy({
      by: ['severity'],
      _count: true,
    });

    return distribution.map((item) => ({
      severity: item.severity,
      count: item._count,
    }));
  }

  async getSourceDistribution() {
    const distribution = await this.prisma.timelineEvent.groupBy({
      by: ['source'],
      _count: true,
      orderBy: {
        _count: {
          source: 'desc',
        },
      },
      take: 10,
    });

    const total = await this.prisma.timelineEvent.count();

    return distribution.map((item) => ({
      source: item.source,
      count: item._count,
      percentage: ((item._count / total) * 100).toFixed(2),
    }));
  }
}
