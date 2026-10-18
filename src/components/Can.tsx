import { ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { PermissionName, RoleName } from '@/lib/permissions'

interface CanProps {
  /** Require this single permission. */
  permission?: PermissionName | string
  /** Require at least one of these permissions. */
  any?: Array<PermissionName | string>
  /** Require all of these permissions. */
  all?: Array<PermissionName | string>
  /** Require this role (or one of these roles). */
  role?: RoleName | string | Array<RoleName | string>
  /** Rendered when the user is not allowed (defaults to nothing). */
  fallback?: ReactNode
  children: ReactNode
}

/**
 * Renders its children only when the current user satisfies every supplied
 * condition (permission AND any AND all AND role). Use it to hide or replace
 * actions the user is not authorized to perform.
 *
 * @example
 * <Can permission={Permissions.CREATE_USER}>
 *   <Button>Add User</Button>
 * </Can>
 */
export default function Can({ permission, any, all, role, fallback = null, children }: CanProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, hasRole } = useAuth()

  const allowed =
    (permission === undefined || hasPermission(permission)) &&
    (any === undefined || hasAnyPermission(any)) &&
    (all === undefined || hasAllPermissions(all)) &&
    (role === undefined || hasRole(role))

  return <>{allowed ? children : fallback}</>
}
