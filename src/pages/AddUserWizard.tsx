import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Check,
  Eye,
  ArrowLeft,
  CheckCircle,
  User as UserIcon,
  Shield,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { userService, CreateUserData, Role, State, Party } from '@/services/users'
import { User } from '@/services/auth'

const WIZARD_STEPS = [
  { number: 1, label: 'Basic Info', icon: UserIcon },
  { number: 2, label: 'Roles & Access', icon: Shield },
]

export default function AddUserWizard() {
  const navigate = useNavigate()
  const { id: userId } = useParams()
  const isEditMode = Boolean(userId)
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [submittedUser, setSubmittedUser] = useState<User | null>(null)
  
  const [roles, setRoles] = useState<Role[]>([])
  const [states, setStates] = useState<State[]>([])
  const [parties, setParties] = useState<Party[]>([])

  const [formData, setFormData] = useState<CreateUserData>({
    name: '',
    phoneNo: '',
    email: '',
    role_id: 0,
    permissions: [],
    state_id: 0,
    party_id: 0
  })

  useEffect(() => {
    fetchMetadata()
    if (isEditMode) {
      loadUser()
    }
  }, [userId])

  const fetchMetadata = async () => {
    try {
      const [rolesData, statesData, partiesData] = await Promise.all([
        userService.getUserRoles(),
        userService.getStates(),
        userService.getParties()
      ])
      setRoles(rolesData)
      setStates(statesData)
      setParties(partiesData)
    } catch (err) {
      console.error('Failed to fetch metadata:', err)
    }
  }

  const loadUser = async () => {
    if (!userId) return
    try {
      setIsLoading(true)
      const user = await userService.getUser(Number(userId))
      setFormData({
        name: user.name,
        email: user.email,
        phoneNo: user.phoneNo,
        role_id: user.role_id,
        state_id: user.state_id || 0,
        party_id: user.party_id || 0,
        permissions: user.permissions.map(p => p.id)
      })
    } catch (err) {
      console.error('Failed to load user details:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.name || !formData.email || !formData.phoneNo) {
        alert('Please fill in all basic info')
        return
      }
    } else if (currentStep === 2) {
      if (!formData.role_id) {
        alert('Please select a role')
        return
      }
    }

    if (currentStep < 2) {
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
      const user = isEditMode && userId
        ? await userService.updateUser(Number(userId), formData)
        : await userService.createUser(formData)
      setSubmittedUser(user)
      setCurrentStep(3) // Success
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Full Name *</label>
              <Input
                placeholder="Enter full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-12"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email Address *</label>
                <Input
                  type="email"
                  placeholder="user@example.com"
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
          </div>
        )
      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Administrative Role *</label>
              <Select
                value={formData.role_id?.toString()}
                onValueChange={(value) => setFormData({ ...formData, role_id: parseInt(value) })}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.id.toString()}>{role.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Assign to State</label>
                <Select
                  value={formData.state_id?.toString()}
                  onValueChange={(value) => setFormData({ ...formData, state_id: parseInt(value) })}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="National / Select State" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">National (All States)</SelectItem>
                    {states.map(state => (
                      <SelectItem key={state.id} value={state.id.toString()}>{state.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Assign to Party</label>
                <Select
                  value={formData.party_id?.toString()}
                  onValueChange={(value) => setFormData({ ...formData, party_id: parseInt(value) })}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select Political Party" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">None / Independent</SelectItem>
                    {parties.map(party => (
                      <SelectItem key={party.id} value={party.id.toString()}>{party.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )
      case 3:
        return (
          <div className="flex items-center justify-center min-h-[320px]">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 max-w-sm w-full text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-7 h-7 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">{isEditMode ? 'User Updated' : 'User Created'}</h2>
              <p className="text-gray-600 text-sm mb-5">
                <span className="font-semibold text-[#146c4f]">{submittedUser?.name}</span> has been successfully {isEditMode ? 'updated' : 'registered'}.
              </p>
              <div className="flex flex-col gap-2">
                <Button className="bg-[#146c4f] hover:bg-[#115a42] text-white" onClick={() => navigate('/k8s9d7f3-users')}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Users
                </Button>
                <Button variant="outline" onClick={() => navigate('/k8s9d7f3-users')}>
                  Return to User Management
                </Button>
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#146c4f]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <p className="text-sm text-gray-500">Configure credentials and administrative access for the new system user.</p>
        <Button variant="outline" onClick={() => navigate('/k8s9d7f3-users')} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Users
        </Button>
      </div>

      {/* Step Indicator */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          {WIZARD_STEPS.map((step, index) => {
            const Icon = step.icon
            const isActive = currentStep === step.number
            const isCompleted = currentStep > step.number
            return (
              <div key={step.number} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isCompleted ? 'bg-[#146c4f] text-white' : isActive ? 'bg-[#146c4f] text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`text-[10px] mt-1 font-medium ${isActive || isCompleted ? 'text-[#146c4f]' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                </div>
                {index < WIZARD_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${isCompleted ? 'bg-[#146c4f]' : 'bg-gray-100'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-2xl mx-auto">
        {currentStep < 3 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">{WIZARD_STEPS[currentStep-1].label}</h2>
            <p className="text-sm text-gray-500">Please provide the details below</p>
          </div>
        )}

        {renderStepContent()}

        {currentStep < 3 && (
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
            <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>
              Back
            </Button>
            <Button 
              className="bg-[#146c4f] hover:bg-[#115a42] text-white min-w-[120px]" 
              onClick={handleNext}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {currentStep === 2 ? (isEditMode ? 'Update User' : 'Create User') : 'Next Step'}
              {currentStep === 1 && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
