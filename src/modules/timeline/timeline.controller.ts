import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, UsePipes } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TimelineService } from './timeline.service';
import { CreateTimelineEventSchema, CreateTimelineEventInput } from './dto/timeline.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@ApiTags('Timeline')
@Controller('timeline')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TimelineController {
  constructor(private timelineService: TimelineService) {}

  @Post()
  @ApiOperation({ summary: 'Create timeline event' })
  @UsePipes(new ZodValidationPipe(CreateTimelineEventSchema))
  async create(@Body() dto: CreateTimelineEventInput) {
    return this.timelineService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all timeline events' })
  async findAll(
    @Query('caseId') caseId?: string,
    @Query('severity') severity?: string,
  ) {
    return this.timelineService.findAll(caseId, severity);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get timeline event by ID' })
  async findOne(@Param('id') id: string) {
    return this.timelineService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete timeline event' })
  async delete(@Param('id') id: string) {
    return this.timelineService.delete(id);
  }
}