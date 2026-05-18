import { authService } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export interface Party {
  id: number
  name: string
  description: string
  slogan: string
  philosophy: string
  address: string | null
  status: number | boolean
  registrationYear: string | null
  logopath: string | null
  created_at: string | null
  updated_at: string | null
}

export interface CandidateProfile {
  id: number
  nin: string
  fullName: string
  email?: string
  phoneNo?: string
  gender?: string
  dob?: string
  address?: string
  avatarUrl?: string | null
  [key: string]: any
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
}

class PartyService {
  private getAuthHeaders() {
    const token = authService.getToken()
    return {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  }

  async getAllParties(): Promise<Party[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/parties`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch parties: ${response.status} ${response.statusText}`)
      }

      const responseData = await response.json() as ApiResponse<Party[] | { data: Party[] }>

      if (!responseData.success) {
        throw new Error(responseData.message || 'API returned unsuccessful response')
      }

      const payload = responseData.data
      if (Array.isArray(payload)) {
        return payload
      }

      if (payload && Array.isArray((payload as { data?: unknown }).data)) {
        return (payload as { data: Party[] }).data
      }

      throw new Error('Unexpected response format when fetching parties')
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while fetching parties')
    }
  }

  async getPartyById(id: number): Promise<Party> {
    try {
      const response = await fetch(`${API_BASE_URL}/parties/get-party/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch party: ${response.status} ${response.statusText}`)
      }

      const data: ApiResponse<Party> = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'API returned unsuccessful response')
      }

      return data.data
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while fetching party')
    }
  }

  async getPartyChairman(id: string): Promise<{ partyName?: string; currentChairman?: any; formerChairmen?: any[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}/parties/all-party-chairmen/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch party chairman: ${response.status} ${response.statusText}`)
      }

      const data: ApiResponse<any> = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'API returned unsuccessful response')
      }

      // Handle paginated response from backend
      const responseData = data.data
      let chairmenList: any[] = []
      let partyName: string | undefined

      if (responseData.data && Array.isArray(responseData.data)) {
        // Paginated response structure
        chairmenList = responseData.data
        partyName = chairmenList[0]?.party?.name
      } else if (Array.isArray(responseData)) {
        // Direct array response
        chairmenList = responseData
      } else {
        // Already formatted response
        return responseData
      }

      // Separate current and former chairmen
      const isActiveStatus = (status: any) => status === 1 || status === true || status === '1' || status === 'true'
      const isFormerStatus = (status: any) => status === 0 || status === false || status === '0' || status === 'false'

      const currentChairmanRecord = chairmenList.find((c) => isActiveStatus(c.status))
      const formerChairmenRecords = chairmenList.filter((c) => isFormerStatus(c.status))

      const formatChairmanDate = (value?: string | null) => {
        if (!value) return ''
        try {
          const date = new Date(value)
          if (Number.isNaN(date.getTime())) return ''
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        } catch {
          return ''
        }
      }

      const normalizeChairmanRecord = (record: any) => {
        // Handle both camelCase (startDate) and snake_case (start_date) from backend
        const startDate = record.startDate || record.start_date || record.created_at || null
        const endDate = record.endDate || record.end_date || record.updated_at || null
        const startFormatted = formatChairmanDate(startDate)
        const endFormatted = endDate ? formatChairmanDate(endDate) : ''
        const period = startFormatted
          ? `${startFormatted} - ${endFormatted || 'Present'}`
          : endFormatted
          ? `Until ${endFormatted}`
          : 'N/A'

        let duration = 'N/A'
        if (startDate && endDate) {
          const startParsed = new Date(startDate)
          const endParsed = new Date(endDate)
          if (!Number.isNaN(startParsed.getTime()) && !Number.isNaN(endParsed.getTime())) {
            const years = Math.max(0, endParsed.getFullYear() - startParsed.getFullYear())
            duration = `${years} year${years !== 1 ? 's' : ''}`
          }
        }

        return {
          startDate,
          endDate,
          normalizedPeriod: period,
          normalizedDuration: duration,
        }
      }

      // Transform current chairman
      const currentChairman = currentChairmanRecord
        ? (() => {
            const { startDate, endDate, normalizedPeriod } = normalizeChairmanRecord(currentChairmanRecord)
            return {
              id: currentChairmanRecord.id,
              userId: currentChairmanRecord.candidate?.id,
              fullName: currentChairmanRecord.candidate?.fullName,
              avatarUrl: currentChairmanRecord.candidate?.avatarUrl || null,
              status: 'active',
              startDate,
              endDate,
              termStart: startDate,
              addedBy: 'Admin',
              period: normalizedPeriod,
              duration: 'Active',
            }
          })()
        : null

      // Transform former chairmen
      const formerChairmen = formerChairmenRecords.map((c) => {
        const { startDate, endDate, normalizedPeriod, normalizedDuration } = normalizeChairmanRecord(c)

        return {
          id: c.id,
          userId: c.candidate?.id,
          fullName: c.candidate?.fullName,
          avatarUrl: c.candidate?.avatarUrl || null,
          status: 'former',
          startDate,
          endDate,
          termStart: startDate,
          period: normalizedPeriod,
          duration: normalizedDuration,
        }
      })

      return {
        partyName,
        currentChairman,
        formerChairmen,
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while fetching party chairman')
    }
  }

  async getPartyChairmanProfile(chairmanId: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/parties/get-party-chairman/${chairmanId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch party chairman profile: ${response.status} ${response.statusText}`)
      }

      const data: ApiResponse<any> = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'API returned unsuccessful response')
      }

      const record = data.data
      // Apply date normalization - handle both camelCase and snake_case
      const startDate = record.startDate || record.start_date || record.created_at || null
      const endDate = record.endDate || record.end_date || record.updated_at || null

      return {
        ...record,
        startDate,
        endDate,
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while fetching party chairman profile')
    }
  }

  async checkCandidateByNin(nin: string): Promise<CandidateProfile> {
    try {
      const response = await fetch(`${API_BASE_URL}/candidates/check-candidate/${encodeURIComponent(nin)}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`Failed to check candidate: ${response.status} ${response.statusText}`)
      }

      const data: ApiResponse<CandidateProfile> = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'API returned unsuccessful response')
      }

      return data.data
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while checking candidate')
    }
  }

  async getAllPartyChairmen(id: string): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/parties/all-party-chairmen/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch all party chairmen: ${response.status} ${response.statusText}`)
      }

      const data: ApiResponse<any[]> = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'API returned unsuccessful response')
      }

      const chairmenList = data.data || []

      // Apply date normalization to all chairman records - handle both camelCase and snake_case
      return chairmenList.map((record) => {
        const startDate = record.startDate || record.start_date || record.created_at || null
        const endDate = record.endDate || record.end_date || record.updated_at || null

        return {
          ...record,
          startDate,
          endDate,
        }
      })
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while fetching all party chairmen')
    }
  }

  async updateParty(id: number, partyData: Partial<Party>): Promise<Party> {
    try {
      const response = await fetch(`${API_BASE_URL}/parties/update-party/${id}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(partyData),
      })

      if (!response.ok) {
        throw new Error(`Failed to update party: ${response.status} ${response.statusText}`)
      }

      const data: ApiResponse<Party> = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'API returned unsuccessful response')
      }

      return data.data
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while updating party')
    }
  }

  async togglePartyStatus(id: number): Promise<Party> {
    try {
      const response = await fetch(`${API_BASE_URL}/parties/toggle-party/${id}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`Failed to toggle party status: ${response.status} ${response.statusText}`)
      }

      const data: ApiResponse<Party> = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'API returned unsuccessful response')
      }

      return data.data
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while toggling party status')
    }
  }

  async createParty(partyData: {
    name: string
    description: string
    slogan?: string
    philosophy?: string
    address?: string
    registrationYear?: number
  }): Promise<Party> {
    try {
      const response = await fetch(`${API_BASE_URL}/parties/create-new-party`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(partyData),
      })

      if (!response.ok) {
        throw new Error(`Failed to create party: ${response.status} ${response.statusText}`)
      }

      const data: ApiResponse<Party> = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'API returned unsuccessful response')
      }

      return data.data
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while creating party')
    }
  }

  async uploadPartyLogo(id: number, file: File): Promise<Party> {
    try {
      const formData = new FormData()
      formData.append('logo', file)

      const token = authService.getToken()
      const response = await fetch(`${API_BASE_URL}/parties/upload-party-logo/${id}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Failed to upload logo: ${response.status} ${response.statusText}`)
      }

      const data: ApiResponse<Party> = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'API returned unsuccessful response')
      }

      return data.data
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while uploading logo')
    }
  }

  async assignChairman(partyId: string, candidateId: number): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/parties/${partyId}/assign-chairman`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ candidateId }),
      })

      if (!response.ok) {
        throw new Error(`Failed to assign chairman: ${response.status} ${response.statusText}`)
      }

      const data: ApiResponse<any> = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'API returned unsuccessful response')
      }

      return data.data
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while assigning chairman')
    }
  }

  async createPartyChairman(partyId: string, chairmanData: {
    candidateId: number
    startDate: string
    endDate: string
    remark?: string
  }): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/parties/create-party-chairman`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          party_id: partyId,
          candidate_id: chairmanData.candidateId,
          start_date: chairmanData.startDate,
          end_date: chairmanData.endDate,
          remark: chairmanData.remark || '',
        }),
      })

      const data: ApiResponse<any> = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'API returned unsuccessful response')
      }

      const record = data.data
      const startDate = record.startDate || record.start_date || record.created_at || null
      const endDate = record.endDate || record.end_date || record.updated_at || null

      return {
        ...record,
        startDate,
        endDate,
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while creating party chairman')
    }
  }

  async deletePartyChairman(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/parties/delete-party-chairman/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`Failed to delete party chairman: ${response.status} ${response.statusText}`)
      }

      const data: ApiResponse<void> = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'API returned unsuccessful response')
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while deleting party chairman')
    }
  }
}

export const partyService = new PartyService()
