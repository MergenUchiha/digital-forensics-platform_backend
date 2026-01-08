// src/main.ts
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { ConfigService } from '@nestjs/config';
import * as morgan from 'morgan';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get('PORT', 4000);
  const frontendUrl = configService.get('FRONTEND_URL', 'http://localhost:3000');
  const nodeEnv = configService.get('NODE_ENV', 'development');

  // Enable CORS
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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
  app.getHttpAdapter().get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Swagger documentation
  if (nodeEnv !== 'production') {
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

  logger.log('\n' + '='.repeat(60));
  logger.log(`🚀 Server is running on http://localhost:${port}`);
  logger.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  logger.log(`🔍 API Endpoint: http://localhost:${port}/api`);
  logger.log(`💚 Health Check: http://localhost:${port}/api/health`);
  logger.log(`🌍 Environment: ${nodeEnv}`);
  logger.log('='.repeat(60) + '\n');
}

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start application:', error);
  process.exit(1);
});