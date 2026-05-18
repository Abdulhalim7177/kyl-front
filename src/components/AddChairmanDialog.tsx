import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { partyService, CandidateProfile } from '@/services/parties'
import { UserCheck, CheckCircle, AlertTriangle } from 'lucide-react'

interface AddChairmanDialogProps {
  partyId: string
  partyName?: string
  onChairmanAssigned?: (candidate: CandidateProfile) => void
}

interface CurrentChairman {
  id?: number
  fullName?: string
  avatarUrl?: string | null
  termStart?: string
  period?: string
  duration?: string
}

export default function AddChairmanDialog({ partyId, partyName = '', onChairmanAssigned }: AddChairmanDialogProps) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'search' | 'confirm' | 'details' | 'warning' | 'success'>('search')
  const [nin, setNin] = useState('')
  const [candidate, setCandidate] = useState<CandidateProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [currentChairman, setCurrentChairman] = useState<CurrentChairman | null>(null)
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    remark: '',
  })

  const formatDate = (dateValue: string) => {
    if (!dateValue) return ''
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) return dateValue

    try {
      const parsedDate = new Date(dateValue)
      if (Number.isNaN(parsedDate.getTime())) return dateValue

      const year = parsedDate.getFullYear()
      const month = String(parsedDate.getMonth() + 1).padStart(2, '0')
      const day = String(parsedDate.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    } catch {
      return dateValue
    }
  }

  const formatDateDisplay = (dateValue?: string) => {
    if (!dateValue) return 'N/A'
    try {
      const date = new Date(dateValue)
      if (Number.isNaN(date.getTime())) return 'N/A'
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
      return 'N/A'
    }
  }

  useEffect(() => {
    if (open) {
      loadCurrentChairman()
    }
  }, [open])

  const loadCurrentChairman = async () => {
    try {
      const result = await partyService.getPartyChairman(partyId)
      setCurrentChairman(result.currentChairman || null)
    } catch (error) {
      console.error('Failed to load current chairman:', error)
      setCurrentChairman(null)
    }
  }

  const reset = () => {
    setNin('')
    setCandidate(null)
    setStep('search')
    setLoading(false)
    setSubmitting(false)
    setSearchError(null)
    setSubmitError(null)
    setSuccessMessage(null)
    setFormData({ startDate: '', endDate: '', remark: '' })
  }

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!nin.trim()) {
      setSearchError('Please enter a valid NIN.')
      return
    }

    setLoading(true)
    setSearchError(null)
    setSubmitError(null)
    setCandidate(null)

    try {
      const result = await partyService.checkCandidateByNin(nin.trim())
      setCandidate(result)
      setStep('confirm')
    } catch (error) {
      let message = 'Unable to find candidate'
      if (error instanceof Error) {
        message = error.message.includes('Failed to check candidate: 404')
          ? "Candidate not found or is not a party member."
          : error.message
      }
      setSearchError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmProfile = () => {
    if (!candidate) {
      setSubmitError('No candidate selected.')
      return
    }
    setStep('details')
    setSubmitError(null)
  }

  const handleShowWarning = () => {
    if (!candidate) {
      setSubmitError('No candidate selected.')
      return
    }

    if (!formData.startDate) {
      setSubmitError('Start date is required.')
      return
    }

    if (!formData.endDate) {
      setSubmitError('End date is required.')
      return
    }

    setSubmitError(null)
    setStep('warning')
  }

  const handleConfirmSubmit = async () => {
    if (!candidate) {
      setSubmitError('No candidate selected.')
      return
    }

    setSubmitting(true)
    setSubmitError(null)
    setSuccessMessage(null)

    try {
      await partyService.createPartyChairman(partyId, {
        candidateId: candidate.id,
        startDate: formData.startDate,
        endDate: formData.endDate,
        remark: formData.remark,
      })
      setSuccessMessage('Chairman appointed successfully!')
      onChairmanAssigned?.(candidate)
      setStep('success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to appoint chairman'
      setSubmitError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen)
      if (!newOpen) reset()
    }}>
      <DialogTrigger asChild>
        <Button className="bg-green-700 hover:bg-green-800 text-white">
          <UserCheck className="w-4 h-4 mr-2" />
          Add Chairman
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0">
        {/* STEP 1: Search */}
        {step === 'search' && (
          <div className="p-6">
            <DialogHeader>
              <DialogTitle>Add Chairman</DialogTitle>
              <DialogDescription>
                Search a candidate by NIN and prepare them for party chairman assignment.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={(e) => {
              e.preventDefault()
              handleSearch(e as React.FormEvent<HTMLFormElement>)
            }} className="space-y-4 mt-6">
              <div>
                <label htmlFor="nin" className="block text-sm font-medium text-slate-700 mb-2">
                  National Identification Number (NIN)
                </label>
                <Input
                  id="nin"
                  value={nin}
                  onChange={(event) => setNin(event.target.value)}
                  placeholder="Enter candidate NIN"
                  className={searchError ? 'border-red-500' : ''}
                />
                {searchError && <p className="mt-2 text-sm text-red-600">{searchError}</p>}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" size="lg" disabled={loading} className="bg-green-800 hover:bg-green-700">
                  {loading ? 'Searching…' : 'Find Profile'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 2: Profile Confirmation */}
        {step === 'confirm' && candidate && (
          <div>
            <div className="border-b border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-600">Step 2: Profile Confirmation</span>
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Profile Confirmation</h2>
              <p className="text-sm text-slate-600 mt-2">Please review the details fetched from our database.</p>
            </div>

            <div className="p-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-shrink-0">
                  <Avatar className="h-32 w-32 rounded-2xl border-4 border-slate-200 bg-white shadow-sm">
                    {candidate.avatarUrl ? (
                      <img src={candidate.avatarUrl} alt={candidate.fullName} className="h-full w-full object-cover" />
                    ) : (
                      <AvatarFallback className="text-3xl font-semibold">{candidate.fullName?.slice(0, 2).toUpperCase() || 'NA'}</AvatarFallback>
                    )}
                  </Avatar>
                </div>

                <div className="flex-1">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500 mb-1">Full Name</p>
                      <p className="text-lg font-semibold text-slate-900">{candidate.fullName || 'N/A'}</p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500 mb-1">Date of Birth</p>
                      <p className="text-sm font-medium text-slate-900">{candidate.dob || 'N/A'}</p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500 mb-1">Gender</p>
                      <p className="text-sm font-medium text-slate-900">{candidate.gender || 'N/A'}</p>
                    </div>

                    <div className="sm:col-span-2">
                      <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500 mb-1">National Identity Number</p>
                      <p className="text-sm font-medium text-slate-900 tracking-widest">
                        {candidate.nin
                          ? candidate.nin.slice(0, 4) + ' •••• •••• ' + candidate.nin.slice(-4)
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500 mb-1">Email</p>
                    <p className="text-sm text-slate-900">{candidate.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500 mb-1">Phone</p>
                    <p className="text-sm text-slate-900">{candidate.phoneNo || 'N/A'}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500 mb-1">Address</p>
                    <p className="text-sm text-slate-900">{candidate.address || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {submitError && <p className="mt-4 text-sm text-red-600">{submitError}</p>}

              <div className="mt-8 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCandidate(null)
                    setNin('')
                    setStep('search')
                    setSearchError(null)
                  }}
                  className="px-6"
                >
                  Back
                </Button>
                <Button
                  onClick={handleConfirmProfile}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Confirm & Proceed
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Chairman Details Form */}
        {step === 'details' && candidate && (
          <div>
            <div className="border-b border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-600">Step 3: Chairman Details</span>
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Appointment Details</h2>
              <p className="text-sm text-slate-600 mt-2">Enter the chairman's appointment details.</p>
            </div>

            <div className="p-6 space-y-4">
              {/* Candidate Name (Disabled) */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Candidate Name</label>
                <Input
                  value={candidate.fullName || ''}
                  disabled
                  className="bg-slate-50"
                />
              </div>

              {/* Party Name (Disabled) */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Party Name</label>
                <Input
                  value={partyName}
                  disabled
                  className="bg-slate-50"
                />
              </div>

              {/* Start Date */}
              <div>
                <label htmlFor="startDate" className="text-sm font-medium text-slate-700 mb-2 block">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <Input
                  id="startDate"
                  type="text"
                  placeholder="YYYY-MM-DD"
                  value={formData.startDate}
                  onChange={(e) => {
                    setFormData({ ...formData, startDate: e.target.value })
                    setSubmitError(null)
                  }}
                  className="border-slate-200"
                />
                <p className="mt-2 text-xs text-slate-500">Required format: YYYY-MM-DD. Selected: {formData.startDate ? formatDate(formData.startDate) : 'YYYY-MM-DD'}</p>
              </div>

              {/* End Date */}
              <div>
                <label htmlFor="endDate" className="text-sm font-medium text-slate-700 mb-2 block">
                  End Date <span className="text-red-500">*</span>
                </label>
                <Input
                  id="endDate"
                  type="text"
                  placeholder="YYYY-MM-DD"
                  value={formData.endDate}
                  onChange={(e) => {
                    setFormData({ ...formData, endDate: e.target.value })
                    setSubmitError(null)
                  }}
                  className="border-slate-200"
                />
                <p className="mt-2 text-xs text-slate-500">Required format: YYYY-MM-DD. Selected: {formData.endDate ? formatDate(formData.endDate) : 'YYYY-MM-DD'}</p>
              </div>

              {/* Remark */}
              <div>
                <label htmlFor="remark" className="text-sm font-medium text-slate-700 mb-2 block">
                  Remark
                </label>
                <Textarea
                  id="remark"
                  value={formData.remark}
                  onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                  placeholder="Add any remarks or notes..."
                  className="min-h-[100px] border-slate-200"
                />
              </div>

              {submitError && <p className="text-sm text-red-600">{submitError}</p>}
              {successMessage && <p className="text-sm text-green-600 font-medium">{successMessage}</p>}

              <div className="mt-8 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('confirm')}
                  className="px-6"
                  disabled={submitting}
                >
                  Back
                </Button>
                <Button
                  onClick={handleShowWarning}
                  disabled={submitting}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Submit
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 'warning' && candidate && (
          <div>
            <div className="rounded-t-3xl bg-red-50 p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-red-600/10 text-red-700">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-600">Active Tenure Warning</p>
                  <p className="mt-3 text-base font-semibold text-slate-900">
                    {currentChairman
                      ? "Assigning a new chairman will automatically terminate the current chairman's tenure."
                      : 'No active chairman currently assigned to this party.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6 bg-white">
              {currentChairman ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Start Date</p>
                      <p className="mt-3 text-lg font-semibold text-slate-900">{formatDateDisplay(currentChairman.termStart)}</p>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Duration</p>
                      <p className="mt-3 text-lg font-semibold text-slate-900">{currentChairman.duration || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16 rounded-3xl border border-slate-200 bg-slate-100">
                        {currentChairman.avatarUrl ? (
                          <img src={currentChairman.avatarUrl} alt={currentChairman.fullName} className="h-full w-full object-cover" />
                        ) : (
                          <AvatarFallback className="text-lg font-semibold text-slate-700">{currentChairman.fullName?.slice(0, 2).toUpperCase() || 'NA'}</AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{currentChairman.fullName || 'N/A'}</p>
                        <p className="text-sm text-slate-500">Active Chairman</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <p className="text-sm font-semibold text-slate-600">None</p>
                  <p className="mt-2 text-xs text-slate-500">No active chairman currently assigned to this party.</p>
                </div>
              )}

              {submitError && <p className="text-sm text-red-600">{submitError}</p>}
              {successMessage && <p className="text-sm text-green-600 font-medium">{successMessage}</p>}

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('details')}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmSubmit}
                  disabled={submitting}
                  className="bg-red-600 hover:bg-red-700 text-white px-6"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Submitting...
                    </>
                  ) : (
                    `${currentChairman ? 'Terminate Current & ' : ''}Appoint Now`
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 'success' && candidate && (
          <div className="p-6">
            <div className="rounded-3xl bg-white shadow-lg p-8">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <CheckCircle className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-semibold text-slate-900">Appointment Successful</h2>
                <p className="max-w-xl text-sm text-slate-500">
                  The institutional leadership records have been updated. The new tenure for the Party Chairman is now active.
                </p>
              </div>

              <div className="mt-8 rounded-[2rem] border border-slate-200 bg-slate-50 p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Official Appointment Record</p>
                <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 rounded-3xl border border-slate-200 bg-white">
                      {candidate.avatarUrl ? (
                        <img src={candidate.avatarUrl} alt={candidate.fullName} className="h-full w-full object-cover rounded-3xl" />
                      ) : (
                        <AvatarFallback className="text-lg font-semibold text-slate-700">{candidate.fullName?.slice(0, 2).toUpperCase() || 'NA'}</AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{candidate.fullName}</p>
                      <p className="text-sm text-slate-500">Party Chairman</p>
                      <p className="text-xs text-slate-400">Phone: {candidate.phoneNo || 'N/A'}</p>
                      <p className="text-xs text-slate-400">Date of Birth: {candidate.dob || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-center">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Start Date</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{formatDate(formData.startDate)}</p>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-center">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">End Date</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{formatDate(formData.endDate)}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                  <p className="font-medium text-slate-900">{candidate.fullName ? `${candidate.fullName}'s tenure is complete.` : 'The new chairman tenure is complete.'}</p>
                  <p className="mt-1 text-slate-500">This profile is now archived under Former Candidates.</p>
                </div>
              </div>

              <div className="mt-8 flex justify-center">
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6"
                  onClick={() => {
                    setOpen(false)
                    reset()
                    navigate('/k8s9d7f3-parties')
                  }}
                >
                  View Party Dashboard
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
