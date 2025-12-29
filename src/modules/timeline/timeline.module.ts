import { Module } from '@nestjs/common';
import { TimelineService } from './timeline.service';
import { TimelineController } from './timeline.controller';
import { CasesModule } from '../cases/cases.module';

@Module({
  imports: [CasesModule],
  providers: [TimelineService],
  controllers: [TimelineController],
  exports: [TimelineService],
})
export class TimelineModule {}