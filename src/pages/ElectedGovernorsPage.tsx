import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Loader2, MapPin, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { candidateService, Candidate } from '@/services/candidates'
import { districtsService } from '@/services/districts'
import { electionService, Election, StateOffice } from '@/services/elections'
import { AddElectedGovernorData, ElectedLeader, leadersService, UpdateElectedGovernorData } from '@/services/leaders'
import { Party, partyService } from '@/services/parties'
import { getLogoUrl } from '@/lib/utils'

const normalizeCandidateIdentifier = (value: string | number | undefined) =>
  String(value ?? '').toLowerCase().replace(/[\s()+-]/g, '')

export default function ElectedGovernorsPage() {
  const { id } = useParams<{ id: string }>()
  const [stateName, setStateName] = useState('')
  const [leaders, setLeaders] = useState<ElectedLeader[]>([])
  const [candidateOptions, setCandidateOptions] = useState<Candidate[]>([])
  const [candidateSearch, setCandidateSearch] = useState('')
  const [candidateSearchError, setCandidateSearchError] = useState('')
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [isLookingUpCandidate, setIsLookingUpCandidate] = useState(false)
  const [elections, setElections] = useState<Election[]>([])
  const [searchFilter, setSearchFilter] = useState<string>('')
  const [offices, setOffices] = useState<StateOffice[]>([])
  const [parties, setParties] = useState<Party[]>([])
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingLeader, setEditingLeader] = useState<ElectedLeader | null>(null)
  const [editError, setEditError] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editData, setEditData] = useState<UpdateElectedGovernorData>({
    candidate_id: 0,
    office_id: 0,
    party_id: 0,
    election_id: 0,
    state_id: 0,
    start_date: '',
    end_date: '',
    tenure: '',
    remark: ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [formData, setFormData] = useState({
    candidate_id: '',
    office_id: '',
    election_id: '',
    start_date: '',
    end_date: '',
    tenure: '',
    remark: '',
    status: 'active'
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Load initial state data, active governors, and metadata safely
  useEffect(() => {
    if (!id) return

    const loadInitialData = async () => {
      try {
        setLoading(true)
        setError('')
        const stateIdNum = Number(id)
        const [state, allCandidates, activeElections, stateOffices, activeGovernorData, allParties] = await Promise.all([
          districtsService.getState(stateIdNum),
          candidateService.getAllCandidates(),
          electionService.getActiveElections(),
          electionService.getStateOffices(stateIdNum),
          leadersService.getActiveElectedGovernors(stateIdNum).catch(() => []),
          partyService.getAllParties().catch((partyError) => {
            console.error('Failed to load parties for elected governor form:', partyError)
            return []
          })
        ])
        const validElections = Array.isArray(activeElections) ? activeElections : []

        setStateName(state?.name ?? '')
        const filteredCandidates = (Array.isArray(allCandidates) ? allCandidates : []).filter((candidate) =>
          candidate?.state_id === state?.id || candidate?.state?.toLowerCase() === state?.name?.toLowerCase()
        )
        setCandidateOptions(filteredCandidates)
        
        setElections(validElections)
        setOffices((Array.isArray(stateOffices) ? stateOffices : []).filter((office) => office?.status === 1))
        setParties(allParties)
        setLeaders(Array.isArray(activeGovernorData) ? activeGovernorData : [])

        // Preselect the first available election in the form data if present
        if (validElections.length > 0 && validElections[0]?.id) {
          setFormData((current) => ({
            ...current,
            election_id: `${validElections[0].id}`
          }))
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load page data')
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [id])

  const resetForm = () => {
    setFormError('')
    setCandidateSearch('')
    setCandidateSearchError('')
    setSelectedCandidate(null)
    setFormData({
      candidate_id: '',
      office_id: '',
      election_id: elections[0]?.id ? `${elections[0].id}` : '',
      start_date: '',
      end_date: '',
      tenure: '',
      remark: '',
      status: 'active'
    })
  }

  const findCandidate = async () => {
    const identifier = candidateSearch.trim()
    const electionIdVal = formData.election_id
    if (!identifier || !electionIdVal) {
      setCandidateSearchError(!identifier ? 'Enter the candidate NIN or phone number.' : 'Select an election before finding a candidate.')
      return
    }

    setIsLookingUpCandidate(true)
    setFormError('')
    setCandidateSearchError('')
    setSelectedCandidate(null)
    setFormData((current) => ({ ...current, candidate_id: '' }))
    try {
      const normalizedIdentifier = normalizeCandidateIdentifier(identifier)
      const candidate = candidateOptions.find((option) =>
        normalizeCandidateIdentifier(option?.nin) === normalizedIdentifier ||
        normalizeCandidateIdentifier(option?.phoneNo) === normalizedIdentifier
      )
      if (!candidate) {
        throw new Error('No candidate found with that NIN or phone number.')
      }
      if (candidate?.state_id !== undefined && candidate?.state_id !== Number(id)) {
        setCandidateSearchError(`This candidate is not registered in ${stateName}.`)
        return
      }
      const registration = await leadersService.checkLeadershipRegistration({
        candidate_id: Number(candidate.id),
        election_id: Number(electionIdVal)
      })
      if (!registration?.can_register) {
        throw new Error(registration?.message || 'This candidate is already registered for a leadership position in this election.')
      }

      setSelectedCandidate(candidate)
      setFormData((current) => ({ ...current, candidate_id: `${candidate.id}` }))
    } catch (err) {
      setCandidateSearchError(err instanceof Error ? err.message : 'Unable to find candidate')
    } finally {
      setIsLookingUpCandidate(false)
    }
  }

  const addElectedLeader = async () => {
    const candidate = selectedCandidate
    const stateIdNum = Number(id)
    if (!id || !candidate || !formData.office_id || !formData.election_id || !formData.start_date || !formData.end_date || !formData.tenure) {
      setFormError('Please complete all required fields.')
      return
    }

    setIsSaving(true)
    setFormError('')
    try {
      const registration = await leadersService.checkLeadershipRegistration({
        candidate_id: Number(candidate.id),
        election_id: Number(formData.election_id)
      })
      if (!registration?.can_register) {
        setFormError(registration?.message || 'This candidate is already assigned to a leadership position for the selected election.')
        return
      }

      const payload: AddElectedGovernorData = {
        candidate_id: Number(candidate.id),
        office_id: Number(formData.office_id),
        party_id: Number(candidate.party_id ?? 0),
        election_id: Number(formData.election_id),
        state_id: stateIdNum,
        start_date: formData.start_date,
        end_date: formData.end_date,
        tenure: formData.tenure,
        remark: formData.remark,
        status: formData.status
      }
      await leadersService.addElectedGovernor(payload)
      
      const updatedLeaders = await leadersService.getActiveElectedGovernors(stateIdNum)
      setLeaders(Array.isArray(updatedLeaders) ? updatedLeaders : [])
      setIsAddOpen(false)
      resetForm()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to add elected leader')
    } finally {
      setIsSaving(false)
    }
  }

  const openEditForm = (leader: ElectedLeader) => {
    const dateOnly = (value: unknown) => typeof value === 'string' ? value.slice(0, 10) : ''
    setEditingLeader(leader)
    setEditError('')
    setEditData({
      candidate_id: Number(leader.candidate_id ?? leader.candidateId ?? leader.candidate?.id) || 0,
      office_id: Number(leader.office_id ?? leader.office?.id) || 0,
      party_id: Number(leader.party_id ?? leader.party?.id ?? leader.candidate?.party_id) || 0,
      election_id: Number(leader.election_id ?? leader.election?.id) || 0,
      state_id: Number(leader.state_id ?? leader.stateId ?? leader.state?.id ?? id) || 0,
      start_date: dateOnly(leader.start_date),
      end_date: dateOnly(leader.end_date),
      tenure: String(leader.tenure ?? ''),
      remark: String(leader.remark ?? '')
    })
  }

  const updateElectedLeader = async () => {
    const leaderId = Number(editingLeader?.id)
    if (!Number.isInteger(leaderId) || leaderId <= 0) {
      setEditError('This elected governor record does not have a valid ID.')
      return
    }
    if (
      !editData.candidate_id || !editData.office_id || !editData.party_id ||
      !editData.election_id || !editData.state_id || !editData.start_date ||
      !editData.end_date || !editData.tenure.trim()
    ) {
      setEditError('Complete all required fields before saving.')
      return
    }

    setIsUpdating(true)
    setEditError('')
    try {
      await leadersService.updateElectedGovernor(leaderId, editData)
      const updatedLeaders = await leadersService.getActiveElectedGovernors(Number(id))
      setLeaders(Array.isArray(updatedLeaders) ? updatedLeaders : [])
      setEditingLeader(null)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Unable to update elected governor.')
    } finally {
      setIsUpdating(false)
    }
  }

  const removeElectedGovernor = async (leader: ElectedLeader) => {
    const leaderId = Number(leader.id)
    if (!Number.isInteger(leaderId) || leaderId <= 0) {
      setEditError('This elected governor record does not have a valid ID.')
      return
    }
    if (!window.confirm(`Are you sure you want to remove ${leader.name || 'this elected governor'}? This action cannot be undone.`)) {
      return
    }

    setIsDeleting(true)
    setEditError('')
    try {
      await leadersService.removeElectedGovernor(leaderId)
      setLeaders((current) => current.filter((item) => Number(item.id) !== leaderId))
      if (editingLeader && Number(editingLeader.id) === leaderId) {
        setEditingLeader(null)
      }
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Unable to remove elected governor.')
    } finally {
      setIsDeleting(false)
    }
  }

  // Filter leaders dynamically based on user typed text input
  const filteredLeaders = useMemo(() => {
    if (!id || !stateName) return leaders

    const stateIdNum = Number(id)
    const query = searchFilter.trim().toLowerCase()

    return (Array.isArray(leaders) ? leaders : []).filter((leader) => {
      const leaderStateId = leader?.stateId ?? leader?.state_id ?? leader?.state?.id
      const leaderStateName = leader?.stateName ?? leader?.state?.name
      const matchesState = Number(leaderStateId) === stateIdNum || leaderStateName?.toLowerCase() === stateName.toLowerCase()

      if (!matchesState) return false
      if (!query) return true

      const candidateName = (leader?.candidate?.fullName ?? leader?.name ?? '').toLowerCase()
      const positionTitle = (leader?.office?.title ?? leader?.position ?? '').toLowerCase()
      const partyName = (leader?.party?.name ?? leader?.partyName ?? '').toLowerCase()
      const electionYear = String(leader?.election?.year ?? '')
      const tenure = (leader?.tenure ?? '').toLowerCase()

      return (
        candidateName.includes(query) ||
        positionTitle.includes(query) ||
        partyName.includes(query) ||
        electionYear.includes(query) ||
        tenure.includes(query)
      )
    })
  }, [id, leaders, stateName, searchFilter])

  if (loading && leaders.length === 0) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#146c4f]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4 p-4 md:p-0">
        <Link to="/k8s9d7f3-districts/states" className="inline-flex items-center gap-2 text-sm font-medium text-[#146c4f] hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to states
        </Link>
        <Card>
          <CardContent className="py-12 text-center text-red-600">{error}</CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-0">
      <Link to="/k8s9d7f3-districts/states" className="inline-flex items-center gap-2 text-sm font-medium text-[#146c4f] hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to states
      </Link>

      <Card className="border border-gray-100 shadow-md">
        <CardContent className="p-0">
          <div className="border-b border-gray-100 p-6 md:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100">
                  <MapPin className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Elected Leadership</p>
                  <h1 className="mt-1 text-2xl font-bold text-gray-900">{stateName || 'State'}</h1>
                </div>
              </div>

              {/* Dynamic Free-Text Search Input Bar */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 shadow-sm focus-within:ring-2 focus-within:ring-[#146c4f]">
                  <Search className="h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search governor, party, year..."
                    className="w-52 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                    value={searchFilter}
                    onChange={(event) => setSearchFilter(event.target.value)}
                  />
                </div>

                <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Records</p>
                  <div className="flex items-center gap-1.5 font-semibold text-[#146c4f]">
                    <CheckCircle2 className="h-4 w-4" />
                    {filteredLeaders.length} elected
                  </div>
                </div>

                <Button type="button" onClick={() => setIsAddOpen(true)} className="bg-[#146c4f] hover:bg-[#10563f]">
                  <Plus className="h-4 w-4" />
                  Add Elected
                </Button>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Active governor and elected deputy leadership for {stateName || 'this state'}. Use the search input above to filter by name, office, or year.
            </p>
          </div>

          {filteredLeaders.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              {searchFilter ? `No active or past elected leaders match "${searchFilter}".` : 'No active governor or leadership records found for this state.'}
            </div>
          ) : (
            <div className="grid gap-4 p-6 md:grid-cols-2">
              {filteredLeaders.map((leader) => {
                const candidateName = leader?.candidate?.full_name ?? leader?.candidate?.fullName ?? leader?.name ?? 'Candidate'
                const positionTitle = leader?.office?.title ?? leader?.position ?? 'Position'
                const partyName = leader?.party?.name ?? leader?.partyName ?? leader?.candidate?.political_party ?? 'N/A'
                
                const linkedCandidate = candidateOptions.find((candidate) =>
                  String(candidate?.id) === String(leader?.candidateId ?? leader?.candidate_id ?? leader?.candidate?.id)
                )
                const candidatePhotoUrl = getLogoUrl(leader?.candidatePhoto ?? leader?.candidate?.image ?? linkedCandidate?.image ?? null)
                const partyLogoUrl = getLogoUrl(
                  leader?.partyLogo ?? 
                  leader?.party?.logopath ?? 
                  leader?.party?.logo ?? 
                  leader?.party?.logo_path ?? 
                  leader?.party?.logo_url ?? 
                  leader?.candidate?.party?.logopath ??
                  leader?.candidate?.party?.logo ??
                  linkedCandidate?.party ?? 
                  null
                )

                return (
                  <div
                    key={`${leader?.id ?? 'leader'}-${positionTitle}`}
                    className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div>
                      <div className="mb-4 flex items-center justify-between gap-3 border-b border-gray-100 pb-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12 border border-gray-200">
                            {candidatePhotoUrl && <AvatarImage src={candidatePhotoUrl} alt={candidateName} className="object-cover" />}
                            <AvatarFallback className="bg-[#146c4f]/10 text-sm font-bold text-[#146c4f]">
                              {candidateName.charAt(0)?.toUpperCase() || 'P'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-base font-bold text-gray-900">{candidateName}</p>
                            <p className="text-xs font-semibold text-[#146c4f]">{positionTitle}</p>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
                            {leader?.status || 'Active'}
                          </span>
                          <div className="flex flex-col gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => openEditForm(leader)}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit
                            </Button>
                            <Button type="button" variant="destructive" size="sm" onClick={() => removeElectedGovernor(leader)} disabled={isDeleting}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 text-xs text-gray-600">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center gap-2 rounded-xl bg-gray-50 p-2.5">
                            <Avatar className="h-8 w-8 shrink-0 border border-gray-200 bg-white">
                              {partyLogoUrl && <AvatarImage src={partyLogoUrl} alt={`${partyName} logo`} className="object-contain" />}
                              <AvatarFallback className="bg-gray-101 text-[10px] font-semibold text-gray-600">
                                {partyName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Party</p>
                              <p className="truncate font-semibold text-gray-800">{partyName}</p>
                            </div>
                          </div>

                          <div className="rounded-xl bg-gray-50 p-2.5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Election Details</p>
                            <p className="truncate font-semibold text-gray-800">
                              {leader?.election?.year
                                ? leader?.election?.details && leader?.election?.details !== String(leader?.election?.year)
                                  ? `${leader.election.year} - ${leader.election.details}`
                                  : leader.election.year
                                : (leader?.election?.details || 'N/A')}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-xl bg-gray-50 p-2.5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Tenure Period</p>
                            <p className="font-semibold text-gray-800">{leader?.tenure || 'N/A'}</p>
                          </div>
                          <div className="rounded-xl bg-gray-50 p-2.5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Start / End Date</p>
                            <p className="font-medium text-gray-800">
                              {leader?.start_date ?? 'N/A'} — {leader?.end_date ?? 'N/A'}
                            </p>
                          </div>
                        </div>

                        {leader?.candidate && (
                          <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3 space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Candidate Information</p>
                            <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 text-[11px]">
                              <div>
                                <span className="text-gray-400">NIN: </span>
                                <span className="font-medium text-gray-700">{leader.candidate.nin || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-gray-400">Code: </span>
                                <span className="font-medium text-gray-700">{leader.candidate.code || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-gray-400">Phone: </span>
                                <span className="font-medium text-gray-700">{leader.candidate.phoneNo || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-gray-400">Gender: </span>
                                <span className="font-medium text-gray-700">{leader.candidate.gender || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div className="rounded-xl bg-gray-50 p-2">
                            <span className="font-bold text-gray-400 uppercase">Created At: </span>
                            <span className="font-medium text-gray-700">
                              {leader?.created_at ? new Date(leader.created_at).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                          <div className="rounded-xl bg-gray-50 p-2">
                            <span className="font-bold text-gray-400 uppercase">Updated At: </span>
                            <span className="font-medium text-gray-700">
                              {leader?.updated_at ? new Date(leader.updated_at).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                        </div>

                        {leader?.remark && (
                          <div className="rounded-xl bg-amber-50/60 border border-amber-100 p-2.5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Remark</p>
                            <p className="mt-0.5 text-[11px] text-amber-900 line-clamp-2">{leader.remark}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isAddOpen}
        onOpenChange={(open) => {
          setIsAddOpen(open)
          if (!open) resetForm()
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Elected Governor or Deputy Governor</DialogTitle>
            <DialogDescription>
              Assign a candidate to an elected state leadership position.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label htmlFor="elected-election" className="mb-2 block text-sm font-medium text-gray-700">Election Year *</label>
              <select
                id="elected-election"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={formData.election_id}
                disabled={isLookingUpCandidate || isSaving}
                onChange={(event) => {
                  setFormData((current) => ({
                    ...current,
                    election_id: event.target.value,
                    candidate_id: ''
                  }))
                  setSelectedCandidate(null)
                  setCandidateSearchError('')
                  setFormError('')
                }}
              >
                <option value="">Select election year</option>
                {elections.map((elec) => (
                  <option key={elec?.id ?? 'elec'} value={elec?.id ?? ''}>
                    {elec?.year ?? ''} {elec?.details ? `- ${elec.details}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="elected-candidate" className="mb-2 block text-sm font-medium text-gray-700">Candidate NIN or phone number *</label>
                <div className="flex gap-2">
                  <input
                    id="elected-candidate"
                    className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm"
                    value={candidateSearch}
                    placeholder="Enter NIN or phone number"
                    disabled={isLookingUpCandidate || isSaving}
                    onChange={(event) => {
                      setCandidateSearch(event.target.value)
                      setSelectedCandidate(null)
                      setFormData((current) => ({ ...current, candidate_id: '' }))
                      setCandidateSearchError('')
                      setFormError('')
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        if (selectedCandidate) {
                          void addElectedLeader()
                        } else {
                          void findCandidate()
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      if (selectedCandidate) {
                        void addElectedLeader()
                        return
                      }
                      void findCandidate()
                    }}
                    disabled={isLookingUpCandidate || isSaving}
                    className="bg-[#146c4f] hover:bg-[#10563f]"
                  >
                    {isLookingUpCandidate ? 'Checking...' : selectedCandidate ? (isSaving ? 'Saving...' : 'Add Elected') : 'Verify Candidate'}
                  </Button>
                </div>
                {candidateSearchError && <p className="mt-2 text-sm text-red-600">{candidateSearchError}</p>}
                {selectedCandidate && (
                  <div className="mt-3 space-y-3 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                    <p className="font-semibold text-green-900">Candidate verified for the selected election.</p>
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-green-700">Candidate name</p>
                      <div className="rounded-md border border-green-200 bg-white px-3 py-2 font-semibold text-gray-900">
                        {selectedCandidate.full_name}
                      </div>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-green-700">State</p>
                      <div className="rounded-md border border-green-200 bg-white px-3 py-2 text-gray-900">
                        {selectedCandidate.state || stateName || 'State'}
                      </div>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-green-700">Political party</p>
                      <div className="flex items-center gap-2 rounded-md border border-green-200 bg-white px-3 py-1.5 text-gray-900">
                        {(() => {
                          const logoUrl = getLogoUrl(
                            selectedCandidate.party?.logopath
                            ?? selectedCandidate.party?.logo
                            ?? selectedCandidate.party?.logo_path
                            ?? selectedCandidate.party?.logo_url
                            ?? (selectedCandidate as unknown as Record<string, unknown>)?.party_logo
                            ?? (selectedCandidate as unknown as Record<string, unknown>)?.partyLogo
                            ?? null
                          )
                          const partyDisplayTitle = selectedCandidate.party?.name || selectedCandidate.political_party || 'Party'
                          return logoUrl ? (
                            <img
                              src={logoUrl}
                              alt={`${partyDisplayTitle} logo`}
                              className="h-8 w-8 rounded-full border border-gray-200 object-contain"
                              onError={(event) => {
                                event.currentTarget.style.display = 'none'
                              }}
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 font-semibold text-green-700">
                              {partyDisplayTitle.charAt(0).toUpperCase()}
                            </div>
                          )
                        })()}
                        <span>{selectedCandidate.party?.name || selectedCandidate.political_party || 'Party not available'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {selectedCandidate && (
              <>
                <div>
                  <label htmlFor="elected-office" className="mb-2 block text-sm font-medium text-gray-700">Position *</label>
                  <select
                    id="elected-office"
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={formData.office_id}
                    onChange={(event) => setFormData((current) => ({ ...current, office_id: event.target.value }))}
                  >
                    <option value="">Select position</option>
                    {offices.map((office) => (
                      <option key={office?.id ?? 'office'} value={office?.id ?? ''}>
                        {office?.title ?? 'Office'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label htmlFor="elected-start-date" className="mb-2 block text-sm font-medium text-gray-700">Start Date *</label>
                    <input
                      id="elected-start-date"
                      type="date"
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      value={formData.start_date}
                      onChange={(event) => setFormData((current) => ({ ...current, start_date: event.target.value }))}
                    />
                  </div>
                  <div>
                    <label htmlFor="elected-end-date" className="mb-2 block text-sm font-medium text-gray-700">End Date *</label>
                    <input
                      id="elected-end-date"
                      type="date"
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      value={formData.end_date}
                      onChange={(event) => setFormData((current) => ({ ...current, end_date: event.target.value }))}
                    />
                  </div>
                  <div>
                    <label htmlFor="elected-tenure" className="mb-2 block text-sm font-medium text-gray-700">Tenure *</label>
                    <input
                      id="elected-tenure"
                      placeholder="e.g. 2027-2031"
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      value={formData.tenure}
                      onChange={(event) => setFormData((current) => ({ ...current, tenure: event.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="elected-remark" className="mb-2 block text-sm font-medium text-gray-700">Remark</label>
                  <textarea
                    id="elected-remark"
                    placeholder="Enter any administrative notes..."
                    className="w-full rounded-md border border-input bg-background p-3 text-sm"
                    rows={3}
                    value={formData.remark}
                    onChange={(event) => setFormData((current) => ({ ...current, remark: event.target.value }))}
                  />
                </div>
              </>
            )}

            {formError && <p className="text-sm text-red-600">{formError}</p>}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              {selectedCandidate && (
                <Button type="button" onClick={addElectedLeader} disabled={isSaving} className="bg-[#146c4f] hover:bg-[#10563f]">
                  {isSaving ? 'Saving...' : 'Save Elected Leader'}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editingLeader)}
        onOpenChange={(open) => {
          if (!open && !isUpdating) {
            setEditingLeader(null)
            setEditError('')
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Elected Governor or Deputy Governor</DialogTitle>
            <DialogDescription>Update the elected leadership record.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="edit-governor-candidate_id" className="mb-2 block text-sm font-medium text-gray-700">Candidate *</label>
                <select
                  id="edit-governor-candidate_id"
                  className="h-10 w-full rounded-md border border-input bg-gray-50 px-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                  value={editData.candidate_id || ''}
                  disabled
                >
                  <option value="">Select candidate</option>
                  {!candidateOptions.some((candidate) => candidate.id === editData.candidate_id) && editData.candidate_id > 0 && (
                    <option value={editData.candidate_id}>
                      {editingLeader?.candidate?.full_name ??
                        editingLeader?.candidate?.fullName ??
                        editingLeader?.candidate?.name ??
                        editingLeader?.name ??
                        `Candidate ${editData.candidate_id}`}
                    </option>
                  )}
                  {candidateOptions.map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>{candidate.full_name || `Candidate ${candidate.id}`}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="edit-governor-office_id" className="mb-2 block text-sm font-medium text-gray-700">Office *</label>
                <select
                  id="edit-governor-office_id"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={editData.office_id || ''}
                  onChange={(event) => setEditData((current) => ({ ...current, office_id: Number(event.target.value) || 0 }))}
                >
                  <option value="">Select office</option>
                  {!offices.some((office) => office.id === editData.office_id) && editData.office_id > 0 && (
                    <option value={editData.office_id}>
                      {editingLeader?.office?.title ?? editingLeader?.position ?? `Office ${editData.office_id}`}
                    </option>
                  )}
                  {offices.map((office) => <option key={office.id} value={office.id}>{office.title}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="edit-governor-party_id" className="mb-2 block text-sm font-medium text-gray-700">Political Party *</label>
                <select
                  id="edit-governor-party_id"
                  className="h-10 w-full rounded-md border border-input bg-gray-50 px-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                  value={editData.party_id || ''}
                  disabled
                >
                  <option value="">Select party</option>
                  {!parties.some((party) => party.id === editData.party_id) && editData.party_id > 0 && (
                    <option value={editData.party_id}>
                      {editingLeader?.party?.name ?? editingLeader?.partyName ?? `Party ${editData.party_id}`}
                    </option>
                  )}
                  {parties.map((party) => <option key={party.id} value={party.id}>{party.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="edit-governor-election_id" className="mb-2 block text-sm font-medium text-gray-700">Election *</label>
                <select
                  id="edit-governor-election_id"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={editData.election_id || ''}
                  onChange={(event) => setEditData((current) => ({ ...current, election_id: Number(event.target.value) || 0 }))}
                >
                  <option value="">Select election</option>
                  {!elections.some((election) => election.id === editData.election_id) && editData.election_id > 0 && (
                    <option value={editData.election_id}>
                      {editingLeader?.election?.year ?? editingLeader?.election?.details ?? `Election ${editData.election_id}`}
                    </option>
                  )}
                  {elections.map((election) => (
                    <option key={election.id} value={election.id}>
                      {election.year}{election.details ? ` - ${election.details}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="edit-governor-state_id" className="mb-2 block text-sm font-medium text-gray-700">State *</label>
                <input
                  id="edit-governor-state_id"
                  className="h-10 w-full rounded-md border border-input bg-gray-50 px-3 text-sm"
                  value={stateName || editingLeader?.state?.name || editingLeader?.stateName || ''}
                  readOnly
                />
              </div>
              <div>
                <label htmlFor="edit-governor-start-date" className="mb-2 block text-sm font-medium text-gray-700">Start Date *</label>
                <input
                  id="edit-governor-start-date"
                  type="date"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={editData.start_date}
                  onChange={(event) => setEditData((current) => ({ ...current, start_date: event.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="edit-governor-end-date" className="mb-2 block text-sm font-medium text-gray-700">End Date *</label>
                <input
                  id="edit-governor-end-date"
                  type="date"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={editData.end_date}
                  onChange={(event) => setEditData((current) => ({ ...current, end_date: event.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="edit-governor-tenure" className="mb-2 block text-sm font-medium text-gray-700">Tenure *</label>
                <input
                  id="edit-governor-tenure"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={editData.tenure}
                  onChange={(event) => setEditData((current) => ({ ...current, tenure: event.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="edit-governor-remark" className="mb-2 block text-sm font-medium text-gray-700">Remark</label>
                <textarea
                  id="edit-governor-remark"
                  rows={3}
                  className="w-full rounded-md border border-input bg-background p-3 text-sm"
                  value={editData.remark}
                  onChange={(event) => setEditData((current) => ({ ...current, remark: event.target.value }))}
                />
              </div>
            </div>
            {editError && <p role="alert" className="text-sm text-red-600">{editError}</p>}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setEditingLeader(null)} disabled={isUpdating}>Cancel</Button>
              <Button type="button" onClick={updateElectedLeader} disabled={isUpdating} className="bg-[#146c4f] hover:bg-[#10563f]">
                {isUpdating ? 'Updating...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}