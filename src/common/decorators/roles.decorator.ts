import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

export type UserRole = 'ADMIN' | 'ANALYST';

/**
 * Restricts a route to the listed roles. Without one, a route is open to any
 * authenticated user — which is what every route was, because the `role`
 * column existed and nothing ever read it.
 *
 * Placed on a controller class it applies to every handler in it.
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
