import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Loader2 } from 'lucide-react'

export default function AdminPollFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEditing = !!id

  const [loading, setLoading] = useState(false)
  const [initLoading, setInitLoading] = useState(true)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    election_id: '',
    office_id: '',
    question: '',
    status: 'active',
    results_visibility: 'immediate',
    starts_at: '',
    ends_at: '',
    candidate_office_ids: [] as number[]
  })

  useEffect(() => {
    const fetchPoll = async () => {
      if (isEditing) {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/polls/${id}`, {
            headers: { 'Accept': 'application/json' }
          })
          if (!res.ok) throw new Error('Poll not found')
          const data = (await res.json()).data
          
          setFormData({
            election_id: data.election_id?.toString() || '',
            office_id: data.office_id?.toString() || '',
            question: data.question || '',
            status: data.status || 'active',
            results_visibility: data.results_visibility || 'immediate',
            starts_at: data.starts_at ? new Date(data.starts_at).toISOString().slice(0, 16) : '',
            ends_at: data.ends_at ? new Date(data.ends_at).toISOString().slice(0, 16) : '',
            candidate_office_ids: data.candidates?.map((c: any) => c.candidate_office_id) || []
          })
        } catch (err: any) {
          setError('Failed to load poll data')
        }
      }
      setInitLoading(false)
    }
    fetchPoll()
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
        candidate_office_ids: formData.candidate_office_ids
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
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#146c4f]" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(-1)}
          className="text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Poll' : 'Add New Poll'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isEditing ? 'Update the configuration of this poll.' : 'Create a new public opinion poll.'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Question</label>
              <Input 
                required 
                name="question" 
                value={formData.question} 
                onChange={handleChange} 
                placeholder="e.g. Who is your preferred candidate?" 
                className="rounded-xl border-gray-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Election ID</label>
                <Input 
                  required 
                  type="number" 
                  name="election_id" 
                  value={formData.election_id} 
                  onChange={handleChange} 
                  className="rounded-xl border-gray-200"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Office ID</label>
                <Input 
                  required 
                  type="number" 
                  name="office_id" 
                  value={formData.office_id} 
                  onChange={handleChange} 
                  className="rounded-xl border-gray-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Candidate Office IDs (Comma separated)</label>
              <Input 
                placeholder="e.g. 14, 15, 16"
                value={formData.candidate_office_ids.join(', ')}
                onChange={(e) => setFormData({...formData, candidate_office_ids: e.target.value.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n))})}
                className="rounded-xl border-gray-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Start Time</label>
                <Input 
                  type="datetime-local" 
                  name="starts_at" 
                  value={formData.starts_at} 
                  onChange={handleChange} 
                  className="rounded-xl border-gray-200"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">End Time</label>
                <Input 
                  type="datetime-local" 
                  name="ends_at" 
                  value={formData.ends_at} 
                  onChange={handleChange} 
                  className="rounded-xl border-gray-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <select 
                  name="status" 
                  value={formData.status} 
                  onChange={handleChange} 
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Results Visibility</label>
                <select 
                  name="results_visibility" 
                  value={formData.results_visibility} 
                  onChange={handleChange} 
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="immediate">Immediate</option>
                  <option value="after_close">After Close</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-6 flex justify-end gap-3 border-t border-gray-100">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate(-1)} 
              className="rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading} 
              className="rounded-xl bg-[#146c4f] hover:bg-[#115a42] text-white"
            >
              {loading ? 'Saving...' : 'Save Poll'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
