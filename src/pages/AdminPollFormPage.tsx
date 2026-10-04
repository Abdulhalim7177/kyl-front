import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { pollService } from '@/services/polls'

export default function AdminPollFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEditing = !!id

  const [loading, setLoading] = useState(false)
  const [initLoading, setInitLoading] = useState(isEditing)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    election_id: '',
    office_id: '',
    question: '',
    state_id: '',
    status: 'active',
    results_visibility: 'immediate',
    starts_at: '',
    ends_at: '',
    candidate_office_ids: [] as number[]
  })

  useEffect(() => {
    if (isEditing) {
      const fetchPoll = async () => {
        try {
          const data = await pollService.getPoll(Number(id))
          setFormData({
            election_id: data.election_id?.toString() || '',
            office_id: data.office_id?.toString() || '',
            question: data.question || '',
            state_id: data.state_id?.toString() || '',
            status: data.status || 'active',
            results_visibility: data.results_visibility || 'immediate',
            starts_at: data.starts_at ? new Date(data.starts_at).toISOString().slice(0, 16) : '',
            ends_at: data.ends_at ? new Date(data.ends_at).toISOString().slice(0, 16) : '',
            candidate_office_ids: data.candidates?.map((c: any) => c.candidate_office_id) || []
          })
        } catch (err: any) {
          setError('Failed to load poll data')
        } finally {
          setInitLoading(false)
        }
      }
      fetchPoll()
    }
  }, [id, isEditing])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        election_id: Number(formData.election_id),
        office_id: Number(formData.office_id),
        question: formData.question,
        status: formData.status,
        results_visibility: formData.results_visibility,
        starts_at: formData.starts_at,
        ends_at: formData.ends_at,
        candidate_office_ids: formData.candidate_office_ids.length > 0 ? formData.candidate_office_ids : [1] // Fake for now, need actual multi-select
      }

      const url = `${import.meta.env.VITE_API_BASE_URL || '/api'}/polls${isEditing ? `/${id}` : ''}`
      const response = await fetch(url, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const resData = await response.json()
        throw new Error(resData.message || 'Failed to save poll')
      }

      navigate('/k8s9d7f3-polls')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  if (initLoading) {
    return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div></div>
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Poll' : 'Create New Poll'}</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Question</label>
              <Input required name="question" value={formData.question} onChange={handleChange} placeholder="e.g. Who is your preferred candidate?" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Election ID</label>
                <Input required type="number" name="election_id" value={formData.election_id} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Office ID</label>
                <Input required type="number" name="office_id" value={formData.office_id} onChange={handleChange} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date & Time</label>
                <Input type="datetime-local" name="starts_at" value={formData.starts_at} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date & Time</label>
                <Input type="datetime-local" name="ends_at" value={formData.ends_at} onChange={handleChange} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className="w-full border rounded-md px-3 py-2">
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Results Visibility</label>
                <select name="results_visibility" value={formData.results_visibility} onChange={handleChange} className="w-full border rounded-md px-3 py-2">
                  <option value="immediate">Immediate</option>
                  <option value="after_close">After Close</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Candidate Office IDs (Comma separated)</label>
              <Input 
                placeholder="e.g. 14, 15, 16"
                value={formData.candidate_office_ids.join(', ')}
                onChange={(e) => setFormData({...formData, candidate_office_ids: e.target.value.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n))})}
              />
            </div>

            <div className="pt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => navigate('/k8s9d7f3-polls')}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Poll'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}


