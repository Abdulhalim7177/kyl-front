import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, User, MapPin, Phone, Mail, Calendar, FileText, Building } from 'lucide-react'
import { candidateService, CandidateDetail } from '@/services/candidates'
import { useAuth } from '@/contexts/AuthContext'

export default function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [candidate, setCandidate] = useState<CandidateDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated && id) {
      loadCandidate()
    } else {
      setLoading(false)
      setError('You must be logged in to view candidate details.')
    }
  }, [isAuthenticated, id])

  const loadCandidate = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await candidateService.getCandidateById(parseInt(id!))
      setCandidate(data)
    } catch (err) {
      console.error('Failed to load candidate:', err)
      setError('Failed to load candidate details. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#146c4f]"></div>
      </div>
    )
  }

  if (error || !candidate) {
    return (
      <div className="text-center py-16">
        <div className="text-red-600 mb-4">
          <p className="font-medium mb-2">Error Loading Candidate</p>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
        <div className="space-x-4">
          <Button onClick={loadCandidate} className="bg-[#146c4f] hover:bg-[#115a42] text-white">
            Try Again
          </Button>
          <Button variant="outline" onClick={() => navigate('/k8s9d7f3-candidates')}>
            Back to Candidates
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/k8s9d7f3-candidates')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Candidates
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{candidate.fullName}</h1>
          <p className="text-gray-600">Candidate Details</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/k8s9d7f3-candidates-edit/${candidate.id}`)}
          >
            Edit Candidate
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Basic Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Full Name</label>
                  <p className="text-gray-900">{candidate.fullName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone Number</label>
                  <p className="text-gray-900">{candidate.phoneNo}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900">{candidate.email || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Gender</label>
                  <p className="text-gray-900">{candidate.gender}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                  <p className="text-gray-900">{candidate.dob || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">NIN</label>
                  <p className="text-gray-900">{candidate.nin}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Location Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Address</label>
                  <p className="text-gray-900">{candidate.address || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">State</label>
                  <p className="text-gray-900">{candidate.state?.name || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Senatorial District</label>
                  <p className="text-gray-900">{candidate.lga_district?.name || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">LGA District</label>
                  <p className="text-gray-900">{candidate.lga_district?.name || 'Not provided'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Additional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Religion</label>
                <p className="text-gray-900">{candidate.religion || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Bio</label>
                <p className="text-gray-900">{candidate.bio || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Remark</label>
                <p className="text-gray-900">{candidate.remark || 'Not provided'}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Status & Party */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge
                variant={candidate.status === 1 ? 'default' : 'secondary'}
                className={candidate.status === 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}
              >
                {candidate.status === 1 ? 'Active' : 'Inactive'}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Political Party
              </CardTitle>
            </CardHeader>
            <CardContent>
              {candidate.party ? (
                <div className="space-y-2">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Party Name</label>
                    <p className="text-gray-900 font-medium">{candidate.party.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Slogan</label>
                    <p className="text-gray-900">{candidate.party.slogan || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Philosophy</label>
                    <p className="text-gray-900">{candidate.party.philosophy || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Registration Year</label>
                    <p className="text-gray-900">{candidate.party.registrationYear || 'Not provided'}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No party information available</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Timestamps
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <label className="text-sm font-medium text-gray-500">Created At</label>
                <p className="text-gray-900">{new Date(candidate.created_at).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Updated At</label>
                <p className="text-gray-900">{new Date(candidate.updated_at).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}