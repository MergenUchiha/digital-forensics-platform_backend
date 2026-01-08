import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: any[] = [];

    // Handle different exception types
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as any).message || message;
        errors = (exceptionResponse as any).errors || [];
      } else {
        message = exceptionResponse as string;
      }
    } else if (exception instanceof ZodError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Validation failed';
      errors = exception.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle Prisma errors
      status = HttpStatus.BAD_REQUEST;
      
      switch (exception.code) {
        case 'P2002':
          message = 'Unique constraint violation';
          errors = [{ field: (exception.meta?.target as string[])?.[0], message: 'Already exists' }];
          break;
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = 'Record not found';
          break;
        case 'P2003':
          message = 'Foreign key constraint failed';
          break;
        default:
          message = 'Database error';
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Log the error
    const errorLog = {
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      status,
      message,
      errors,
      ...(process.env.NODE_ENV === 'development' && {
        stack: exception instanceof Error ? exception.stack : undefined,
      }),
    };

    if (status >= 500) {
      this.logger.error(errorLog);
    } else {
      this.logger.warn(errorLog);
    }

    // Send response
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      ...(errors.length > 0 && { errors }),
    });
  }
}