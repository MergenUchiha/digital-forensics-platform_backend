import { Module } from '@nestjs/common';
import { EvidenceService } from './evidence.service';
import { EvidenceController } from './evidence.controller';
import { CasesModule } from '../cases/cases.module';

@Module({
  // The JwtModule import is gone with the `?token=` download path: the file
  // route uses the same guard as every other one now.
  imports: [CasesModule],
  providers: [EvidenceService],
  controllers: [EvidenceController],
  exports: [EvidenceService],
})
export class EvidenceModule {}
