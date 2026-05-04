const API_BASE_URL = '/api'

export interface LoginCredentials {
  email: string
  password: string
}

export interface User {
  id: number
  name: string
  phoneNo: string
  email: string
  email_verified_at: string | null
  role_id: number
  state_id: number | null
  party_id: number | null
  status: number
  created_at: string
  updated_at: string
  deleted_at: string | null
  role: {
    id: number
    name: string
  }
  permissions: Array<{
    id: number
    name: string
    module_id: number
  }>
  state: unknown | null
  party: unknown | null
}

export interface AuthResponse {
  success: boolean
  data: {
    user: User
    token: string
  }
  message: string
}

export interface LogoutResponse {
  success: boolean
  message: string
}

class AuthService {
  private getCsrfToken(): string {
    const meta = document.querySelector('meta[name="csrf-token"]')
    return meta?.getAttribute('content') || ''
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const formData = new FormData()
    formData.append('email', credentials.email)
    formData.append('password', credentials.password)

    const response = await fetch(`${API_BASE_URL}/users/login`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
      body: formData,
    })

    let data
    try {
      data = await response.json()
    } catch {
      data = { message: 'Server error. Please try again later.', success: false }
    }

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error(data.message || 'Invalid Login Credentials')
      }
      if (response.status === 422) {
        const errors = data.errors
        if (errors?.email) {
          throw new Error(errors.email[0] || 'Invalid email format')
        }
        if (errors?.password) {
          throw new Error(errors.password[0] || 'Password is required')
        }
        throw new Error(data.message || 'Validation failed. Please check your input.')
      }
      if (response.status === 403) {
        throw new Error(data.message || 'Access denied')
      }
      throw new Error(data.message || `Error (${response.status}). Please try again.`)
    }

    if (!data.success) {
      throw new Error(data.message || 'Invalid Login Credentials')
    }

    return data
  }

  async logout(): Promise<LogoutResponse> {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      return { success: true, message: 'Logged out successfully' }
    }

    const response = await fetch(`${API_BASE_URL}/users/logout`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-CSRF-TOKEN': this.getCsrfToken(),
      },
    })

    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Logout failed' }))
      throw new Error(error.message || 'Logout failed')
    }

    return response.json()
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token')
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token')
  }

  getUser(): User | null {
    const userData = localStorage.getItem('auth_user')
    return userData ? JSON.parse(userData) : null
  }

  setAuth(token: string, user: User): void {
    localStorage.setItem('auth_token', token)
    localStorage.setItem('auth_user', JSON.stringify(user))
  }

  clearAuth(): void {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
  }

  hasPermission(permissionName: string): boolean {
    const user = this.getUser()
    if (!user) return false
    return user.permissions.some(p => p.name === permissionName)
  }
}

export const authService = new AuthService()