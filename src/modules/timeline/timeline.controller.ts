import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  type RequestUser,
} from '../../common/decorators/current-user.decorator';
import { TimelineService } from './timeline.service';
import {
  CreateTimelineEventSchema,
  TimelineFilterSchema,
  type CreateTimelineEventInput,
  type TimelineFilterInput,
} from './dto/timeline.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@ApiTags('Timeline')
@Controller('timeline')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TimelineController {
  constructor(private timelineService: TimelineService) {}

  @Post()
  @ApiOperation({ summary: 'Add an event to a case timeline' })
  async create(
    @Body(new ZodValidationPipe(CreateTimelineEventSchema))
    dto: CreateTimelineEventInput,
    @CurrentUser() user: RequestUser,
  ) {
    return this.timelineService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'List timeline events the caller may see' })
  async findAll(
    @CurrentUser() user: RequestUser,
    @Query(new ZodValidationPipe(TimelineFilterSchema))
    filter: TimelineFilterInput,
  ) {
    return this.timelineService.findAll(user, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a timeline event by id' })
  async findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.timelineService.findOne(id, user);
  }

  /** Removing an event from a forensic timeline is an administrator action. */
  @Roles('ADMIN')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a timeline event (admin only)' })
  async delete(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.timelineService.delete(id, user);
  }
}
