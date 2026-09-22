/* eslint-disable @typescript-eslint/no-explicit-any */
const API_BASE_URL = '/api'

export interface Election {
  id: number
  year: number
  details?: string
  status: string
  created_at?: string
  updated_at?: string
  [key: string]: any // allow extra fields from API
}

export interface ElectionStats {
  total: number
  upcoming: number
  completed: number
  ongoing: number
}

export interface ElectionResponse {
  success: boolean
  data: Election[] | { current_page: number; data: Election[]; total: number; per_page: number; last_page: number }
  message: string
}

export interface SingleElectionResponse {
  success: boolean
  data: Election
  message: string
}

class ElectionService {
  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token')
    return {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  // GET /elections - get all elections
  async getAllElections(): Promise<Election[]> {
    console.log('🔍 Fetching all elections...')
    const response = await fetch(`${API_BASE_URL}/elections`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })

    console.log('📨 Elections API Response Status:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Elections API Error:', errorText)
      throw new Error(`Failed to fetch elections: ${response.status} ${response.statusText}`)
    }

    const rawData = await response.json()
    console.log('📊 Elections API Response Data:', rawData)

    // Handle both paginated and array responses
    let elections: Election[] = []
    if (Array.isArray(rawData.data)) {
      elections = rawData.data
    } else if (rawData.data?.data && Array.isArray(rawData.data.data)) {
      elections = rawData.data.data
    } else if (Array.isArray(rawData)) {
      elections = rawData
    }

    // Normalize status for each election
    return elections.map(e => ({ 
      ...e, 
      status: this.normalizeStatus(e.current_status || e.status) 
    }))
  }

  // GET /elections/get-active-election - get active elections only
  async getActiveElections(): Promise<Election[]> {
    console.log('🔍 Fetching active elections...')
    const response = await fetch(`${API_BASE_URL}/elections/get-active-election`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Active Elections API Error:', errorText)
      throw new Error(`Failed to fetch active elections: ${response.status} ${response.statusText}`)
    }

    const rawData = await response.json()
    console.log('📊 Active Elections Response:', rawData)

    let elections: Election[] = []
    if (Array.isArray(rawData.data)) {
      elections = rawData.data
    } else if (rawData.data?.data && Array.isArray(rawData.data.data)) {
      elections = rawData.data.data
    } else if (Array.isArray(rawData)) {
      elections = rawData
    } else if (rawData.data && typeof rawData.data === 'object' && rawData.data.id !== undefined) {
      // Backend returned a single object instead of an array
      elections = [rawData.data]
    } else if (rawData.id !== undefined) {
      elections = [rawData]
    }

    // Normalize status for each election
    return elections.map(e => ({ 
      ...e, 
      status: this.normalizeStatus(e.current_status || e.status) 
    }))
  }

  // Normalize status from API (could be number or string)
  private normalizeStatus(status: any): string {
    if (typeof status === 'string') {
      const lower = status.toLowerCase()
      if (lower === 'upcoming' || status === '0') return 'Upcoming'
      if (lower === 'ongoing' || lower === 'on-going' || status === '1') return 'Ongoing'
      if (lower === 'completed' || status === '2') return 'Completed'
      return status
    }
    // Handle numeric status codes
    if (typeof status === 'number') {
      switch (status) {
        case 0: return 'Upcoming'
        case 1: return 'Ongoing'
        case 2: return 'Completed'
        default: return String(status)
      }
    }
    return String(status || 'Unknown')
  }

  // Compute stats from actual election data
  async getElectionStats(): Promise<ElectionStats> {
    const elections = await this.getAllElections()

    const stats: ElectionStats = {
      total: elections.length,
      upcoming: 0,
      completed: 0,
      ongoing: 0
    }

    elections.forEach((e) => {
      const normalized = this.normalizeStatus(e.status)
      if (normalized === 'Upcoming') stats.upcoming++
      else if (normalized === 'Completed') stats.completed++
      else if (normalized === 'Ongoing') stats.ongoing++
    })

    return stats
  }

  // GET /elections/get-election/{id} - get single election
  async getElectionById(id: number): Promise<Election | null> {
    console.log(`🔍 Fetching election #${id}...`)
    const response = await fetch(`${API_BASE_URL}/elections/get-election/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      if (response.status === 404) return null
      const errorText = await response.text()
      console.error('❌ Election detail API Error:', errorText)
      throw new Error(`Failed to fetch election: ${response.status} ${response.statusText}`)
    }

    const rawData = await response.json()
    console.log('📊 Election detail Response:', rawData)

    const election = rawData.data || rawData || null
    if (election) {
      election.status = this.normalizeStatus(election.current_status || election.status)
    }
    return election
  }

  // POST /elections/create-election?year={year}&details={details}
  async createElection(data: { year: number; details?: string }): Promise<Election> {
    console.log('🔍 Creating election...', data)
    const response = await fetch(`${API_BASE_URL}/elections/create-election`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    })

    console.log('📨 Create Election Response Status:', response.status, response.statusText)

    if (!response.ok) {
      let errorMsg = `Failed to create election: ${response.status} ${response.statusText}`
      try {
        const errJson = await response.json()
        if (errJson.message) errorMsg = errJson.message
        if (errJson.errors) {
           const details = Object.values(errJson.errors).flat().join(' | ')
           errorMsg += ': ' + details
        }
      } catch {
        // ignore
      }
      throw new Error(errorMsg)
    }

    const rawData = await response.json()
    console.log('📊 Created Election Response:', rawData)

    return rawData.data || rawData
  }

  // PATCH /elections/update-election/{id}
  async updateElection(id: number, data: { year?: number; details?: string }): Promise<Election> {
    console.log(`🔍 Updating election #${id}...`, data)
    const response = await fetch(`${API_BASE_URL}/elections/update-election/${id}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    })

    console.log('📨 Update Election Response Status:', response.status, response.statusText)

    if (!response.ok) {
      let errorMsg = `Failed to update election: ${response.status} ${response.statusText}`
      try {
        const errJson = await response.json()
        if (errJson.message) errorMsg = errJson.message
        if (errJson.errors) {
           const details = Object.values(errJson.errors).flat().join(' | ')
           errorMsg += ': ' + details
        }
      } catch {
        // ignore
      }
      throw new Error(errorMsg)
    }

    const rawData = await response.json()
    console.log('📊 Updated Election Response:', rawData)

    return rawData.data || rawData
  }

  // PATCH /elections/change-election-status/{id}
  async changeElectionStatus(id: number, status: 'Upcoming' | 'Ongoing' | 'Completed'): Promise<Election> {
    console.log(`🔍 Changing election #${id} status to ${status}...`)
    
    const params = new URLSearchParams()
    params.append('current_status', status)

    const response = await fetch(`${API_BASE_URL}/elections/change-election-status/${id}?${params.toString()}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders()
    })

    console.log('📨 Change Status Response Status:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Change Status API Error:', errorText)
      throw new Error(`Failed to change election status: ${response.status} ${response.statusText}`)
    }

    const rawData = await response.json()
    console.log('📊 Changed Status Response:', rawData)

    return rawData.data || rawData
  }

  // DELETE /elections/delete-election/{id}
  async deleteElection(id: number): Promise<void> {
    console.log(`🔍 Deleting election #${id}...`)
    const response = await fetch(`${API_BASE_URL}/elections/delete-election/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    })

    console.log('📨 Delete Election Response Status:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Delete Election API Error:', errorText)
      throw new Error(`Failed to delete election: ${response.status} ${response.statusText}`)
    }

    console.log('✅ Election deleted successfully')
  }

  // GET /elections/get-election-timetables/{electionid}
  async getElectionTimetables(electionId: number): Promise<any[]> {
    console.log(`🔍 Fetching timetables for election #${electionId}...`)
    const response = await fetch(`${API_BASE_URL}/elections/get-election-timetables/${electionId}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch election timetables')
    const rawData = await response.json()
    return rawData.data || rawData
  }

  // GET /elections/get-timetable-candidates/{timetableid}
  async getTimetableCandidates(timetableId: number): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/elections/get-timetable-candidates/${timetableId}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch timetable candidates')
    const rawData = await response.json()
    return rawData.data || rawData
  }

  // GET /elections/get-election-timetable/{id}
  async getElectionTimetable(id: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/elections/get-election-timetable/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch election timetable')
    const rawData = await response.json()
    return rawData.data || rawData
  }

  // GET /elections/get-election-types
  async getElectionTypes(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/elections/get-election-types`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch election types')
    const rawData = await response.json()
    return rawData.data || rawData
  }

  // GET /offices/get-offices (Assuming it's /offices or /offices/get-offices)
  async getOffices(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/offices/get-offices`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })
    if (!response.ok) {
       // fallback if route is different
       const fallbackResponse = await fetch(`${API_BASE_URL}/offices`, {
         method: 'GET',
         headers: this.getAuthHeaders()
       })
       if (!fallbackResponse.ok) throw new Error('Failed to fetch offices')
       const rawData = await fallbackResponse.json()
       return rawData.data?.offices || rawData.data || rawData
    }
    const rawData = await response.json()
    return rawData.data?.offices || rawData.data || rawData
  }

  // GET /offices/get-state-offices
  async getStateOffices(stateId?: number): Promise<any[]> {
    const query = stateId ? `?state_id=${stateId}` : ''
    const response = await fetch(`${API_BASE_URL}/offices/get-state-offices${query}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch state offices')
    const rawData = await response.json()
    const data = rawData.data ?? rawData
    return data.offices || data
  }

  // POST /elections/create-election-timetable
  async createElectionTimetable(data: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/elections/create-election-timetable`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    })
    if (!response.ok) {
      let errorMsg = `Failed to create timetable: ${response.status} ${response.statusText}`
      try {
        const errJson = await response.json()
        if (errJson.message) errorMsg = errJson.message
        if (errJson.errors) {
           const details = Object.values(errJson.errors).flat().join(' | ')
           errorMsg += ': ' + details
        }
      } catch {
        // ignore
      }
      throw new Error(errorMsg)
    }
    const rawData = await response.json()
    return rawData.data || rawData
  }

  // PATCH /elections/update-election-timetable/{id}
  async updateElectionTimetable(id: number, data: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/elections/update-election-timetable/${id}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error('Failed to update election timetable')
    const rawData = await response.json()
    return rawData.data || rawData
  }

  // PATCH /elections/change-election-timetable-status/{id}
  async changeElectionTimetableStatus(id: number, status: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/elections/change-election-timetable-status/${id}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ status })
    })
    if (!response.ok) throw new Error('Failed to change timetable status')
    const rawData = await response.json()
    return rawData.data || rawData
  }

  // DELETE /elections/delete-election-timetable/{id}
  async deleteElectionTimetable(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/elections/delete-election-timetable/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to delete election timetable')
  }
}

export const electionService = new ElectionService()
