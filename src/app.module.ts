import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { CasesModule } from './modules/cases/cases.module';
import { EvidenceModule } from './modules/evidence/evidence.module';
import { TimelineModule } from './modules/timeline/timeline.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { UsersModule } from './modules/users/users.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { SiemLoggerInterceptor } from './common/interceptors/siem-logger.interceptor';
import { LogsModule } from './logs/logs.module';
import { LogsService } from './logs/logs.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    CasesModule,
    EvidenceModule,
    TimelineModule,
    AnalyticsModule,
    UsersModule,
    NotificationsModule,
    LogsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useFactory: (configService: ConfigService, logsService: LogsService) =>
        new SiemLoggerInterceptor(configService, logsService),
      inject: [ConfigService, LogsService],
    },
  ],
})
export class AppModule {}
