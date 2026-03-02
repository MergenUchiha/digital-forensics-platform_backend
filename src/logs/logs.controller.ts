import {
  Controller,
  Get,
  Head,
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
