import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
// Select components removed as they are no longer needed
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { electionService } from '@/services/elections'
import { useAuth } from '@/contexts/AuthContext'

export default function ElectionFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  
  const isEditMode = !!id

  const [loading, setLoading] = useState(isEditMode)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<{ year: string; details?: string }>({
    year: '',
    details: ''
  })

  useEffect(() => {
    if (isAuthenticated && isEditMode) {
      loadElection(Number(id))
    }
  }, [isAuthenticated, isEditMode, id])

  const loadElection = async (electionId: number) => {
    try {
      setLoading(true)
      const data = await electionService.getElectionById(electionId)
      if (data) {
        setFormData({
          year: data.year ? String(data.year) : '',
          details: data.details || ''
        })
      } else {
        setError('Election not found')
      }
    } catch (err) {
      console.error('Failed to load election:', err)
      setError('Failed to load election details.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

// handleSelectChange removed; not needed for year/details fields

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.year) {
      setError('Year is required.')
      return
    }
    const yearNum = Number(formData.year)
    if (isNaN(yearNum) || yearNum <= 0) {
      setError('Year must be a valid positive integer.')
      return
    }
    try {
      setSaving(true)
      setError(null)
      if (isEditMode) {
        await electionService.updateElection(Number(id), {
          year: yearNum,
          details: formData.details?.trim() || undefined
        })
      } else {
        await electionService.createElection({ year: yearNum, details: formData.details?.trim() || undefined })
      }
      navigate('/k8s9d7f3-elections')
    } catch (err) {
      console.error('Failed to save election:', err)
      setError('Failed to save election. Please try again.')
      setSaving(false)
    }
  }

  if (loading) {
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
            {isEditMode ? 'Edit Election' : 'Add New Election'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isEditMode ? 'Update the details of an existing election.' : 'Create a new election in the system.'}
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
              <label htmlFor="year" className="text-sm font-medium text-gray-700">Election Year</label>
              <Input
                id="year"
                name="year"
                value={formData.year}
                onChange={handleChange}
                placeholder="e.g. 2027"
                className="rounded-xl border-gray-200"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="details" className="text-sm font-medium text-gray-700">Details (optional)</label>
              <Input
                id="details"
                name="details"
                value={formData.details}
                onChange={handleChange}
                placeholder="Additional description"
                className="rounded-xl border-gray-200"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/k8s9d7f3-elections')}
              className="rounded-xl"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-[#146c4f] hover:bg-[#115a42] text-white rounded-xl min-w-[120px]"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isEditMode ? 'Update Election' : 'Create Election'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
