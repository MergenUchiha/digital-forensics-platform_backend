import { Injectable } from '@nestjs/common';

export interface ForensicLog {
  id: string;
  timestamp: string;
  source: string;
  severity: string;
  message: string;
  ip: string;
  user?: string;
  action: string;
  details: any;
}

@Injectable()
export class LogsService {
  private logs: ForensicLog[] = [];
  private maxLogs = 1000;

  save(log: Omit<ForensicLog, 'id' | 'timestamp'>) {
    const entry: ForensicLog = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...log,
    };
    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
    return entry;
  }

  findAll(limit = 100): ForensicLog[] {
    return this.logs.slice(0, limit);
  }
}
