import { z } from 'zod';

// Location Schema
const LocationSchema = z.object({
  city: z.string().min(1),
  country: z.string().min(1),
  lat: z.number().optional(),
  lng: z.number().optional(),
}).optional();

// Create Case Schema
export const CreateCaseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'CLOSED', 'ARCHIVED']).optional(),
  tags: z.array(z.string()).optional(),
  location: LocationSchema,
  assignedToId: z.string().uuid().optional(),
});

// Update Case Schema - ВСЕ ПОЛЯ ОПЦИОНАЛЬНЫЕ
export const UpdateCaseSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'CLOSED', 'ARCHIVED']).optional(),
  tags: z.array(z.string()).optional(),
  assignedToId: z.string().uuid().optional().nullable(),
}).passthrough(); // ВАЖНО: позволяет передавать дополнительные поля

// Types
export type CreateCaseInput = z.infer<typeof CreateCaseSchema>;
export type UpdateCaseInput = z.infer<typeof UpdateCaseSchema>;