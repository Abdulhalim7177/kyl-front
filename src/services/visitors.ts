const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

class VisitorService {
  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
  }

  private async fetchApi(endpoint: string, params?: Record<string, string | number>) {
    let url = `${API_BASE_URL}/visitors/${endpoint}`
    if (params) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) searchParams.append(key, String(value))
      })
      const qs = searchParams.toString()
      if (qs) url += `?${qs}`
    }
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders()
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${endpoint}`)
    }
    
    const data = await response.json()
    if (data.success && data.data) {
      return data.data
    }
    return data
  }

  // --- Districts ---
  async getStates() { return this.fetchApi('get-states') }
  async getStateSenatorialDistricts(stateId: number) { return this.fetchApi(`state-senatorial-districts/${stateId}`) }
  async getStateFederalHouseDistricts(stateId: number) { return this.fetchApi(`state-federal-house-districts/${stateId}`) }
  async getStateStateHouseDistricts(stateId: number) { return this.fetchApi(`state-state-house-districts/${stateId}`) }
  async getStateLgas(stateId: number) { return this.fetchApi(`state-lgas/${stateId}`) }
  async getLgaWards(lgaId: number) { return this.fetchApi(`lga-wards/${lgaId}`) }

  // --- Candidates ---
  async getActivePresidencyCandidates(params?: Record<string, string|number>) { return this.fetchApi('get-active-presidency-candidates', params) }
  async getPresidencyCandidates(params?: Record<string, string|number>) { return this.fetchApi('get-presidency-candidates', params) }
  async getActiveGovernatorialCandidates(params?: Record<string, string|number>) { return this.fetchApi('get-active-governatorial-candidates', params) }
  async getGovernatorialCandidates(params?: Record<string, string|number>) { return this.fetchApi('get-governatorial-candidates', params) }
  async getActiveSenatorialCandidates(params?: Record<string, string|number>) { return this.fetchApi('get-active-senatorial-candidates', params) }
  async getSenatorialCandidates(params?: Record<string, string|number>) { return this.fetchApi('get-senatorial-candidates', params) }
  async getActiveFederalHouseCandidates(params?: Record<string, string|number>) { return this.fetchApi('get-active-federal-house-candidates', params) }
  async getFederalHouseCandidates(params?: Record<string, string|number>) { return this.fetchApi('get-federal-house-candidates', params) }
  async getActiveStateHouseCandidates(params?: Record<string, string|number>) { return this.fetchApi('get-active-state-house-candidates', params) }
  async getStateHouseCandidates(params?: Record<string, string|number>) { return this.fetchApi('get-state-house-candidates', params) }
  async getActiveLgaCandidates(params?: Record<string, string|number>) { return this.fetchApi('get-active-lga-candidates', params) }
  async getLgaCandidates(params?: Record<string, string|number>) { return this.fetchApi('get-lga-candidates', params) }
  async getActiveWardCandidates(params?: Record<string, string|number>) { return this.fetchApi('get-active-ward-candidates', params) }
  async getWardCandidates(params?: Record<string, string|number>) { return this.fetchApi('get-ward-candidates', params) }

  // --- Elected Leaders ---
  async getActiveElectedPresidency() { return this.fetchApi('get-active-elected-presidency') }
  async getElectedPresidency() { return this.fetchApi('get-elected-presidency') }
  async getActiveElectedGovernor() { return this.fetchApi('get-active-elected-governor') }
  async getElectedGovernor() { return this.fetchApi('get-elected-governor') }
  async getActiveElectedSenator() { return this.fetchApi('get-active-elected-senator') }
  async getElectedSenator() { return this.fetchApi('get-elected-senator') }
  async getActiveElectedHouseOfRepMember() { return this.fetchApi('get-active-elected-house-of-rep-member') }
  async getElectedHouseOfRepMember() { return this.fetchApi('get-elected-house-of-rep-member') }
  async getActiveElectedStateAssemblyMember() { return this.fetchApi('get-active-elected-state-assembly-member') }
  async getElectedStateAssemblyMember() { return this.fetchApi('get-elected-state-assembly-member') }
  async getActiveElectedLgaChairman() { return this.fetchApi('get-active-elected-lga-chairman') }
  async getElectedLgaChairman() { return this.fetchApi('get-elected-lga-chairman') }
  async getActiveElectedWardCouncillor() { return this.fetchApi('get-active-elected-ward-councillor') }
  async getElectedWardCouncillor() { return this.fetchApi('get-elected-ward-councillor') }

  // --- Profile ---
  async getCandidateProfile(id: number) { return this.fetchApi(`get-candidate-profile/${id}`) }
  async getCandidateEducation(id: number) { return this.fetchApi(`get-candidate-education/${id}`) }
  async getCandidateExperiences(id: number) { return this.fetchApi(`get-candidate-experiences/${id}`) }
  async getCandidateAchievements(id: number) { return this.fetchApi(`get-candidate-achievements/${id}`) }
  async getCandidateOffices(id: number) { return this.fetchApi(`get-candidate-offices/${id}`) }
  async getCandidateLeadershipHistory(id: number) { return this.fetchApi(`get-candidate-leadership/${id}`) }
}

export const visitorService = new VisitorService()
