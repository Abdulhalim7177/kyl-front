import { User } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export interface ActivityLog {
  id: number
  user_id: number
  action: string
  module: string
  details: string
  ip_address: string
  created_at: string
  user?: {
    id: number
    name: string
    email: string
  }
}

export interface CreateUserData {
  name: string
  phoneNo: string
  email: string
  role_id: number
  permissions?: number[]
  state_id?: number
  party_id?: number
}

export interface UserUpdateData {
  name?: string
  email?: string
  phoneNo?: string
  role_id?: number
  state_id?: number
  party_id?: number
  status?: number
  permissions?: number[]
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
}

export interface Role {
  id: number
  name: string
  description?: string
}

export interface Permission {
  id: number
  name: string
  module_id?: number
}

export interface State {
  id: number
  name: string
}

export interface Party {
  id: number
  name: string
  shortCode?: string
}

class UserService {
  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token')
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    return headers
  }

  private extractDataArray<T>(data: any): T[] {
    if (!data) return []
    if (Array.isArray(data.data)) {
      return data.data
    }
    if (data.data && Array.isArray(data.data.data)) {
      return data.data.data
    }
    if (data.data && data.data.users) {
      return Array.isArray(data.data.users) ? data.data.users : [data.data.users]
    }
    if (data.data && data.data.user) {
      return Array.isArray(data.data.user) ? data.data.user : [data.data.user]
    }

    // Sometimes API returns the array directly
    if (Array.isArray(data)) return data

    return []
  }

  async createUser(userData: CreateUserData): Promise<User> {
    // Clean payload: remove 0 values for state_id and party_id as they represent "None/National"
    const payload: any = {
      ...userData,
      state_id: userData.state_id === 0 ? null : userData.state_id,
      party_id: userData.party_id === 0 ? null : userData.party_id,
    }

    if (userData.permissions && userData.permissions.length > 0) {
      payload.permissions = userData.permissions
    }

    const response = await fetch(`${API_BASE_URL}/users/create-user`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload)
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to create user' }))
      throw new Error(error.message || 'Failed to create user')
    }
    const data: ApiResponse<User> = await response.json()
    return data.data
  }

  async getUsers(): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/users/get-users`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch users')
    const data = await response.json()
    return this.extractDataArray<User>(data)
  }

  async getUser(id: number): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/show-user/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch user')
    const data = await response.json().catch(() => null)

    if (!data) throw new Error('Failed to fetch user')

    // Normalize various API shapes:
    // - { success: true, data: { user: { ... } } }
    // - { success: true, data: { ...userFields } }
    // - { success: true, user: { ... } }
    // - { success: true, data: { data: [ ... ] } } (not expected here)
    if (data.data && data.data.user) return data.data.user as User
    if (data.user) return data.user as User
    if (data.data && typeof data.data === 'object') return data.data as User

    return data as User
  }

  async getPartyUsers(partyId: number): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/users/get-party-users/${partyId}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })
    if (!response.ok) {
      const errorBody = await response.json().catch(() => null)
      const message = errorBody?.message || response.statusText || 'Failed to fetch party users'
      throw new Error(`${response.status} ${message}`)
    }
    const data = await response.json().catch(() => null)

    // Normalize various possible API shapes into an array of users.
    // Supported shapes:
    // - { success: true, data: [ ...users ] }
    // - { success: true, data: { data: [ ...users ] } }
    // - { success: true, data: { users: [ ...users ] } }
    // - { success: true, users: [ ...users ] }
    // - { success: true, data: { user: { ... } } }
    // - { success: true, user: { ... } }
    if (!data) return []

    if (Array.isArray(data.data)) return data.data as User[]
    if (Array.isArray(data.data?.data)) return data.data.data as User[]
    if (Array.isArray(data.data?.users)) return data.data.users as User[]
    if (Array.isArray(data.users)) return data.users as User[]
    if (data.data?.user && typeof data.data.user === 'object') return [data.data.user as User]
    if (data.user && typeof data.user === 'object') return [data.user as User]

    // Fallback to helper which already handles common envelope shapes.
    return this.extractDataArray<User>(data)
  }

  async getStateUsers(): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/users/get-state-users`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch state users')
    const data = await response.json()
    return this.extractDataArray<User>(data)
  }

  async updateUser(id: number, userData: UserUpdateData): Promise<User> {
    const payload: any = {
      name: userData.name,
      phoneNo: userData.phoneNo,
      email: userData.email,
      role_id: userData.role_id,
      permissions: userData.permissions ?? [],
      state_id: userData.state_id === 0 ? null : userData.state_id,
      party_id: userData.party_id === 0 ? null : userData.party_id,
    }

    const response = await fetch(`${API_BASE_URL}/users/update-user/${id}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload)
    })
    if (!response.ok) throw new Error('Failed to update user')
    const data: ApiResponse<User> = await response.json()
    return data.data
  }

  async updateProfile(id: number, profileData: Partial<UserUpdateData>): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/update-profile/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(profileData)
    })
    if (!response.ok) throw new Error('Failed to update profile')
    const data: ApiResponse<User> = await response.json()
    return data.data
  }

  async toggleUser(id: number): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/toggle-user/${id}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to toggle user status')
    const data: ApiResponse<User> = await response.json()
    return data.data
  }

  async deleteUser(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/delete-user/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to delete user')
  }

  async forgotPassword(email: string): Promise<ApiResponse<null>> {
    const response = await fetch(`${API_BASE_URL}/users/forgot-password`, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })
    return response.json()
  }

  async resetPassword(data: any): Promise<ApiResponse<null>> {
    const response = await fetch(`${API_BASE_URL}/users/reset-password`, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return response.json()
  }

  async updatePassword(id: number, data: any): Promise<ApiResponse<null>> {
    const response = await fetch(`${API_BASE_URL}/users/update-password/${id}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    })
    return response.json()
  }

  async getActivityLogs(): Promise<ActivityLog[]> {
    const response = await fetch(`${API_BASE_URL}/users/activity-logs`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch activity logs')
    const data = await response.json()
    return this.extractDataArray<ActivityLog>(data)
  }

  async getRangeActivityLogs(startDate: string, endDate: string): Promise<ActivityLog[]> {
    const response = await fetch(`${API_BASE_URL}/users/range-activity-logs?start_date=${startDate}&end_date=${endDate}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch activity logs range')
    const data = await response.json()
    return this.extractDataArray<ActivityLog>(data)
  }

  async getUserActivityLogs(userId: number): Promise<ActivityLog[]> {
    const response = await fetch(`${API_BASE_URL}/users/user-activity-logs?user_id=${userId}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch user activity logs')
    const data = await response.json()
    return this.extractDataArray<ActivityLog>(data)
  }

  async getUserRangeActivityLogs(userId: number, startDate: string, endDate: string): Promise<ActivityLog[]> {
    const response = await fetch(`${API_BASE_URL}/users/user-range-activity-logs?user_id=${userId}&start_date=${startDate}&end_date=${endDate}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch user activity logs range')
    const data = await response.json()
    return this.extractDataArray<ActivityLog>(data)
  }

  // Lookup Methods
  async getUserRoles(): Promise<Role[]> {
    const response = await fetch(`${API_BASE_URL}/permissions/get-user-roles`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch user roles')
    const data = await response.json()
    return this.extractDataArray<Role>(data)
  }

  async getPartyRoles(): Promise<Role[]> {
    const response = await fetch(`${API_BASE_URL}/permissions/get-party-roles`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch party roles')
    const data = await response.json()
    return this.extractDataArray<Role>(data)
  }

  async getRolePermissions(roleId: number): Promise<Permission[]> {
    const response = await fetch(`${API_BASE_URL}/permissions/get-role-permissions/${roleId}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch role permissions')
    const data = await response.json()
    return this.extractDataArray<Permission>(data)
  }

  async getStates(): Promise<State[]> {
    const response = await fetch(`${API_BASE_URL}/states`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch states')
    const data = await response.json()
    return this.extractDataArray<State>(data)
  }

  async getParties(): Promise<Party[]> {
    const response = await fetch(`${API_BASE_URL}/parties`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch parties')
    const data = await response.json()
    return this.extractDataArray<Party>(data)
  }
  }


export const userService = new UserService()


