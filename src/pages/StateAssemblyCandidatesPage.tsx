import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, MapPin, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { candidateService, Candidate, UpdateStateAssemblyCandidateData } from '@/services/candidates'
import { districtsService, District } from '@/services/districts'
import { Election, electionService } from '@/services/elections'
import { Party, partyService } from '@/services/parties'
import { useAuth } from '@/contexts/AuthContext'
import { getLogoUrl, getPartyLogoValue } from '@/lib/utils'

type OfficeOption = { id: number; title: string; status?: number }

const normalizeCandidateIdentifier = (value: string | number | undefined) =>
  String(value ?? '').replace(/\D/g, '')

export default function StateAssemblyCandidatesPage() {
  const { id } = useParams<{ id: string }>()
  const { isAuthenticated } = useAuth()
  const [district, setDistrict] = useState<District | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [elections, setElections] = useState<Election[]>([])
  const [searchElections, setSearchElections] = useState<Election[]>([])
  const [parties, setParties] = useState<Party[]>([])
  const [activeAddElections, setActiveAddElections] = useState<Election[]>([])
  const [isLoadingAddElections, setIsLoadingAddElections] = useState(false)
  const [addElectionError, setAddElectionError] = useState('')
  const [offices, setOffices] = useState<OfficeOption[]>([])
  const [isLoadingOffices, setIsLoadingOffices] = useState(false)
  const [officeLoadError, setOfficeLoadError] = useState('')
  const [electionId, setElectionId] = useState('')
  const [searchElectionYear, setSearchElectionYear] = useState('')
  const [searchPartyName, setSearchPartyName] = useState('')
  const [appliedSearch, setAppliedSearch] = useState<{ electionId: number; partyId?: number } | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [candidateSearch, setCandidateSearch] = useState('')
  const [candidateSearchError, setCandidateSearchError] = useState('')
  const [formError, setFormError] = useState('')
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [officeId, setOfficeId] = useState('')
  const [manifesto, setManifesto] = useState('')
  const [loading, setLoading] = useState(true)
  const [candidatesLoading, setCandidatesLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null)
  const [deletingCandidate, setDeletingCandidate] = useState<Candidate | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [editData, setEditData] = useState<UpdateStateAssemblyCandidateData>({
    candidate_id: 0,
    office_id: 0,
    party_id: 0,
    election_id: 0,
    state_house_district_id: 0,
    manifesto: ''
  })
  const [editError, setEditError] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState('')
  const [dataError, setDataError] = useState('')
  const [candidatesError, setCandidatesError] = useState('')
  const [candidatePage, setCandidatePage] = useState(1)
  const districtId = Number(id)
  const districtName = district?.name ?? `State Constituency ${id ?? ''}`
  const candidatesPerPage = 4

  const openAddDialog = async () => {
    setIsAddOpen(true)
    setIsLoadingAddElections(true)
    setIsLoadingOffices(true)
    setAddElectionError('')
    setOfficeLoadError('')
    setCandidateSearchError('')
    setFormError('')
    setSelectedCandidate(null)
    setElectionId('')

    const [electionResult, officeResult] = await Promise.allSettled([
      electionService.getActiveElections(),
      electionService.getStateAssemblyOffices()
    ])

    if (electionResult.status === 'fulfilled') {
      setActiveAddElections(electionResult.value)
      setElectionId(String(electionResult.value[0]?.id ?? ''))
      if (electionResult.value.length === 0) {
        setAddElectionError('There are no active elections available.')
      }
    } else {
      setActiveAddElections([])
      setAddElectionError(electionResult.reason instanceof Error ? electionResult.reason.message : 'Unable to load active elections.')
    }
    setIsLoadingAddElections(false)

    if (officeResult.status === 'fulfilled') {
      const availableOffices = officeResult.value
        .map((office) => ({
          id: Number(office.id),
          title: String(office.title ?? ''),
          status: office.status === undefined ? undefined : Number(office.status)
        }))
        .filter((office) => office.id > 0 && office.title && office.status !== 0)
      setOffices(availableOffices)
      if (availableOffices.length === 0) {
        setOfficeLoadError('No active State Assembly offices were returned by the API.')
      }
    } else {
      setOfficeLoadError(officeResult.reason instanceof Error ? officeResult.reason.message : 'Unable to load State Assembly offices.')
    }
    setIsLoadingOffices(false)
  }

  const handleAddDialogChange = (open: boolean) => {
    setIsAddOpen(open)
    if (!open) {
      setCandidateSearch('')
      setCandidateSearchError('')
      setFormError('')
      setSelectedCandidate(null)
      setElectionId('')
      setOfficeId('')
      setManifesto('')
      setAddElectionError('')
      setOfficeLoadError('')
    }
  }

  const loadCandidates = useCallback(async (searchFilters = appliedSearch) => {
    if (searchFilters) {
      return candidateService.getElectionStateAssemblyCandidates(
        districtId,
        searchFilters.electionId,
        searchFilters.partyId
      )
    }
    return candidateService.getActiveElectionStateAssemblyCandidates(districtId)
  }, [appliedSearch, districtId])

  useEffect(() => {
    if (!districtId || districtId <= 0) {
      setCandidates([])
      return
    }

    let isCurrent = true
    setCandidatesLoading(true)
    candidateService.getActiveElectionStateAssemblyCandidates(districtId)
      .then((data) => {
        if (isCurrent) {
          setCandidates(data)
          setCandidatesError('')
        }
      })
      .catch((loadError: unknown) => {
        if (isCurrent) {
          setCandidates([])
          setCandidatesError(loadError instanceof Error ? loadError.message : 'Unable to load State Assembly candidates.')
        }
      })
      .finally(() => {
        if (isCurrent) setCandidatesLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [districtId])

  const loadPage = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      setDataError('')
      const districts = await districtsService.getStateHouseDistricts(true)
      const currentDistrict = districts.find((item) => item.id === districtId)
      if (!currentDistrict) throw new Error('State constituency not found.')

      setDistrict(currentDistrict)
      setLoading(false)

      const [electionResult, allElectionResult, partyResult, officeResult] = await Promise.allSettled([
        electionService.getActiveElections(),
        electionService.getAllElections(),
        partyService.getAllParties(),
        electionService.getStateAssemblyOffices()
      ])
      const errors: string[] = []
      if (electionResult.status === 'fulfilled') {
        setElections(electionResult.value)
        setElectionId((current) => current || String(electionResult.value[0]?.id ?? ''))
      } else {
        errors.push('Unable to load elections.')
        console.error('Failed to load active elections:', electionResult.reason)
      }
      if (allElectionResult.status === 'fulfilled') {
        setSearchElections(allElectionResult.value)
      } else {
        errors.push('Unable to load elections for candidate search.')
        console.error('Failed to load elections for candidate search:', allElectionResult.reason)
      }
      if (partyResult.status === 'fulfilled') {
        setParties(partyResult.value)
      } else {
        errors.push('Unable to load political parties for candidate search.')
        console.error('Failed to load parties for candidate search:', partyResult.reason)
      }
      if (officeResult.status === 'fulfilled') {
        setOffices((Array.isArray(officeResult.value) ? officeResult.value : [])
          .map((office) => ({
            id: Number(office.id),
            title: String(office.title ?? ''),
            status: office.status === undefined ? undefined : Number(office.status)
          }))
          .filter((office) => office.id && office.title && office.status !== 0))
      } else {
        errors.push('Unable to load State Assembly offices.')
        console.error('Failed to load offices:', officeResult.reason)
      }
      setDataError(errors.join(' '))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load state constituency.')
    } finally {
      setLoading(false)
    }
  }, [districtId])

  useEffect(() => {
    if (!isAuthenticated || !id) return
    void loadPage()
  }, [id, isAuthenticated, loadPage])

  const filteredCandidates = candidates
  const totalCandidatePages = Math.max(1, Math.ceil(filteredCandidates.length / candidatesPerPage))
  const paginatedCandidates = filteredCandidates.slice(
    (candidatePage - 1) * candidatesPerPage,
    candidatePage * candidatesPerPage
  )

  useEffect(() => {
    setCandidatePage(1)
  }, [candidates, appliedSearch])

  const searchCandidates = async () => {
    const electionYear = searchElectionYear.trim()
    const election = searchElections.find((item) => String(item.year).trim() === electionYear)
    if (!electionYear || !election) {
      setCandidatesError('Enter an election year that exists in the election records.')
      return
    }
    const partyName = searchPartyName.trim()
    const party = partyName
      ? parties.find((item) => item.name.trim().toLocaleLowerCase() === partyName.toLocaleLowerCase())
      : undefined
    if (partyName && !party) {
      setCandidatesError('Enter a political party name that exists in the party records, or leave the field blank.')
      return
    }

    const filters = {
      electionId: election.id,
      ...(party ? { partyId: party.id } : {})
    }
    setCandidatesLoading(true)
    setCandidatesError('')
    try {
      const results = await candidateService.getElectionStateAssemblyCandidates(
        districtId,
        filters.electionId,
        filters.partyId
      )
      setCandidates(results)
      setAppliedSearch(filters)
    } catch (searchError) {
      setCandidatesError(searchError instanceof Error ? searchError.message : 'Unable to search State Assembly candidates.')
    } finally {
      setCandidatesLoading(false)
    }
  }

  const clearCandidateSearch = async () => {
    setSearchPartyName('')
    setSearchElectionYear('')
    setAppliedSearch(null)
    setCandidatesLoading(true)
    setCandidatesError('')
    try {
      const activeCandidates = await candidateService.getActiveElectionStateAssemblyCandidates(districtId)
      setCandidates(activeCandidates)
    } catch (loadError) {
      setCandidatesError(loadError instanceof Error ? loadError.message : 'Unable to load active State Assembly candidates.')
    } finally {
      setCandidatesLoading(false)
    }
  }

  const verifyCandidate = async () => {
    const identifier = normalizeCandidateIdentifier(candidateSearch)
    if (!identifier) {
      setCandidateSearchError('Enter the candidate NIN or phone number.')
      return
    }
    if (!electionId) {
      setCandidateSearchError('Select an election before verifying the candidate.')
      return
    }

    setIsVerifying(true)
    setCandidateSearchError('')
    setFormError('')
    setSelectedCandidate(null)
    try {
      const refreshedDirectory = await candidateService.getAllCandidates()
      const candidate = refreshedDirectory.find((item) =>
        normalizeCandidateIdentifier(item.nin) === identifier ||
        normalizeCandidateIdentifier(item.phoneNo) === identifier
      )
      if (!candidate) {
        throw new Error('No candidate matched that NIN or phone number in the candidate directory. Check the number or make sure the candidate profile exists.')
      }

      await electionService.checkCandidateRegistration({
        candidate_id: Number(candidate.id),
        election_id: Number(electionId)
      })
      setSelectedCandidate(candidate)
    } catch (verificationError) {
      setCandidateSearchError(verificationError instanceof Error ? verificationError.message : 'Candidate verification failed.')
    } finally {
      setIsVerifying(false)
    }
  }

  const saveMember = async () => {
    const partyId = Number(selectedCandidate?.party_id)
    if (!selectedCandidate || !Number.isInteger(partyId) || partyId <= 0) {
      setFormError('Select and verify a candidate with a political party assigned.')
      return
    }
    if (!officeId) {
      setFormError('Select a State Assembly office.')
      return
    }
    if (!electionId) {
      setFormError('Select an election.')
      return
    }

    setIsSaving(true)
    setFormError('')
    try {
      await electionService.checkCandidateRegistration({
        candidate_id: Number(selectedCandidate.id),
        election_id: Number(electionId)
      })
      await candidateService.addStateAssemblyCandidate({
        candidate_id: Number(selectedCandidate.id),
        office_id: Number(officeId),
        party_id: partyId,
        election_id: Number(electionId),
        state_house_district_id: districtId,
        manifesto: manifesto.trim()
      })
      setIsAddOpen(false)
      setSelectedCandidate(null)
      setCandidateSearch('')
      setOfficeId('')
      setManifesto('')
      setCandidatesLoading(true)
      const updated = await loadCandidates()
      setCandidates(updated)
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : 'Unable to add State Assembly candidate.')
    } finally {
      setIsSaving(false)
      setCandidatesLoading(false)
    }
  }

  const openEditDialog = (candidate: Candidate) => {
    setEditingCandidate(candidate)
    setEditData({
      candidate_id: Number(candidate.candidate_id ?? candidate.id),
      office_id: Number(candidate.office_id ?? 0),
      party_id: Number(candidate.party_id ?? 0),
      election_id: Number(candidate.election_id ?? (Number(electionId) || 0)),
      state_house_district_id: districtId,
      manifesto: candidate.manifesto ?? ''
    })
    setEditError('')
  }

  const saveEdit = async () => {
    if (!editingCandidate) return
    const assignmentId = Number(editingCandidate.assignment_id)
    if (!Number.isInteger(assignmentId) || assignmentId <= 0) {
      setEditError('This State Assembly candidate assignment does not have a valid record ID.')
      return
    }
    if (
      !editData.candidate_id || !editData.party_id || !editData.office_id ||
      !editData.election_id || !editData.state_house_district_id
    ) {
      setEditError('Complete all required fields before saving.')
      return
    }
    setIsUpdating(true)
    setEditError('')
    try {
      await candidateService.updateStateAssemblyCandidate(assignmentId, {
        candidate_id: editData.candidate_id,
        office_id: editData.office_id,
        party_id: editData.party_id,
        election_id: editData.election_id,
        state_house_district_id: districtId,
        manifesto: editData.manifesto
      })
      const refreshed = await loadCandidates()
      setCandidates(refreshed)
      setEditingCandidate(null)
    } catch (saveError) {
      setEditError(saveError instanceof Error ? saveError.message : 'Unable to update State Assembly candidate.')
    } finally {
      setIsUpdating(false)
    }
  }

  const removeCandidate = async (candidate: Candidate) => {
    const assignmentId = Number(candidate.assignment_id)
    if (!Number.isInteger(assignmentId) || assignmentId <= 0) {
      setDeleteError('This State Assembly candidate assignment does not have a valid record ID.')
      return
    }
    setDeleteError('')
    setIsDeleting(true)
    try {
      await candidateService.removeStateAssemblyCandidate(assignmentId)
      const refreshed = await loadCandidates()
      setCandidates(refreshed)
      setDeletingCandidate(null)
    } catch (deleteError) {
      setDeleteError(deleteError instanceof Error ? deleteError.message : 'Unable to remove State Assembly candidate.')
    } finally {
      setIsDeleting(false)
    }
  }

  const editElections = elections.some((election) => election.id === editData.election_id)
    ? elections
    : editingCandidate?.election?.id
      ? [...elections, {
          id: editingCandidate.election.id,
          year: Number(editingCandidate.election.year) || editingCandidate.election.id,
          details: editingCandidate.election.details,
          status: editingCandidate.election.current_status ?? ''
        }]
      : elections

  return (
    <div className="space-y-6 p-4 md:p-0">
      <Link to="/k8s9d7f3-districts/state-house" className="inline-flex items-center gap-2 text-sm font-medium text-[#146c4f] hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to State Constituencies
      </Link>
      <Card className="border border-gray-100 shadow-md">
        <CardContent className="p-0">
          <div className="flex flex-col gap-4 border-b border-gray-100 p-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">State House Candidates</p>
                <h1 className="mt-1 text-2xl font-bold text-gray-900">{districtName}</h1>
                <p className="text-sm text-gray-500">{district?.state?.name ?? district?.lga_district?.state?.name ?? 'State not specified'}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <label className="space-y-1 text-xs font-medium text-gray-600">
                Election year
                <Input
                  aria-label="Search candidates by election year"
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter election year"
                  value={searchElectionYear}
                  onChange={(event) => setSearchElectionYear(event.target.value)}
                  className="h-9 min-w-36"
                />
              </label>
              <label className="space-y-1 text-xs font-medium text-gray-600">
                Political party (optional)
                <Input
                  aria-label="Filter candidates by political party name"
                  type="text"
                  placeholder="Enter party name"
                  value={searchPartyName}
                  onChange={(event) => setSearchPartyName(event.target.value)}
                  className="h-9 min-w-36"
                />
              </label>
              <Button type="button" size="sm" variant="outline" disabled={candidatesLoading} onClick={() => void searchCandidates()}>
                {candidatesLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="mr-2 h-4 w-4" /> Search</>}
              </Button>
              <Button type="button" size="sm" variant="outline" disabled={candidatesLoading} onClick={() => void clearCandidateSearch()}>
                <X className="mr-2 h-4 w-4" /> Show Active
              </Button>
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Matching Candidates</p>
                <p className="font-semibold text-[#146c4f]">{filteredCandidates.length} candidates</p>
              </div>
              <Button size="sm" onClick={() => void openAddDialog()}>
                <Plus className="mr-2 h-4 w-4" /> Add Candidate
              </Button>
            </div>
          </div>

          {error && <div role="alert" className="p-8 text-center text-sm text-red-600">{error}</div>}
          {dataError && <div role="alert" className="border-b border-amber-100 bg-amber-50/60 px-6 py-3 text-sm text-amber-800">{dataError}</div>}
          {candidatesError && <div role="alert" className="border-b border-red-100 bg-red-50 px-6 py-3 text-sm text-red-700">{candidatesError}</div>}
          {(loading || candidatesLoading) && (
            <div className="flex items-center justify-center gap-2 p-12 text-sm text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin text-[#146c4f]" />
              {candidatesLoading ? 'Searching candidates...' : 'Loading candidates...'}
            </div>
          )}
          {!loading && !candidatesLoading && !error && filteredCandidates.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              {appliedSearch ? 'No candidates found for the selected election and party.' : 'No active candidates found for this constituency and party.'}
            </div>
          )}
          {!loading && !candidatesLoading && !error && filteredCandidates.length > 0 && (
            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
              {paginatedCandidates.map((candidate) => {
                const photoUrl = getLogoUrl(candidate.image)
                const partyPhotoUrl = getPartyLogoValue(candidate.party)
                const partyName = candidate.party?.name ?? candidate.political_party ?? 'N/A'
                const election = candidate.election?.year
                  ? `${candidate.election.year}${candidate.election.details ? ` - ${candidate.election.details}` : ''}`
                  : candidate.election?.details ?? 'N/A'
                return (
                  <article key={`${candidate.assignment_id ?? candidate.id}-${candidate.election_id ?? ''}`} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-start justify-between gap-3 border-b border-gray-100 pb-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="h-12 w-12 border border-gray-200">
                          {photoUrl && <AvatarImage src={photoUrl} alt={candidate.full_name} className="object-cover" />}
                          <AvatarFallback className="bg-[#146c4f]/10 font-bold text-[#146c4f]">
                            {candidate.full_name?.charAt(0)?.toUpperCase() || 'C'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <h2 className="truncate font-bold text-gray-900">{candidate.full_name || 'Candidate'}</h2>
                          <p className="text-xs font-semibold text-[#146c4f]">{candidate.office_title || 'State House of Assembly Candidate'}</p>
                        </div>
                      </div>
                      <Button type="button" size="sm" variant="outline" onClick={() => openEditDialog(candidate)} disabled={!candidate.assignment_id}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl bg-gray-50 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Political Party</p>
                        <div className="mt-1 flex min-w-0 items-center gap-2">
                          <Avatar className="h-8 w-8 shrink-0 border border-gray-200 bg-white">
                            {partyPhotoUrl && <AvatarImage src={partyPhotoUrl} alt={`${partyName} logo`} className="object-contain p-0.5" />}
                            <AvatarFallback className="text-[10px] font-bold text-gray-500">{partyName.charAt(0)?.toUpperCase() || 'P'}</AvatarFallback>
                          </Avatar>
                          <p className="truncate font-semibold text-gray-800">{partyName}</p>
                        </div>
                      </div>
                      <div className="rounded-xl bg-gray-50 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Election</p>
                        <p className="truncate font-semibold text-gray-800">{election}</p>
                      </div>
                      <div className="rounded-xl bg-gray-50 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Phone</p>
                        <p className="truncate font-semibold text-gray-800">{candidate.phoneNo || 'N/A'}</p>
                      </div>
                      <div className="rounded-xl bg-gray-50 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Email</p>
                        <p className="truncate font-semibold text-gray-800">{candidate.email || 'N/A'}</p>
                      </div>
                    </div>
                    {candidate.manifesto && (
                      <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50/60 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Manifesto</p>
                        <p className="mt-1 line-clamp-3 text-sm text-amber-900">{candidate.manifesto}</p>
                      </div>
                    )}
                    <div className="mt-4 flex justify-end border-t border-gray-100 pt-3">
                      <Button type="button" size="sm" variant="destructive" onClick={() => {
                        setDeleteError('')
                        setDeletingCandidate(candidate)
                      }} disabled={!candidate.assignment_id}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </Button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
          {!loading && !candidatesLoading && !error && filteredCandidates.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                Showing {(candidatePage - 1) * candidatesPerPage + 1}–{Math.min(candidatePage * candidatesPerPage, filteredCandidates.length)} of {filteredCandidates.length} candidates
              </p>
              <div className="flex items-center gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => setCandidatePage((page) => Math.max(1, page - 1))} disabled={candidatePage === 1}>
                  <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                </Button>
                <span className="text-sm text-gray-600">Page {candidatePage} of {totalCandidatePages}</span>
                <Button type="button" size="sm" variant="outline" onClick={() => setCandidatePage((page) => Math.min(totalCandidatePages, page + 1))} disabled={candidatePage >= totalCandidatePages}>
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={handleAddDialogChange}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add State House of Assembly candidate</DialogTitle>
            <DialogDescription>
              {selectedCandidate
                ? 'Step 2 of 2: Review the verified candidate and complete the constituency assignment.'
                : 'Step 1 of 2: Select an election and verify the candidate registration.'}
            </DialogDescription>
          </DialogHeader>
          {!selectedCandidate ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="state-assembly-add-election" className="mb-1 block text-sm font-medium">Active election *</label>
                <select
                  id="state-assembly-add-election"
                  value={electionId}
                  disabled={isLoadingAddElections || activeAddElections.length === 0}
                  onChange={(event) => {
                    setElectionId(event.target.value)
                    setSelectedCandidate(null)
                    setCandidateSearchError('')
                    setFormError('')
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">
                    {isLoadingAddElections ? 'Loading active elections...' : 'Select active election'}
                  </option>
                  {activeAddElections.map((election) => (
                    <option key={election.id} value={election.id}>
                      {election.year}{election.details ? ` - ${election.details}` : ''}
                    </option>
                  ))}
                </select>
                {addElectionError && <p role="alert" className="mt-1 text-sm text-red-600">{addElectionError}</p>}
              </div>
              <label className="block space-y-1 text-sm font-medium">
                Candidate NIN or phone number *
                <div className="flex gap-2">
                  <Input
                    value={candidateSearch}
                    onChange={(event) => {
                      setCandidateSearch(event.target.value)
                      setCandidateSearchError('')
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        void verifyCandidate()
                      }
                    }}
                    placeholder="Enter candidate NIN or phone number"
                    className="flex-1"
                  />
                  <Button onClick={verifyCandidate} disabled={isVerifying || isLoadingAddElections || !electionId}>
                    {isVerifying ? 'Verifying...' : 'Verify'}
                  </Button>
                </div>
              </label>
              {candidateSearchError && <div role="alert" className="text-sm text-red-600">{candidateSearchError}</div>}
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => handleAddDialogChange(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="mb-3 flex items-center gap-3">
                  <Avatar className="h-14 w-14 border">
                    <AvatarImage src={getLogoUrl(selectedCandidate.image) ?? undefined} alt={selectedCandidate.full_name} />
                    <AvatarFallback>{selectedCandidate.full_name?.slice(0, 2).toUpperCase() || 'C'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{selectedCandidate.full_name}</p>
                    <p className="text-sm text-muted-foreground">Verified candidate</p>
                  </div>
                </div>
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <p><span className="font-medium">NIN:</span> {selectedCandidate.nin || 'N/A'}</p>
                  <p><span className="font-medium">Phone:</span> {selectedCandidate.phoneNo || 'N/A'}</p>
                  <p><span className="font-medium">Email:</span> {selectedCandidate.email || 'N/A'}</p>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Party:</span>
                    <Avatar className="h-6 w-6 border">
                      {getPartyLogoValue(selectedCandidate.party) && <AvatarImage src={getPartyLogoValue(selectedCandidate.party) ?? undefined} alt={`${selectedCandidate.party?.name || selectedCandidate.political_party || 'Party'} logo`} />}
                      <AvatarFallback className="text-[10px]">{(selectedCandidate.party?.name || selectedCandidate.political_party || 'P').slice(0, 1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span>{selectedCandidate.party?.name || selectedCandidate.political_party || 'Unknown party'}</span>
                  </div>
                  <p><span className="font-medium">Election:</span> {elections.find((election) => election.id === Number(electionId))?.year ?? electionId}</p>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Office *</label>
                <select
                  value={officeId}
                  onChange={(event) => setOfficeId(event.target.value)}
                  disabled={isLoadingOffices || offices.length === 0}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">{isLoadingOffices ? 'Loading offices...' : 'Select office'}</option>
                  {offices.map((office) => (
                    <option key={office.id} value={office.id}>{office.title}</option>
                  ))}
                </select>
                {officeLoadError && <p role="alert" className="mt-1 text-sm text-red-600">{officeLoadError}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Manifesto</label>
                <Textarea value={manifesto} onChange={(event) => setManifesto(event.target.value)} placeholder="Enter manifesto details" rows={4} />
              </div>
              {formError && <div role="alert" className="text-sm text-red-600">{formError}</div>}
              <div className="flex justify-between gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedCandidate(null)
                    setCandidateSearchError('')
                    setFormError('')
                  }}
                  disabled={isSaving}
                >
                  Back
                </Button>
                <Button onClick={saveMember} disabled={isSaving} className="bg-[#146c4f] hover:bg-[#10563f]">
                  {isSaving ? 'Saving...' : 'Add candidate'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingCandidate)} onOpenChange={(open) => !open && setEditingCandidate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit State Assembly candidate</DialogTitle>
            <DialogDescription>Update this candidate’s State House election assignment.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Candidate</label>
              <Input value={editingCandidate?.full_name ?? ''} disabled />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Office</label>
                <select
                  value={editData.office_id || ''}
                  onChange={(event) => setEditData((current) => ({ ...current, office_id: Number(event.target.value) }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select office</option>
                  {offices.map((office) => (
                    <option key={office.id} value={office.id}>{office.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Political Party</label>
                <Input value={editingCandidate?.party?.name || editingCandidate?.political_party || `Party ${editData.party_id}`} disabled />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Election</label>
                <select
                  value={String(editData.election_id || '')}
                  onChange={(event) => setEditData((current) => ({ ...current, election_id: Number(event.target.value) }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select election</option>
                  {editElections.map((election) => (
                    <option key={election.id} value={election.id}>{election.year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">State Constituency</label>
                <Input value={districtName} disabled />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Manifesto</label>
              <Textarea value={editData.manifesto} onChange={(event) => setEditData((current) => ({ ...current, manifesto: event.target.value }))} rows={4} />
            </div>
            {editError && <div className="text-sm text-red-600">{editError}</div>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingCandidate(null)}>Cancel</Button>
              <Button onClick={saveEdit} disabled={isUpdating} className="bg-[#146c4f] hover:bg-[#10563f]">
                {isUpdating ? 'Saving...' : 'Save changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deletingCandidate)} onOpenChange={(open) => !open && setDeletingCandidate(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete candidate</DialogTitle>
            <DialogDescription>Are you sure you want to remove this candidate from this State Assembly constituency?</DialogDescription>
          </DialogHeader>
          {deleteError && <div className="text-sm text-red-600">{deleteError}</div>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeletingCandidate(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deletingCandidate && removeCandidate(deletingCandidate)} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
