// src/main.ts
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { ConfigService } from '@nestjs/config';
import * as morgan from 'morgan';
import type { Request, Response } from 'express';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger:
      process.env.NODE_ENV === 'production'
        ? ['error', 'warn', 'log']
        : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = configService.getOrThrow<number>('PORT');
  const nodeEnv = configService.getOrThrow<string>('NODE_ENV');

  // The list used to be hardcoded, and carried a production IP with a
  // trailing slash — an origin never has one, so that entry could not match
  // anything. `FRONTEND_URL` was read into a variable and never used.
  app.enableCors({
    origin: configService
      .getOrThrow<string>('CORS_ORIGINS')
      .split(',')
      .map((origin) => origin.trim().replace(/\/$/, ''))
      .filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-api-key',
      'x-lang',
      'Accept-Language',
    ],
  });

  // API prefix
  app.setGlobalPrefix('api');

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // HTTP request logging (development only)
  if (nodeEnv === 'development') {
    app.use(
      morgan('dev', {
        skip: (req) => req.url === '/api/health',
      }),
    );
  }

  // Health check endpoint
  app.getHttpAdapter().get('/api/health', (_req: Request, res: Response) =>
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    }),
  );

  // Off by default in production: the schema of a forensics platform is a map
  // of everything worth attacking.
  if (configService.get<boolean>('SWAGGER_ENABLED')) {
    const config = new DocumentBuilder()
      .setTitle('Digital Forensics API')
      .setDescription('Backend API for Digital Forensics Platform')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Auth', 'Authentication endpoints')
      .addTag('Cases', 'Case management')
      .addTag('Evidence', 'Evidence management')
      .addTag('Timeline', 'Timeline events')
      .addTag('Analytics', 'Analytics and statistics')
      .addTag('Users', 'User management')
      .addTag('Notifications', 'Notification system')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      customSiteTitle: 'Forensics API Docs',
      customCss: '.swagger-ui .topbar { display: none }',
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  await app.listen(port, '0.0.0.0');

  logger.log(`API listening on http://localhost:${port}/api (${nodeEnv})`);
  if (configService.get<boolean>('SWAGGER_ENABLED')) {
    logger.log(`Swagger UI at http://localhost:${port}/api/docs`);
  }
}

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start application:', error);
  process.exit(1);
});
