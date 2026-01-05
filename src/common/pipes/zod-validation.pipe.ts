import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    console.log('🔍 Validating data:', JSON.stringify(value, null, 2));
    
    try {
      const parsedValue = this.schema.parse(value);
      console.log('✅ Validation passed:', JSON.stringify(parsedValue, null, 2));
      return parsedValue;
    } catch (error) {
      console.error('❌ Validation failed:', error);
      
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));
        
        console.error('Validation errors:', JSON.stringify(errors, null, 2));
        
        throw new BadRequestException({
          message: 'Validation failed',
          errors: errors,
        });
      }
      
      throw new BadRequestException({
        message: 'Validation failed',
        errors: [{ field: 'unknown', message: 'Unknown validation error' }],
      });
    }
  }
}