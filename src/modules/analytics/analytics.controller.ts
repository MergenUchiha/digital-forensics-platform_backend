import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { z } from 'zod';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  type RequestUser,
} from '../../common/decorators/current-user.decorator';
import { AnalyticsService } from './analytics.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

/** A bucket per hour is built in memory, so the range needs a ceiling. */
const TimeSeriesQuerySchema = z.object({
  hours: z.coerce.number().int().min(1).max(8760).default(24),
});

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Headline figures for the caller' })
  async getDashboard(@CurrentUser() user: RequestUser) {
    return this.analyticsService.getDashboard(user);
  }

  @Get('time-series')
  @ApiOperation({ summary: 'Hourly event counts (1–8760 hours)' })
  async getTimeSeries(
    @CurrentUser() user: RequestUser,
    @Query(new ZodValidationPipe(TimeSeriesQuerySchema))
    query: { hours: number },
  ) {
    return this.analyticsService.getTimeSeries(user, query.hours);
  }

  @Get('severity-distribution')
  @ApiOperation({ summary: 'Event counts by severity' })
  async getSeverityDistribution(@CurrentUser() user: RequestUser) {
    return this.analyticsService.getSeverityDistribution(user);
  }

  @Get('source-distribution')
  @ApiOperation({ summary: 'Share of events per source' })
  async getSourceDistribution(@CurrentUser() user: RequestUser) {
    return this.analyticsService.getSourceDistribution(user);
  }
}
