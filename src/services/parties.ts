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

      const parseChairmanDate = (value?: string | null) => {
        if (!value) return null

        const trimmed = String(value).trim()
        if (!trimmed) return null

        const slashMatch = trimmed.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/)
        if (slashMatch) {
          const [, year, month, day] = slashMatch
          const parsed = new Date(Number(year), Number(month) - 1, Number(day))
          if (!Number.isNaN(parsed.getTime())) return parsed
        }

        const parsed = new Date(trimmed)
        return Number.isNaN(parsed.getTime()) ? null : parsed
      }

      if (responseData?.data && Array.isArray(responseData.data)) {
        // Paginated response structure
        chairmenList = responseData.data
        partyName = chairmenList[0]?.party?.name
      } else if (Array.isArray(responseData)) {
        // Direct array response
        chairmenList = responseData
      } else if (responseData && typeof responseData === 'object') {
        const singleRecord = (responseData as any).data && typeof (responseData as any).data === 'object'
          ? (responseData as any).data
          : responseData

        if (singleRecord && typeof singleRecord === 'object' && ('candidate' in singleRecord || 'party_id' in singleRecord || 'startDate' in singleRecord || 'endDate' in singleRecord)) {
          chairmenList = [singleRecord]
          partyName = singleRecord.party?.name || (responseData as any).party?.name
        } else {
          return responseData as any
        }
      } else {
        // Already formatted response
        return responseData
      }

      // Separate current and former chairmen
      const isActiveStatus = (status: any) => status === 1 || status === true || status === '1' || status === 'true'
      const isFormerStatus = (status: any) => status === 0 || status === false || status === '0' || status === 'false'

      const currentChairmanRecord = chairmenList.find((c) => isActiveStatus(c.status))
      // Include both former and active records in the formerChairmen list so the table shows all historical
      // records including the currently active chairman (as requested).
      const formerChairmenRecords = chairmenList.filter((c) => isFormerStatus(c.status) || isActiveStatus(c.status))

      // Deduplicate records by candidate + start/end dates to handle duplicates
      // even when IDs differ or the backend returns duplicates.
      const uniqueKeyMap = new Map<string, any>()
      for (const r of formerChairmenRecords) {
        const candidateId = r.candidate?.id ?? r.candidate_id ?? ''
        const s = r.startDate || r.start_date || ''
        const e = r.endDate || r.end_date || ''
        const key = `${candidateId}::${s}::${e}`
        if (!uniqueKeyMap.has(key)) uniqueKeyMap.set(key, r)
      }
      const uniqueFormerChairmenRecords = Array.from(uniqueKeyMap.values())

      const formatChairmanDate = (value?: string | null) => {
        const parsed = parseChairmanDate(value)
        if (!parsed) return ''

        const year = parsed.getFullYear()
        const month = String(parsed.getMonth() + 1).padStart(2, '0')
        const day = String(parsed.getDate()).padStart(2, '0')
        // Use slash-separated format as requested (YYYY/MM/DD)
        return `${year}/${month}/${day}`
      }

      const normalizeChairmanRecord = (record: any) => {
        const isActive = isActiveStatus(record.status)
        // Prefer explicit start/end date fields from the API; do not fall back to metadata timestamps
        const startDate = record.startDate || record.start_date || null
        const endDate = record.endDate || record.end_date || null
        const termLimit = record.termLimit || record.term_limit || record.termEnd || record.term_end || record.term_end_date || endDate || null
        const startFormatted = formatChairmanDate(startDate)
        const endFormatted = endDate ? formatChairmanDate(endDate) : ''
        const period = startFormatted
          ? endFormatted
            ? `${startFormatted} - ${endFormatted}`
            : isActive
              ? `${startFormatted} - Present`
              : `${startFormatted}`
          : endFormatted
          ? `Until ${endFormatted}`
          : 'N/A'

        let duration = 'N/A'
        const startParsed = parseChairmanDate(startDate)
        const endParsed = endDate ? parseChairmanDate(endDate) : null

        const yearsBetween = (from: Date, to: Date) => {
          let years = to.getFullYear() - from.getFullYear()
          if (to.getMonth() < from.getMonth() || (to.getMonth() === from.getMonth() && to.getDate() < from.getDate())) {
            years--
          }
          return years
        }

        if (startParsed && endParsed) {
          const years = yearsBetween(startParsed, endParsed)
          duration = years > 0 ? `${years} year${years !== 1 ? 's' : ''}` : 'Less than 1 year'
        } else if (startParsed && isActive) {
          const now = new Date()
          const years = yearsBetween(startParsed, now)
          duration = years > 0 ? `${years} year${years !== 1 ? 's' : ''}` : 'Less than 1 year'
        }

        return {
          startDate,
          endDate,
          termLimit,
          normalizedPeriod: period === '' ? 'N/A' : period,
          normalizedDuration: duration,
        }
      }

      // Transform current chairman
      const currentChairman = currentChairmanRecord
        ? (() => {
            const { startDate, endDate, termLimit, normalizedPeriod, normalizedDuration } = normalizeChairmanRecord(currentChairmanRecord)
            return {
              id: currentChairmanRecord.id,
              userId: currentChairmanRecord.candidate?.id,
              fullName: currentChairmanRecord.candidate?.fullName,
              avatarUrl: currentChairmanRecord.candidate?.avatarUrl || null,
              status: 'active',
              startDate,
              endDate,
              termStart: startDate,
              termLimit,
              addedBy: 'Admin',
              period: normalizedPeriod,
              duration: normalizedDuration || 'Active',
            }
          })()
        : null

      // Transform former chairmen
      const formerChairmen = uniqueFormerChairmenRecords.map((c) => {
        const { startDate, endDate, termLimit, normalizedPeriod, normalizedDuration } = normalizeChairmanRecord(c)
        const isActive = isActiveStatus(c.status)

        return {
          id: c.id,
          userId: c.candidate?.id,
          fullName: c.candidate?.fullName,
          avatarUrl: c.candidate?.avatarUrl || null,
          status: isActive ? 'active' : 'former',
          startDate,
          endDate,
          termStart: startDate,
          termLimit,
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
      const startDate = record.startDate || record.start_date || null
      const endDate = record.endDate || record.end_date || null

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
        const startDate = record.startDate || record.start_date || null
        const endDate = record.endDate || record.end_date || null

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
          startDate: chairmanData.startDate,
          endDate: chairmanData.endDate,
          remark: chairmanData.remark || '',
        }),
      })

      const data: ApiResponse<any> = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'API returned unsuccessful response')
      }

      const record = data.data
      const startDate = record.startDate || record.start_date || null
      const endDate = record.endDate || record.end_date || null

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


