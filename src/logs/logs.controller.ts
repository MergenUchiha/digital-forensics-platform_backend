import {
  Controller,
  Get,
  Post,
  Head,
  Body,
  Headers,
  UnauthorizedException,
  HttpCode,
  Query,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LogsService } from './logs.service';

@Controller('logs')
export class LogsController {
  constructor(
    private configService: ConfigService,
    private logsService: LogsService,
  ) {}

  @Head('ingest')
  @HttpCode(200)
  testIngest(@Headers('x-api-key') apiKey: string) {
    this.validateKey(apiKey);
  }

  @Post('ingest')
  ingestLog(@Body() logData: any, @Headers('x-api-key') apiKey: string) {
    this.validateKey(apiKey);

    return this.logsService.save({
      source: logData.source || logData.host || logData.hostname || 'External',
      severity: logData.level || logData.severity || logData.priority || 'info',
      message: logData.message || logData.msg || logData.log || 'No message',
      ip: logData.ip || logData.src_ip || logData.source_ip || logData.host || '0.0.0.0',
      action: logData.action || logData.event_type || logData.event || 'Unknown',
      user: logData.user || logData.username || logData.account,
      details: logData,
    });
  }

  @Get()
  findAll(
    @Headers('x-api-key') apiKey: string,
    @Query('limit') limit?: string,
  ) {
    this.validateKey(apiKey);
    return this.logsService.findAll(limit ? parseInt(limit) : 100);
  }

  private validateKey(apiKey: string) {
    const validKey = this.configService.get('SIEM_API_KEY');
    if (validKey && apiKey !== validKey) {
      throw new UnauthorizedException('Invalid API key');
    }
  }
}
