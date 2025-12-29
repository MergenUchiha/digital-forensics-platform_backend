import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// Create Evidence Schema
export const CreateEvidenceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum([
    'LOG',
    'NETWORK_CAPTURE',
    'DISK_IMAGE',
    'MEMORY_DUMP',
    'FILE',
    'API_RESPONSE',
  ]),
  description: z.string().optional(),
  caseId: z.string().uuid('Invalid case ID'),
  metadata: z.record(z.any()).optional(),
});

// Update Evidence Schema
export const UpdateEvidenceSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// Export DTOs
export class CreateEvidenceDto extends createZodDto(CreateEvidenceSchema) {}
export class UpdateEvidenceDto extends createZodDto(UpdateEvidenceSchema) {}

// Types
export type CreateEvidenceInput = z.infer<typeof CreateEvidenceSchema>;
export type UpdateEvidenceInput = z.infer<typeof UpdateEvidenceSchema>;
