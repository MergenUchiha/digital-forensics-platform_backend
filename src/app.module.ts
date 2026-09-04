import { Module } from '@nestjs/common';
import { validateEnv } from './config/env.validation';
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
import {
  I18nModule,
  AcceptLanguageResolver,
  HeaderResolver,
} from 'nestjs-i18n';
import * as path from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        // `dist/i18n`, next to the compiled entry point. This read
        // `__dirname/../i18n`, which only resolved because the build was
        // emitting to `dist/src/` — fixing the output path would have broken
        // translations silently, falling back to raw keys.
        path: path.join(__dirname, 'i18n'),
        watch: process.env.NODE_ENV !== 'production',
      },
      resolvers: [new HeaderResolver(['x-lang']), AcceptLanguageResolver],
    }),
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
