import {
  AuthorizableUser,
  Permissions,
  Roles,
  userHasAllPermissions,
  userHasAnyPermission,
  userHasPermission,
  userHasRole,
} from '@/lib/permissions'

export interface AccessRule {
  /** Require this single permission. */
  permission?: string
  /** Require at least one of these permissions. */
  any?: string[]
  /** Require all of these permissions. */
  all?: string[]
  /** Require this role (or one of these roles). */
  role?: string | string[]
}

interface RouteRule extends AccessRule {
  /** Matched with `RegExp.test` against `location.pathname`. */
  pattern: RegExp
}

/**
 * Access rules for every admin route. The first matching rule wins, so
 * more specific patterns must be listed before generic ones. Paths with no
 * matching rule are unrestricted (beyond authentication) — e.g. the dashboard.
 */
export const ADMIN_ROUTE_RULES: RouteRule[] = [
  // --- Users ---
  { pattern: /^\/k8s9d7f3-users-add\/?$/, any: [Permissions.CREATE_USER, Permissions.CREATE_PARTY_USER, Permissions.CREATE_STATE_USER] },
  { pattern: /^\/k8s9d7f3-users-edit\/[^/]+\/?$/, permission: Permissions.UPDATE_USER },
  { pattern: /^\/k8s9d7f3-users-view\/[^/]+\/?$/, any: [Permissions.VIEW_USERS, Permissions.VIEW_PARTY_USERS, Permissions.VIEW_STATE_USERS] },
  { pattern: /^\/k8s9d7f3-users\/?$/, any: [Permissions.VIEW_USERS, Permissions.VIEW_PARTY_USERS, Permissions.VIEW_STATE_USERS] },
  { pattern: /^\/k8s9d7f3-roles\/?$/, role: Roles.SUPER_ADMIN },

  // --- Candidates ---
  { pattern: /^\/k8s9d7f3-candidates-add\/?$/, permission: Permissions.CREATE_CANDIDATE },
  { pattern: /^\/k8s9d7f3-candidates-edit\/[^/]+\/?$/, permission: Permissions.UPDATE_CANDIDATE },
  { pattern: /^\/k8s9d7f3-candidates-view\/[^/]+\/?$/, permission: Permissions.VIEW_CANDIDATES },
  { pattern: /^\/k8s9d7f3-candidates\/?$/, permission: Permissions.VIEW_CANDIDATES },

  // --- Elections ---
  { pattern: /^\/k8s9d7f3-elections-add\/?$/, permission: Permissions.CREATE_ELECTION },
  { pattern: /^\/k8s9d7f3-elections-edit\/[^/]+\/?$/, permission: Permissions.UPDATE_ELECTION },
  { pattern: /^\/k8s9d7f3-elections-view\/[^/]+\/?$/, permission: Permissions.VIEW_ELECTIONS },
  { pattern: /^\/k8s9d7f3-elections\/?$/, permission: Permissions.VIEW_ELECTIONS },

  // --- Parties ---
  { pattern: /^\/k8s9d7f3-parties\/[^/]+\/chairman\/?$/, any: [Permissions.VIEW_PARTY_CHAIRMEN, Permissions.VIEW_PARTY] },
  { pattern: /^\/k8s9d7f3-parties(\/[^/]+)?\/?$/, permission: Permissions.VIEW_PARTY },

  // --- Activity Logs ---
  { pattern: /^\/k8s9d7f3-activity-logs\/?$/, permission: Permissions.VIEW_ACTIVITY_LOGS },

  // --- Polls (no backend permission exists -> restrict to national admins) ---
  { pattern: /^\/k8s9d7f3-polls(-add|-edit\/[^/]+)?\/?$/, role: [Roles.SUPER_ADMIN, Roles.SUPPORT_ADMIN] },

  // --- Blogs / Posts ---
  { pattern: /^\/k8s9d7f3-blogs-add\/?$/, permission: Permissions.CREATE_POST },
  { pattern: /^\/k8s9d7f3-blogs-edit\/[^/]+\/?$/, permission: Permissions.UPDATE_POST },
  { pattern: /^\/k8s9d7f3-blogs\/?$/, permission: Permissions.VIEW_POSTS },

  // --- Districts: presidency ---
  { pattern: /^\/k8s9d7f3-districts\/presidency\/elected\/?$/, permission: Permissions.VIEW_LEADERS },
  { pattern: /^\/k8s9d7f3-districts\/presidency(\/candidates)?\/?$/, permission: Permissions.VIEW_CANDIDATES },

  // --- Districts: states ---
  { pattern: /^\/k8s9d7f3-districts\/states\/[^/]+\/elected\/?$/, permission: Permissions.VIEW_LEADERS },
  { pattern: /^\/k8s9d7f3-districts\/states(\/[^/]+)?\/?$/, permission: Permissions.VIEW_STATES },

  // --- Districts: senatorial ---
  { pattern: /^\/k8s9d7f3-districts\/senatorial\/[^/]+\/candidates\/?$/, permission: Permissions.VIEW_CANDIDATES },
  { pattern: /^\/k8s9d7f3-districts\/senatorial\/[^/]+\/elected\/?$/, permission: Permissions.VIEW_LEADERS },
  { pattern: /^\/k8s9d7f3-districts\/senatorial\/?$/, permission: Permissions.VIEW_SENATORIAL_DISTRICTS },

  // --- Districts: federal ---
  { pattern: /^\/k8s9d7f3-districts\/federal\/[^/]+\/candidates\/?$/, permission: Permissions.VIEW_CANDIDATES },
  { pattern: /^\/k8s9d7f3-districts\/federal\/[^/]+\/elected\/?$/, permission: Permissions.VIEW_LEADERS },
  { pattern: /^\/k8s9d7f3-districts\/federal\/?$/, permission: Permissions.VIEW_FEDERAL_HOUSE_DISTRICTS },

  // --- Districts: state house ---
  { pattern: /^\/k8s9d7f3-districts\/state-house\/[^/]+\/candidates\/?$/, permission: Permissions.VIEW_CANDIDATES },
  { pattern: /^\/k8s9d7f3-districts\/state-house\/[^/]+\/elected\/?$/, permission: Permissions.VIEW_LEADERS },
  { pattern: /^\/k8s9d7f3-districts\/state-house\/?$/, permission: Permissions.VIEW_STATE_HOUSE_DISTRICTS },

  // --- Districts: LGAs ---
  { pattern: /^\/k8s9d7f3-districts\/lgas\/[^/]+\/candidates\/?$/, permission: Permissions.VIEW_CANDIDATES },
  { pattern: /^\/k8s9d7f3-districts\/lgas\/[^/]+\/elected\/?$/, permission: Permissions.VIEW_LEADERS },
  { pattern: /^\/k8s9d7f3-districts\/lgas(\/[^/]+)?\/?$/, permission: Permissions.VIEW_LGAS },

  // --- Districts: wards ---
  { pattern: /^\/k8s9d7f3-districts\/wards\/[^/]+\/candidates\/?$/, permission: Permissions.VIEW_CANDIDATES },
  { pattern: /^\/k8s9d7f3-districts\/wards\/[^/]+\/elected\/?$/, permission: Permissions.VIEW_LEADERS },
  { pattern: /^\/k8s9d7f3-districts\/wards(\/[^/]+)?\/?$/, permission: Permissions.VIEW_WARDS },
]

/** Find the first access rule matching a path (or null when unrestricted). */
export function getAccessRule(pathname: string): AccessRule | null {
  const match = ADMIN_ROUTE_RULES.find((rule) => rule.pattern.test(pathname))
  return match ?? null
}

/** Evaluate whether a user satisfies an access rule. */
export function isAllowed(user: AuthorizableUser | null | undefined, rule: AccessRule | null): boolean {
  if (!rule) return true
  if (rule.permission !== undefined && !userHasPermission(user, rule.permission)) return false
  if (rule.any !== undefined && !userHasAnyPermission(user, rule.any)) return false
  if (rule.all !== undefined && !userHasAllPermissions(user, rule.all)) return false
  if (rule.role !== undefined && !userHasRole(user, rule.role)) return false
  return true
}

/** Convenience: can this user access a given admin path? */
export function canAccessPath(user: AuthorizableUser | null | undefined, pathname: string): boolean {
  return isAllowed(user, getAccessRule(pathname))
}
