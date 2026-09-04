import { z } from 'zod';

export const USER_ROLES = ['ADMIN', 'ANALYST'] as const;
export const UserRoleSchema = z.enum(USER_ROLES);

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Used by the admin-only `POST /auth/users`. There is no open registration:
 * an account here reads case files, evidence and chain of custody.
 */
export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .max(200, 'Password must be at most 200 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  role: UserRoleSchema.default('ANALYST'),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(12, 'New password must be at least 12 characters')
    .max(200),
});

export const UpdateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
