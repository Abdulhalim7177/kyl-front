const API_BASE_URL = '/api'

export interface Candidate {
  id: number
  user_id: string
  full_name: string
  political_party: string
  senatorial_district: string
  state: string
  status: string
  created_at: string
}

export interface CreateCandidateData {
  fullName: string
  phoneNo: string
  email?: string
  address?: string
  dob?: string
  gender: 'Male' | 'Female'
  nin: number
  religion?: string
  bio?: string
  remark?: string
  lga_district_id: number
  party_id?: number
}

export interface CandidateResponse {
  success: boolean
  data: Candidate[]
  message: string
}

export interface CandidateDetail {
  id: number
  fullName: string
  phoneNo: string
  email?: string
  address?: string
  dob?: string
  gender: 'Male' | 'Female'
  nin: string | number
  religion?: string
  bio?: string
  remark?: string
  lga_district_id: number
  party_id?: number
  status: number
  created_at: string
  updated_at: string
  deleted_at: string | null
  party?: {
    id: number
    name: string
    description: string
    slogan: string
    philosophy: string
    address: string | null
    status: number
    registrationYear: string | null
    logopath: string | null
    created_at: string | null
    updated_at: string | null
  }
  lga_district?: {
    id: number
    name: string
    state_id: number
    senetorial_district_id: number
  }
  state?: {
    id: number
    name: string
    status: number
    laravel_through_key: number
  }
  image?: string | null
}

export interface PaginatedResponse<T> {
  success: boolean
  data: {
    current_page: number
    data: T[]
    first_page_url: string
    from: number | null
    last_page: number
    last_page_url: string
    links: Array<{ url: string | null; label: string; active: boolean }>
    next_page_url: string | null
    path: string
    per_page: number
    prev_page_url: string | null
    to: number | null
    total: number
  }
  message: string
}

export interface SingleCandidateResponse<T = Candidate> {
  success: boolean
  data: T
  message: string
}

class CandidateService {
  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token')
    return {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  async getAllCandidates(): Promise<Candidate[]> {
    console.log('🔍 Fetching all candidates...')
    const response = await fetch(`${API_BASE_URL}/candidates/get-all-candidates`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })
    
    console.log('📨 Candidates API Response Status:', response.status, response.statusText)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ API Error response:', errorText)
      throw new Error(`Failed to fetch candidates: ${response.status} ${response.statusText}`)
    }
    
    const rawData = await response.json() as PaginatedResponse<Candidate>
    console.log('📊 Candidates API Response Data:', rawData)

     const rawCandidates = Array.isArray(rawData.data?.data) ? rawData.data.data : []
     console.log('📊 Raw candidates length:', rawCandidates.length)

     const candidates = rawCandidates.map((candidate: any) => {
       const rawStatus = candidate.status
       const isActive =
         rawStatus === 1 ||
         rawStatus === true ||
         String(rawStatus) === '1' ||
         String(rawStatus).toLowerCase() === 'active'
       const normalizedStatus = isActive ? 'Active' : 'Inactive'

       return {
         id: candidate.id,
         user_id: String(candidate.id),
         full_name: candidate.fullName ?? '',
         political_party: candidate.party?.name ?? '',
         senatorial_district: candidate.lga_district?.name ?? '',
         state: candidate.state && typeof candidate.state === 'object' ? candidate.state.name : String(candidate.state ?? ''),
         status: normalizedStatus,
         created_at: candidate.created_at ?? ''
       }
     })

    console.log('✅ Returning normalized candidates:', candidates.length, 'items')
    return candidates
  }

  async getCandidateById(id: number): Promise<CandidateDetail> {
    const response = await fetch(`${API_BASE_URL}/candidates/find-candidate/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch candidate')
    }
    
    const data: SingleCandidateResponse<CandidateDetail> = await response.json()
    return data.data
  }

  async createCandidate(candidateData: CreateCandidateData): Promise<Candidate> {
    const params = new URLSearchParams()
    params.append('fullName', candidateData.fullName)
    params.append('phoneNo', candidateData.phoneNo)
    if (candidateData.email) params.append('email', candidateData.email)
    if (candidateData.address) params.append('address', candidateData.address)
    if (candidateData.dob) params.append('dob', candidateData.dob)
    params.append('gender', candidateData.gender)
    params.append('nin', candidateData.nin.toString())
    if (candidateData.religion) params.append('religion', candidateData.religion)
    if (candidateData.bio) params.append('bio', candidateData.bio)
    if (candidateData.remark) params.append('remark', candidateData.remark)
    params.append('lga_district_id', candidateData.lga_district_id.toString())
    if (candidateData.party_id !== undefined) {
      params.append('party_id', candidateData.party_id.toString())
    }

    const url = `${API_BASE_URL}/candidates/create-candidate`
    const apiData = {
      fullName: candidateData.fullName,
      phoneNo: candidateData.phoneNo,
      email: candidateData.email,
      address: candidateData.address,
      dob: candidateData.dob,
      gender: candidateData.gender,
      nin: candidateData.nin,
      religion: candidateData.religion,
      bio: candidateData.bio,
      remark: candidateData.remark,
      lga_district_id: candidateData.lga_district_id,
      party_id: candidateData.party_id
    }
    const headers = {
      ...this.getAuthHeaders(),
      'Content-Type': 'application/json'
    }
    const bodyString = JSON.stringify(apiData)

    console.log('🚀 Creating Candidate:')
    console.log('URL:', url)
    console.log('Method: POST')
    console.log('Headers:', headers)
    console.log('Body:', bodyString)
    console.log('Body params:', apiData)

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: bodyString
    })

    console.log('📨 Response Status:', response.status, response.statusText)
    console.log('Response Headers:', {
      'Content-Type': response.headers.get('Content-Type'),
      'Content-Length': response.headers.get('Content-Length')
    })

    let responseText = ''
    try {
      responseText = await response.text()
      console.log('Response Body:', responseText)
    } catch (error) {
      console.error('Failed to read response body:', error)
    }

    if (!response.ok) {
      let message = `${response.status} ${response.statusText}`
      if (responseText) {
        message += ` - ${responseText.substring(0, 500)}`
      }
      console.error('❌ Candidate creation failed:', message)
      throw new Error(`Failed to create candidate: ${message}`)
    }

    console.log('✅ Candidate created successfully')
    try {
      const data: SingleCandidateResponse = JSON.parse(responseText)
      return data.data
    } catch (error) {
      console.error('Failed to parse response JSON:', error)
      throw new Error('Failed to parse candidate response')
    }
  }

  async updateCandidate(id: number, candidateData: Partial<CreateCandidateData>): Promise<Candidate> {
    const payload: Record<string, unknown> = {}
    if (candidateData.fullName !== undefined) payload.fullName = candidateData.fullName
    if (candidateData.phoneNo !== undefined) payload.phoneNo = candidateData.phoneNo
    if (candidateData.email !== undefined) payload.email = candidateData.email
    if (candidateData.address !== undefined) payload.address = candidateData.address
    if (candidateData.dob !== undefined) payload.dob = candidateData.dob
    if (candidateData.gender !== undefined) payload.gender = candidateData.gender
    if (candidateData.nin !== undefined) payload.nin = candidateData.nin
    if (candidateData.religion !== undefined) payload.religion = candidateData.religion
    if (candidateData.bio !== undefined) payload.bio = candidateData.bio
    if (candidateData.remark !== undefined) payload.remark = candidateData.remark
    if (candidateData.lga_district_id !== undefined) payload.lga_district_id = candidateData.lga_district_id
    if (candidateData.party_id !== undefined) payload.party_id = candidateData.party_id

    const response = await fetch(`${API_BASE_URL}/candidates/update-candidate/${id}`, {
      method: 'PATCH',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      throw new Error(`Failed to update candidate: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`)
    }
    
    const data: SingleCandidateResponse = await response.json()
    return data.data
  }

  async deleteCandidate(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/candidates/delete-candidate/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to delete candidate')
    }
  }

  async toggleCandidateStatus(id: number): Promise<Candidate> {
    const response = await fetch(`${API_BASE_URL}/candidates/toggle-candidate-status/${id}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      throw new Error(`Failed to toggle candidate status: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`)
    }

    const data: SingleCandidateResponse<CandidateDetail> = await response.json()
    const candidate = data.data

    const rawStatus = candidate.status
    const isActive =
      rawStatus === 1 ||
      String(rawStatus) === '1' ||
      String(rawStatus).toLowerCase() === 'active'
    const normalizedStatus = isActive ? 'Active' : 'Inactive'

    return {
      id: candidate.id,
      user_id: String(candidate.id),
      full_name: candidate.fullName,
      political_party: candidate.party?.name ?? '',
      senatorial_district: candidate.lga_district?.name ?? '',
      state: candidate.state?.name ?? '',
      status: normalizedStatus,
      created_at: candidate.created_at
    }
  }

  async checkCandidate(candidateData: { name?: string; state_id?: number }): Promise<Candidate | null> {
    const response = await fetch(`${API_BASE_URL}/candidates/check-candidate`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(candidateData)
    })
    
    if (!response.ok) {
      throw new Error('Failed to check candidate')
    }
    
    const data: SingleCandidateResponse = await response.json()
    return data.data
  }

  async getPartyPresidents(): Promise<Candidate[]> {
    const response = await fetch(`${API_BASE_URL}/candidates/view-party-president`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch president candidates')
    }
    
    const data: CandidateResponse = await response.json()
    return data.data
  }

  async getPartyGovernors(): Promise<Candidate[]> {
    const response = await fetch(`${API_BASE_URL}/candidates/view-party-governors`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch governatorial candidates')
    }
    
    const data: CandidateResponse = await response.json()
    return data.data
  }

  async getPartySenators(): Promise<Candidate[]> {
    const response = await fetch(`${API_BASE_URL}/candidates/party-state-senators`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch senatorial candidates')
    }
    
    const data: CandidateResponse = await response.json()
    return data.data
  }

  async getPartyReps(): Promise<Candidate[]> {
    const response = await fetch(`${API_BASE_URL}/candidates/party-state-reps`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch reps candidates')
    }
    
    const data: CandidateResponse = await response.json()
    return data.data
  }

  async getPartyAssemblyMembers(): Promise<Candidate[]> {
    const response = await fetch(`${API_BASE_URL}/candidates/party-state-members`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch assembly candidates')
    }
    
    const data: CandidateResponse = await response.json()
    return data.data
  }

  async getDistrictCandidates(districtData: { district_type?: string; district_id?: number }): Promise<Candidate[]> {
    const response = await fetch(`${API_BASE_URL}/candidates/view-district-candidates`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(districtData)
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch district candidates')
    }
    
    const data: CandidateResponse = await response.json()
    return data.data
  }
}

export const candidateService = new CandidateService()