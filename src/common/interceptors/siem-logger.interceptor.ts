import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { LogsService } from '../../logs/logs.service';

@Injectable()
export class SiemLoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SiemLoggerInterceptor.name);
  private readonly siemUrl: string;
  private readonly siemApiKey: string;
  private readonly enabled: boolean;
  private queue: any[] = [];
  private isSending = false;

  constructor(
    private configService: ConfigService,
    private logsService: LogsService,
  ) {
    this.siemUrl = configService.get('SIEM_URL', 'http://localhost:5001');
    this.siemApiKey = configService.get('SIEM_API_KEY', '');
    this.enabled = !!this.siemApiKey;

    // Отправляем логи из очереди раз в 1 секунду
    setInterval(() => this.flushOne(), 1000);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (!this.enabled) return next.handle();

    const req = context.switchToHttp().getRequest<Request>();
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const res = context.switchToHttp().getResponse<Response>();
        this.processLog(req, res.statusCode, Date.now() - startTime, null);
      }),
      catchError((err) => {
        const status = err.status || 500;
        this.processLog(req, status, Date.now() - startTime, err);
        return throwError(() => err);
      }),
    );
  }

  private processLog(
    req: Request,
    statusCode: number,
    durationMs: number,
    error: any,
  ) {
    const severity = this.mapSeverity(statusCode, error);
    const payload = {
      source: 'Digital Forensics Platform',
      severity,
      message: `${req.method} ${req.path} → ${statusCode} (${durationMs}ms)`,
      ip: (req.headers['x-forwarded-for'] as string) || req.ip || '0.0.0.0',
      user: (req as any).user?.email || undefined,
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

    // Сохраняем локально для Pull
    this.logsService.save(payload);

    // Добавляем в очередь (отправится раз в 1 секунду)
    this.queue.push(payload);
  }

  private async flushOne() {
    if (this.isSending || this.queue.length === 0) return;

    this.isSending = true;
    const payload = this.queue.shift();

    try {
      await fetch(`${this.siemUrl}/api/logs/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.siemApiKey,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(3000),
      });
    } catch (err: any) {
      this.logger.warn(`Failed to send log to SIEM: ${err.message}`);
    } finally {
      this.isSending = false;
    }
  }

  private mapSeverity(
    statusCode: number,
    error: any,
  ): 'critical' | 'high' | 'medium' | 'low' | 'info' {
    if (statusCode >= 500) return 'critical';
    if (statusCode === 401 || statusCode === 403) return 'high';
    if (statusCode >= 400) return 'medium';
    if (error) return 'high';
    return 'info';
  }
}
