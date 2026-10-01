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

export interface Office {
  id: number
  name: string
  description?: string
  [key: string]: any
}

export interface ElectionType {
  id: number
  name: string
  description?: string
  [key: string]: any
}

export interface ElectionTimetable {
  id?: number | null
  election_id?: number | string | null
  office_id?: number | string | null
  election_type_id?: number | string | null
  description?: string
  date?: string
  starttime?: string
  endtime?: string
  status?: string
  created_at?: string
  updated_at?: string
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
  async getAllOffices(): Promise<Office[]> {
    const officeEndpoints = [
      `${API_BASE_URL}/offices/get-all-offices`,
      `${API_BASE_URL}/offices`,
      `${API_BASE_URL}/offices/get-all`,
      `${API_BASE_URL}/offices/all`,
    ]

    for (const endpoint of officeEndpoints) {
      try {
        console.log('🔍 Fetching all offices from:', endpoint)
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: this.getAuthHeaders()
        })

        console.log('📨 Offices API Response Status:', response.status, response.statusText, 'URL:', endpoint)

        if (!response.ok) {
          const errorText = await response.text()
          console.warn(`⚠️ Offices endpoint failed (${endpoint}):`, response.status, errorText)
          continue
        }

        const rawData = await response.json()
        console.log('📊 Offices API Response Data:', rawData)

        const payload = rawData?.data ?? rawData
        let offices: Office[] = []

        if (Array.isArray(payload)) {
          offices = payload
        } else if (Array.isArray(payload?.data)) {
          offices = payload.data
        } else if (payload && typeof payload === 'object') {
          const list = payload.offices ?? payload.items ?? payload.results ?? payload.data?.offices ?? payload.office_list ?? payload.data?.office_list
          if (Array.isArray(list)) offices = list
        }

        if (offices.length > 0) {
          return offices.map((office) => ({
            ...office,
            id: office.id,
            name: office.title || office.name || office.office_name || 'Unnamed Office',
          }))
        }

        return []
      } catch (error) {
        console.warn(`⚠️ Office fetch failed for ${endpoint}:`, error)
      }
    }

    return []
  }

  async getAllElectionTypes(): Promise<ElectionType[]> {
    console.log('🔍 Fetching all election types...')
    const response = await fetch(`${API_BASE_URL}/elections/get-election-types`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })

    console.log('📨 Election Types API Response Status:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Election Types API Error:', errorText)
      throw new Error(`Failed to fetch election types: ${response.status} ${response.statusText}`)
    }

    const rawData = await response.json()
    console.log('📊 Election Types API Response Data:', rawData)

    const payload = rawData?.data ?? rawData
    let electionTypes: ElectionType[] = []

    if (Array.isArray(payload)) {
      electionTypes = payload
    } else if (Array.isArray(payload?.data)) {
      electionTypes = payload.data
    } else if (payload && typeof payload === 'object') {
      const list = payload.election_types ?? payload.electionTypes ?? payload.items ?? payload.results
      if (Array.isArray(list)) electionTypes = list
    }

    return electionTypes.map((type) => ({
      ...type,
      id: type.id,
      name: type.name || type.election_type_name || 'Unnamed Election Type',
    }))
  }

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

  private normalizeTimetableStatus(status: any): string {
    if (typeof status === 'string') {
      const lower = status.trim().toLowerCase()
      if (lower === 'upcoming' || lower === 'up coming') return 'Upcoming'
      if (lower === 'ongoing' || lower === 'on-going' || lower === 'in_progress' || lower === 'in progress') return 'Ongoing'
      if (lower === 'completed' || lower === 'done') return 'Completed'
      return status
    }

    if (typeof status === 'number') {
      switch (status) {
        case 0: return 'Upcoming'
        case 1: return 'Ongoing'
        case 2: return 'Completed'
        default: return String(status)
      }
    }

    return 'Upcoming'
  }

  private normalizeTimeToApi(value?: string): string {
    if (!value) return ''
    const trimmed = value.trim()
    if (!trimmed.includes(':')) return trimmed
    const [hours, minutes] = trimmed.split(':')
    return `${hours}:${minutes}`
  }

  private normalizeTimetable(record: any): ElectionTimetable {
    return {
      id: record?.id ?? null,
      election_id: record?.election_id ?? record?.electionId ?? null,
      office_id: record?.office_id ?? record?.officeId ?? null,
      election_type_id: record?.election_type_id ?? record?.electionTypeId ?? null,
      description: record?.description ?? '',
      date: record?.date ?? '',
      starttime: record?.starttime ?? record?.start_time ?? '',
      endtime: record?.endtime ?? record?.end_time ?? '',
      status: this.normalizeTimetableStatus(record?.status ?? record?.current_status),
      created_at: record?.created_at ?? '',
      updated_at: record?.updated_at ?? '',
    }
  }

  async getElectionTimetables(electionId: number): Promise<ElectionTimetable[]> {
    console.log(`🔍 Fetching election timetables for election #${electionId}...`)
    const response = await fetch(`${API_BASE_URL}/elections/get-election-timetables/${electionId}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Election timetable list API Error:', errorText)
      throw new Error(`Failed to fetch election timetables: ${response.status} ${response.statusText}`)
    }

    const rawData = await response.json()
    console.log('📊 Election timetable response:', rawData)

    const payload = rawData?.data ?? rawData
    const list = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : []

    return list.map((item: any) => this.normalizeTimetable(item))
  }

  async getElectionTimetableById(id: number): Promise<ElectionTimetable> {
    console.log(`🔍 Fetching election timetable #${id}...`)
    const response = await fetch(`${API_BASE_URL}/elections/get-election-timetable/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Election timetable detail API Error:', errorText)
      throw new Error(`Failed to fetch timetable: ${response.status} ${response.statusText}`)
    }

    const rawData = await response.json()
    console.log('📊 Election timetable detail response:', rawData)

    const timetable = rawData?.data ?? rawData
    return this.normalizeTimetable(timetable)
  }

  async createElectionTimetable(data: {
    election_id: number
    office_id: number
    election_type_id: number
    description: string
    date: string
    starttime: string
    endtime: string
  }): Promise<ElectionTimetable> {
    console.log('🔍 Creating election timetable...', data)

    const params = new URLSearchParams()
    params.append('election_id', String(data.election_id))
    params.append('office_id', String(data.office_id))
    params.append('election_type_id', String(data.election_type_id))
    params.append('description', data.description)
    params.append('date', data.date)
    params.append('starttime', this.normalizeTimeToApi(data.starttime))
    params.append('endtime', this.normalizeTimeToApi(data.endtime))

    const response = await fetch(`${API_BASE_URL}/elections/create-election-timetable?${params.toString()}`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    })

    console.log('📨 Create Election Timetable Response Status:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Create Election Timetable API Error:', errorText)
      throw new Error(`Failed to create election timetable: ${response.status} ${response.statusText}`)
    }

    const rawData = await response.json()
    console.log('📊 Created Election Timetable Response:', rawData)

    return this.normalizeTimetable(rawData?.data ?? rawData)
  }

  async updateElectionTimetable(id: number, data: {
    office_id?: number
    election_type_id?: number
    description?: string
    date?: string
    starttime?: string
    endtime?: string
  }): Promise<ElectionTimetable> {
    console.log(`🔍 Updating election timetable #${id}...`, data)

    const params = new URLSearchParams()
    if (data.office_id !== undefined) params.append('office_id', String(data.office_id))
    if (data.election_type_id !== undefined) params.append('election_type_id', String(data.election_type_id))
    if (data.description !== undefined) params.append('description', data.description)
    if (data.date !== undefined) params.append('date', data.date)
    if (data.starttime !== undefined) params.append('starttime', this.normalizeTimeToApi(data.starttime))
    if (data.endtime !== undefined) params.append('endtime', this.normalizeTimeToApi(data.endtime))

    const response = await fetch(`${API_BASE_URL}/elections/update-election-timetable/${id}?${params.toString()}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Update Election Timetable API Error:', errorText)
      throw new Error(`Failed to update election timetable: ${response.status} ${response.statusText}`)
    }

    const rawData = await response.json()
    return this.normalizeTimetable(rawData?.data ?? rawData)
  }

  async deleteElectionTimetable(id: number): Promise<void> {
    console.log(`🔍 Deleting election timetable #${id}...`)

    const response = await fetch(`${API_BASE_URL}/elections/delete-election-timetable/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Delete Election Timetable API Error:', errorText)
      throw new Error(`Failed to delete timetable: ${response.status} ${response.statusText}`)
    }
  }

  async changeElectionTimetableStatus(id: number, status: 'Upcoming' | 'Ongoing' | 'Completed'): Promise<ElectionTimetable> {
    console.log(`🔍 Changing election timetable #${id} status to ${status}...`)

    const params = new URLSearchParams()
    params.append('status', status)

    const response = await fetch(`${API_BASE_URL}/elections/change-election-timetable-status/${id}?${params.toString()}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Change Election Timetable Status API Error:', errorText)
      throw new Error(`Failed to change timetable status: ${response.status} ${response.statusText}`)
    }

    const rawData = await response.json()
    return this.normalizeTimetable(rawData?.data ?? rawData)
  }

  // POST /elections/create-election?year={year}&details={details}
  async createElection(data: { year: number; details?: string }): Promise<Election> {
    console.log('🔍 Creating election...', data)
    const params = new URLSearchParams()
    params.append('year', data.year.toString())
    if (data.details) {
      params.append('details', data.details)
    }

    const response = await fetch(`${API_BASE_URL}/elections/create-election?${params.toString()}`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    })

    console.log('📨 Create Election Response Status:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Create Election API Error:', errorText)
      throw new Error(`Failed to create election: ${response.status} ${response.statusText}`)
    }

    const rawData = await response.json()
    console.log('📊 Created Election Response:', rawData)

    return rawData.data || rawData
  }

  // PATCH /elections/update-election/{id}
  async updateElection(id: number, data: { year?: number; details?: string }): Promise<Election> {
    console.log(`🔍 Updating election #${id}...`, data)
    const params = new URLSearchParams()
    if (data.year !== undefined) {
      params.append('year', data.year.toString())
    }
    if (data.details !== undefined) {
      params.append('details', data.details)
    }

    const response = await fetch(`${API_BASE_URL}/elections/update-election/${id}?${params.toString()}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders()
    })

    console.log('📨 Update Election Response Status:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Update Election API Error:', errorText)
      throw new Error(`Failed to update election: ${response.status} ${response.statusText}`)
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
}

export const electionService = new ElectionService()
