import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, MapPin, Pencil, Trash2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Candidate, candidateService } from '@/services/candidates'
import { District, districtsService } from '@/services/districts'
import { electionService, Election, SenateOffice } from '@/services/elections'
import { Party, partyService } from '@/services/parties'
import { getLogoUrl } from '@/lib/utils'

export default function FederalHouseCandidatesPage() {
  const { id } = useParams<{ id: string }>()
  const districtId = Number(id)
  const [district, setDistrict] = useState<District | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [candidatePage, setCandidatePage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState('')
  const [filterElectionYear, setFilterElectionYear] = useState('')
  const [filterPartyId, setFilterPartyId] = useState(0)
  const [appliedElectionId, setAppliedElectionId] = useState(0)
  const [appliedPartyId, setAppliedPartyId] = useState(0)
  const [searchRequest, setSearchRequest] = useState(0)

  // Add candidate dialog state
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [addStep, setAddStep] = useState<1 | 2>(1)
  const [candidateSearch, setCandidateSearch] = useState('')
  const [candidateSearchError, setCandidateSearchError] = useState('')
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [addForm, setAddForm] = useState({ office_id: 0, election_id: 0, party_id: 0, manifesto: '' })
  const [elections, setElections] = useState<Election[]>([])
  const [searchElections, setSearchElections] = useState<Election[]>([])
  const [parties, setParties] = useState<Party[]>([])
  const [officeOptions, setOfficeOptions] = useState<SenateOffice[]>([])
  const [candidateDirectory, setCandidateDirectory] = useState<Candidate[]>([])
  const [addError, setAddError] = useState('')
  const [metaError, setMetaError] = useState('')
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null)
  const [editForm, setEditForm] = useState({
    candidate_id: 0,
    office_id: 0,
    party_id: 0,
    election_id: 0,
    manifesto: ''
  })
  const [editError, setEditError] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [deletingCandidate, setDeletingCandidate] = useState<Candidate | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const candidatesPerPage = 4
  const totalCandidatePages = Math.max(1, Math.ceil(candidates.length / candidatesPerPage))
  const paginatedCandidates = candidates.slice(
    (candidatePage - 1) * candidatesPerPage,
    candidatePage * candidatesPerPage
  )

  useEffect(() => {
    setCandidatePage(1)
  }, [candidates])

  useEffect(() => {
    // Prefetch elections, offices and candidate directory
    let isCurrent = true
    const loadMeta = async () => {
      const [electionRes, allElectionRes, candidateRes, officesRes, partyRes] = await Promise.allSettled([
        electionService.getActiveElections(),
        electionService.getAllElections(),
        candidateService.getAllCandidates(),
        electionService.getFederalHouseOffices(),
        partyService.getAllParties()
      ])
      if (!isCurrent) return

      const errors: string[] = []
      if (electionRes.status === 'fulfilled') setElections(electionRes.value)
      else errors.push(electionRes.reason instanceof Error ? electionRes.reason.message : 'Unable to load elections.')

      if (allElectionRes.status === 'fulfilled') setSearchElections(allElectionRes.value)
      else errors.push(allElectionRes.reason instanceof Error ? allElectionRes.reason.message : 'Unable to load elections for search.')

      if (candidateRes.status === 'fulfilled') setCandidateDirectory(candidateRes.value)
      else errors.push(candidateRes.reason instanceof Error ? candidateRes.reason.message : 'Unable to load candidates.')

      if (officesRes.status === 'fulfilled') setOfficeOptions(officesRes.value)
      else errors.push(officesRes.reason instanceof Error ? officesRes.reason.message : 'Unable to load Federal House offices.')

      if (partyRes.status === 'fulfilled') setParties(partyRes.value)
      else errors.push(partyRes.reason instanceof Error ? partyRes.reason.message : 'Unable to load parties.')

      setMetaError(errors.join(' '))
    }

    void loadMeta()
    return () => { isCurrent = false }
  }, [])

  useEffect(() => {
    let isCurrent = true
    if (!Number.isInteger(districtId) || districtId <= 0) {
      setError('Invalid Federal Constituency.')
      setLoading(false)
      return
    }

    const loadPage = async () => {
      setLoading(true)
      setError('')
      try {
        const districts = await districtsService.getFederalHouseDistricts()
        const currentDistrict = districts.find((item) => item.id === districtId)
        if (!currentDistrict) throw new Error('Federal Constituency not found.')
        if (isCurrent) {
          setDistrict(currentDistrict)
        }
      } catch (loadError) {
        if (isCurrent) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load Federal House candidates.')
        }
      } finally {
        if (isCurrent) setLoading(false)
      }
    }

    void loadPage()
    return () => {
      isCurrent = false
    }
  }, [districtId])

  useEffect(() => {
    let isCurrent = true
    if (!Number.isInteger(districtId) || districtId <= 0) {
      return
    }

    const loadCandidates = async () => {
      setIsSearching(true)
      setError('')
      try {
        const results = appliedElectionId > 0
          ? await candidateService.getElectionFederalHouseCandidates(
            districtId,
            appliedElectionId,
            appliedPartyId > 0 ? appliedPartyId : undefined
          )
          : await candidateService.getActiveElectionFederalHouseCandidates(districtId)
        const filteredResults = appliedElectionId === 0 && appliedPartyId > 0
          ? results.filter((candidate) => Number(candidate.party_id) === appliedPartyId)
          : results
        if (isCurrent) setCandidates(filteredResults)
      } catch (loadError) {
        if (isCurrent) {
          setCandidates([])
          setError(loadError instanceof Error ? loadError.message : 'Unable to search Federal House candidates.')
        }
      } finally {
        if (isCurrent) setIsSearching(false)
      }
    }

    void loadCandidates()
    return () => {
      isCurrent = false
    }
  }, [districtId, appliedElectionId, appliedPartyId, searchRequest])

  // Helpers for add candidate dialog
  const verifyCandidate = async () => {
    setCandidateSearchError('')
    setSelectedCandidate(null)
    const query = candidateSearch.trim()
    if (!query) {
      setCandidateSearchError('Enter candidate NIN or phone to search')
      return
    }
    if (!addForm.election_id) {
      setCandidateSearchError('Select an election before verifying the candidate.')
      return
    }
    setIsVerifying(true)
    try {
      const normalizedQuery = query.replace(/\D/g, '')
      const found = candidateDirectory.find((c) =>
        (normalizedQuery.length > 0 && String(c.nin ?? '').replace(/\D/g, '') === normalizedQuery) ||
        (normalizedQuery.length > 0 && String(c.phoneNo ?? '').replace(/\D/g, '') === normalizedQuery)
      )
      if (!found) {
        throw new Error('No candidate found with that NIN or phone number.')
      }
      await electionService.checkCandidateRegistration({
        candidate_id: Number(found.id),
        election_id: Number(addForm.election_id)
      })
      setSelectedCandidate(found)
      setAddForm((s) => ({ ...s, party_id: found.party_id ?? s.party_id }))
      setAddStep(2)
    } catch (err) {
      setCandidateSearchError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setIsVerifying(false)
    }
  }

  const submitAddCandidate = async () => {
    setAddError('')
    if (!selectedCandidate) {
      setAddError('Please verify and select a candidate')
      return
    }
    if (!addForm.election_id || !addForm.office_id) {
      setAddError('Please select election and office')
      return
    }
    if (!selectedCandidate.party_id && !addForm.party_id) {
      setAddError('The verified candidate must have a political party assigned.')
      return
    }
    setIsSaving(true)
    try {
      await electionService.checkCandidateRegistration({
        candidate_id: Number(selectedCandidate.id),
        election_id: Number(addForm.election_id)
      })
      await candidateService.addFederalHouseCandidate({
        candidate_id: Number(selectedCandidate.id),
        office_id: Number(addForm.office_id),
        party_id: Number(addForm.party_id || selectedCandidate.party_id),
        election_id: Number(addForm.election_id),
        federal_house_district_id: districtId,
        manifesto: addForm.manifesto
      })
      const refreshed = await candidateService.getElectionFederalHouseCandidates(districtId, addForm.election_id)
      setCandidates(refreshed)
      const addedElectionYear = elections.find((election) => election.id === addForm.election_id)?.year
      setFilterElectionYear(String(addedElectionYear ?? ''))
      setAppliedElectionId(addForm.election_id)
      setFilterPartyId(0)
      setAppliedPartyId(0)
      setIsAddOpen(false)
      // reset form
      setCandidateSearch('')
      setSelectedCandidate(null)
      setAddForm({ office_id: 0, election_id: 0, party_id: 0, manifesto: '' })
      setAddStep(1)
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Unable to add candidate')
    } finally {
      setIsSaving(false)
    }
  }

  const openEditCandidate = (candidate: Candidate) => {
    if (!candidate.assignment_id || !Number.isInteger(candidate.assignment_id)) {
      setError('Unable to edit this candidate because the assignment ID is missing.')
      return
    }
    setEditingCandidate(candidate)
    setEditError('')
    setEditForm({
      candidate_id: Number(candidate.candidate_id ?? candidate.id),
      office_id: Number(candidate.office_id) || 0,
      party_id: Number(candidate.party_id) || 0,
      election_id: Number(candidate.election_id ?? candidate.election?.id) || 0,
      manifesto: candidate.manifesto ?? ''
    })
  }

  const submitEditCandidate = async () => {
    if (!editingCandidate?.assignment_id) return
    if (!editForm.candidate_id || !editForm.office_id || !editForm.party_id || !editForm.election_id) {
      setEditError('Candidate, office, party, and election are required.')
      return
    }

    setIsUpdating(true)
    setEditError('')
    try {
      await candidateService.updateFederalHouseCandidate(editingCandidate.assignment_id, {
        ...editForm,
        federal_house_district_id: districtId
      })
      const updatedCandidates = appliedElectionId > 0
        ? await candidateService.getElectionFederalHouseCandidates(
          districtId,
          appliedElectionId,
          appliedPartyId > 0 ? appliedPartyId : undefined
        )
        : await candidateService.getActiveElectionFederalHouseCandidates(districtId)
      setCandidates(updatedCandidates)
      setEditingCandidate(null)
    } catch (updateError) {
      setEditError(updateError instanceof Error ? updateError.message : 'Unable to update Federal House candidate.')
    } finally {
      setIsUpdating(false)
    }
  }

  const removeFederalHouseCandidate = async () => {
    const assignmentId = Number(deletingCandidate?.assignment_id)
    if (!Number.isInteger(assignmentId) || assignmentId <= 0) {
      setDeleteError('This Federal House assignment does not have a valid record ID.')
      return
    }

    setIsDeleting(true)
    setDeleteError('')
    try {
      await candidateService.removeFederalHouseCandidate(assignmentId)
      const refreshedCandidates = appliedElectionId > 0
        ? await candidateService.getElectionFederalHouseCandidates(
          districtId,
          appliedElectionId,
          appliedPartyId > 0 ? appliedPartyId : undefined
        )
        : await candidateService.getActiveElectionFederalHouseCandidates(districtId)
      const filteredCandidates = appliedElectionId === 0 && appliedPartyId > 0
        ? refreshedCandidates.filter((candidate) => Number(candidate.party_id) === appliedPartyId)
        : refreshedCandidates
      setCandidates(filteredCandidates)
      setDeletingCandidate(null)
    } catch (removeError) {
      setDeleteError(removeError instanceof Error ? removeError.message : 'Unable to remove Federal House candidate.')
    } finally {
      setIsDeleting(false)
    }
  }

  const editCandidateOptions = [...candidateDirectory, ...(editingCandidate ? [editingCandidate] : [])]
    .filter((candidate, index, all) => all.findIndex((item) => item.id === candidate.id) === index)
  const editElectionOptions = [...elections, ...searchElections]
    .filter((election, index, all) => all.findIndex((item) => item.id === election.id) === index)

  const searchCandidates = () => {
    const year = filterElectionYear.trim()
    if (!year) {
      setError('')
      setAppliedElectionId(0)
      setAppliedPartyId(filterPartyId)
      setSearchRequest((request) => request + 1)
      return
    }

    const matchingElection = searchElections.find((election) => String(election.year).trim() === year)
    if (!matchingElection) {
      setCandidates([])
      setError(`No election was found for the year ${year}.`)
      return
    }

    setError('')
    setAppliedElectionId(Number(matchingElection.id))
    setAppliedPartyId(filterPartyId)
    setSearchRequest((request) => request + 1)
  }

  return (
    <div className="space-y-6 p-4 md:p-0">
      <Link to="/k8s9d7f3-districts/federal" className="inline-flex items-center gap-2 text-sm font-medium text-[#146c4f] hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to Federal Constituencies
      </Link>
      <Card className="border border-gray-100 shadow-md">
        <CardContent className="p-0">
          <div className="flex flex-col gap-4 border-b border-gray-100 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Federal House Candidates</p>
                <h1 className="mt-1 text-2xl font-bold text-gray-900">{district?.name ?? 'Federal Constituency'}</h1>
                <p className="text-sm text-gray-500">{district?.state?.name ?? 'State not specified'}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Input
                aria-label="Filter by election year"
                className="h-9 w-36"
                inputMode="numeric"
                placeholder="Election year"
                value={filterElectionYear}
                onChange={(event) => setFilterElectionYear(event.target.value)}
              />
              <select
                aria-label="Filter by political party"
                className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm"
                value={filterPartyId}
                onChange={(event) => setFilterPartyId(Number(event.target.value))}
              >
                <option value={0}>All parties</option>
                {parties.map((party) => (
                  <option key={party.id} value={party.id}>{party.name}</option>
                ))}
              </select>
              <Button
                size="sm"
                variant="outline"
                disabled={isSearching}
                onClick={searchCandidates}
              >
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : filterElectionYear.trim() ? 'Search' : 'Show Active'}
              </Button>
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Matching Candidates</p>
                <p className="font-semibold text-[#146c4f]">{candidates.length} candidates</p>
              </div>

              <Button size="sm" variant="outline" onClick={() => {
                setAddStep(1)
                setSelectedCandidate(null)
                setCandidateSearch('')
                setCandidateSearchError('')
                setAddError('')
                setIsAddOpen(true)
              }}>
                Add Candidate
              </Button>

            </div>
          </div>
          {(loading || isSearching) && (
            <div className="flex items-center justify-center gap-2 p-12 text-sm text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin text-[#146c4f]" /> {isSearching ? 'Searching candidates...' : 'Loading candidates...'}
            </div>
          )}
          {!loading && !isSearching && error && <div role="alert" className="p-8 text-center text-sm text-red-600">{error}</div>}
          {!loading && !isSearching && !error && candidates.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              {appliedElectionId
                ? 'No candidates found for the selected election and party.'
                : 'No active candidates found for this constituency and party.'}
            </div>
          )}
          {!loading && !isSearching && !error && candidates.length > 0 && (
            <div className="grid gap-4 p-6 grid-cols-1 md:grid-cols-2">
              {paginatedCandidates.map((candidate) => {
                const photoUrl = getLogoUrl(candidate.image)
                const partyPhotoUrl = getLogoUrl(
                  candidate.party?.logopath
                    ?? candidate.party?.logo_path
                    ?? candidate.party?.logo_url
                    ?? candidate.party?.image_url
                    ?? candidate.party?.image_path
                    ?? candidate.party?.logo
                )
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
                            {candidate.full_name.charAt(0)?.toUpperCase() || 'C'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <h2 className="truncate font-bold text-gray-900">{candidate.full_name || 'Candidate'}</h2>
                          <p className="text-xs font-semibold text-[#146c4f]">{candidate.office_title || 'Federal House Representative'}</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => openEditCandidate(candidate)}
                        disabled={!candidate.assignment_id}
                      >
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl bg-gray-50 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Political Party</p>
                        <div className="mt-1 flex min-w-0 items-center gap-2">
                          <Avatar className="h-8 w-8 shrink-0 border border-gray-200 bg-white">
                            {partyPhotoUrl && <AvatarImage src={partyPhotoUrl} alt={`${partyName} logo`} className="object-contain p-0.5" />}
                            <AvatarFallback className="text-[10px] font-bold text-gray-500">
                              {partyName.charAt(0)?.toUpperCase() || 'P'}
                            </AvatarFallback>
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
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setDeleteError('')
                          setDeletingCandidate(candidate)
                        }}
                        disabled={!candidate.assignment_id}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </Button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
          {!loading && !isSearching && !error && candidates.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                Showing {(candidatePage - 1) * candidatesPerPage + 1}–{Math.min(candidatePage * candidatesPerPage, candidates.length)} of {candidates.length} candidates
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setCandidatePage((page) => Math.max(1, page - 1))}
                  disabled={candidatePage === 1}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                </Button>
                <span className="text-sm text-gray-600">Page {candidatePage} of {totalCandidatePages}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setCandidatePage((page) => Math.min(totalCandidatePages, page + 1))}
                  disabled={candidatePage >= totalCandidatePages}
                >
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={(open) => {
        setIsAddOpen(open)
        if (!open) {
          setAddStep(1)
          setSelectedCandidate(null)
          setCandidateSearchError('')
          setAddError('')
        }
      }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Federal House Candidate</DialogTitle>
            <DialogDescription>
              {addStep === 1
                ? 'Verify the candidate’s registration for an election to continue.'
                : 'Review the verified candidate and complete the Federal House assignment.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 p-2">
            {addStep === 1 ? (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium">Election</label>
                  <select className="w-full rounded-md border px-3 py-2" value={addForm.election_id} onChange={(e) => {
                    setAddForm((s) => ({ ...s, election_id: Number(e.target.value) }))
                    setSelectedCandidate(null)
                    setCandidateSearchError('')
                  }}>
                    <option value={0}>Select election</option>
                    {elections.map((el) => (
                      <option key={el.id} value={el.id}>{el.year} - {el.details}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Candidate NIN or phone number</label>
                  <div className="flex gap-2">
                    <Input value={candidateSearch} onChange={(e) => {
                      setCandidateSearch(e.target.value)
                      setSelectedCandidate(null)
                      setCandidateSearchError('')
                    }} placeholder="Enter NIN or phone" />
                    <Button onClick={verifyCandidate} disabled={isVerifying}>
                      {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
                    </Button>
                  </div>
                  {candidateSearchError && <p className="mt-1 text-xs text-red-600">{candidateSearchError}</p>}
                </div>
                {metaError && <p className="text-sm text-red-600">{metaError}</p>}
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                </div>
              </>
            ) : (
              <>
                {selectedCandidate && (
                  <div className="rounded-lg border p-4">
                    <div className="mb-3 flex items-center gap-3">
                      <Avatar className="h-12 w-12 border">
                        {(() => {
                          const img = selectedCandidate.image
                          const photoUrl = typeof img === 'string' ? img : img && ((img as any).image_path ?? (img as any).image_url ?? (img as any).path ?? (img as any).url)
                          return photoUrl ? <AvatarImage src={photoUrl as string} alt={selectedCandidate.full_name} /> : null
                        })()}
                        <AvatarFallback>{selectedCandidate.full_name?.charAt(0)?.toUpperCase() || 'C'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold">{selectedCandidate.full_name}</p>
                        <p className="text-sm text-green-700">Registration verified</p>
                      </div>
                    </div>
                    <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                      <div><dt className="text-gray-500">NIN</dt><dd className="font-medium">{selectedCandidate.nin || 'N/A'}</dd></div>
                      <div><dt className="text-gray-500">Phone</dt><dd className="font-medium">{selectedCandidate.phoneNo || 'N/A'}</dd></div>
                      <div><dt className="text-gray-500">Email</dt><dd className="font-medium">{selectedCandidate.email || 'N/A'}</dd></div>
                      <div><dt className="text-gray-500">Political Party</dt><dd className="font-medium">{selectedCandidate.party?.name || selectedCandidate.party_id || 'N/A'}</dd></div>
                    </dl>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Office</label>
                    <select className="w-full rounded-md border px-3 py-2" value={addForm.office_id} onChange={(e) => setAddForm((s) => ({ ...s, office_id: Number(e.target.value) }))}>
                      <option value={0}>Select office</option>
                      {officeOptions.map((o) => (
                        <option key={o.id} value={o.id}>{o.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Manifesto (optional)</label>
                    <textarea className="w-full rounded-md border px-3 py-2" rows={3} value={addForm.manifesto} onChange={(e) => setAddForm((s) => ({ ...s, manifesto: e.target.value }))} />
                  </div>
                </div>
                {metaError && <p className="text-sm text-red-600">{metaError}</p>}
                {addError && <p className="text-sm text-red-600">{addError}</p>}
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => {
                    setAddStep(1)
                    setSelectedCandidate(null)
                    setAddError('')
                  }}>Back</Button>
                  <Button onClick={submitAddCandidate} disabled={isSaving || !selectedCandidate}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Candidate'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editingCandidate !== null} onOpenChange={(open) => {
        if (!open && !isUpdating) {
          setEditingCandidate(null)
          setEditError('')
        }
      }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Federal House Candidate</DialogTitle>
            <DialogDescription>Update this candidate’s Federal House election assignment.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Candidate</label>
              <select
                className="w-full rounded-md border bg-gray-100 px-3 py-2 text-gray-500 disabled:cursor-not-allowed"
                value={editForm.candidate_id}
                disabled
              >
                <option value={0}>Select candidate</option>
                {editCandidateOptions.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>{candidate.full_name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Office</label>
                <select
                  className="w-full rounded-md border px-3 py-2"
                  value={editForm.office_id}
                  onChange={(event) => setEditForm((form) => ({ ...form, office_id: Number(event.target.value) }))}
                >
                  <option value={0}>Select office</option>
                  {officeOptions.map((office) => (
                    <option key={office.id} value={office.id}>{office.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Political Party</label>
                <select
                  className="w-full rounded-md border bg-gray-100 px-3 py-2 text-gray-500 disabled:cursor-not-allowed"
                  value={editForm.party_id}
                  disabled
                >
                  <option value={0}>Select party</option>
                  {editingCandidate?.party_id && !parties.some((party) => party.id === editingCandidate.party_id) && (
                    <option value={editingCandidate.party_id}>
                      {editingCandidate.party?.name || editingCandidate.political_party || `Party ${editingCandidate.party_id}`}
                    </option>
                  )}
                  {parties.map((party) => (
                    <option key={party.id} value={party.id}>{party.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Election</label>
                <select
                  className="w-full rounded-md border px-3 py-2"
                  value={editForm.election_id}
                  onChange={(event) => setEditForm((form) => ({ ...form, election_id: Number(event.target.value) }))}
                >
                  <option value={0}>Select election</option>
                  {editElectionOptions.map((election) => (
                    <option key={election.id} value={election.id}>{election.year} - {election.details}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Manifesto</label>
              <textarea
                className="w-full rounded-md border px-3 py-2"
                rows={4}
                value={editForm.manifesto}
                onChange={(event) => setEditForm((form) => ({ ...form, manifesto: event.target.value }))}
              />
            </div>
            {editError && <p role="alert" className="text-sm text-red-600">{editError}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setEditingCandidate(null)} disabled={isUpdating}>Cancel</Button>
              <Button type="button" onClick={submitEditCandidate} disabled={isUpdating}>
                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
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
            <DialogTitle>Delete Federal House Candidate</DialogTitle>
            <DialogDescription>
              Remove {deletingCandidate?.full_name || 'this candidate'} from this Federal House assignment? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteError && <p role="alert" className="text-sm text-red-600">{deleteError}</p>}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setDeletingCandidate(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={removeFederalHouseCandidate} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete Candidate'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
