import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Loader2, MapPin, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { getLogoUrl, getPartyLogoValue } from '@/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { districtsService, District } from '@/services/districts'
import { candidateService, Candidate, UpdateGovernatorialCandidateData } from '@/services/candidates'
import { electionService, Election, StateOffice } from '@/services/elections'
import { partyService, Party } from '@/services/parties'
import { useAuth } from '@/contexts/AuthContext'

const normalizeCandidateIdentifier = (value: string | number | undefined) =>
  String(value ?? '').toLowerCase().replace(/[\s()+-]/g, '')

export default function StateDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const { isAuthenticated } = useAuth()
  const [state, setState] = useState<District | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [candidateDirectory, setCandidateDirectory] = useState<Candidate[]>([])
  const [electionYearSearch, setElectionYearSearch] = useState('')
  const [electionPartySearch, setElectionPartySearch] = useState('')
  const [searchElections, setSearchElections] = useState<Election[]>([])
  const [electionSearchError, setElectionSearchError] = useState('')
  const [isSearchingElectionCandidates, setIsSearchingElectionCandidates] = useState(false)
  const [hasSearchedElectionCandidates, setHasSearchedElectionCandidates] = useState(false)
  const [candidatePage, setCandidatePage] = useState(1)
  const candidatesPerPage = 4
  const [candidateOptions, setCandidateOptions] = useState<Candidate[]>([])
  const [elections, setElections] = useState<Election[]>([])
  const [offices, setOffices] = useState<StateOffice[]>([])
  const [parties, setParties] = useState<Party[]>([])
  const [officesError, setOfficesError] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null)
  const [editData, setEditData] = useState<UpdateGovernatorialCandidateData>({
    candidate_id: 0,
    office_id: 0,
    party_id: 0,
    election_id: 0,
    state_id: 0,
    manifesto: ''
  })
  const [editError, setEditError] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [deletingCandidate, setDeletingCandidate] = useState<Candidate | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [formError, setFormError] = useState('')
  const [candidateSearch, setCandidateSearch] = useState('')
  const [candidateSearchError, setCandidateSearchError] = useState('')
  const [hasSearchedCandidates, setHasSearchedCandidates] = useState(false)
  const [isSearchingCandidates, setIsSearchingCandidates] = useState(false)
  const [isVerifyingCandidate, setIsVerifyingCandidate] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [formData, setFormData] = useState({
    candidate_id: '',
    office_id: '',
    party_id: '',
    election_id: '',
    manifesto: ''
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [assignedCandidateIds, setAssignedCandidateIds] = useState<number[]>([])

  const resetForm = () => {
    setCandidateSearch('')
    setCandidateSearchError('')
    setHasSearchedCandidates(false)
    setCandidateOptions([])
    setSelectedCandidate(null)
    setFormError('')
    setFormData({ candidate_id: '', office_id: '', party_id: '', election_id: '', manifesto: '' })
  }

  const getAssignmentCandidateId = (assignment: Candidate) => {
    const assignmentData = assignment as Candidate & {
      candidate_id?: number
      candidateId?: number
      candidate?: { id?: number }
    }
    return Number(assignmentData.candidate_id ??
      assignmentData.candidateId ??
      assignmentData.candidate?.id ??
      assignmentData.id)
  }

  const hasExistingOfficeAssignment = (candidateId: number) => assignedCandidateIds.includes(candidateId)

  const verifyCandidate = async (candidate: Candidate) => {
    if (!formData.election_id) {
      setCandidateSearchError('Select an election before verifying the candidate.')
      return
    }
    setIsVerifyingCandidate(true)
    setCandidateSearchError('')
    setFormError('')
    try {
      await electionService.checkCandidateRegistration({
        candidate_id: Number(candidate.id),
        election_id: Number(formData.election_id)
      })
      if (hasExistingOfficeAssignment(candidate.id)) {
        throw new Error('This candidate is already registered for an office and cannot be assigned again.')
      }
      setSelectedCandidate(candidate)
      setCandidateSearch(candidate.full_name)
      setFormData((current) => ({
        ...current,
        candidate_id: candidate.id.toString(),
        party_id: candidate.party_id?.toString() || ''
      }))
    } catch (verifyError) {
      setCandidateSearchError(verifyError instanceof Error ? verifyError.message : 'Unable to verify candidate.')
    } finally {
      setIsVerifyingCandidate(false)
    }
  }

  const searchElectionCandidates = async () => {
    const identifier = normalizeCandidateIdentifier(candidateSearch)
    if (!state || !formData.election_id || !identifier) {
      setCandidateSearchError(!identifier
        ? 'Enter a candidate NIN or phone number.'
        : 'Select an election before searching for a candidate.')
      return
    }

    setIsSearchingCandidates(true)
    setCandidateSearchError('')
    setHasSearchedCandidates(false)
    setCandidateOptions([])
    try {
      const allCandidates = await candidateService.getAllCandidates()
      const identifierMatches = allCandidates.filter((candidate) =>
        normalizeCandidateIdentifier(candidate.nin) === identifier ||
        normalizeCandidateIdentifier(candidate.phoneNo) === identifier
      )
      const matchingCandidates = identifierMatches.filter((candidate) => {
        if (candidate.state_id !== undefined) return Number(candidate.state_id) === state.id
        if (candidate.state) return candidate.state.trim().toLowerCase() === state.name.trim().toLowerCase()
        return true
      })
      setCandidateOptions(matchingCandidates)
      setHasSearchedCandidates(true)
      if (matchingCandidates.length === 0) {
        setCandidateSearchError(identifierMatches.length
          ? `This candidate is not registered in ${state.name}.`
          : 'No candidate found with that NIN or phone number.')
      }
    } catch (err) {
      setCandidateSearchError(err instanceof Error ? err.message : 'Unable to search election candidates.')
    } finally {
      setIsSearchingCandidates(false)
    }
  }

  useEffect(() => {
    if (isAddOpen && !formData.election_id && elections[0]) {
      setFormData((current) => ({ ...current, election_id: elections[0].id.toString() }))
    }
  }, [isAddOpen, elections, formData.election_id])

  useEffect(() => {
    if (searchParams.get('addGovernatorial') === 'true') {
      setIsAddOpen(true)
    }
  }, [searchParams])

  useEffect(() => {
    if (!isAuthenticated || !id) return

    const loadState = async () => {
      try {
        setLoading(true)
        setError('')
        const stateData = await districtsService.getState(Number(id))
        setState(stateData)

        const [candidateResult, electionResult, officeResult, directoryResult, partyResult, searchElectionResult] = await Promise.allSettled([
          candidateService.getActiveGovernatorialCandidates(stateData.id),
          electionService.getActiveElections(),
          electionService.getStateOffices(stateData.id),
          candidateService.getAllCandidates(),
          partyService.getAllParties(),
          electionService.getAllElections()
        ])

        if (candidateResult.status === 'fulfilled') {
          setAssignedCandidateIds(candidateResult.value.map(getAssignmentCandidateId))
          setCandidates(candidateResult.value)
          setCandidatePage(1)
        }
        if (electionResult.status === 'fulfilled') {
          setElections(electionResult.value)
          setFormData((current) => ({
            ...current,
            election_id: electionResult.value[0]?.id.toString() || ''
          }))
        }
        if (officeResult.status === 'fulfilled') {
          setOffices(officeResult.value.filter((office) => office.status === 1))
        } else {
          setOfficesError('Unable to load state offices.')
          console.error('Failed to load state offices:', officeResult.reason)
        }
        if (directoryResult.status === 'fulfilled') {
          setCandidateDirectory(directoryResult.value)
        } else {
          console.error('Failed to load candidate directory:', directoryResult.reason)
        }
        if (partyResult.status === 'fulfilled') {
          setParties(partyResult.value)
        } else {
          console.error('Failed to load political parties:', partyResult.reason)
        }
        if (searchElectionResult.status === 'fulfilled') {
          setSearchElections(searchElectionResult.value)
        } else {
          setElectionSearchError(searchElectionResult.reason instanceof Error
            ? searchElectionResult.reason.message
            : 'Unable to load elections for candidate search.')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load state')
      } finally {
        setLoading(false)
      }
    }

    loadState()
  }, [id, isAuthenticated])

  const addCandidate = async () => {
    if (!state || !formData.candidate_id || !formData.office_id || !formData.party_id || !formData.election_id) {
      setFormError('Please complete all required fields.')
      return
    }

    try {
      setIsSaving(true)
      setFormError('')
      await electionService.checkCandidateRegistration({
        candidate_id: Number(formData.candidate_id),
        election_id: Number(formData.election_id)
      })
      if (hasExistingOfficeAssignment(Number(formData.candidate_id))) {
        throw new Error('This candidate is already registered for an office and cannot be assigned again.')
      }
      await candidateService.addGovernatorialCandidate({
        candidate_id: Number(formData.candidate_id),
        office_id: Number(formData.office_id),
        party_id: Number(formData.party_id),
        election_id: Number(formData.election_id),
        state_id: state.id,
        manifesto: formData.manifesto
      })
      setIsAddOpen(false)
      resetForm()
      const updatedCandidates = await candidateService.getActiveGovernatorialCandidates(state.id)
      setAssignedCandidateIds(updatedCandidates.map(getAssignmentCandidateId))
      setCandidates(updatedCandidates)
      setCandidatePage(1)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to add candidate')
    } finally {
      setIsSaving(false)
    }
  }

  const openEditForm = (candidate: Candidate) => {
    setEditingCandidate(candidate)
    setEditError('')
    setEditData({
      candidate_id: Number(candidate.candidate_id ?? candidate.id) || 0,
      office_id: Number(candidate.office_id) || 0,
      party_id: Number(candidate.party_id) || 0,
      election_id: Number(candidate.election_id ?? candidate.election?.id) || 0,
      state_id: state?.id ?? 0,
      manifesto: candidate.manifesto ?? ''
    })
  }

  const updateCandidate = async () => {
    const assignmentId = Number(editingCandidate?.assignment_id)
    if (!Number.isInteger(assignmentId) || assignmentId <= 0) {
      setEditError('This governatorial assignment does not have a valid record ID.')
      return
    }
    if (
      !editData.candidate_id || !editData.office_id || !editData.party_id ||
      !editData.election_id || !editData.state_id
    ) {
      setEditError('Complete all required fields before saving.')
      return
    }

    setIsUpdating(true)
    setEditError('')
    try {
      await candidateService.updateGovernatorialCandidate(assignmentId, editData)
      const updatedCandidates = await candidateService.getActiveGovernatorialCandidates(state!.id)
      setAssignedCandidateIds(updatedCandidates.map(getAssignmentCandidateId))
      setCandidates(updatedCandidates)
      setCandidatePage(1)
      setEditingCandidate(null)
    } catch (updateError) {
      setEditError(updateError instanceof Error ? updateError.message : 'Unable to update governatorial candidate.')
    } finally {
      setIsUpdating(false)
    }
  }

  const removeCandidate = async () => {
    const assignmentId = Number(deletingCandidate?.assignment_id)
    if (!Number.isInteger(assignmentId) || assignmentId <= 0) {
      setDeleteError('This governatorial assignment does not have a valid record ID.')
      return
    }
    if (!state) {
      setDeleteError('The state could not be identified. Reload the page and try again.')
      return
    }

    setIsDeleting(true)
    setDeleteError('')
    try {
      await candidateService.removeGovernatorialCandidate(assignmentId)
      const updatedCandidates = await candidateService.getActiveGovernatorialCandidates(state.id)
      setAssignedCandidateIds(updatedCandidates.map(getAssignmentCandidateId))
      setCandidates(updatedCandidates)
      setCandidatePage(1)
      setDeletingCandidate(null)
    } catch (removeError) {
      setDeleteError(removeError instanceof Error ? removeError.message : 'Unable to remove governatorial candidate.')
    } finally {
      setIsDeleting(false)
    }
  }

  const editCandidateOptions = [...candidateDirectory, ...(editingCandidate ? [editingCandidate] : [])]
    .filter((candidate, index, all) => all.findIndex((item) => item.id === candidate.id) === index)
  const editPartyOptions = [...parties]
  if (editData.party_id && !editPartyOptions.some((party) => party.id === editData.party_id)) {
    editPartyOptions.push({
      id: editData.party_id,
      name: editingCandidate?.party?.name || editingCandidate?.political_party || `Party ${editData.party_id}`,
      description: '',
      slogan: '',
      philosophy: '',
      address: null,
      status: 1,
      registrationYear: null,
      logopath: null,
      created_at: null,
      updated_at: null
    })
  }
  const editOfficeOptions = offices.some((office) => office.id === editData.office_id)
    ? offices
    : editingCandidate?.office_id
      ? [...offices, { id: editingCandidate.office_id, title: editingCandidate.office_title || `Office ${editingCandidate.office_id}`, status: 1 }]
      : offices
  const editElectionOptions = elections.some((election) => election.id === editData.election_id)
    ? elections
    : editingCandidate?.election_id
      ? [...elections, {
          id: editingCandidate.election_id,
          year: editingCandidate.election?.year ?? '',
          details: editingCandidate.election?.details,
          status: editingCandidate.election?.current_status ?? ''
        }]
      : elections

  const candidatePageCount = Math.max(1, Math.ceil(candidates.length / candidatesPerPage))
  const paginatedCandidates = candidates.slice(
    (candidatePage - 1) * candidatesPerPage,
    candidatePage * candidatesPerPage
  )

  const searchGovernatorialCandidates = async () => {
    if (!state) return

    const electionYear = electionYearSearch.trim()
    const election = searchElections.find((item) => String(item.year).trim() === electionYear)
    if (!electionYear || !election) {
      setElectionSearchError(electionYear ? 'Select a valid election year from the available elections.' : 'Enter an election year.')
      return
    }

    const partyName = electionPartySearch.trim()
    const party = partyName
      ? parties.find((item) => item.name.trim().toLowerCase() === partyName.toLowerCase())
      : undefined
    if (partyName && !party) {
      setElectionSearchError('Select a valid party from the available parties, or leave party blank.')
      return
    }

    setIsSearchingElectionCandidates(true)
    setElectionSearchError('')
    setCandidatePage(1)
    try {
      setCandidates(await candidateService.getElectionGovernatorialCandidates(state.id, election.id, party?.id))
      setHasSearchedElectionCandidates(true)
    } catch (err) {
      setElectionSearchError(err instanceof Error ? err.message : 'Unable to search governatorial candidates.')
    } finally {
      setIsSearchingElectionCandidates(false)
    }
  }

  const showActiveCandidates = async () => {
    if (!state) return

    setIsSearchingElectionCandidates(true)
    setElectionSearchError('')
    try {
      setCandidates(await candidateService.getActiveGovernatorialCandidates(state.id))
      setElectionYearSearch('')
      setElectionPartySearch('')
      setHasSearchedElectionCandidates(false)
      setCandidatePage(1)
    } catch (err) {
      setElectionSearchError(err instanceof Error ? err.message : 'Unable to load active governatorial candidates.')
    } finally {
      setIsSearchingElectionCandidates(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#146c4f]" />
      </div>
    )
  }

  if (error || !state) {
    return (
      <div className="space-y-4 p-4 md:p-0">
        <Link to="/k8s9d7f3-districts/states" className="inline-flex items-center gap-2 text-sm font-medium text-[#146c4f] hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to states
        </Link>
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            {error || 'State not found'}
          </CardContent>
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
          <div className="border-b border-gray-100 p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100">
                  <MapPin className="h-6 w-6 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Manage State Candidates</p>
                  <h1 className="mt-1 break-words text-xl font-bold text-gray-900 sm:text-2xl">{state.name}</h1>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:items-end">
                <Button type="button" className="w-full bg-[#146c4f] hover:bg-[#10563f] sm:w-auto" onClick={() => setIsAddOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add Candidate
                </Button>
                <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-2 sm:self-end">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Status</p>
                  <div className="mt-1 flex items-center gap-2 font-semibold text-[#146c4f]">
                    <CheckCircle2 className="h-4 w-4" />
                    {state.status === 1 ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-500">Manage active governatorial candidates for {state.name}.</p>
          </div>
          <div className="flex flex-col gap-4 border-b border-gray-100 px-4 py-4 sm:px-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] sm:items-end">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-gray-600">Election year</span>
                <input
                  type="text"
                  value={electionYearSearch}
                  onChange={(event) => setElectionYearSearch(event.target.value)}
                  placeholder="Enter election year"
                  className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#146c4f] focus:outline-none focus:ring-2 focus:ring-[#146c4f]/20"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-gray-600">Party (optional)</span>
                <input
                  type="text"
                  value={electionPartySearch}
                  onChange={(event) => setElectionPartySearch(event.target.value)}
                  placeholder="Enter party name"
                  className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#146c4f] focus:outline-none focus:ring-2 focus:ring-[#146c4f]/20"
                />
              </label>
              <Button type="button" onClick={searchGovernatorialCandidates} disabled={isSearchingElectionCandidates}>
                {isSearchingElectionCandidates && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Search
              </Button>
              {hasSearchedElectionCandidates && (
                <Button type="button" variant="outline" onClick={showActiveCandidates} disabled={isSearchingElectionCandidates}>
                  Show active
                </Button>
              )}
            </div>
            {electionSearchError && <p className="text-sm text-red-600" role="alert">{electionSearchError}</p>}
            <p className="text-sm text-gray-500" aria-live="polite">
              Showing {candidates.length === 0 ? 0 : (candidatePage - 1) * candidatesPerPage + 1}–{Math.min(candidatePage * candidatesPerPage, candidates.length)} of {candidates.length} candidates · {candidatesPerPage} per page
            </p>
          </div>
          {candidates.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              {hasSearchedElectionCandidates ? 'No governatorial candidates found for these filters.' : 'No active gubernatorial candidates found.'}
            </div>
          ) : (
            <>
            <div className="grid w-full grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-6">
              {paginatedCandidates.map((candidate) => {
                const photoUrl = getLogoUrl(candidate.image)
                const partyLogoUrl = getPartyLogoValue(candidate.party)
                const nameInitial = candidate.full_name?.trim().charAt(0).toUpperCase() || 'C'
                const partyName = candidate.political_party || candidate.party?.name || 'N/A'
                const isDeputyGovernor = /deputy/i.test(candidate.office_title ?? '')
                const deleteLabel = isDeputyGovernor ? 'Delete Deputy' : 'Delete Governor'

                return (
                  <Card key={`${candidate.id}-${candidate.office_id}`} className="h-full min-w-0 overflow-hidden border border-gray-100 shadow-md">
                    <div className="h-2 bg-gradient-to-r from-[#146c4f] to-emerald-300" />
                    <CardContent className="p-4 sm:p-8">
                      <div className="mb-4 flex items-center justify-between gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${candidate.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                          {candidate.status || 'Active'}
                        </span>
                        <div className="flex shrink-0 gap-1 sm:gap-2">
                        <Button type="button" size="sm" variant="outline" aria-label={`Edit ${candidate.full_name}`} title="Edit candidate" className="h-8 px-2 sm:h-9 sm:px-3" onClick={() => openEditForm(candidate)}>
                          <Pencil className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Edit</span>
                        </Button>
                        <Button type="button" size="sm" variant="destructive" aria-label={`${deleteLabel} ${candidate.full_name}`} title={deleteLabel} className="h-8 px-2 sm:h-9 sm:px-3" onClick={() => {
                          setDeletingCandidate(candidate)
                          setDeleteError('')
                        }}>
                          <Trash2 className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">{deleteLabel}</span>
                        </Button>
                        </div>
                      </div>

                      <div className="flex flex-col items-center text-center">
                        <Avatar className="h-28 w-28 border-4 border-white shadow-lg ring-2 ring-[#146c4f]/20">
                          {photoUrl && <AvatarImage src={photoUrl} alt={candidate.full_name} className="object-cover" />}
                          <AvatarFallback className="bg-[#146c4f]/10 text-2xl font-bold text-[#146c4f]">{nameInitial}</AvatarFallback>
                        </Avatar>
                        <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-[#146c4f]">{candidate.office_title || 'Governatorial Candidate'}</p>
                        <h2 className="mt-2 break-words text-2xl font-bold text-gray-900">{candidate.full_name || 'Candidate'}</h2>
                      </div>

                      <div className="mt-7 grid gap-3 text-sm sm:grid-cols-2">
                        <div className="rounded-xl bg-gray-50 p-4">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Political Party</p>
                          <div className="mt-2 flex items-center gap-3">
                            <Avatar className="h-12 w-12 border border-gray-200 bg-white">
                              {partyLogoUrl && <AvatarImage src={partyLogoUrl} alt={`${partyName} logo`} className="object-contain p-1" />}
                              <AvatarFallback className="text-sm font-bold text-gray-500">{partyName.charAt(0).toUpperCase() || 'P'}</AvatarFallback>
                            </Avatar>
                            <p className="truncate font-semibold text-gray-800">{partyName}</p>
                          </div>
                        </div>
                        <div className="rounded-xl bg-gray-50 p-4">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Election</p>
                          <p className="mt-2 font-semibold text-gray-800">{candidate.election?.year || candidate.election?.details || 'Not specified'}</p>
                        </div>
                        <div className="rounded-xl bg-gray-50 p-4">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">NIN</p>
                          <p className="mt-2 break-words font-semibold text-gray-800">{candidate.nin || 'Not specified'}</p>
                        </div>
                        <div className="rounded-xl bg-gray-50 p-4">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Phone</p>
                          <p className="mt-2 break-words font-semibold text-gray-800">{candidate.phoneNo || 'Not specified'}</p>
                        </div>
                        <div className="rounded-xl bg-gray-50 p-4">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Email</p>
                          <p className="mt-2 break-all font-semibold text-gray-800">{candidate.email || 'Not specified'}</p>
                        </div>
                        <div className="rounded-xl bg-gray-50 p-4">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Date of Birth</p>
                          <p className="mt-2 font-semibold text-gray-800">{candidate.dob || 'Not specified'}</p>
                        </div>
                        <div className="rounded-xl bg-gray-50 p-4 sm:col-span-2">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Address</p>
                          <p className="mt-2 break-words font-semibold text-gray-800">{candidate.address || 'Not specified'}</p>
                        </div>
                        {candidate.manifesto && (
                          <div className="rounded-xl bg-gray-50 p-4 sm:col-span-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Manifesto</p>
                            <p className="mt-2 whitespace-pre-wrap text-gray-800">{candidate.manifesto}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
            {candidates.length > 0 && (
              <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-4 py-4 sm:justify-center sm:gap-6 sm:px-6">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => setCandidatePage((page) => Math.max(1, page - 1))}
                  disabled={candidatePage === 1}
                  aria-label="Previous candidate page"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </Button>
                <span className="whitespace-nowrap text-sm text-gray-600" aria-live="polite">
                  Page {candidatePage} of {candidatePageCount}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => setCandidatePage((page) => Math.min(candidatePageCount, page + 1))}
                  disabled={candidatePage === candidatePageCount}
                  aria-label="Next candidate page"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(editingCandidate)}
        onOpenChange={(open) => {
          if (!open && !isUpdating) {
            setEditingCandidate(null)
            setEditError('')
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Governatorial Candidate</DialogTitle>
            <DialogDescription>Update the governatorial candidate registration.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="edit-governatorial-candidate" className="mb-2 block text-sm font-medium text-gray-700">Candidate *</label>
                <select
                  id="edit-governatorial-candidate"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={editData.candidate_id || ''}
                  onChange={(event) => setEditData((current) => ({ ...current, candidate_id: Number(event.target.value) || 0 }))}
                >
                  <option value="">Select candidate</option>
                  {editCandidateOptions.map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>{candidate.full_name || `Candidate ${candidate.id}`}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="edit-governatorial-office" className="mb-2 block text-sm font-medium text-gray-700">Office *</label>
                <select
                  id="edit-governatorial-office"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={editData.office_id || ''}
                  onChange={(event) => setEditData((current) => ({ ...current, office_id: Number(event.target.value) || 0 }))}
                >
                  <option value="">Select office</option>
                  {editOfficeOptions.map((office) => <option key={office.id} value={office.id}>{office.title}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="edit-governatorial-party" className="mb-2 block text-sm font-medium text-gray-700">Political Party *</label>
                <select
                  id="edit-governatorial-party"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={editData.party_id || ''}
                  onChange={(event) => setEditData((current) => ({ ...current, party_id: Number(event.target.value) || 0 }))}
                >
                  <option value="">Select party</option>
                  {editPartyOptions.map((party) => <option key={party.id} value={party.id}>{party.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="edit-governatorial-election" className="mb-2 block text-sm font-medium text-gray-700">Election *</label>
                <select
                  id="edit-governatorial-election"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={editData.election_id || ''}
                  onChange={(event) => setEditData((current) => ({ ...current, election_id: Number(event.target.value) || 0 }))}
                >
                  <option value="">Select election</option>
                  {editElectionOptions.map((election) => (
                    <option key={election.id} value={election.id}>
                      {election.year}{election.details ? ` - ${election.details}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="edit-governatorial-state" className="mb-2 block text-sm font-medium text-gray-700">State *</label>
                <input
                  id="edit-governatorial-state"
                  className="h-10 w-full rounded-md border border-input bg-gray-50 px-3 text-sm"
                  value={state.name}
                  readOnly
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="edit-governatorial-manifesto" className="mb-2 block text-sm font-medium text-gray-700">Manifesto</label>
                <Textarea
                  id="edit-governatorial-manifesto"
                  rows={3}
                  value={editData.manifesto}
                  onChange={(event) => setEditData((current) => ({ ...current, manifesto: event.target.value }))}
                />
              </div>
            </div>
            {editError && <p role="alert" className="text-sm text-red-600">{editError}</p>}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setEditingCandidate(null)} disabled={isUpdating}>Cancel</Button>
              <Button type="button" onClick={updateCandidate} disabled={isUpdating} className="bg-[#146c4f] hover:bg-[#10563f]">
                {isUpdating ? 'Updating...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deletingCandidate)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeletingCandidate(null)
            setDeleteError('')
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {deletingCandidate && /deputy/i.test(deletingCandidate.office_title ?? '') ? 'Deputy' : 'Governor'} Candidate</DialogTitle>
            <DialogDescription>
              Remove {deletingCandidate?.full_name || 'this candidate'} from this governatorial assignment? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteError && <p role="alert" className="text-sm text-red-600">{deleteError}</p>}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setDeletingCandidate(null)} disabled={isDeleting}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={removeCandidate} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isAddOpen}
        onOpenChange={(open) => {
          setIsAddOpen(open)
          if (!open) {
            resetForm()
            const nextParams = new URLSearchParams(searchParams)
            nextParams.delete('addGovernatorial')
            setSearchParams(nextParams)
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add Governatorial Candidate</DialogTitle>
            <DialogDescription>
              Verify the candidate first, then complete the governatorial assignment details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className={`rounded-xl border p-3 ${selectedCandidate ? 'border-emerald-200 bg-emerald-50' : 'border-[#146c4f]/30 bg-[#146c4f]/5'}`}>
                <p className="text-xs font-bold uppercase tracking-wider text-[#146c4f]">Step 1</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">Verify candidate</p>
              </div>
              <div className={`rounded-xl border p-3 ${selectedCandidate ? 'border-[#146c4f]/30 bg-[#146c4f]/5' : 'border-gray-200 bg-gray-50'}`}>
                <p className={`text-xs font-bold uppercase tracking-wider ${selectedCandidate ? 'text-[#146c4f]' : 'text-gray-400'}`}>Step 2</p>
                <p className={`mt-1 text-sm font-semibold ${selectedCandidate ? 'text-gray-900' : 'text-gray-400'}`}>Assignment details</p>
              </div>
            </div>

            {!selectedCandidate ? (
              <div className="space-y-4 rounded-xl border border-gray-100 bg-gray-50/60 p-4">
                <div>
                  <label htmlFor="governatorial-election" className="mb-1 block text-sm font-medium text-gray-700">Active Election *</label>
                  <select
                    id="governatorial-election"
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={formData.election_id}
                    disabled={isVerifyingCandidate || isSearchingCandidates}
                    onChange={(event) => {
                      setFormData((current) => ({
                        ...current,
                        election_id: event.target.value,
                        candidate_id: '',
                        party_id: ''
                      }))
                      setCandidateOptions([])
                      setHasSearchedCandidates(false)
                      setSelectedCandidate(null)
                      setCandidateSearchError('')
                      setFormError('')
                    }}
                  >
                    <option value="">Select election</option>
                    {elections.map((election) => (
                      <option key={election.id} value={election.id}>
                        {election.year}{election.details ? ` - ${election.details}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="governatorial-candidate-search" className="mb-1 block text-sm font-medium text-gray-700">Candidate NIN or phone number *</label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      id="governatorial-candidate-search"
                      className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm"
                      value={candidateSearch}
                      placeholder="Enter candidate NIN or phone number"
                      disabled={isVerifyingCandidate || isSearchingCandidates}
                      onChange={(event) => {
                        setCandidateSearch(event.target.value)
                        setCandidateOptions([])
                        setCandidateSearchError('')
                        setHasSearchedCandidates(false)
                        setFormError('')
                        setFormData((current) => ({ ...current, candidate_id: '', party_id: '' }))
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          void searchElectionCandidates()
                        }
                      }}
                    />
                    <Button
                      type="button"
                      className="w-full bg-[#146c4f] hover:bg-[#10563f] sm:w-auto"
                      onClick={() => void searchElectionCandidates()}
                      disabled={isSearchingCandidates || isVerifyingCandidate}
                    >
                      <Search className="mr-2 h-4 w-4" />
                      {isSearchingCandidates ? 'Searching...' : 'Find Candidate'}
                    </Button>
                  </div>
                </div>
                {candidateSearch.trim() && hasSearchedCandidates && candidateOptions.length > 0 && (
                  <div className="space-y-1 rounded-md border border-gray-200 bg-white p-2">
                    <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Select the matching candidate to verify</p>
                    {candidateOptions.map((candidate) => (
                      <button
                        key={candidate.id}
                        type="button"
                        className="flex w-full flex-col rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-100 disabled:opacity-50 sm:flex-row sm:items-center sm:justify-between"
                        disabled={isVerifyingCandidate}
                        onClick={() => void verifyCandidate(candidate)}
                      >
                        <span className="font-medium">{candidate.full_name}</span>
                        <span className="text-gray-500">{candidate.phoneNo || candidate.nin}</span>
                      </button>
                    ))}
                  </div>
                )}
                {(isVerifyingCandidate || isSearchingCandidates) && (
                  <p role="status" className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isVerifyingCandidate ? 'Verifying candidate registration...' : 'Searching candidates...'}
                  </p>
                )}
                {candidateSearchError && <p role="alert" className="text-sm text-red-600">{candidateSearchError}</p>}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center">
                  <Avatar className="h-12 w-12 border border-emerald-200">
                    <AvatarImage src={getLogoUrl(selectedCandidate.image) ?? undefined} alt={selectedCandidate.full_name} className="object-cover" />
                    <AvatarFallback className="bg-white font-semibold text-[#146c4f]">
                      {selectedCandidate.full_name?.trim().charAt(0).toUpperCase() || 'C'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Candidate verified</p>
                    <p className="break-words font-semibold text-gray-900">{selectedCandidate.full_name}</p>
                    <p className="text-sm text-gray-600">{selectedCandidate.phoneNo || selectedCandidate.nin || 'Verified candidate'}</p>
                  </div>
                  <Button type="button" size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => {
                    setSelectedCandidate(null)
                    setFormData((current) => ({ ...current, candidate_id: '', party_id: '' }))
                    setCandidateSearchError('')
                    setFormError('')
                  }}>
                    Change candidate
                  </Button>
                </div>

                <div>
                  <label htmlFor="governatorial-office" className="mb-1 block text-sm font-medium text-gray-700">Office *</label>
                  <select
                    id="governatorial-office"
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={formData.office_id}
                    onChange={(event) => setFormData((current) => ({ ...current, office_id: event.target.value }))}
                  >
                    <option value="">{officesError || (offices.length ? 'Select office' : 'No state offices available')}</option>
                    {offices.map((office) => <option key={office.id} value={office.id}>{office.title}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="governatorial-party" className="mb-1 block text-sm font-medium text-gray-700">Political Party *</label>
                  <input
                    id="governatorial-party"
                    readOnly
                    className="h-10 w-full rounded-md border border-input bg-gray-50 px-3 text-sm"
                    value={selectedCandidate.political_party || selectedCandidate.party?.name || ''}
                    placeholder="Selected candidate's registered party"
                  />
                </div>
                <div>
                  <label htmlFor="governatorial-manifesto" className="mb-1 block text-sm font-medium text-gray-700">Manifesto</label>
                  <Textarea
                    id="governatorial-manifesto"
                    value={formData.manifesto}
                    onChange={(event) => setFormData((current) => ({ ...current, manifesto: event.target.value }))}
                    placeholder="Manifesto"
                  />
                </div>
                {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}
                <Button type="button" onClick={addCandidate} disabled={isSaving || isVerifyingCandidate} className="w-full bg-[#146c4f] hover:bg-[#10563f]">
                  {isSaving ? 'Adding...' : 'Add Governatorial Candidate'}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}