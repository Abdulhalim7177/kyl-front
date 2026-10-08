/* eslint-disable @typescript-eslint/no-explicit-any */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://kyl.aitshub.com.ng/api/v1'

export interface ElectedLeader {
  id: number | string
  name: string
  position: string
  stateId?: number
  stateName?: string
  candidateId?: number | string
  candidatePhoto?: string | Record<string, any> | null
  candidateNin?: string | number
  candidatePhone?: string
  candidateEmail?: string
  partyName?: string
  partyLogo?: string | null
  status?: string
  [key: string]: any
}

export interface ElectedLgaActionResponse {
  leader: ElectedLeader
  message: string
}

export interface ElectedCandidate {
  id: number
  full_name: string
  nin?: string | number
  phoneNo?: string
  party_id?: number
  political_party?: string
  state?: string
  state_id?: number
  party?: {
    name?: string
    logopath?: string | null
  }
}

export interface AddElectedGovernorData {
  candidate_id: number
  office_id: number
  party_id: number
  election_id: number
  state_id: number
  start_date: string
  end_date: string
  tenure: string
  remark: string
  status: string
}

export interface UpdateElectedGovernorData {
  candidate_id: number
  office_id: number
  party_id: number
  election_id: number
  state_id: number
  start_date: string
  end_date: string
  tenure: string
  remark: string
}

export interface AddElectedSenatorData {
  candidate_id: number
  office_id: number
  party_id: number
  election_id: number
  senetorial_district_id: number
  start_date: string
  end_date: string
  tenure: string
  remark: string
}

export type UpdateElectedSenatorData = AddElectedSenatorData

export interface AddElectedHouseOfRepMemberData {
  candidate_id: number
  office_id: number
  party_id: number
  election_id: number
  federal_house_district_id: number
  start_date: string
  end_date: string
  tenure: string
  remark: string
}

export interface AddElectedStateAssemblyMemberData {
  candidate_id: number
  office_id: number
  party_id: number
  election_id: number
  state_house_district_id: number
  start_date: string
  end_date: string
  tenure: string
  remark: string
}

export interface AddElectedLgaChairmanData {
  candidate_id: number
  office_id: number
  party_id: number
  election_id: number
  lga_district_id: number
  start_date: string
  end_date: string
  tenure: string
  remark: string
}

export interface AddElectedWardCouncillorData {
  candidate_id: number
  office_id: number
  party_id: number
  election_id: number
  ward_id: number
  start_date: string
  end_date: string
  tenure: string
  remark: string
}

export type UpdateElectedHouseOfRepMemberData = AddElectedHouseOfRepMemberData

export interface LeadershipRegistrationCheck {
  candidate_id: number
  election_id: number
  already_registered: boolean
  can_register: boolean
  registrations?: any
  message?: string
}

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('auth_token')
  return {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }
}

const unwrapPayload = (result: any): any => result?.data ?? result

const toArray = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.leaders)) return payload.leaders
  if (Array.isArray(payload?.elected)) return payload.elected

  const entries: any[] = []
  const governor = payload?.governor ?? payload?.elected_governor
  const deputyGovernor = payload?.deputy_governor ?? payload?.deputyGovernor ?? payload?.elected_deputy_governor
  const chairman = payload?.chairman ?? payload?.elected_lga_chairman ?? payload?.lga_chairman
  const deputyChairman = payload?.deputy_chairman
    ?? payload?.deputyChairman
    ?? payload?.elected_deputy_lga_chairman
    ?? payload?.elected_lga_deputy_chairman
    ?? payload?.deputy_lga_chairman
    ?? payload?.lga_deputy_chairman
  const appendPosition = (value: any, position: string) => {
    const records = Array.isArray(value) ? value : [value]
    records.forEach((record) => {
      if (record && typeof record === 'object') {
        entries.push({ ...record, position: record.position ?? record.office_title ?? record.office?.title ?? position })
      }
    })
  }
  appendPosition(governor, 'Governor')
  appendPosition(deputyGovernor, 'Deputy Governor')
  appendPosition(chairman, 'Local Government Chairman')
  appendPosition(deputyChairman, 'Deputy Local Government Chairman')
  return entries
}

const normalizeLeader = (leader: any, fallbackPosition?: string): ElectedLeader => {
  const candidate = leader.candidate ?? leader.user ?? leader
  const state = leader.state ?? candidate.state
  const party = leader.party

  return {
    ...leader,
    id: leader.id ?? candidate.id ?? `${fallbackPosition}-${leader.state_id ?? state?.id ?? 'unknown'}`,
    name: candidate.full_name ?? candidate.fullName ?? candidate.name ?? leader.name ?? 'N/A',
    position: leader.position ?? leader.office_title ?? leader.office?.title ?? fallbackPosition ?? 'N/A',
    stateId: leader.state_id ?? candidate.state_id ?? state?.id,
    stateName: state?.name ?? leader.state_name ?? candidate.state_name,
    candidateId: leader.candidate_id ?? candidate.id,
    candidatePhoto: candidate.image ?? candidate.photo ?? candidate.photo_url ?? candidate.profile_photo ?? candidate.profile_picture ?? candidate.avatar ?? leader.candidate_image ?? leader.candidate_photo ?? leader.photo ?? null,
    candidateNin: candidate.nin,
    candidatePhone: candidate.phoneNo ?? candidate.phone_no ?? candidate.phone,
    candidateEmail: candidate.email,
    partyName: party?.name ?? leader.party_name ?? candidate.party_name ?? candidate.political_party ?? candidate.party?.name,
    partyLogo: party?.logopath ?? party?.logo ?? party?.logo_path ?? party?.logo_url ?? party?.url ?? party?.path ?? party?.image_url ?? party?.image_path ?? leader.party_logo ?? leader.partyLogo ?? candidate.party_logo ?? candidate.partyLogo ?? candidate.party?.logo ?? candidate.party?.logo_url ?? candidate.party?.logopath ?? candidate.party?.logo_path ?? null,
    status: leader.status ?? candidate.status
  }
}

const getErrorMessage = (result: any, fallback: string) => {
  if (result?.message) return result.message
  if (result?.errors) {
    return Object.values(result.errors).flat().join(' | ')
  }
  return fallback
}

class LeadersService {
  async getActiveElectedGovernors(stateId: number): Promise<ElectedLeader[]> {
    const query = new URLSearchParams({ state_id: stateId.toString() })
    const response = await fetch(`${API_BASE_URL}/leaders/get-active-elected-governor?${query.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      if (response.status === 404) return []
      const result = await response.json().catch(() => ({}))
      throw new Error(getErrorMessage(result, `Failed to fetch active elected governors: ${response.status}`))
    }

    const result = await response.json()
    return toArray(unwrapPayload(result)).map((leader) => normalizeLeader(leader))
  }

  async getElectedGovernors(stateId: number, electionId: number): Promise<ElectedLeader[]> {
    const query = new URLSearchParams({
      state_id: stateId.toString(),
      election_id: electionId.toString()
    })
    const response = await fetch(`${API_BASE_URL}/leaders/get-elected-governor?${query.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      if (response.status === 404) return []
      const result = await response.json().catch(() => ({}))
      throw new Error(getErrorMessage(result, `Failed to fetch elected governors: ${response.status}`))
    }

    const result = await response.json()
    return toArray(unwrapPayload(result)).map((leader) => normalizeLeader(leader))
  }

  async getActiveElectedSenators(senatorialDistrictId: number): Promise<ElectedLeader[]> {
    const query = new URLSearchParams({ senetorial_district_id: senatorialDistrictId.toString() })
    const response = await fetch(`${API_BASE_URL}/leaders/get-active-elected-senator?${query.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      if (response.status === 404) return []
      const result = await response.json().catch(() => ({}))
      throw new Error(getErrorMessage(result, `Failed to fetch active elected senators: ${response.status}`))
    }

    const result = await response.json()
    return toArray(unwrapPayload(result)).map((leader) => normalizeLeader(leader, 'Senator'))
  }

  async getActiveElectedHouseOfRepMembers(federalHouseDistrictId: number): Promise<ElectedLeader[]> {
    const query = new URLSearchParams({ federal_house_district_id: federalHouseDistrictId.toString() })
    const response = await fetch(`${API_BASE_URL}/leaders/get-active-elected-house-of-rep-member?${query.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      if (response.status === 404) return []
      const result = await response.json().catch(() => ({}))
      throw new Error(getErrorMessage(result, `Failed to fetch elected House of Representatives members: ${response.status}`))
    }

    const result = await response.json()
    if (result?.success === false) {
      throw new Error(getErrorMessage(result, 'Failed to fetch elected House of Representatives members'))
    }
    return toArray(unwrapPayload(result)).map((leader) => normalizeLeader(leader, 'Federal House Representative'))
  }

  async getActiveElectedStateAssemblyMembers(stateHouseDistrictId: number): Promise<ElectedLeader[]> {
    const query = new URLSearchParams({ state_house_district_id: stateHouseDistrictId.toString() })
    const response = await fetch(`${API_BASE_URL}/leaders/get-active-elected-state-assembly-member?${query.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      if (response.status === 404) return []
      const result = await response.json().catch(() => ({}))
      throw new Error(getErrorMessage(result, `Failed to fetch elected State Assembly members: ${response.status}`))
    }

    const result = await response.json()
    if (result?.success === false) {
      throw new Error(getErrorMessage(result, 'Failed to fetch elected State Assembly members'))
    }
    return toArray(unwrapPayload(result)).map((leader) => normalizeLeader(leader, 'State House of Assembly Member'))
  }

  async getActiveElectedLgaChairman(lgaDistrictId: number): Promise<ElectedLeader[]> {
    const query = new URLSearchParams({ lga_district_id: lgaDistrictId.toString() })
    const response = await fetch(`${API_BASE_URL}/leaders/get-active-elected-lga-chairman?${query.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      if (response.status === 404) return []
      const result = await response.json().catch(() => ({}))
      throw new Error(getErrorMessage(result, `Failed to fetch active elected LGA chairman: ${response.status}`))
    }

    const result = await response.json()
    if (result?.success === false) {
      throw new Error(getErrorMessage(result, 'Failed to fetch active elected LGA chairman'))
    }
    return toArray(unwrapPayload(result)).map((leader, index) =>
      normalizeLeader(leader, index === 0 ? 'Local Government Chairman' : 'Deputy Local Government Chairman')
    )
  }

  async getActiveElectedWardCouncillor(wardId: number): Promise<ElectedLeader[]> {
    const query = new URLSearchParams({ ward_id: wardId.toString() })
    const response = await fetch(`${API_BASE_URL}/leaders/get-active-elected-ward-councillor?${query.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      if (response.status === 404) return []
      const result = await response.json().catch(() => ({}))
      throw new Error(getErrorMessage(result, `Failed to fetch active elected ward councillors: ${response.status}`))
    }

    const result = await response.json()
    if (result?.success === false) {
      throw new Error(getErrorMessage(result, 'Failed to fetch active elected ward councillors'))
    }
    return toArray(unwrapPayload(result)).map((leader) => normalizeLeader(leader, 'Ward Councillor'))
  }

  async getElectedWardCouncillor(wardId: number, electionId: number): Promise<ElectedLeader[]> {
    const query = new URLSearchParams({
      ward_id: wardId.toString(),
      election_id: electionId.toString()
    })
    const response = await fetch(`${API_BASE_URL}/leaders/get-elected-ward-councillor?${query.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      if (response.status === 404) return []
      const result = await response.json().catch(() => ({}))
      throw new Error(getErrorMessage(result, `Failed to fetch elected ward councillors: ${response.status}`))
    }

    const result = await response.json()
    if (result?.success === false) {
      throw new Error(getErrorMessage(result, 'Failed to fetch elected ward councillors'))
    }
    return toArray(unwrapPayload(result)).map((leader) => normalizeLeader(leader, 'Ward Councillor'))
  }

  async getElectedLgaChairman(lgaDistrictId: number, electionId: number): Promise<ElectedLeader[]> {
    const query = new URLSearchParams({
      election_id: electionId.toString(),
      lga_district_id: lgaDistrictId.toString()
    })
    const response = await fetch(`${API_BASE_URL}/leaders/get-elected-lga-chairman?${query.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      if (response.status === 404) return []
      const result = await response.json().catch(() => ({}))
      throw new Error(getErrorMessage(result, `Failed to fetch elected LGA leaders: ${response.status}`))
    }

    const result = await response.json()
    if (result?.success === false) {
      throw new Error(getErrorMessage(result, 'Failed to fetch elected LGA leaders'))
    }
    return toArray(unwrapPayload(result)).map((leader, index) =>
      normalizeLeader(leader, index === 0 ? 'Local Government Chairman' : 'Deputy Local Government Chairman')
    )
  }

  async addElectedLgaChairman(data: AddElectedLgaChairmanData): Promise<ElectedLeader> {
    const response = await fetch(`${API_BASE_URL}/leaders/add-elected-lga-chairman`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    const result = await response.json().catch(() => ({}))
    if (!response.ok || result.success === false) {
      throw new Error(getErrorMessage(result, 'Failed to add elected LGA chairman'))
    }

    return result.data ?? result
  }

  async addElectedWardCouncillor(data: AddElectedWardCouncillorData): Promise<ElectedLeader> {
    const response = await fetch(`${API_BASE_URL}/leaders/add-elected-ward-councillor`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    const result = await response.json().catch(() => ({}))
    if (!response.ok || result.success === false) {
      throw new Error(getErrorMessage(result, 'Failed to add elected ward councillor'))
    }

    return result.data ?? result
  }

  async updateElectedWardCouncillor(id: number, data: AddElectedWardCouncillorData): Promise<ElectedLeader> {
    const response = await fetch(`${API_BASE_URL}/leaders/update-elected-ward-councillor/${id}`, {
      method: 'PATCH',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    const result = await response.json().catch(() => ({}))
    if (!response.ok || result.success === false) {
      throw new Error(getErrorMessage(result, 'Failed to update elected ward councillor'))
    }

    return result.data ?? result
  }

  async removeElectedWardCouncillor(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/leaders/remove-elected-ward-councillor/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })

    const result = await response.json().catch(() => ({}))
    if (!response.ok || result.success === false) {
      throw new Error(getErrorMessage(result, 'Failed to remove elected ward councillor'))
    }
  }

  async terminateElectedWardCouncillor(id: number): Promise<ElectedLgaActionResponse> {
    const response = await fetch(`${API_BASE_URL}/leaders/terminate-elected-ward-councillor/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    })

    const result = await response.json().catch(() => ({}))
    if (!response.ok || result.success === false) {
      throw new Error(getErrorMessage(result, 'Failed to terminate elected ward councillor'))
    }

    return {
      leader: normalizeLeader(result.data ?? result, 'Ward Councillor'),
      message: String(result.message ?? 'Elected ward councillor terminated successfully.')
    }
  }

  async updateElectedLgaChairman(id: number, data: AddElectedLgaChairmanData): Promise<ElectedLeader> {
    const response = await fetch(`${API_BASE_URL}/leaders/update-elected-lga-chairman/${id}`, {
      method: 'PATCH',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    const result = await response.json().catch(() => ({}))
    if (!response.ok || result.success === false) {
      throw new Error(getErrorMessage(result, 'Failed to update elected LGA chairman'))
    }

    return result.data ?? result
  }

  async removeElectedLgaChairman(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/leaders/remove-elected-lga-chairman/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })

    const result = await response.json().catch(() => ({}))
    if (!response.ok || result.success === false) {
      throw new Error(getErrorMessage(result, 'Failed to remove elected LGA chairman'))
    }
  }

  async terminateElectedLgaChairman(id: number): Promise<ElectedLgaActionResponse> {
    const response = await fetch(`${API_BASE_URL}/leaders/terminate-elected-lga-chairman/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    })

    const result = await response.json().catch(() => ({}))
    if (!response.ok || result.success === false) {
      throw new Error(getErrorMessage(result, 'Failed to terminate elected LGA chairman'))
    }

    return {
      leader: normalizeLeader(result.data ?? result, 'Local Government Official'),
      message: String(result.message ?? 'Elected LGA official terminated successfully.')
    }
  }

  async getElectedStateAssemblyMembers(stateHouseDistrictId: number, electionId: number): Promise<ElectedLeader[]> {
    const query = new URLSearchParams({
      election_id: electionId.toString(),
      state_house_district_id: stateHouseDistrictId.toString()
    })
    const response = await fetch(`${API_BASE_URL}/leaders/get-elected-state-assembly-member?${query.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      if (response.status === 404) return []
      const result = await response.json().catch(() => ({}))
      throw new Error(getErrorMessage(result, `Failed to fetch elected State Assembly members: ${response.status}`))
    }

    const result = await response.json()
    if (result?.success === false) {
      throw new Error(getErrorMessage(result, 'Failed to fetch elected State Assembly members'))
    }
    return toArray(unwrapPayload(result)).map((leader) => normalizeLeader(leader, 'State House of Assembly Member'))
  }

  async getElectedHouseOfRepMembers(federalHouseDistrictId: number, electionId: number): Promise<ElectedLeader[]> {
    const query = new URLSearchParams({
      election_id: electionId.toString(),
      federal_house_district_id: federalHouseDistrictId.toString()
    })
    const response = await fetch(`${API_BASE_URL}/leaders/get-elected-house-of-rep-member?${query.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      if (response.status === 404) return []
      const result = await response.json().catch(() => ({}))
      throw new Error(getErrorMessage(result, `Failed to fetch elected House of Representatives members: ${response.status}`))
    }

    const result = await response.json()
    if (result?.success === false) {
      throw new Error(getErrorMessage(result, 'Failed to fetch elected House of Representatives members'))
    }
    return toArray(unwrapPayload(result)).map((leader) => normalizeLeader(leader, 'Federal House Representative'))
  }

  async checkLeadershipRegistration(data: { candidate_id: number; election_id: number }): Promise<LeadershipRegistrationCheck> {
    const response = await fetch(`${API_BASE_URL}/leaders/check-leadership-registration`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    const result = await response.json().catch(() => ({}))
    if (!response.ok || result.success === false) {
      throw new Error(getErrorMessage(result, 'This candidate is already assigned to a leadership position.'))
    }

    const payload = result.data ?? result
    return {
      candidate_id: Number(payload.candidate_id ?? data.candidate_id),
      election_id: Number(payload.election_id ?? data.election_id),
      already_registered: payload.already_registered === true,
      can_register: payload.can_register === true && payload.already_registered !== true,
      registrations: payload.registrations ?? null,
      message: result.message
    }
  }

  async addElectedGovernor(data: AddElectedGovernorData): Promise<ElectedLeader> {
    const response = await fetch(`${API_BASE_URL}/leaders/add-elected-governor`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    const result = await response.json().catch(() => ({}))
    if (!response.ok || result.success === false) {
      throw new Error(getErrorMessage(result, 'Failed to add elected governor'))
    }

    return result.data ?? result
  }

  async updateElectedGovernor(id: number, data: UpdateElectedGovernorData): Promise<ElectedLeader> {
    const response = await fetch(`${API_BASE_URL}/leaders/update-elected-governor/${id}`, {
      method: 'PATCH',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    const result = await response.json().catch(() => ({}))
    if (!response.ok || result.success === false) {
      throw new Error(getErrorMessage(result, 'Failed to update elected governor'))
    }

    return result.data ?? result
  }

  async addElectedSenator(data: AddElectedSenatorData): Promise<ElectedLeader> {
    const response = await fetch(`${API_BASE_URL}/leaders/add-elected-senator`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    const result = await response.json().catch(() => ({}))
    if (!response.ok || result.success === false) {
      throw new Error(getErrorMessage(result, 'Failed to add elected senator'))
    }

    return result.data ?? result
  }

  async addElectedHouseOfRepMember(data: AddElectedHouseOfRepMemberData): Promise<ElectedLeader> {
    const response = await fetch(`${API_BASE_URL}/leaders/add-elected-house-of-rep-member`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    const result = await response.json().catch(() => ({}))
    if (!response.ok || result.success === false) {
      throw new Error(getErrorMessage(result, 'Failed to add elected House of Representatives member'))
    }

    return result.data ?? result
  }

  async addElectedStateAssemblyMember(data: AddElectedStateAssemblyMemberData): Promise<ElectedLeader> {
    const response = await fetch(`${API_BASE_URL}/leaders/add-elected-state-assembly-member`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    const result = await response.json().catch(() => ({}))
    if (!response.ok || result.success === false) {
      throw new Error(getErrorMessage(result, 'Failed to add elected State Assembly member'))
    }

    return result.data ?? result
  }

  async updateElectedHouseOfRepMember(id: number, data: UpdateElectedHouseOfRepMemberData): Promise<ElectedLeader> {
    const response = await fetch(`${API_BASE_URL}/leaders/update-elected-house-of-rep-member/${id}`, {
      method: 'PATCH',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    const result = await response.json().catch(() => ({}))
    if (!response.ok || result.success === false) {
      throw new Error(getErrorMessage(result, 'Failed to update elected House of Representatives member'))
    }

    return result.data ?? result
  }

  async terminateElectedHouseOfRepMember(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/leaders/terminate-elected-house-of-rep-member/${id}`, {
      method: 'POST',
      headers: getAuthHeaders()
    })

    const result = await response.json().catch(() => ({}))
    if (!response.ok || result.success === false) {
      throw new Error(getErrorMessage(result, 'Failed to terminate elected House of Representatives member'))
    }
  }

  async removeElectedHouseOfRepMember(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/leaders/remove-elected-house-of-rep-member/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })

    const result = await response.json().catch(() => ({}))
    if (!response.ok || result.success === false) {
      throw new Error(getErrorMessage(result, 'Failed to delete elected House of Representatives member'))
    }
  }

  async removeElectedStateAssemblyMember(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/leaders/remove-elected-state-assembly-member/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })

    const result = await response.json().catch(() => ({}))
    if (!response.ok || result.success === false) {
      throw new Error(getErrorMessage(result, 'Failed to remove elected State Assembly member'))
    }
  }

  async terminateElectedStateAssemblyMember(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/leaders/terminate-elected-state-assembly-member/${id}`, {
      method: 'POST',
      headers: getAuthHeaders()
    })

    const result = await response.json().catch(() => ({}))
    if (!response.ok || result.success === false) {
      throw new Error(getErrorMessage(result, 'Failed to terminate elected State Assembly member'))
    }
  }

  async updateElectedSenator(id: number, data: UpdateElectedSenatorData): Promise<ElectedLeader> {
    const response = await fetch(`${API_BASE_URL}/leaders/update-elected-senator/${id}`, {
      method: 'PATCH',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }) 

    const result = await response.json().catch(() => ({}))
    if (!response.ok || result.success === false) {
      throw new Error(getErrorMessage(result, 'Failed to update elected senator'))
    }

    return result.data ?? result
  }

  async removeElectedGovernor(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/leaders/remove-elected-governor/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })

    const result = await response.json().catch(() => ({}))
    if (!response.ok || result.success === false) {
      throw new Error(getErrorMessage(result, 'Failed to remove elected governor'))
    }
  }

  async removeElectedSenator(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/leaders/remove-elected-senator/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })

    const result = await response.json().catch(() => ({}))
    if (!response.ok || result.success === false) {
      throw new Error(getErrorMessage(result, 'Failed to remove elected senator'))
    }
  }

}

export const leadersService = new LeadersService()
