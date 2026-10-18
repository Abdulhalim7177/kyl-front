/**
 * Central permission & role definitions.
 *
 * The string values MUST match the permission names returned by the backend
 * (`GET /users/login` -> `data.user.permissions[].name` and
 * `GET /permissions/get-role-permissions/{id}`). They are grouped by the
 * backend "module" they belong to.
 */

export const Permissions = {
  // Module: User
  CREATE_USER: 'Create User',
  CREATE_PARTY_USER: 'Create Party User',
  CREATE_STATE_USER: 'Create State User',
  VIEW_USERS: 'View Users',
  VIEW_PARTY_USERS: 'View Party Users',
  VIEW_STATE_USERS: 'View State Users',
  UPDATE_USER: 'Update User',
  TOGGLE_USER_STATUS: 'Toggle User Status',
  DELETE_USER: 'Delete User',

  // Module: Party
  CREATE_PARTY: 'Create Party',
  VIEW_PARTY: 'View Party',
  UPDATE_PARTY: 'Update Party',
  CHANGE_PARTY_STATUS: 'Change Party Status',
  CREATE_PARTY_CHAIRMAN: 'Create Party Chairman',
  VIEW_PARTY_CHAIRMEN: 'View Party Chairmen',
  UPDATE_PARTY_CHAIRMAN: 'Update Party Chairman',
  DELETE_PARTY_CHAIRMAN: 'Delete Party Chairman',
  CHANGE_PARTY_CHAIRMAN_STATUS: 'Change Party Chairman Status',

  // Module: Election
  CREATE_ELECTION: 'Create Election',
  VIEW_ELECTIONS: 'View Elections',
  UPDATE_ELECTION: 'Update Election',
  CHANGE_ELECTION_STATUS: 'Change Election Status',
  DELETE_ELECTION: 'Delete Election',
  CREATE_TIME_TABLE: 'Create Time Table',
  VIEW_TIME_TABLE: 'View Time Table',
  UPDATE_TIME_TABLE: 'Update Time Table',
  DELETE_TIME_TABLE: 'Delete Time Table',

  // Module: Candidate
  CREATE_CANDIDATE: 'Create Candidate',
  VIEW_CANDIDATES: 'View Candidates',
  UPDATE_CANDIDATE: 'Update Candidate',
  TOGGLE_CANDIDATE_STATUS: 'Toggle Candidate Status',
  DELETE_CANDIDATE: 'Delete Candidate',
  ADD_CANDIDATE_EDUCATION: 'Add Candidate Education',
  VIEW_CANDIDATE_EDUCATION: 'View Candidate Education',
  UPDATE_CANDIDATE_EDUCATION: 'Update Candidate Education',
  DELETE_CANDIDATE_EDUCATION: 'Delete Candidate Education',
  ADD_CANDIDATE_EXPERIENCE: 'Add Candidate Experience',
  VIEW_CANDIDATE_EXPERIENCES: 'View Candidate Experiences',
  UPDATE_CANDIDATE_EXPERIENCE: 'Update Candidate Experience',
  DELETE_CANDIDATE_EXPERIENCE: 'Delete Candidate Experience',
  ADD_CANDIDATE_ACHIEVEMENT: 'Add Candidate Achievement',
  VIEW_CANDIDATE_ACHIEVEMENTS: 'View Candidate Achievements',
  UPDATE_CANDIDATE_ACHIEVEMENT: 'Update Candidate Achievement',
  DELETE_CANDIDATE_ACHIEVEMENT: 'Delete Candidate Achievement',

  // Module: District
  VIEW_STATES: 'View States',
  VIEW_SENATORIAL_DISTRICTS: 'View Senatorial Districts',
  VIEW_FEDERAL_HOUSE_DISTRICTS: 'View Federal House Districts',
  VIEW_STATE_HOUSE_DISTRICTS: 'View State House Districts',
  VIEW_LGAS: 'View LGAs',
  VIEW_WARDS: 'View Wards',

  // Module: Post Type
  CREATE_POST_TYPE: 'Create Post Type',
  GET_ALL_POST_TYPES: 'Get All Post Types',
  SHOW_POST_TYPE: 'Show Post Type',
  UPDATE_POST_TYPE: 'Update Post Type',
  TOGGLE_POST_TYPE: 'Toggle Post Type',
  DELETE_POST_TYPE: 'Delete Post Type',
  GET_POSTS_BY_TYPE: 'Get Posts By Type',

  // Module: Post (blogs)
  CREATE_POST: 'Create Post',
  VIEW_POSTS: 'View Posts',
  SHOW_POST: 'Show Post',
  UPDATE_POST: 'Update Post',
  DELETE_POST: 'Delete Post',
  VIEW_POST_IMAGES: 'View Post Images',
  DELETE_POST_IMAGE: 'Delete Post Image',

  // Module: Contacts
  VIEW_CONTACT_FORMS: 'View Contact Forms',
  VIEW_RANGE_CONTACT_FORMS: 'View Range Contact Forms',
  CHANGE_CONTACT_FORM_STATUS: 'Change Contact Form Status',
  MANAGE_COMPANY_SETTINGS: 'Manage Company Settings',

  // Module: Activity Log
  VIEW_ACTIVITY_LOGS: 'View Activity Logs',
  GET_ACTIVITY_LOG: 'Get Activity Log',
  VIEW_RANGE_ACTIVITY_LOGS: 'View Range Activity Logs',
  VIEW_USER_ACTIVITY_LOGS: 'View User Activity Logs',
  VIEW_USER_RANGE_ACTIVITY_LOGS: 'View User Range Activity Logs',

  // Module: Leaders
  CREATE_LEADER: 'Create Leader',
  VIEW_LEADERS: 'View leaders',
  SHOW_LEADER: 'Show Leader',
  UPDATE_LEADER: 'Update Leader',
  DELETE_LEADER: 'Delete Leader',
  ADD_LEADER_EDUCATION: 'Add Leader Education',
  VIEW_LEADER_EDUCATION: 'View Leader Education',
  UPDATE_LEADER_EDUCATION: 'Update Leader Education',
  DELETE_LEADER_EDUCATION: 'Delete Leader Education',
  ADD_LEADER_EXPERIENCE: 'Add Leader Experience',
  VIEW_LEADER_EXPERIENCES: 'View Leader Experiences',
  UPDATE_LEADER_EXPERIENCE: 'Update Leader Experience',
  DELETE_LEADER_EXPERIENCE: 'Delete Leader Experience',
  ADD_LEADER_ACHIEVEMENT: 'Add Leader Achievement',
  VIEW_LEADER_ACHIEVEMENTS: 'View Leader Achievements',
  UPDATE_LEADER_ACHIEVEMENT: 'Update Leader Achievement',
  DELETE_LEADER_ACHIEVEMENT: 'Delete leader Achievement',
} as const

export type PermissionName = (typeof Permissions)[keyof typeof Permissions]

export const Roles = {
  SUPER_ADMIN: 'Super Admin',
  SUPPORT_ADMIN: 'Support Admin',
  STATE_ADMIN: 'State Admin',
  STATE_SUPPORT: 'State Support',
  PARTY_SUPER_ADMIN: 'Party Super Admin',
  PARTY_SUPPORT_ADMIN: 'Party Support Admin',
  PARTY_STATE_ADMIN: 'Party State Admin',
  PARTY_STATE_SUPPORT: 'Party State Support',
} as const

export type RoleName = (typeof Roles)[keyof typeof Roles]

/** Minimal shape needed to evaluate permissions/roles for a user. */
export interface AuthorizableUser {
  permissions?: Array<{ name: string }> | null
  role?: { name: string } | null
}

export function userHasPermission(
  user: AuthorizableUser | null | undefined,
  permission: PermissionName | string,
): boolean {
  if (!user?.permissions?.length) return false
  return user.permissions.some((p) => p.name === permission)
}

export function userHasAnyPermission(
  user: AuthorizableUser | null | undefined,
  permissions: Array<PermissionName | string>,
): boolean {
  if (!permissions.length) return true
  if (!user?.permissions?.length) return false
  return permissions.some((name) => userHasPermission(user, name))
}

export function userHasAllPermissions(
  user: AuthorizableUser | null | undefined,
  permissions: Array<PermissionName | string>,
): boolean {
  if (!permissions.length) return true
  if (!user?.permissions?.length) return false
  return permissions.every((name) => userHasPermission(user, name))
}

export function userHasRole(
  user: AuthorizableUser | null | undefined,
  role: RoleName | string | Array<RoleName | string>,
): boolean {
  if (!user?.role?.name) return false
  const roles = Array.isArray(role) ? role : [role]
  return roles.includes(user.role.name)
}

export function userIsSuperAdmin(user: AuthorizableUser | null | undefined): boolean {
  return userHasRole(user, Roles.SUPER_ADMIN)
}
