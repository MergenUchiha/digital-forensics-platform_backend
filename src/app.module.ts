import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { CasesModule } from './modules/cases/cases.module';
import { EvidenceModule } from './modules/evidence/evidence.module';
import { TimelineModule } from './modules/timeline/timeline.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule, 
    AuthModule, 
    CasesModule, 
    EvidenceModule, 
    TimelineModule, 
    AnalyticsModule, 
    UsersModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
