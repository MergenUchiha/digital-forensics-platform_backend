// src/modules/cases/dto/case.dto.ts
import { z } from 'zod';

// Location Schema
const LocationSchema = z
  .object({
    city: z.string().min(1, 'City is required').max(100),
    country: z.string().min(1, 'Country is required').max(100),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
  })
  .optional();

// Create Case Schema
export const CreateCaseSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must not exceed 200 characters')
    .trim(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must not exceed 5000 characters')
    .trim(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], {
    errorMap: () => ({ message: 'Invalid severity level' }),
  }),
  status: z
    .enum(['OPEN', 'IN_PROGRESS', 'CLOSED', 'ARCHIVED'], {
      errorMap: () => ({ message: 'Invalid status' }),
    })
    .optional()
    .default('OPEN'),
  tags: z
    .array(z.string().min(1).max(50).trim())
    .max(20, 'Maximum 20 tags allowed')
    .optional()
    .default([]),
  location: LocationSchema,
  assignedToId: z.string().uuid('Invalid user ID').optional(),
});

// Update Case Schema - все поля опциональные, но строгая валидация
export const UpdateCaseSchema = z
  .object({
    title: z
      .string()
      .min(3, 'Title must be at least 3 characters')
      .max(200, 'Title must not exceed 200 characters')
      .trim()
      .optional(),
    description: z
      .string()
      .min(10, 'Description must be at least 10 characters')
      .max(5000, 'Description must not exceed 5000 characters')
      .trim()
      .optional(),
    severity: z
      .enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], {
        errorMap: () => ({ message: 'Invalid severity level' }),
      })
      .optional(),
    status: z
      .enum(['OPEN', 'IN_PROGRESS', 'CLOSED', 'ARCHIVED'], {
        errorMap: () => ({ message: 'Invalid status' }),
      })
      .optional(),
    tags: z
      .array(z.string().min(1).max(50).trim())
      .max(20, 'Maximum 20 tags allowed')
      .optional(),
    assignedToId: z
      .string()
      .uuid('Invalid user ID')
      .nullable()
      .optional(),
  })
  .strict() // Prevent unknown fields
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

// Query Parameters Schema
export const CaseQuerySchema = z.object({
  status: z
    .enum(['OPEN', 'IN_PROGRESS', 'CLOSED', 'ARCHIVED'])
    .optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  assignedToId: z.string().uuid().optional(),
  createdById: z.string().uuid().optional(),
  tags: z.string().optional(), // comma-separated
  search: z.string().min(1).max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'title', 'severity'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Types
export type CreateCaseInput = z.infer<typeof CreateCaseSchema>;
export type UpdateCaseInput = z.infer<typeof UpdateCaseSchema>;
export type CaseQueryInput = z.infer<typeof CaseQuerySchema>;