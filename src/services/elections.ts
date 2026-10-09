// force vite reload
/* eslint-disable @typescript-eslint/no-explicit-any */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export interface Election {
  id: number
  year: number
  details?: string
  status: string
  created_at?: string
  updated_at?: string
  [key: string]: any // allow extra fields from API
}

export const isElectionCompleted = (election: Pick<Election, 'status'>) =>
  String(election.status ?? '').trim().toLowerCase() === 'completed'

export interface ElectionStats {
  total: number
  upcoming: number
  completed: number
  ongoing: number
}

export interface StateOffice {
  id: number
  title: string
  remark?: string
  status: number
}

export interface SenateOffice {
  id: number
  title: string
  remark?: string
  status?: number
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
  id: number | string
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
  office_name?: string | null
  election_type_id?: number | string | null
  election_type_name?: string | null
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
            id: office.id ?? office.office_id ?? office.officeId,
            name: office.title || office.name || office.office_name || office.office_title || office.officeTitle || 'Unnamed Office',
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
      id: type.id ?? type.election_type_id ?? type.type_id,
      name: type.name || type.election_type_name || type.electionTypeName || type.type_name || type.title || 'Unnamed Election Type',
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

  async checkCandidateRegistration(data: { candidate_id: number; election_id: number }): Promise<void> {
    console.debug('[Candidate registration check] Request:', data)
    let response: Response
    try {
      response = await fetch(`${API_BASE_URL}/elections/check-candidate-registration`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data)
      })
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error('Could not connect to the registration API. Check your internet connection and try again. If the problem continues, the API server may be unavailable.')
      }
      throw error
    }
    const result = await response.json().catch(() => ({}))
    const payload = result.data ?? result

    console.debug('[Candidate registration check] Response:', {
      status: response.status,
      success: result.success,
      message: result.message,
      data: {
        candidate_id: payload?.candidate_id,
        election_id: payload?.election_id,
        already_registered: payload?.already_registered,
        can_register: payload?.can_register,
        is_registered: payload?.is_registered,
        isRegistered: payload?.isRegistered,
        registered: payload?.registered,
        candidate_registered: payload?.candidate_registered,
        candidateRegistered: payload?.candidateRegistered,
        registrations_present: payload?.registrations != null
      }
    })

    if (!response.ok || result.success === false) {
      throw new Error(result.message || 'Candidate is not registered for the selected election.')
    }

    if (!payload || typeof payload !== 'object') {
      throw new Error('Candidate registration could not be verified for the selected election.')
    }

    if ('can_register' in payload || 'already_registered' in payload) {
      if (payload.already_registered === true) {
        throw new Error(result.message || 'Candidate is already registered for the selected election.')
      }
      if (payload.can_register !== true) {
        throw new Error(result.message || 'Candidate is not available for registration in the selected election.')
      }
      return
    }

    const registered = payload.is_registered
      ?? payload.isRegistered
      ?? payload.registered
      ?? payload.candidate_registered
      ?? payload.candidateRegistered
    const isRegistered = registered === true ||
      String(registered).toLowerCase() === 'true' ||
      String(registered) === '1'

    if (!isRegistered) {
      throw new Error(result.message || (registered === undefined
        ? 'Candidate registration could not be verified for the selected election.'
        : 'Candidate is not registered for the selected election.'))
    }
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
    const electionType = record?.election_type ?? record?.electionType
    const officeRelation = record?.office ?? record?.office_details ?? record?.officeDetails
    const officeIdentifier = record?.office_id ?? record?.officeId
    const officeObject = typeof officeIdentifier === 'object'
      ? officeIdentifier
      : typeof officeRelation === 'object' ? officeRelation : null
    return {
      id: record?.id ?? null,
      election_id: record?.election_id ?? record?.electionId ?? null,
      office_id: (typeof officeIdentifier === 'object' ? officeIdentifier?.id : officeIdentifier) ?? officeObject?.id ?? null,
      office_name: record?.office_name ?? record?.officeName ?? record?.office_title ?? record?.officeTitle
        ?? officeObject?.name ?? officeObject?.title ?? officeObject?.office_name
        ?? (typeof officeRelation === 'string' ? officeRelation : null),
      election_type_id: record?.election_type_id ?? record?.electionTypeId ?? electionType?.id ?? null,
      election_type_name: record?.election_type_name ?? record?.electionTypeName ?? (typeof electionType === 'string' ? electionType : electionType?.name ?? electionType?.election_type_name ?? electionType?.type_name ?? electionType?.title) ?? null,
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

  // GET /elections/get-timetable-candidates/{timetableid}
  async getTimetableCandidates(timetableId: number): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/elections/get-timetable-candidates/${timetableId}`, { headers: this.getAuthHeaders() });
    if (!response.ok) return [];
    const data = await response.json();
    return data.data || [];
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

  async getSenateOffices(): Promise<SenateOffice[]> {
    const response = await fetch(`${API_BASE_URL}/offices/get-senate-office`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })

    const result = await response.json().catch(() => ({}))
    if (!response.ok || result.success === false) {
      throw new Error(result.message || `Failed to fetch Senate offices: ${response.status}`)
    }

    const payload = result.data ?? result
    const offices = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.offices)
          ? payload.offices
          : null

    if (!offices) {
      throw new Error('The Senate offices response did not contain an office list.')
    }

    return offices.map((office: Record<string, unknown>) => ({
      id: Number(office.id),
      title: String(office.title ?? office.name ?? ''),
      remark: typeof office.remark === 'string' ? office.remark : undefined,
      status: office.status === undefined ? undefined : Number(office.status)
    })).filter((office: SenateOffice) => office.id > 0 && office.title.length > 0)
  }

  async getFederalHouseOffices(): Promise<SenateOffice[]> {
    const response = await fetch(`${API_BASE_URL}/offices/get-federal-house-office`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })

    const result = await response.json().catch(() => ({}))
    if (!response.ok || result.success === false) {
      throw new Error(result.message || `Failed to fetch Federal House offices: ${response.status}`)
    }

    const payload = result.data ?? result
    const offices = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.offices)
          ? payload.offices
          : null

    if (!offices) {
      throw new Error('The Federal House offices response did not contain an office list.')
    }

    return offices.map((office: Record<string, unknown>) => ({
      id: Number(office.id),
      title: String(office.title ?? office.name ?? ''),
      remark: typeof office.remark === 'string' ? office.remark : undefined,
      status: office.status === undefined ? undefined : Number(office.status)
    })).filter((office: SenateOffice) => office.id > 0 && office.title.length > 0)
  }

  // GET /offices/get-state-offices
  async getStateOffices(stateId?: number): Promise<StateOffice[]> {
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
  async getStateAssemblyOffices(): Promise<StateOffice[]> {
    const response = await fetch(`${API_BASE_URL}/offices/get-state-assembly-office`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })

    const result = await response.json().catch(() => ({}))
    if (!response.ok || result.success === false) {
      throw new Error(result.message || `Failed to fetch State Assembly offices: ${response.status}`)
    }

    const payload = result.data ?? result
    const offices = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.offices)
          ? payload.offices
          : null

    if (!offices) {
      throw new Error('The State Assembly offices response did not contain an office list.')
    }

    return offices.map((office: Record<string, unknown>) => ({
      id: Number(office.id),
      title: String(office.title ?? office.name ?? ''),
      remark: typeof office.remark === 'string' ? office.remark : undefined,
      status: office.status === undefined ? undefined : Number(office.status)
    })).filter((office: StateOffice) => office.id > 0 && office.title.length > 0)
  }

  async getLgaOffices(): Promise<StateOffice[]> {
    const response = await fetch(`${API_BASE_URL}/offices/get-lga-offices`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })

    const result = await response.json().catch(() => ({}))
    if (!response.ok || result.success === false) {
      throw new Error(result.message || `Failed to fetch LGA offices: ${response.status}`)
    }

    const payload = result.data ?? result
    const offices = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.offices)
          ? payload.offices
          : null

    if (!offices) {
      throw new Error('The LGA offices response did not contain an office list.')
    }

    return offices.map((office: Record<string, unknown>) => ({
      id: Number(office.id),
      title: String(office.title ?? office.name ?? ''),
      remark: typeof office.remark === 'string' ? office.remark : undefined,
      status: office.status === undefined ? undefined : Number(office.status)
    })).filter((office: StateOffice) => office.id > 0 && office.title.length > 0 && office.status !== 0)
  }

  async getWardOffices(): Promise<StateOffice[]> {
    const response = await fetch(`${API_BASE_URL}/offices/get-ward-office`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })

    const result = await response.json().catch(() => ({}))
    if (!response.ok || result.success === false) {
      throw new Error(result.message || `Failed to fetch ward offices: ${response.status}`)
    }

    const payload = result.data ?? result
    const offices = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.offices)
          ? payload.offices
          : null

    if (!offices) {
      throw new Error('The ward offices response did not contain an office list.')
    }

    return offices.map((office: Record<string, unknown>) => ({
      id: Number(office.id),
      title: String(office.title ?? office.name ?? ''),
      remark: typeof office.remark === 'string' ? office.remark : undefined,
      status: office.status === undefined ? undefined : Number(office.status)
    })).filter((office: StateOffice) => office.id > 0 && office.title.length > 0 && office.status !== 0)
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

export const electionService = new ElectionService();

