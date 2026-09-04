import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export interface RequestUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): RequestUser =>
    context.switchToHttp().getRequest<Request>().user as RequestUser,
);
