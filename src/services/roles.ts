const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export interface Permission {
  id: number
  name: string
  module_id: number
  pivot?: {
    role_id: number
    permission_id: number
  }
}

export interface Role {
  id: number
  name: string
  description?: string
  permissions?: Permission[]
}

export interface Module {
  id: number
  name: string
  permissions: Permission[]
}

class RoleService {
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

  async getUserRoles(): Promise<Role[]> {
    const response = await fetch(`${API_BASE_URL}/permissions/get-user-roles`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch user roles')
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

  async createRole(roleData: { name: string, description?: string, permissions: number[] }): Promise<Role> {
    const response = await fetch(`${API_BASE_URL}/permissions/create-role`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(roleData)
    })
    if (!response.ok) throw new Error('Failed to create role')
    const data = await response.json()
    return data.data
  }

  async updateRole(id: number, roleData: { name?: string, description?: string, permissions?: number[] }): Promise<Role> {
    const response = await fetch(`${API_BASE_URL}/permissions/update-role/${id}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(roleData)
    })
    if (!response.ok) throw new Error('Failed to update role')
    const data = await response.json()
    return data.data
  }

  async deleteRole(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/permissions/delete-role/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to delete role')
  }

  async getModules(): Promise<Module[]> {
    const response = await fetch(`${API_BASE_URL}/permissions/get-modules`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch modules')
    const data = await response.json()
    return this.extractDataArray<Module>(data)
  }
}

export const roleService = new RoleService()
