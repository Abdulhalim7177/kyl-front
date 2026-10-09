import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Loader2, MapPin, Pencil, Search, Trash2 } from 'lucide-react'
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
    const openForm = () => setIsAddOpen(true)
    window.addEventListener('open-governatorial-form', openForm)
    return () => window.removeEventListener('open-governatorial-form', openForm)
  }, [])

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

  const candidatePageCount = Math.ceil(candidates.length / candidatesPerPage)
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
          <div className="border-b border-gray-100 p-6 md:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100">
                  <MapPin className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Manage Governatorial</p>
                  <h1 className="mt-1 text-2xl font-bold text-gray-900">{state.name}</h1>
                </div>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Status</p>
                <div className="mt-1 flex items-center gap-2 font-semibold text-[#146c4f]">
                  <CheckCircle2 className="h-4 w-4" />
                  {state.status === 1 ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-500">Manage active governatorial candidates for {state.name}.</p>
          </div>
          <div className="flex flex-col gap-4 border-b border-gray-100 px-6 py-4">
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
              Showing {candidates.length === 0 ? 0 : (candidatePage - 1) * candidatesPerPage + 1}–{Math.min(candidatePage * candidatesPerPage, candidates.length)} of {candidates.length} candidates
            </p>
          </div>
          {candidates.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              {hasSearchedElectionCandidates ? 'No governatorial candidates found for these filters.' : 'No active gubernatorial candidates found.'}
            </div>
          ) : (
            <>
            <div className="grid w-full grid-cols-1 gap-4 p-6 sm:grid-cols-2">
              {paginatedCandidates.map((candidate) => {
                const photoUrl = getLogoUrl(candidate.image)
                const partyLogoUrl = getPartyLogoValue(candidate.party)
                const nameInitial = candidate.full_name?.trim().charAt(0).toUpperCase() || 'C'
                const partyName = candidate.political_party || candidate.party?.name || 'N/A'
                const isDeputyGovernor = /deputy/i.test(candidate.office_title ?? '')
                const deleteLabel = isDeputyGovernor ? 'Delete Deputy' : 'Delete Governor'

                return (
                  <article key={`${candidate.id}-${candidate.office_id}`} className="w-full rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
                    <div className="mb-4 flex items-center gap-3">
                      <Avatar className="h-12 w-12 shrink-0 border border-gray-200">
                        {photoUrl && <AvatarImage src={photoUrl} alt={candidate.full_name} className="object-cover" />}
                        <AvatarFallback className="bg-[#146c4f]/10 font-semibold text-[#146c4f]">{nameInitial}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-900">{candidate.full_name}</p>
                      </div>
                      <div className="ml-auto flex shrink-0 gap-2">
                        <Button type="button" variant="outline" onClick={() => openEditForm(candidate)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button type="button" variant="destructive" onClick={() => {
                          setDeletingCandidate(candidate)
                          setDeleteError('')
                        }}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          {deleteLabel}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3 text-sm text-gray-600">
                      <div className="flex min-w-0 items-center gap-3 rounded-lg bg-gray-50 p-2.5">
                        <Avatar className="h-9 w-9 shrink-0 border border-gray-200 bg-white">
                          {partyLogoUrl && <AvatarImage src={partyLogoUrl} alt={`${partyName} logo`} className="object-contain" />}
                          <AvatarFallback className="bg-gray-100 text-xs font-semibold text-gray-600">
                            {partyName.charAt(0).toUpperCase() || 'P'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Party</p>
                          <p className="truncate font-medium text-gray-800">{partyName}</p>
                        </div>
                      </div>

                      <div className="rounded-lg bg-gray-50 p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Office</p>
                        <p className="mt-1 font-medium text-gray-800">{candidate.office_title || 'N/A'}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="min-w-0 rounded-lg bg-gray-50 p-2.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">NIN</p>
                          <p className="mt-1 break-words font-medium text-gray-800">{candidate.nin || 'N/A'}</p>
                        </div>
                        <div className="min-w-0 rounded-lg bg-gray-50 p-2.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Phone</p>
                          <p className="mt-1 break-words font-medium text-gray-800">{candidate.phoneNo || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="min-w-0 rounded-lg bg-gray-50 p-2.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Email</p>
                          <p className="mt-1 break-all font-medium text-gray-800">{candidate.email || 'N/A'}</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-2.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Date of birth</p>
                          <p className="mt-1 font-medium text-gray-800">{candidate.dob || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="rounded-lg bg-gray-50 p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Address</p>
                        <p className="mt-1 line-clamp-2 font-medium text-gray-800">{candidate.address || 'N/A'}</p>
                      </div>

                      {candidate.manifesto && (
                        <div className="rounded-lg bg-gray-50 p-2.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Manifesto</p>
                          <p className="mt-1 line-clamp-3 whitespace-pre-wrap font-medium text-gray-800">{candidate.manifesto}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Status</span>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${candidate.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
                          {candidate.status || 'Active'}
                        </span>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
            {candidatePageCount > 1 && (
              <div className="flex items-center justify-center gap-4 border-t border-gray-100 px-6 py-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCandidatePage((page) => Math.max(1, page - 1))}
                  disabled={candidatePage === 1}
                  aria-label="Previous candidate page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-600" aria-live="polite">
                  Page {candidatePage} of {candidatePageCount}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCandidatePage((page) => Math.min(candidatePageCount, page + 1))}
                  disabled={candidatePage === candidatePageCount}
                  aria-label="Next candidate page"
                >
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Governatorial Candidate</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <label htmlFor="governatorial-election" className="block text-sm font-medium text-gray-700">Active Election *</label>
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
            <label htmlFor="governatorial-candidate-search" className="block text-sm font-medium text-gray-700">Candidate NIN or phone number *</label>
            <div className="flex gap-2">
              <input
                id="governatorial-candidate-search"
                className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm"
                value={selectedCandidate?.full_name || candidateSearch}
                placeholder="Enter candidate NIN or phone number"
                readOnly={Boolean(selectedCandidate)}
                disabled={isVerifyingCandidate}
                onChange={(event) => {
                  if (selectedCandidate) return
                  setCandidateSearch(event.target.value)
                  setCandidateOptions([])
                  setCandidateSearchError('')
                  setHasSearchedCandidates(false)
                  setFormError('')
                  setFormData({ ...formData, candidate_id: '', party_id: '' })
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    void searchElectionCandidates()
                  }
                }}
              />
              <Button type="button" onClick={searchElectionCandidates} disabled={isSearchingCandidates || isVerifyingCandidate || Boolean(selectedCandidate)} className="bg-[#146c4f] hover:bg-[#10563f]">
                <Search className="h-4 w-4" />
                {isSearchingCandidates ? 'Searching...' : isVerifyingCandidate ? 'Verifying...' : 'Search'}
              </Button>
            </div>
            {candidateSearch.trim() && !selectedCandidate && hasSearchedCandidates && candidateOptions.length > 0 && (
              <div className="space-y-1 rounded-md border border-gray-200 p-2">
                {candidateOptions.map((candidate) => (
                    <button
                      key={candidate.id}
                      type="button"
                      className="block w-full rounded px-2 py-2 text-left text-sm hover:bg-gray-100 disabled:opacity-50"
                      disabled={isVerifyingCandidate}
                      onClick={() => void verifyCandidate(candidate)}
                    >
                      <span className="font-medium">{candidate.full_name}</span>
                      <span className="ml-2 text-gray-500">{candidate.phoneNo || candidate.nin}</span>
                    </button>
                  ))}
              </div>
            )}
            {candidateSearchError && <p className="text-sm text-red-600">{candidateSearchError}</p>}
            {selectedCandidate && (
              <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-800">
                Candidate verified for the selected election.
              </p>
            )}

            <label className="block text-sm font-medium text-gray-700">Office *</label>
            <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={formData.office_id} onChange={(event) => setFormData({ ...formData, office_id: event.target.value })}>
              <option value="">{officesError || (offices.length ? 'Select office' : 'No state offices available')}</option>
              {offices.map((office) => <option key={office.id} value={office.id}>{office.title}</option>)}
            </select>

            <label className="block text-sm font-medium text-gray-700">Political Party *</label>
            <input
              readOnly
              className="h-10 w-full rounded-md border border-input bg-gray-50 px-3 text-sm"
              value={selectedCandidate?.political_party || ''}
              placeholder="Selected candidate's registered party"
            />

            <Textarea value={formData.manifesto} onChange={(event) => setFormData({ ...formData, manifesto: event.target.value })} placeholder="Manifesto" />
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <Button type="button" onClick={addCandidate} disabled={isSaving || isVerifyingCandidate} className="w-full bg-[#146c4f] hover:bg-[#10563f]">
              {isSaving ? 'Adding...' : 'Add Governatorial'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}