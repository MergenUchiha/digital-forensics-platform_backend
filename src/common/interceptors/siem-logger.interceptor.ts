import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  type OnModuleDestroy,
} from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { LogsService } from '../../logs/logs.service';

type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

interface LogPayload {
  source: string;
  severity: Severity;
  message: string;
  ip: string;
  user?: string;
  action: string;
  details: Record<string, unknown>;
}

const FLUSH_INTERVAL_MS = 1000;
const BATCH_SIZE = 50;
/**
 * A bound on the backlog. The queue used to grow without limit while draining
 * one entry per second, so any traffic above 1 req/s meant unbounded memory
 * growth — and if the SIEM was unreachable it never drained at all.
 */
const MAX_QUEUE = 5000;

@Injectable()
export class SiemLoggerInterceptor implements NestInterceptor, OnModuleDestroy {
  private readonly logger = new Logger(SiemLoggerInterceptor.name);
  private readonly siemUrl: string;
  private readonly siemApiKey: string;
  private readonly enabled: boolean;
  private queue: LogPayload[] = [];
  private dropped = 0;
  private isSending = false;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private configService: ConfigService,
    private logsService: LogsService,
  ) {
    this.siemUrl = configService.get<string>('SIEM_URL', '');
    this.siemApiKey = configService.get<string>('SIEM_API_KEY', '');
    this.enabled = Boolean(this.siemUrl && this.siemApiKey);

    if (this.enabled) {
      this.timer = setInterval(() => void this.flush(), FLUSH_INTERVAL_MS);
      // Do not keep the process alive just to drain a log queue.
      this.timer.unref?.();
    }
  }

  /** The interval used to be started in the constructor and never cleared. */
  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (!this.enabled) return next.handle();

    const req = context.switchToHttp().getRequest<Request>();
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const res = context.switchToHttp().getResponse<Response>();
        this.record(req, res.statusCode, Date.now() - startTime, null);
      }),
      catchError(
        (err: { status?: number; message?: string; name?: string }) => {
          this.record(req, err.status ?? 500, Date.now() - startTime, err);
          return throwError(() => err);
        },
      ),
    );
  }

  private record(
    req: Request,
    statusCode: number,
    durationMs: number,
    error: { message?: string; name?: string } | null,
  ) {
    const user = (req as Request & { user?: { email?: string } }).user;

    const payload: LogPayload = {
      source: 'Digital Forensics Platform',
      severity: mapSeverity(statusCode, error),
      message: `${req.method} ${req.path} → ${statusCode} (${durationMs}ms)`,
      ip: (req.headers['x-forwarded-for'] as string) || req.ip || '0.0.0.0',
      user: user?.email,
      action: `${req.method} ${req.path}`,
      details: {
        method: req.method,
        path: req.path,
        statusCode,
        durationMs,
        userAgent: req.headers['user-agent'],
        ...(error && { error: { message: error.message, name: error.name } }),
      },
    };

    this.logsService.save(payload);

    if (this.queue.length >= MAX_QUEUE) {
      this.dropped++;
      return;
    }
    this.queue.push(payload);
  }

  /** Sends a batch, and puts it back at the front if the SIEM is unreachable. */
  private async flush() {
    if (this.isSending || this.queue.length === 0) return;

    this.isSending = true;
    const batch = this.queue.splice(0, BATCH_SIZE);

    try {
      const response = await fetch(`${this.siemUrl}/api/logs/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.siemApiKey,
        },
        body: JSON.stringify(batch),
        signal: AbortSignal.timeout(3000),
      });

      if (!response.ok) {
        this.logger.warn(`SIEM responded with HTTP ${response.status}`);
      }

      if (this.dropped > 0) {
        this.logger.warn(
          `Dropped ${this.dropped} log entries while the queue was full`,
        );
        this.dropped = 0;
      }
    } catch (err) {
      this.logger.warn(
        `Failed to send logs to SIEM: ${err instanceof Error ? err.message : String(err)}`,
      );
      if (this.queue.length + batch.length <= MAX_QUEUE) {
        this.queue.unshift(...batch);
      } else {
        this.dropped += batch.length;
      }
    } finally {
      this.isSending = false;
    }
  }
}

function mapSeverity(statusCode: number, error: unknown): Severity {
  if (statusCode >= 500) return 'critical';
  if (statusCode === 401 || statusCode === 403) return 'high';
  if (statusCode >= 400) return 'medium';
  if (error) return 'high';
  return 'info';
}
