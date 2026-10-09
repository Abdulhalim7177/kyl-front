const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

export interface Poll {
  id: number
  question: string
  title?: string
  description?: string
  election_id?: number
  office_id?: number
  status: 'active' | 'closed'
  state_id?: number
  results_visibility?: string
  starts_at?: string
  ends_at?: string
  created_at: string
  candidates?: PollCandidate[]
  total_votes?: number
}

export interface PollCandidate {
  id: number
  poll_id: number
  candidate_office_id: number
  created_at: string
  candidate?: {
    id: number
    name: string
  }
  party?: {
    id: number
    name: string
    acronym: string
  }
}

export interface PollResult {
  poll_candidate_id: number
  candidate_office_id: number
  candidate?: {
    id: number
    name: string
  }
  party?: {
    id: number
    name: string
    acronym: string
  }
  votes: number
  percentage: number
}

class PollService {
  private getHeaders() {
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  }

  async getPolls(): Promise<Poll[]> {
    const response = await fetch(`${API_BASE_URL}/polls`, {
      method: 'GET',
      headers: this.getHeaders()
    })
    
    if (!response.ok) {
      if (response.status === 404) return []
      throw new Error('Failed to fetch polls')
    }
    
    const data = await response.json()
    if (data.success) {
      // Backend paginates by default, so data.data could be a paginator or array
      return Array.isArray(data.data) ? data.data : (data.data?.data || [])
    }
    return []
  }

  async getPoll(id: number): Promise<Poll> {
    const response = await fetch(`${API_BASE_URL}/polls/${id}`, {
      method: 'GET',
      headers: this.getHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch poll details')
    const data = await response.json()
    return data.data
  }

  async getPollCandidates(id: number): Promise<PollCandidate[]> {
    const response = await fetch(`${API_BASE_URL}/polls/${id}/candidates`, {
      method: 'GET',
      headers: this.getHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch poll candidates')
    const data = await response.json()
    return data.data || []
  }

  async getPollResults(id: number): Promise<{ results: PollResult[], total_votes: number }> {
    const response = await fetch(`${API_BASE_URL}/polls/${id}/results`, {
      method: 'GET',
      headers: this.getHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch poll results')
    const data = await response.json()
    return {
      results: data.data?.candidates || [],
      total_votes: data.data?.total_votes || 0
    }
  }

  async vote(pollId: number, payload: { poll_candidate_id: number, voter_key: string, email?: string, phone?: string, device_id?: string }): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/polls/${pollId}/vote`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    })
    
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.message || 'Failed to submit vote')
    }
    return data
  }
}

export const pollService = new PollService()




