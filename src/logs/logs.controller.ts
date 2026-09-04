import {
  Body,
  Controller,
  Get,
  Head,
  Headers,
  HttpCode,
  NotFoundException,
  Post,
  Query,
  UnauthorizedException,
  UsePipes,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeController } from '@nestjs/swagger';
import { timingSafeEqual } from 'crypto';
import { LogsService } from './logs.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  IngestLogSchema,
  LogsQuerySchema,
  type IngestLogInput,
} from './logs.dto';

/**
 * Request logs for a SIEM to pull, and an endpoint for one to push into.
 *
 * These are gated by `SIEM_API_KEY`, and the gate used to be:
 *
 *     if (validKey && apiKey !== validKey) throw ...
 *
 * With the key unset — and there was no `.env` in the repository — `validKey`
 * is undefined and the condition never holds, so the check disabled itself.
 * `GET /api/logs` then returned the whole buffer, which carries user emails,
 * addresses and request paths, to anyone who asked. The routes now answer 404
 * unless the integration is configured.
 */
@ApiExcludeController()
@Controller('logs')
export class LogsController {
  constructor(
    private configService: ConfigService,
    private logsService: LogsService,
  ) {}

  @Head('ingest')
  @HttpCode(200)
  testIngest(@Headers('x-api-key') apiKey?: string) {
    this.assertKey(apiKey);
  }

  @Post('ingest')
  @UsePipes(new ZodValidationPipe(IngestLogSchema))
  ingestLog(
    @Body() payload: IngestLogInput,
    @Headers('x-api-key') apiKey?: string,
  ) {
    this.assertKey(apiKey);

    return this.logsService.save({
      source: payload.source ?? payload.host ?? payload.hostname ?? 'External',
      severity: String(
        payload.level ?? payload.severity ?? payload.priority ?? 'info',
      ),
      message: payload.message ?? payload.msg ?? payload.log ?? 'No message',
      ip:
        payload.ip ??
        payload.src_ip ??
        payload.source_ip ??
        payload.host ??
        '0.0.0.0',
      action:
        payload.action ?? payload.event_type ?? payload.event ?? 'Unknown',
      user: payload.user ?? payload.username ?? payload.account,
      details: payload,
    });
  }

  @Get()
  findAll(
    @Query(new ZodValidationPipe(LogsQuerySchema)) query: { limit: number },
    @Headers('x-api-key') apiKey?: string,
  ) {
    this.assertKey(apiKey);
    return this.logsService.findAll(query.limit);
  }

  private assertKey(apiKey?: string) {
    const expected = this.configService.get<string>('SIEM_API_KEY');

    if (!expected) {
      throw new NotFoundException(
        'Log forwarding is not configured on this instance',
      );
    }

    if (!apiKey || !constantTimeEquals(apiKey, expected)) {
      throw new UnauthorizedException('Invalid API key');
    }
  }
}

function constantTimeEquals(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    timingSafeEqual(left, left);
    return false;
  }
  return timingSafeEqual(left, right);
}
