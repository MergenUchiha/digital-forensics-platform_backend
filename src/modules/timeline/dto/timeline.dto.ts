import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// Create Timeline Event Schema
export const CreateTimelineEventSchema = z.object({
  timestamp: z.string().datetime().or(z.date()),
  type: z.enum([
    'AUTHENTICATION',
    'NETWORK',
    'FILE_ACCESS',
    'SYSTEM',
    'API_CALL',
    'ALERT',
  ]),
  source: z.string().min(1, 'Source is required'),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  caseId: z.string().uuid('Invalid case ID'),
  metadata: z.record(z.any()).optional(),
  ipAddresses: z.array(z.string()).optional(),
  usernames: z.array(z.string()).optional(),
  files: z.array(z.string()).optional(),
  devices: z.array(z.string()).optional(),
});

// Update Timeline Event Schema
export const UpdateTimelineEventSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  metadata: z.record(z.any()).optional(),
});

// Export DTOs
export class CreateTimelineEventDto extends createZodDto(
  CreateTimelineEventSchema,
) {}
export class UpdateTimelineEventDto extends createZodDto(
  UpdateTimelineEventSchema,
) {}

// Types
export type CreateTimelineEventInput = z.infer<
  typeof CreateTimelineEventSchema
>;
export type UpdateTimelineEventInput = z.infer<
  typeof UpdateTimelineEventSchema
>;
