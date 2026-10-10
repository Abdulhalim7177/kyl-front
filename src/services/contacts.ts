/* eslint-disable @typescript-eslint/no-explicit-any */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export interface ContactMessage {
  id?: number
  name: string
  email: string
  subject: string
  message: string
  status?: string
  created_at?: string
  updated_at?: string
}

class ContactService {
  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token')
    return {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  async submitContact(data: ContactMessage): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/contacts/submit`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error('Failed to submit contact message')
    return await response.json()
  }

  async getContacts(): Promise<ContactMessage[]> {
    const response = await fetch(`${API_BASE_URL}/contacts`, {
      headers: this.getAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch contacts')
    const data = await response.json()
    // Depending on pagination vs straight array return
    if (data.data && Array.isArray(data.data.data)) {
        return data.data.data
    }
    return data.data || data
  }

  async getContactsRange(startDate: string, endDate: string): Promise<ContactMessage[]> {
    const response = await fetch(`${API_BASE_URL}/contacts/range?start_date=${startDate}&end_date=${endDate}`, {
      headers: this.getAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch contacts range')
    const data = await response.json()
    if (data.data && Array.isArray(data.data.data)) {
        return data.data.data
    }
    return data.data || data
  }

  async markStatus(id: number, status: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/contacts/mark-status/${id}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ status })
    })
    if (!response.ok) throw new Error('Failed to update contact status')
    return await response.json()
  }
}

export const contactService = new ContactService()
