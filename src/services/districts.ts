const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export interface District {
  id: number
  name: string
  code?: string
  status?: number
  state_id?: number
  senetorial_district_id?: number
  lga_district_id?: number
  state?: {
    id: number
    name: string
  }
  lga_district?: {
    id: number
    name: string
    state_id?: number
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

export interface StateHouseDistrictsPage extends PaginatedResponse<District> {
  last_page: number
}

export type DistrictsPage = StateHouseDistrictsPage

class DistrictsService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token')
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  }

  private async fetchDistricts(endpoint: string, fetchAllPages = false): Promise<District[]> {
    const districts: District[] = []
    let page = 1
    let lastPage = 1

    do {
      const response = await fetch(`${API_BASE_URL}/districts/${endpoint}?page=${page}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch ${endpoint}`)
      }

      const result = await response.json()
      if (!result.success || !result.data) {
        return districts
      }

      if (Array.isArray(result.data)) {
        return districts.concat(result.data)
      }

      if (Array.isArray(result.data.data)) {
        districts.push(...result.data.data)
        lastPage = result.data.last_page || (
          result.data.total && result.data.per_page
            ? Math.ceil(result.data.total / result.data.per_page)
            : 1
        )
      }

      page += 1
    } while (fetchAllPages && page <= lastPage)

    return districts
  }

  async getStates() { return this.fetchDistricts('get-states', true) }
  async getState(id: number): Promise<District> {
    const response = await fetch(`${API_BASE_URL}/districts/find-state/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Failed to fetch state')
    }

    const result = await response.json()
    if (!result.success || !result.data) {
      throw new Error(result.message || 'State not found')
    }

    return result.data
  }
  async getLgaDistrict(id: number): Promise<District> {
    const response = await fetch(`${API_BASE_URL}/districts/find-lga-district/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Failed to fetch ward')
    }

    const result = await response.json()
    if (!result.success || !result.data) {
      throw new Error(result.message || 'Ward not found')
    }

    return result.data
  }
  async getSenatorialDistricts() { return this.fetchDistricts('get-senatorial-districts', true) }
  async getFederalHouseDistricts() { return this.fetchDistricts('get-federal-house-districts', true) }
  async getStateHouseDistricts(fetchAllPages = false) {
    return this.fetchDistricts('get-state-house-districts', fetchAllPages)
  }
  async getStateHouseDistrictsPage(page = 1, perPage = 20): Promise<StateHouseDistrictsPage> {
    return this.getDistrictsPage('get-state-house-districts', page, perPage)
  }
  async getDistrictsPage(endpoint: string, page = 1, perPage = 20): Promise<DistrictsPage> {
    const response = await fetch(
      `${API_BASE_URL}/districts/${endpoint}?page=${page}&per_page=${perPage}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders()
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch ${endpoint}`)
    }

    const result = await response.json()
    const payload = result?.data
    const pagination = Array.isArray(payload) ? { data: payload } : payload
    if (!result?.success || !Array.isArray(pagination?.data)) {
      throw new Error(result?.message || `Unable to load ${endpoint}.`)
    }

    const total = Number(pagination.total) || pagination.data.length
    const pageSize = Number(pagination.per_page) || perPage
    return {
      current_page: Number(pagination.current_page) || page,
      data: pagination.data,
      total,
      per_page: pageSize,
      last_page: Number(pagination.last_page) || Math.ceil(total / pageSize) || 1
    }
  }
  async getAllDistrictsPaged(endpoint: string, perPage = 100): Promise<District[]> {
    const firstPage = await this.getDistrictsPage(endpoint, 1, perPage)
    const pages: District[][] = [firstPage.data]
    const actualPerPage = firstPage.per_page || perPage
    const lastPage = firstPage.last_page

    for (let startPage = 2; startPage <= lastPage; startPage += 5) {
      const pageNumbers = Array.from(
        { length: Math.min(5, lastPage - startPage + 1) },
        (_, index) => startPage + index
      )
      const pageResults = await Promise.all(
        pageNumbers.map((page) => this.getDistrictsPage(endpoint, page, actualPerPage))
      )
      pages.push(...pageResults.map((result) => result.data))
    }

    return pages.flat()
  }
  async getLgaDistricts() { return this.fetchDistricts('get-lga-districts', true) }
  async getWards() { return this.fetchDistricts('get-wards', true) }
}

export const districtsService = new DistrictsService()
