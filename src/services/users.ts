import { User } from './auth'

const API_BASE_URL = '/api'

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
    return {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  private extractDataArray<T>(data: any): T[] {
    if (Array.isArray(data.data)) {
      return data.data
    } else if (data.data && Array.isArray(data.data.data)) {
      return data.data.data
    }
    return []
  }

  async createUser(userData: CreateUserData): Promise<User> {
    // Clean payload: remove 0 values for state_id and party_id as they represent "None/National"
    const payload = {
      ...userData,
      state_id: userData.state_id === 0 ? null : userData.state_id,
      party_id: userData.party_id === 0 ? null : userData.party_id,
      permissions: userData.permissions?.length ? userData.permissions : [0] // Ensure at least [0] if empty, matching user's example
    }

    const response = await fetch(`${API_BASE_URL}/users/create-user/`, { // Added trailing slash
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
    const data: ApiResponse<User> = await response.json()
    return data.data
  }

  async getPartyUsers(partyId: number): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/users/get-party-users/${partyId}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch party users')
    const data = await response.json()
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
    const response = await fetch(`${API_BASE_URL}/users/update-user/${id}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(userData)
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

  async getStates(): Promise<State[]> {
    const response = await fetch(`${API_BASE_URL}/districts/get-states`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch states')
    const data = await response.json()
    return this.extractDataArray<State>(data)
  }

  async getParties(): Promise<Party[]> {
    const response = await fetch(`${API_BASE_URL}/parties/`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch parties')
    const data = await response.json()
    return this.extractDataArray<Party>(data)
  }
}

export const userService = new UserService()
