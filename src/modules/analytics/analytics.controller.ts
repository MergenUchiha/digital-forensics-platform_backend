import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  async getDashboard() {
    return this.analyticsService.getDashboard();
  }

  @Get('time-series')
  @ApiOperation({ summary: 'Get time series data' })
  async getTimeSeries(@Query('hours') hours?: string) {
    return this.analyticsService.getTimeSeries(
      hours ? parseInt(hours) : 24
    );
  }

  @Get('severity-distribution')
  @ApiOperation({ summary: 'Get severity distribution' })
  async getSeverityDistribution() {
    return this.analyticsService.getSeverityDistribution();
  }

  @Get('source-distribution')
  @ApiOperation({ summary: 'Get source distribution' })
  async getSourceDistribution() {
    return this.analyticsService.getSourceDistribution();
  }
}