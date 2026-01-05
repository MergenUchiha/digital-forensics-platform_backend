import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // API prefix
  app.setGlobalPrefix('api');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Request logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    const { method, url } = req;
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const { statusCode } = res;
      const logMessage = `${method} ${url} ${statusCode} - ${duration}ms`;
      
      if (statusCode >= 500) {
        console.error(`❌ ${logMessage}`);
      } else if (statusCode >= 400) {
        console.warn(`⚠️  ${logMessage}`);
      } else {
        console.log(`✅ ${logMessage}`);
      }
    });
    
    next();
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Digital Forensics API')
    .setDescription('Backend API for Digital Forensics Platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 Server is running on http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  console.log(`🔍 API Endpoint: http://localhost:${port}/api`);
  console.log(`${'='.repeat(60)}\n`);
}

bootstrap();