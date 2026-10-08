import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Ban, Loader2, MapPin, Pencil, Plus, Trash2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ElectedLeader, leadersService, UpdateElectedHouseOfRepMemberData } from '@/services/leaders'
import { District, districtsService } from '@/services/districts'
import { electionService, Election, StateOffice } from '@/services/elections'
import { candidateService, Candidate } from '@/services/candidates'
import { getLogoUrl } from '@/lib/utils'

export default function ElectedStateAssemblyPage() {
  const { id } = useParams<{ id: string }>()
  const districtId = Number(id)
  const [district, setDistrict] = useState<District | null>(null)
  const [members, setMembers] = useState<ElectedLeader[]>([])
  const [candidateDirectory, setCandidateDirectory] = useState<Candidate[]>([])
  const [elections, setElections] = useState<Election[]>([])
  const [activeAddElections, setActiveAddElections] = useState<Election[]>([])
  const [offices, setOffices] = useState<StateOffice[]>([])
  const [loading, setLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [searchElectionYear, setSearchElectionYear] = useState('')
  const [displayedElectionYear, setDisplayedElectionYear] = useState('')
  const [searchError, setSearchError] = useState('')
  const [error, setError] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [addStep, setAddStep] = useState<1 | 2>(1)
  const [isLoadingActiveElections, setIsLoadingActiveElections] = useState(false)
  const [activeElectionError, setActiveElectionError] = useState('')
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [candidateSearch, setCandidateSearch] = useState('')
  const [candidateSearchError, setCandidateSearchError] = useState('')
  const [electionId, setElectionId] = useState('')
  const [officeId, setOfficeId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [tenure, setTenure] = useState('')
  const [remark, setRemark] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [editingMember, setEditingMember] = useState<ElectedLeader | null>(null)
  const [editData, setEditData] = useState<UpdateElectedHouseOfRepMemberData>({
    candidate_id: 0,
    office_id: 0,
    party_id: 0,
    election_id: 0,
    federal_house_district_id: districtId,
    start_date: '',
    end_date: '',
    tenure: '',
    remark: ''
  })
  const [isUpdating, setIsUpdating] = useState(false)
  const [editError, setEditError] = useState('')
  const [deletingMember, setDeletingMember] = useState<ElectedLeader | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [terminatingMember, setTerminatingMember] = useState<ElectedLeader | null>(null)
  const [isTerminating, setIsTerminating] = useState(false)
  const [terminateError, setTerminateError] = useState('')

  useEffect(() => {
    let isCurrent = true
    if (!Number.isInteger(districtId) || districtId <= 0) {
      setError('Invalid State Constituency.')
      setLoading(false)
      return
    }

    const loadPage = async () => {
      setLoading(true)
      setError('')
      try {
        const [districts, activeMembers] = await Promise.all([
          districtsService.getStateHouseDistricts(true),
          leadersService.getActiveElectedStateAssemblyMembers(districtId)
        ])
        const currentDistrict = districts.find((item) => item.id === districtId)
        if (!currentDistrict) throw new Error('State Constituency not found.')
        if (isCurrent) {
          setDistrict(currentDistrict)
          setMembers(activeMembers)
        }
      } catch (loadError) {
        if (isCurrent) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load elected State Assembly members.')
        }
      } finally {
        if (isCurrent) setLoading(false)
      }
    }

    void loadPage()
    return () => { isCurrent = false }
  }, [districtId])

  useEffect(() => {
    let isCurrent = true
    const loadMeta = async () => {
      const [candidateRes, electionsRes, officesRes] = await Promise.allSettled([
        candidateService.getAllCandidates(),
        electionService.getAllElections(),
        electionService.getStateAssemblyOffices()
      ])
      if (!isCurrent) return
      if (candidateRes.status === 'fulfilled') setCandidateDirectory(candidateRes.value)
      if (electionsRes.status === 'fulfilled') {
        setElections(electionsRes.value)
        setElectionId((current) => current || String(electionsRes.value[0]?.id ?? ''))
      }
      if (officesRes.status === 'fulfilled') setOffices(officesRes.value)
    }
    void loadMeta()
    return () => { isCurrent = false }
  }, [])

  const normalizeCandidateIdentifier = (value: string | number | undefined) =>
    String(value ?? '').toLowerCase().replace(/[\s()+-]/g, '')

  const getDisplayedMembers = async () => {
    if (displayedElectionYear) {
      const election = elections.find((item) => String(item.year).trim() === displayedElectionYear)
      if (!election) throw new Error(`No election was found for the year ${displayedElectionYear}.`)
      return leadersService.getElectedStateAssemblyMembers(districtId, election.id)
    }
    return leadersService.getActiveElectedStateAssemblyMembers(districtId)
  }

  const searchElectedMembers = async () => {
    const year = searchElectionYear.trim()
    if (!year) {
      setSearchError('Enter an election year to search elected members.')
      return
    }

    const election = elections.find((item) => String(item.year).trim() === year)
    if (!election) {
      setSearchError(`No election was found for the year ${year}.`)
      return
    }

    setIsSearching(true)
    setSearchError('')
    try {
      const results = await leadersService.getElectedStateAssemblyMembers(districtId, election.id)
      setMembers(results)
      setDisplayedElectionYear(year)
    } catch (searchFailure) {
      setSearchError(searchFailure instanceof Error ? searchFailure.message : 'Unable to search elected State Assembly members.')
    } finally {
      setIsSearching(false)
    }
  }

  const showActiveMembers = async () => {
    setIsSearching(true)
    setSearchError('')
    setSearchElectionYear('')
    try {
      setMembers(await leadersService.getActiveElectedStateAssemblyMembers(districtId))
      setDisplayedElectionYear('')
    } catch (loadError) {
      setSearchError(loadError instanceof Error ? loadError.message : 'Unable to load active elected State Assembly members.')
    } finally {
      setIsSearching(false)
    }
  }

  const openAddDialog = () => {
    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    setStartDate(today)
    setEndDate(today)
    setTenure('')
    setRemark('')
    setCandidateSearch('')
    setCandidateSearchError('')
    setFormError('')
    setSelectedCandidate(null)
    setAddStep(1)
    setActiveElectionError('')
    setIsAddOpen(true)
    setIsLoadingActiveElections(true)
    electionService.getActiveElections()
      .then((activeElections) => {
        setActiveAddElections(activeElections)
        setElectionId(String(activeElections[0]?.id ?? ''))
        if (activeElections.length === 0) {
          setActiveElectionError('There are no active elections available.')
        }
      })
      .catch((loadError: unknown) => {
        setActiveAddElections([])
        setActiveElectionError(loadError instanceof Error ? loadError.message : 'Unable to load active elections.')
      })
      .finally(() => setIsLoadingActiveElections(false))
  }

  const verifyCandidate = async () => {
    const identifier = normalizeCandidateIdentifier(candidateSearch.trim())
    setCandidateSearchError('')
    setSelectedCandidate(null)
    if (!identifier) {
      setCandidateSearchError('Enter the candidate NIN or phone number.')
      return
    }
    if (!electionId) {
      setCandidateSearchError('Select an election before verifying the candidate.')
      return
    }

    setIsVerifying(true)
    try {
      const candidate = candidateDirectory.find((item) =>
        normalizeCandidateIdentifier(item.nin) === identifier ||
        normalizeCandidateIdentifier(item.phoneNo) === identifier
      )
      if (!candidate) throw new Error('No candidate found with that NIN or phone number.')
      const registration = await leadersService.checkLeadershipRegistration({
        candidate_id: Number(candidate.id),
        election_id: Number(electionId)
      })
      if (!registration.can_register) {
        throw new Error(registration.message || 'This candidate is already assigned to a leadership position for this election.')
      }
      if (!candidate.party_id) {
        throw new Error('The verified candidate must have a political party assigned.')
      }
      setSelectedCandidate(candidate)
      setAddStep(2)
    } catch (verificationError) {
      setCandidateSearchError(verificationError instanceof Error ? verificationError.message : 'Candidate verification failed.')
    } finally {
      setIsVerifying(false)
    }
  }

  const saveMember = async () => {
    if (!selectedCandidate) {
      setFormError('Select and verify a candidate first.')
      return
    }
    if (!officeId || !electionId || !startDate || !endDate || !tenure.trim()) {
      setFormError('Office, election, start date, end date, and tenure are required.')
      return
    }
    if (endDate < startDate) {
      setFormError('End date must be on or after the start date.')
      return
    }

    setIsSaving(true)
    setFormError('')
    try {
      const registration = await leadersService.checkLeadershipRegistration({
        candidate_id: Number(selectedCandidate.id),
        election_id: Number(electionId)
      })
      if (!registration.can_register) {
        throw new Error(registration.message || 'This candidate is already assigned to a leadership position for this election.')
      }
      const createdMember = await leadersService.addElectedStateAssemblyMember({
        candidate_id: Number(selectedCandidate.id),
        office_id: Number(officeId),
        party_id: Number(selectedCandidate.party_id),
        election_id: Number(electionId),
        state_house_district_id: districtId,
        start_date: startDate,
        end_date: endDate,
        tenure: tenure.trim(),
        remark: remark.trim()
      })
      const yearElection = elections.find((item) => String(item.year).trim() === displayedElectionYear)
      if (!displayedElectionYear || Number(yearElection?.id) === Number(electionId)) {
        setMembers((current) => [{
          ...createdMember,
          id: createdMember.id ?? `${selectedCandidate.id}-${electionId}`,
          name: createdMember.name || selectedCandidate.full_name,
          position: createdMember.position || 'State House of Assembly Member',
          candidateId: createdMember.candidateId ?? selectedCandidate.id,
          candidatePhoto: createdMember.candidatePhoto ?? selectedCandidate.image,
          candidatePhone: createdMember.candidatePhone ?? selectedCandidate.phoneNo,
          candidateEmail: createdMember.candidateEmail ?? selectedCandidate.email,
          partyName: createdMember.partyName || selectedCandidate.political_party || selectedCandidate.party?.name
        }, ...current])
      }
      setIsAddOpen(false)
      setSelectedCandidate(null)
      setCandidateSearch('')
      setOfficeId('')
      setStartDate('')
      setEndDate('')
      setTenure('')
      setRemark('')
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : 'Unable to add elected member.')
    } finally {
      setIsSaving(false)
    }
  }

  const openEditDialog = (member: ElectedLeader) => {
    setEditingMember(member)
    setEditData({
      candidate_id: Number(member.candidateId ?? 0),
      office_id: Number(member.office_id ?? 0),
      party_id: Number(member.party_id ?? 0),
      election_id: Number(member.election_id ?? 0),
      federal_house_district_id: districtId,
      start_date: member.start_date ?? '',
      end_date: member.end_date ?? '',
      tenure: member.tenure ?? '',
      remark: member.remark ?? ''
    })
    setEditError('')
  }

  const saveEdit = async () => {
    if (!editingMember) return
    setIsUpdating(true)
    setEditError('')
    try {
      await leadersService.updateElectedHouseOfRepMember(Number(editingMember.id), editData)
      const refreshed = await getDisplayedMembers()
      setMembers(refreshed)
      setEditingMember(null)
    } catch (saveError) {
      setEditError(saveError instanceof Error ? saveError.message : 'Unable to update elected member.')
    } finally {
      setIsUpdating(false)
    }
  }

  const removeMember = async (member: ElectedLeader) => {
    if (!member.id) return
    setDeleteError('')
    setIsDeleting(true)
    try {
      await leadersService.removeElectedStateAssemblyMember(Number(member.id))
      const refreshed = await getDisplayedMembers()
      setMembers(refreshed)
      setDeletingMember(null)
    } catch (deleteError) {
      setDeleteError(deleteError instanceof Error ? deleteError.message : 'Unable to remove elected member.')
    } finally {
      setIsDeleting(false)
    }
  }

  const terminateMember = async (member: ElectedLeader) => {
    const memberId = Number(member.id)
    if (!Number.isInteger(memberId) || memberId <= 0) {
      setTerminateError('This elected-member record does not have a valid ID.')
      return
    }

    setIsTerminating(true)
    setTerminateError('')
    try {
      await leadersService.terminateElectedStateAssemblyMember(memberId)
      setMembers((current) => displayedElectionYear
        ? current.map((item) => Number(item.id) === memberId ? { ...item, status: 'Terminated' } : item)
        : current.filter((item) => Number(item.id) !== memberId))
      setTerminatingMember(null)
    } catch (terminationError) {
      setTerminateError(terminationError instanceof Error ? terminationError.message : 'Unable to terminate elected State Assembly member.')
    } finally {
      setIsTerminating(false)
    }
  }

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
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Elected State House Member</p>
                <h1 className="mt-1 text-2xl font-bold text-gray-900">{district?.name ?? 'State Constituency'}</h1>
                <p className="text-sm text-gray-500">{district?.state?.name ?? district?.lga_district?.state?.name ?? 'State not specified'}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Members</p>
                <p className="font-semibold text-[#146c4f]">{members.length} elected</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  aria-label="Enter election year to search elected members"
                  className="h-9 w-36"
                  type="number"
                  inputMode="numeric"
                  placeholder="Election year"
                  value={searchElectionYear}
                  onChange={(event) => {
                    setSearchElectionYear(event.target.value)
                    setSearchError('')
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      void searchElectedMembers()
                    }
                  }}
                  disabled={isSearching}
                />
                <Button type="button" size="sm" variant="outline" onClick={searchElectedMembers} disabled={isSearching}>
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={showActiveMembers} disabled={isSearching}>
                  Show Active
                </Button>
              </div>
              <Button type="button" size="sm" className="bg-[#146c4f] hover:bg-[#10563f]" onClick={openAddDialog}>
                <Plus className="mr-2 h-4 w-4" /> Add Elected Member
              </Button>
            </div>
          </div>
          {searchError && <div role="alert" className="px-6 pt-4 text-sm text-red-600">{searchError}</div>}
          {loading && (
            <div className="flex items-center justify-center gap-2 p-12 text-sm text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin text-[#146c4f]" /> Loading elected members...
            </div>
          )}
          {isSearching && !loading && (
            <div className="flex items-center justify-center gap-2 p-6 text-sm text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin text-[#146c4f]" /> Searching elected members...
            </div>
          )}
          {!loading && error && <div role="alert" className="p-8 text-center text-sm text-red-600">{error}</div>}
          {!loading && !isSearching && !error && members.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              {displayedElectionYear
                ? `No elected members found for ${displayedElectionYear} in this constituency.`
                : 'No active elected members found for this constituency.'}
            </div>
          )}
          {!loading && !isSearching && !error && members.length > 0 && (
            <div className="grid w-full grid-cols-1 gap-4 p-6">
              {members.map((member) => {
                const name = member.name || 'Elected Member'
                const photoUrl = getLogoUrl(member.candidatePhoto)
                const partyName = member.party?.name ?? member.partyName ?? 'N/A'
                const partyPhotoUrl = getLogoUrl(member.partyLogo)
                const election = member.election?.year
                  ? `${member.election.year}${member.election.details ? ` - ${member.election.details}` : ''}`
                  : member.election?.details ?? 'N/A'
                return (
                  <article key={`${member.id}-${member.position}`} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="h-12 w-12 border border-gray-200">
                          {photoUrl && <AvatarImage src={photoUrl} alt={name} className="object-cover" />}
                          <AvatarFallback className="bg-[#146c4f]/10 font-bold text-[#146c4f]">{name.charAt(0)?.toUpperCase() || 'E'}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <h2 className="truncate font-bold text-gray-900">{name}</h2>
                          <p className="text-xs font-semibold text-[#146c4f]">{member.position || 'State House of Assembly Member'}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
                          {member.status || 'Active'}
                        </span>
                        <Button type="button" size="sm" variant="outline" onClick={() => openEditDialog(member)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setTerminateError('')
                            setTerminatingMember(member)
                          }}
                          disabled={!Number.isInteger(Number(member.id)) || Number(member.id) <= 0}
                        >
                          <Ban className="mr-2 h-4 w-4" /> Terminate
                        </Button>
                        <Button type="button" size="sm" variant="destructive" onClick={() => setDeletingMember(member)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </Button>
                      </div>
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
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Tenure</p>
                        <p className="truncate font-semibold text-gray-800">{member.tenure || 'N/A'}</p>
                      </div>
                      <div className="rounded-xl bg-gray-50 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Start / End</p>
                        <p className="truncate font-semibold text-gray-800">{member.start_date || 'N/A'} / {member.end_date || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-3 rounded-xl border border-gray-100 p-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">NIN</p>
                        <p className="truncate font-semibold text-gray-800">{member.candidateNin || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Phone</p>
                        <p className="truncate font-semibold text-gray-800">{member.candidatePhone || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Email</p>
                        <p className="truncate font-semibold text-gray-800">{member.candidateEmail || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">State</p>
                        <p className="truncate font-semibold text-gray-800">{member.stateName || district?.state?.name || 'N/A'}</p>
                      </div>
                    </div>
                    {member.remark && (
                      <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50/60 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Remark</p>
                        <p className="mt-1 line-clamp-3 text-sm text-amber-900">{member.remark}</p>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={(open) => {
        setIsAddOpen(open)
        if (!open && !isSaving) {
          setAddStep(1)
          setSelectedCandidate(null)
          setCandidateSearch('')
          setCandidateSearchError('')
          setFormError('')
          setActiveElectionError('')
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add elected State House member</DialogTitle>
            <DialogDescription>
              {addStep === 1
                ? 'Step 1 of 2: Choose an active election and verify the candidate.'
                : 'Step 2 of 2: Review the verified candidate and complete the State House assignment.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {addStep === 1 ? (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium">Active election *</label>
                  <select
                    value={electionId}
                    disabled={isLoadingActiveElections || activeAddElections.length === 0}
                    onChange={(event) => {
                      setElectionId(event.target.value)
                      setSelectedCandidate(null)
                      setCandidateSearchError('')
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="">{isLoadingActiveElections ? 'Loading active elections...' : 'Select active election'}</option>
                    {activeAddElections.map((election) => (
                      <option key={election.id} value={election.id}>
                        {election.year}{election.details ? ` - ${election.details}` : ''}
                      </option>
                    ))}
                  </select>
                  {activeElectionError && <p role="alert" className="mt-1 text-sm text-red-600">{activeElectionError}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Candidate NIN or phone number *</label>
                  <div className="flex gap-2">
                    <Input
                      value={candidateSearch}
                      onChange={(event) => {
                        setCandidateSearch(event.target.value)
                        setSelectedCandidate(null)
                        setCandidateSearchError('')
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          void verifyCandidate()
                        }
                      }}
                      placeholder="Enter candidate NIN or phone number"
                    />
                    <Button onClick={verifyCandidate} disabled={isVerifying || isLoadingActiveElections || !electionId}>
                      {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
                    </Button>
                  </div>
                  {candidateSearchError && <p role="alert" className="mt-1 text-sm text-red-600">{candidateSearchError}</p>}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddOpen(false)} disabled={isSaving}>Cancel</Button>
                </div>
              </>
            ) : selectedCandidate && (
              <>
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <Avatar className="h-12 w-12 border">
                      {getLogoUrl(selectedCandidate.image) && <AvatarImage src={getLogoUrl(selectedCandidate.image) ?? undefined} alt={selectedCandidate.full_name} />}
                      <AvatarFallback>{selectedCandidate.full_name?.charAt(0)?.toUpperCase() || 'C'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{selectedCandidate.full_name}</p>
                      <p className="text-sm text-green-700">Leadership eligibility verified</p>
                    </div>
                  </div>
                  <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                    <div><dt className="text-gray-500">NIN</dt><dd className="font-medium">{selectedCandidate.nin || 'N/A'}</dd></div>
                    <div><dt className="text-gray-500">Phone</dt><dd className="font-medium">{selectedCandidate.phoneNo || 'N/A'}</dd></div>
                    <div><dt className="text-gray-500">Email</dt><dd className="font-medium">{selectedCandidate.email || 'N/A'}</dd></div>
                    <div><dt className="text-gray-500">Political party</dt><dd className="font-medium">{selectedCandidate.party?.name || selectedCandidate.political_party || 'N/A'}</dd></div>
                  </dl>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Office *</label>
                    <select value={officeId} onChange={(event) => setOfficeId(event.target.value)} className="w-full rounded-md border px-3 py-2">
                      <option value="">Select office</option>
                      {offices.map((office) => <option key={office.id} value={office.id}>{office.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Election</label>
                    <Input value={activeAddElections.find((election) => election.id === Number(electionId))?.year ?? ''} disabled />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Start date *</label>
                    <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">End date *</label>
                    <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium">Tenure *</label>
                    <Input value={tenure} onChange={(event) => setTenure(event.target.value)} placeholder="Enter tenure (for example, 2026-2030)" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium">Remark</label>
                    <Textarea value={remark} onChange={(event) => setRemark(event.target.value)} rows={3} placeholder="Optional remark" />
                  </div>
                </div>
                {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}
                <div className="flex justify-between gap-2">
                  <Button variant="outline" onClick={() => {
                    setAddStep(1)
                    setSelectedCandidate(null)
                    setCandidateSearchError('')
                    setFormError('')
                  }} disabled={isSaving}>Back</Button>
                  <Button onClick={saveMember} disabled={isSaving || !selectedCandidate} className="bg-[#146c4f] hover:bg-[#10563f]">
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSaving ? 'Saving...' : 'Add Elected Member'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingMember)} onOpenChange={(open) => !open && setEditingMember(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit elected member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Candidate ID</label>
              <Input value={editData.candidate_id || ''} onChange={(event) => setEditData((current) => ({ ...current, candidate_id: Number(event.target.value) }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Election</label>
              <select value={String(editData.election_id || '')} onChange={(event) => setEditData((current) => ({ ...current, election_id: Number(event.target.value) }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select election</option>
                {elections.map((election) => (
                  <option key={election.id} value={election.id}>{election.year}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Office ID</label>
              <Input value={editData.office_id || ''} onChange={(event) => setEditData((current) => ({ ...current, office_id: Number(event.target.value) }))} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Start date</label>
                <Input type="date" value={editData.start_date || ''} onChange={(event) => setEditData((current) => ({ ...current, start_date: event.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">End date</label>
                <Input type="date" value={editData.end_date || ''} onChange={(event) => setEditData((current) => ({ ...current, end_date: event.target.value }))} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Tenure</label>
              <Input value={editData.tenure || ''} onChange={(event) => setEditData((current) => ({ ...current, tenure: event.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Remark</label>
              <Textarea value={editData.remark || ''} onChange={(event) => setEditData((current) => ({ ...current, remark: event.target.value }))} rows={4} />
            </div>
            {editError && <div className="text-sm text-red-600">{editError}</div>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingMember(null)}>Cancel</Button>
              <Button onClick={saveEdit} disabled={isUpdating} className="bg-[#146c4f] hover:bg-[#10563f]">{isUpdating ? 'Saving...' : 'Save changes'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deletingMember)} onOpenChange={(open) => !open && setDeletingMember(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete elected member</DialogTitle>
            <DialogDescription>Are you sure you want to remove this elected member?</DialogDescription>
          </DialogHeader>
          {deleteError && <div className="text-sm text-red-600">{deleteError}</div>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeletingMember(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deletingMember && removeMember(deletingMember)} disabled={isDeleting}>{isDeleting ? 'Deleting...' : 'Delete'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(terminatingMember)} onOpenChange={(open) => !open && !isTerminating && setTerminatingMember(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Terminate elected member</DialogTitle>
            <DialogDescription>
              Are you sure you want to terminate {terminatingMember?.name || 'this elected State Assembly member'}?
            </DialogDescription>
          </DialogHeader>
          {terminateError && <div role="alert" className="text-sm text-red-600">{terminateError}</div>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setTerminatingMember(null)} disabled={isTerminating}>Cancel</Button>
            <Button variant="destructive" onClick={() => terminatingMember && terminateMember(terminatingMember)} disabled={isTerminating}>
              {isTerminating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isTerminating ? 'Terminating...' : 'Terminate'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
