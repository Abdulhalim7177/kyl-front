const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export interface District {
  id: number
  name: string
  state_id?: number
  lga_district_id?: number
  state?: {
    id: number
    name: string
  }
  lga_district?: {
    id: number
    name: string
    state?: {
      id: number
      name: string
    }
  }
}

export interface PaginatedResponse<T> {
  current_page: number
  data: T[]
  total: number
  per_page: number
}

class DistrictsService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token')
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  }

  private async fetchDistricts(endpoint: string): Promise<District[]> {
    const response = await fetch(`${API_BASE_URL}/districts/${endpoint}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch ${endpoint}`)
    }

    const data = await response.json()
    // Backend sometimes returns paginated object, sometimes direct array or { data: [...] }
    if (data.success && data.data) {
      if (Array.isArray(data.data)) {
        return data.data
      } else if (data.data.data && Array.isArray(data.data.data)) {
        return data.data.data // Paginated
      }
    }
    return []
  }

  async getStates() { return this.fetchDistricts('get-states') }
  async getSenatorialDistricts() { return this.fetchDistricts('get-senatorial-districts') }
  async getFederalHouseDistricts() { return this.fetchDistricts('get-federal-house-districts') }
  async getStateHouseDistricts() { return this.fetchDistricts('get-state-house-districts') }
  async getLgaDistricts() { return this.fetchDistricts('get-lga-districts') }
  async getWards() { return this.fetchDistricts('get-wards') }
}

export const districtsService = new DistrictsService()
