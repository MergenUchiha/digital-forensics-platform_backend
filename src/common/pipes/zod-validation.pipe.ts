import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ZodError, ZodSchema } from 'zod';

/**
 * Validates a payload against a zod schema.
 *
 * This used to `console.log(JSON.stringify(value))` on every request, which
 * put the body of `POST /auth/login` and `POST /auth/register` — passwords
 * included — into the server log in plain text.
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown): unknown {
    const result = this.schema.safeParse(value);

    if (result.success) {
      return result.data as unknown;
    }

    throw new BadRequestException({
      message: 'Validation failed',
      errors: formatIssues(result.error),
    });
  }
}

function formatIssues(error: ZodError) {
  return error.errors.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }));
}
