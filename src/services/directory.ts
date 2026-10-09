const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

class DirectoryService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token')
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  }

  async search(query: string = '', type: string = 'all') {
    const response = await fetch(`${API_BASE_URL}/directory/search?q=${encodeURIComponent(query)}&type=${encodeURIComponent(type)}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Failed to fetch search results')
    }

    const data = await response.json()
    return data.data
  }

  async getSuggestions(query: string = '') {
    const response = await fetch(`${API_BASE_URL}/directory/suggestions?q=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Failed to fetch suggestions')
    }

    const data = await response.json()
    return data.data
  }
}

export const directoryService = new DirectoryService()
