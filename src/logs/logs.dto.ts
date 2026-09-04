import { z } from 'zod';

/** Field names differ between log shippers, so several spellings are accepted. */
export const IngestLogSchema = z
  .object({
    source: z.string().max(200).optional(),
    host: z.string().max(200).optional(),
    hostname: z.string().max(200).optional(),
    level: z.union([z.string(), z.number()]).optional(),
    severity: z.union([z.string(), z.number()]).optional(),
    priority: z.union([z.string(), z.number()]).optional(),
    message: z.string().max(5000).optional(),
    msg: z.string().max(5000).optional(),
    log: z.string().max(5000).optional(),
    ip: z.string().max(45).optional(),
    src_ip: z.string().max(45).optional(),
    source_ip: z.string().max(45).optional(),
    action: z.string().max(200).optional(),
    event_type: z.string().max(200).optional(),
    event: z.string().max(200).optional(),
    user: z.string().max(200).optional(),
    username: z.string().max(200).optional(),
    account: z.string().max(200).optional(),
  })
  .passthrough();

export const LogsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(1000).default(100),
});

export type IngestLogInput = z.infer<typeof IngestLogSchema>;
