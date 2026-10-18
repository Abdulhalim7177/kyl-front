const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

export interface DirectorySuggestion {
  title: string
  action?: string
  type?: string
  query?: string
  id?: number | string
}

export interface DirectoryEntityDetails {
  id?: number | string
  name?: string
  year?: string | number
  status?: string | number
  details?: string
  [key: string]: unknown
}

export interface DirectoryResultItem {
  id: number | string
  type: string
  title: string
  subtitle?: string
  image?: string | null
  details?: DirectoryEntityDetails | null
  search_query?: string
  party?: string
  party_logo?: string | null
  office?: string
  location?: string
  office_rank?: number
}

export interface DirectorySearchData {
  states: DirectoryResultItem[]
  districts: DirectoryResultItem[]
  candidates: DirectoryResultItem[]
  parties: DirectoryResultItem[]
  elections: DirectoryResultItem[]
  offices: DirectoryResultItem[]
}

export interface DirectorySearchMeta {
  query?: string
  cleaned_query?: string
  requires_state?: boolean
  candidate_limit?: number
}

export interface DirectorySearchResponse {
  data: DirectorySearchData
  meta: DirectorySearchMeta
}

class DirectoryService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token')
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    }
  }

  async search(query: string = '', type: string = 'all', signal?: AbortSignal): Promise<DirectorySearchResponse> {
    const params = new URLSearchParams({ q: query, type })
    const response = await fetch(`${API_BASE_URL}/directory/search?${params.toString()}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
      signal,
    })

    if (!response.ok) {
      throw new Error('Failed to fetch search results')
    }

    const payload = (await response.json()) as {
      data?: Partial<DirectorySearchData>
      meta?: DirectorySearchMeta
    }
    const data = payload.data ?? {}

    return {
      data: {
        states: data.states ?? [],
        districts: data.districts ?? [],
        candidates: data.candidates ?? [],
        parties: data.parties ?? [],
        elections: data.elections ?? [],
        offices: data.offices ?? [],
      },
      meta: payload.meta ?? {},
    }
  }

  async getSuggestions(query: string = '', signal?: AbortSignal): Promise<DirectorySuggestion[]> {
    const params = new URLSearchParams({ q: query })
    const response = await fetch(`${API_BASE_URL}/directory/suggestions?${params.toString()}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
      signal,
    })

    if (!response.ok) {
      throw new Error('Failed to fetch suggestions')
    }

    const payload = (await response.json()) as { data?: DirectorySuggestion[] }
    return Array.isArray(payload.data) ? payload.data : []
  }
}

export const directoryService = new DirectoryService()
