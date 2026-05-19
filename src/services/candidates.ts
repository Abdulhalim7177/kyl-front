export const API_BASE_URL = '/api'

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

export interface Party {
  id: number
  name: string
  description?: string
  slogan?: string
  philosophy?: string
  address?: string
  status: number
  registrationYear?: string
  logopath?: string | null
  created_at?: string
  updated_at?: string
}

export interface State {
  id: number
  name: string
  status?: number
}

export interface LGADistrict {
  id: number
  name: string
  state_id?: number
  senetorial_district_id?: number
  status?: number
}

export interface PartyResponse {
  success: boolean
  data: Party[]
  message: string
}

export interface StateResponse {
  success: boolean
  data: State[]
  message: string
}

export interface LGADistrictResponse {
  success: boolean
  data: LGADistrict[]
  message: string
}

const unwrapApiArray = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload
  if (payload && typeof payload === 'object') {
    if (Array.isArray(payload.data)) return payload.data
    if (payload.data) return unwrapApiArray(payload.data)
  }
  return []
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

    const rawData: PaginatedResponse<any> = await response.json()
    console.log('📊 Candidates API Response Data:', rawData)

    const rawCandidates = Array.isArray(rawData.data?.data) ? rawData.data.data : []
    console.log('📊 Raw candidates length:', rawCandidates.length)

    const candidates = rawCandidates.map((candidate) => {
      const rawStatus = candidate.status
      const normalizedStatus =
        rawStatus === 1 || rawStatus === '1' || rawStatus === true || String(rawStatus).toLowerCase() === 'active'
          ? 'Active'
          : 'Inactive'

      return {
        id: candidate.id,
        user_id: candidate.code ?? String(candidate.id),
        full_name: candidate.fullName ?? '',
        political_party: candidate.party?.name ?? '',
        senatorial_district: candidate.lga_district?.name ?? String(candidate.lga_district?.senetorial_district_id ?? ''),
        state: candidate.state?.name ?? '',
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
    console.log('📥 getCandidateById response data (JSON string):', JSON.stringify(data));
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

    const data: SingleCandidateResponse<any> = await response.json()
    const candidate = data.data

    const rawStatus = candidate.status
    const normalizedStatus =
      rawStatus === 1 || rawStatus === '1' || rawStatus === true || String(rawStatus).toLowerCase() === 'active'
        ? 'Active'
        : 'Inactive'

    return {
      id: candidate.id,
      user_id: candidate.code ?? String(candidate.id),
      full_name: candidate.fullName ?? '',
      political_party: candidate.party?.name ?? '',
      senatorial_district: candidate.lga_district?.name ?? String(candidate.lga_district?.senetorial_district_id ?? ''),
      state: candidate.state?.name ?? '',
      status: normalizedStatus,
      created_at: candidate.created_at ?? ''
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

  async uploadCandidatePhoto(id: number, file: File): Promise<CandidateDetail> {
    const url = `${API_BASE_URL}/candidates/upload-photo/${id}`;
    console.log('📤 Sending photo upload request to:', url);
    console.log('📤 HTTP Method used: POST (spoofing PATCH via X-HTTP-Method-Override header)');
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('_method', 'PATCH'); // Laravel method spoofing in body
    
    const response = await fetch(url, {
      method: 'POST', // Send as POST to avoid Apache stripping Authorization header and PHP PATCH issues
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Accept': 'application/json',
        'X-HTTP-Method-Override': 'PATCH', // Spoof PATCH via Symfony/Laravel header
      },
      body: formData,
    });
    
    console.log('📥 Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response body:', errorText);
      throw new Error(`Failed to upload candidate photo: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data: any = await response.json();
    console.log('📥 Upload success data (JSON string):', JSON.stringify(data));
    
    // Normalize in case response wraps the candidate under a 'candidate' key
    const candidateObj = (data.data && data.data.candidate) ? data.data.candidate : data.data;
    return candidateObj;
  }

  async getAllParties(): Promise<Party[]> {
    try {
      console.log('🔍 Fetching all parties from /parties')
      const response = await fetch(`${API_BASE_URL}/parties`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      })

      console.log('📨 Parties API Response Status:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        console.error('❌ Failed to fetch parties:', response.status, response.statusText, errorText)
        return []
      }

      const data = await response.json()
      console.log('📊 Parties API Response Data:', data)

      const partyList = unwrapApiArray(data)
      console.log('✅ Returning parties:', partyList.length, 'items')
      return partyList
    } catch (error) {
      console.error('❌ Error fetching parties:', error)
      return []
    }
  }

  async getAllStates(): Promise<State[]> {
    try {
      console.log('🔍 Fetching all states from /districts/get-states')
      const response = await fetch(`${API_BASE_URL}/districts/get-states`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      })

      console.log('📨 States API Response Status:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        console.error('❌ Failed to fetch states:', response.status, response.statusText, errorText)
        return []
      }

      const data = await response.json()
      console.log('📊 States API Response Data:', data)

      const stateList = unwrapApiArray(data)
      console.log('✅ Returning states:', stateList.length, 'items')
      return stateList
    } catch (error) {
      console.error('❌ Error fetching states:', error)
      return []
    }
  }

  async getAllLGADistricts(): Promise<LGADistrict[]> {
    try {
      console.log('🔍 Fetching all LGA districts from /districts/get-lga-districts')
      const response = await fetch(`${API_BASE_URL}/districts/get-lga-districts`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      })

      console.log('📨 LGA Districts API Response Status:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        console.error('❌ Failed to fetch LGA districts:', response.status, response.statusText, errorText)
        return []
      }

      const data = await response.json()
      console.log('📊 LGA Districts API Response Data:', data)

      const districtList = unwrapApiArray(data)
      console.log('✅ Returning LGA districts:', districtList.length, 'items')
      return districtList
    } catch (error) {
      console.error('❌ Error fetching LGA districts:', error)
      return []
    }
  }
}

export const candidateService = new CandidateService()