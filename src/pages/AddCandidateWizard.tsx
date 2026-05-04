import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Check,
  Eye,
  ArrowLeft,
  CheckCircle,
  User,
  MapPin,
  Phone,
  Save,
  ArrowRight,
} from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { candidateService, Candidate, CreateCandidateData } from '@/services/candidates'

// Wizard steps configuration
const WIZARD_STEPS = [
  { number: 1, label: 'Personal Profile', icon: User },
  { number: 2, label: 'Contact', icon: Phone },
  { number: 3, label: 'District', icon: MapPin },
]

export default function AddCandidateWizard() {
  const navigate = useNavigate()
  const { id: candidateId } = useParams()
  const isEditMode = Boolean(candidateId)
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingCandidate, setIsLoadingCandidate] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submittedCandidate, setSubmittedCandidate] = useState<Candidate | null>(null)
  
  const [formData, setFormData] = useState<CreateCandidateData>({
    fullName: '',
    phoneNo: '',
    email: '',
    address: '',
    dob: '',
    gender: 'Male',
    nin: 0,
    religion: '',
    bio: '',
    remark: '',
    lga_district_id: 0,
    party_id: undefined
  })

  const handleNext = () => {
    // Validate required fields for current step before proceeding
    if (currentStep === 1) {
      if (!formData.fullName.trim()) {
        alert('Please enter Full Legal Name')
        return
      }
      if (!formData.nin || formData.nin === 0) {
        alert('Please enter NIN')
        return
      }
      if (!formData.religion?.trim()) {
        alert('Please enter Religion')
        return
      }
    } else if (currentStep === 2) {
      if (!formData.phoneNo.trim()) {
        alert('Please enter Phone Number')
        return
      }
    } else if (currentStep === 3) {
      if (!formData.lga_district_id || formData.lga_district_id === 0) {
        alert('Please select LGA District')
        return
      }
    }

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    } else {
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      console.log('📋 Submitting form data:', formData)
      const candidate = isEditMode && candidateId
        ? await candidateService.updateCandidate(Number(candidateId), formData)
        : await candidateService.createCandidate(formData)
      setSubmittedCandidate(candidate)
      setCurrentStep(4) // Show success page
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error('❌ Submission error:', errorMessage)
      alert(`Failed to ${isEditMode ? 'update' : 'create'} candidate:\n\n${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    if (!candidateId) {
      return
    }

    const loadCandidate = async () => {
      setIsLoadingCandidate(true)
      setLoadError(null)
      try {
        const candidate = await candidateService.getCandidateById(Number(candidateId))
        setFormData({
          fullName: candidate.fullName || '',
          phoneNo: candidate.phoneNo || '',
          email: candidate.email || '',
          address: candidate.address || '',
          dob: candidate.dob || '',
          gender: candidate.gender || 'Male',
          nin: typeof candidate.nin === 'string' ? parseInt(candidate.nin, 10) || 0 : candidate.nin || 0,
          religion: candidate.religion || '',
          bio: candidate.bio || '',
          remark: candidate.remark || '',
          lga_district_id: candidate.lga_district_id || 0,
          party_id: candidate.party_id ?? undefined,
        })
      } catch (error) {
        console.error('Failed to load candidate for editing:', error)
        setLoadError('Unable to load candidate details. Please try again.')
      } finally {
        setIsLoadingCandidate(false)
      }
    }

    loadCandidate()
  }, [candidateId])

  const handleSaveDraft = () => {
    // Save as draft logic
    console.log('Save as draft:', formData)
    alert('Draft saved successfully!')
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            {/* Full Legal Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Full Legal Name *</label>
              <Input
                placeholder="Enter full legal name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="h-12"
              />
            </div>

            {/* NIN */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">NIN *</label>
              <Input
                type="number"
                placeholder="Enter National Identification Number"
                value={formData.nin || ''}
                onChange={(e) => setFormData({ ...formData, nin: parseInt(e.target.value) || 0 })}
                className="h-12"
              />
            </div>

            {/* Date of Birth and Gender on same line */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Date of Birth</label>
                <Input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Gender *</label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => setFormData({ ...formData, gender: value as CreateCandidateData['gender'] })}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Religious Affiliation */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Religion *</label>
              <Input
                placeholder="Islam"
                value={formData.religion}
                onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
                className="h-12"
              />
            </div>

            {/* Biography */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Biography</label>
              <Textarea
                placeholder="Provide a brief overview of your professional journey"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="min-h-[100px]"
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            {/* Email and Phone on same line */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email Address</label>
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Phone Number *</label>
                <Input
                  placeholder="Enter phone number"
                  value={formData.phoneNo}
                  onChange={(e) => setFormData({ ...formData, phoneNo: e.target.value })}
                  className="h-12"
                />
              </div>
            </div>

            {/* Residential Address */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Residential Address</label>
              <Input
                placeholder="Enter residential address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="h-12"
              />
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            {/* Party Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Political Party *</label>
              <Select
                value={formData.party_id?.toString() || ''}
                onValueChange={(value) => setFormData({ ...formData, party_id: parseInt(value) })}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select Political Party" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">APC - All Progressives Congress</SelectItem>
                  <SelectItem value="2">PDP - People's Democratic Party</SelectItem>
                  <SelectItem value="3">LP - Labour Party</SelectItem>
                  <SelectItem value="4">NNPP - New Nigeria People's Party</SelectItem>
                  <SelectItem value="5">APGA - All Progressives Grand Alliance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* LGA District Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">LGA District *</label>
              <Select
                value={formData.lga_district_id?.toString() || ''}
                onValueChange={(value) => setFormData({ ...formData, lga_district_id: parseInt(value) })}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select LGA District" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Aba North</SelectItem>
                  <SelectItem value="2">Aba South</SelectItem>
                  <SelectItem value="3">Arochukwu</SelectItem>
                  <SelectItem value="4">Bende</SelectItem>
                  <SelectItem value="5">Ikwuano</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Remark */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Remark <span className="text-gray-400">(Internal)</span></label>
              <Input
                placeholder="Enter internal remark"
                value={formData.remark}
                onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                className="h-12"
              />
            </div>
          </div>
        )

      case 4:
        // Success Page
        return (
          <div className="flex items-center justify-center min-h-[320px]">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 max-w-sm w-full text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-7 h-7 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">{isEditMode ? 'Update Submitted' : 'Registration Submitted'}</h2>
              <p className="text-gray-600 text-sm mb-1">
                Candidate <span className="font-semibold text-[#146c4f]">{submittedCandidate?.full_name || formData.fullName || 'Candidate'}</span> was {isEditMode ? 'updated' : 'created'} successfully.
              </p>
              <p className="text-[12px] text-gray-400 mb-5">
                ID: {submittedCandidate?.id} | Status: {submittedCandidate?.status || 'Pending'}
              </p>
              <div className="flex flex-col gap-2">
                <Button className="bg-[#146c4f] hover:bg-[#115a42] text-white" onClick={() => navigate('/k8s9d7f3-candidates')}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Candidates
                </Button>
                <Button variant="outline" onClick={() => navigate('/k8s9d7f3-candidates')}>
                  Return to Candidates
                </Button>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (isLoadingCandidate) {
    return (
      <div className="min-h-[320px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#146c4f] mx-auto mb-4" />
          <p className="text-sm text-gray-600">Loading candidate details...</p>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-[320px] flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center max-w-md w-full">
          <p className="text-lg font-semibold text-gray-800 mb-2">Unable to load candidate</p>
          <p className="text-sm text-gray-500 mb-4">{loadError}</p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => navigate('/k8s9d7f3-candidates')}>Back to Candidates</Button>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mt-1 sm:mt-2">
         <p className="text-sm text-gray-500 max-w-2xl">Complete all steps to {isEditMode ? 'update' : 'register'} a new candidate in the KYL database.</p>
         <Button 
           variant="outline" 
           onClick={() => navigate('/k8s9d7f3-candidates')}
           className="flex items-center gap-2"
         >
           <ArrowLeft className="w-4 h-4" />
           Back to Candidates
         </Button>
      </div>

      {/* Step Indicator */}
      <div className="bg-white border-b border-gray-200 px-3 py-1">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between gap-2">
            {WIZARD_STEPS.map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep === step.number
              const isCompleted = currentStep > step.number
              
              return (
                <div key={step.number} className="flex items-center gap-2">
                  <div className="flex flex-col items-center">
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        isCompleted 
                          ? 'bg-[#146c4f] text-white' 
                          : isActive 
                            ? 'bg-[#146c4f] text-white ring-2 ring-[#146c4f]/20' 
                            : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {isCompleted ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                    </div>
                    <span className={`text-[9px] mt-0 ${isActive || isCompleted ? 'text-[#146c4f] font-medium' : 'text-gray-400'}`}>
                      {step.label}
                    </span>
                  </div>
                  {index < WIZARD_STEPS.length - 1 && (
                    <div className={`w-12 sm:w-16 h-[1px] ${isCompleted ? 'bg-[#146c4f]' : 'bg-gray-200'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3">
        {/* Step Title */}
        {currentStep < 4 && (
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-gray-800">
              Step {currentStep}: {WIZARD_STEPS[currentStep - 1]?.label}
            </h2>
            <p className="text-sm text-gray-500">
              Fill in the required information for this step
            </p>
          </div>
        )}

        {/* Step Content */}
        {renderStepContent()}

        {/* Navigation Buttons */}
        {currentStep < 4 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 mt-5 pt-3 border-t border-gray-100">
            <div className="w-full sm:w-auto">
              {currentStep === 1 ? (
                <Button 
                  variant="outline" 
                  onClick={handleSaveDraft}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save as Draft
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={handleBack}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              )}
            </div>
            <div className="w-full sm:w-auto">
              {currentStep === 3 ? (
                <Button 
                  className="bg-[#146c4f] hover:bg-[#115a42] text-white flex items-center gap-2 w-full sm:w-auto"
                  onClick={handleNext}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Candidate' : 'Create Candidate')}
                  <CheckCircle className="w-4 h-4" />
                </Button>
              ) : (
                <Button 
                  className="bg-[#146c4f] hover:bg-[#115a42] text-white flex items-center gap-2 w-full sm:w-auto"
                  onClick={handleNext}
                >
                  Next Step
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}