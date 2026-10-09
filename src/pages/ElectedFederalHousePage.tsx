import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CircleStop, Loader2, MapPin, Pencil, Plus, Trash2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Candidate, candidateService } from '@/services/candidates'
import { District, districtsService } from '@/services/districts'
import { Election, electionService, SenateOffice } from '@/services/elections'
import { ElectedLeader, leadersService, UpdateElectedHouseOfRepMemberData } from '@/services/leaders'
import { getLogoUrl } from '@/lib/utils'

const normalizeCandidateIdentifier = (value: string | number | undefined) =>
  String(value ?? '').toLowerCase().replace(/[\s()+-]/g, '')

export default function ElectedFederalHousePage() {
  const { id } = useParams<{ id: string }>()
  const districtId = Number(id)
  const [district, setDistrict] = useState<District | null>(null)
  const [members, setMembers] = useState<ElectedLeader[]>([])
  const [candidateDirectory, setCandidateDirectory] = useState<Candidate[]>([])
  const [elections, setElections] = useState<Election[]>([])
  const [searchElections, setSearchElections] = useState<Election[]>([])
  const [offices, setOffices] = useState<SenateOffice[]>([])
  const [loading, setLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)
  const [error, setError] = useState('')
  const [searchError, setSearchError] = useState('')
  const [searchOptionsError, setSearchOptionsError] = useState('')
  const [searchElectionYear, setSearchElectionYear] = useState('')
  const [displayedElectionYear, setDisplayedElectionYear] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [candidateSearch, setCandidateSearch] = useState('')
  const [candidateSearchError, setCandidateSearchError] = useState('')
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [metaError, setMetaError] = useState('')
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
  const [editError, setEditError] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [terminatingMemberId, setTerminatingMemberId] = useState<number | null>(null)
  const [terminateError, setTerminateError] = useState('')
  const [removingMemberId, setRemovingMemberId] = useState<number | null>(null)
  const [removeError, setRemoveError] = useState('')
  const [confirmAction, setConfirmAction] = useState<{ type: 'terminate' | 'delete'; member: ElectedLeader | null }>({
    type: 'terminate',
    member: null
  })
  const [formData, setFormData] = useState({
    office_id: '',
    election_id: '',
    start_date: '',
    end_date: '',
    tenure: '',
    remark: ''
  })

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
        const [districts, activeMembers] = await Promise.all([
          districtsService.getFederalHouseDistricts(),
          leadersService.getActiveElectedHouseOfRepMembers(districtId)
        ])
        const currentDistrict = districts.find((item) => item.id === districtId)
        if (!currentDistrict) throw new Error('Federal Constituency not found.')
        if (isCurrent) {
          setDistrict(currentDistrict)
          setMembers(activeMembers)
        }
      } catch (loadError) {
        if (isCurrent) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load elected House members.')
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
    const loadFormOptions = async () => {
      const [candidateResult, electionResult, allElectionResult, officeResult] = await Promise.allSettled([
        candidateService.getAllCandidates(),
        electionService.getActiveElections(),
        electionService.getAllElections(),
        electionService.getFederalHouseOffices()
      ])
      if (!isCurrent) return

      const errors: string[] = []
      if (candidateResult.status === 'fulfilled') {
        setCandidateDirectory(candidateResult.value)
      } else {
        errors.push(candidateResult.reason instanceof Error ? candidateResult.reason.message : 'Unable to load candidates.')
      }
      if (electionResult.status === 'fulfilled') {
        setElections(electionResult.value)
        setFormData((current) => ({
          ...current,
          election_id: current.election_id || String(electionResult.value[0]?.id ?? '')
        }))
      } else {
        errors.push(electionResult.reason instanceof Error ? electionResult.reason.message : 'Unable to load elections.')
      }
      if (allElectionResult.status === 'fulfilled') {
        setSearchElections(allElectionResult.value)
      } else {
        setSearchOptionsError(allElectionResult.reason instanceof Error ? allElectionResult.reason.message : 'Unable to load elections for search.')
      }
      if (officeResult.status === 'fulfilled') {
        setOffices(officeResult.value.filter((office) => office.status !== 0))
      } else {
        errors.push(officeResult.reason instanceof Error ? officeResult.reason.message : 'Unable to load Federal House offices.')
      }
      setMetaError(errors.join(' '))
      setIsLoadingOptions(false)
    }

    void loadFormOptions()
    return () => { isCurrent = false }
  }, [])

  const handleAddDialogChange = (open: boolean) => {
    setIsAddOpen(open)
    if (!open) {
      setCandidateSearch('')
      setCandidateSearchError('')
      setSelectedCandidate(null)
      setFormError('')
      setFormData((current) => ({
        ...current,
        office_id: '',
        start_date: '',
        end_date: '',
        tenure: '',
        remark: ''
      }))
    }
  }

  const verifyCandidate = async () => {
    const identifier = normalizeCandidateIdentifier(candidateSearch.trim())
    setCandidateSearchError('')
    setFormError('')
    setSelectedCandidate(null)
    if (!identifier) {
      setCandidateSearchError('Enter the candidate NIN or phone number.')
      return
    }
    if (!formData.election_id) {
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
        election_id: Number(formData.election_id)
      })
      if (!registration.can_register) {
        throw new Error(registration.message || 'This candidate is already assigned to a leadership position for this election.')
      }
      if (!candidate.party_id) {
        throw new Error('The verified candidate must have a political party assigned.')
      }
      setSelectedCandidate(candidate)
    } catch (verifyError) {
      setCandidateSearchError(verifyError instanceof Error ? verifyError.message : 'Unable to verify candidate.')
    } finally {
      setIsVerifying(false)
    }
  }

  const addElectedMember = async () => {
    if (
      !districtId || !selectedCandidate || !selectedCandidate.party_id ||
      !formData.office_id || !formData.election_id ||
      !formData.start_date || !formData.end_date || !formData.tenure.trim()
    ) {
      setFormError('Complete all required fields and verify a candidate before saving.')
      return
    }
    if (formData.end_date < formData.start_date) {
      setFormError('End date must be on or after the start date.')
      return
    }

    setIsSaving(true)
    setFormError('')
    try {
      const registration = await leadersService.checkLeadershipRegistration({
        candidate_id: Number(selectedCandidate.id),
        election_id: Number(formData.election_id)
      })
      if (!registration.can_register) {
        throw new Error(registration.message || 'This candidate is already assigned to a leadership position for this election.')
      }

      await leadersService.addElectedHouseOfRepMember({
        candidate_id: Number(selectedCandidate.id),
        office_id: Number(formData.office_id),
        party_id: Number(selectedCandidate.party_id),
        election_id: Number(formData.election_id),
        federal_house_district_id: districtId,
        start_date: formData.start_date,
        end_date: formData.end_date,
        tenure: formData.tenure.trim(),
        remark: formData.remark.trim()
      })
      handleAddDialogChange(false)
      try {
        setMembers(await leadersService.getActiveElectedHouseOfRepMembers(districtId))
        setSearchElectionYear('')
        setDisplayedElectionYear('')
      } catch (refreshError) {
        setError(`Member was added successfully, but the list could not be refreshed. ${refreshError instanceof Error ? refreshError.message : ''}`)
      }
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : 'Unable to add elected House member.')
    } finally {
      setIsSaving(false)
    }
  }

  const searchElectedMembers = async () => {
    const year = searchElectionYear.trim()
    if (!districtId || !year) {
      setSearchError('Enter an election year to search elected members.')
      return
    }

    const matchingElection = searchElections.find((election) => String(election.year).trim() === year)
    if (!matchingElection) {
      setSearchError(`No election was found for the year ${year}.`)
      return
    }

    setIsSearching(true)
    setSearchError('')
    try {
      const results = await leadersService.getElectedHouseOfRepMembers(
        districtId,
        Number(matchingElection.id)
      )
      setMembers(results)
      setDisplayedElectionYear(year)
    } catch (searchFailure) {
      setSearchError(searchFailure instanceof Error ? searchFailure.message : 'Unable to search elected House members.')
    } finally {
      setIsSearching(false)
    }
  }

  const showActiveMembers = async () => {
    setIsSearching(true)
    setSearchError('')
    setSearchElectionYear('')
    try {
      setMembers(await leadersService.getActiveElectedHouseOfRepMembers(districtId))
      setDisplayedElectionYear('')
    } catch (loadError) {
      setSearchError(loadError instanceof Error ? loadError.message : 'Unable to load active elected House members.')
    } finally {
      setIsSearching(false)
    }
  }

  const openEditMember = (member: ElectedLeader) => {
    const dateOnly = (value: unknown) => typeof value === 'string' ? value.slice(0, 10) : ''
    setEditingMember(member)
    setEditError('')
    setEditData({
      candidate_id: Number(member.candidate_id ?? member.candidateId ?? member.candidate?.id) || 0,
      office_id: Number(member.office_id ?? member.office?.id) || 0,
      party_id: Number(member.party_id ?? member.party?.id ?? member.candidate?.party_id) || 0,
      election_id: Number(member.election_id ?? member.election?.id) || 0,
      federal_house_district_id: Number(member.federal_house_district_id ?? districtId) || districtId,
      start_date: dateOnly(member.start_date),
      end_date: dateOnly(member.end_date),
      tenure: String(member.tenure ?? ''),
      remark: String(member.remark ?? '')
    })
  }

  const updateElectedMember = async () => {
    const memberId = Number(editingMember?.id)
    if (!Number.isInteger(memberId) || memberId <= 0) {
      setEditError('This elected-member record does not have a valid ID.')
      return
    }
    if (
      !editData.candidate_id || !editData.office_id || !editData.party_id ||
      !editData.election_id || !editData.federal_house_district_id ||
      !editData.start_date || !editData.end_date || !editData.tenure.trim()
    ) {
      setEditError('Complete all required fields before saving.')
      return
    }
    if (editData.end_date < editData.start_date) {
      setEditError('End date must be on or after the start date.')
      return
    }

    setIsUpdating(true)
    setEditError('')
    try {
      await leadersService.updateElectedHouseOfRepMember(memberId, {
        ...editData,
        tenure: editData.tenure.trim(),
        remark: editData.remark.trim()
      })
      if (displayedElectionYear) {
        const election = searchElections.find((item) => String(item.year).trim() === displayedElectionYear)
        if (election) {
          setMembers(await leadersService.getElectedHouseOfRepMembers(districtId, Number(election.id)))
        } else {
          setMembers(await leadersService.getActiveElectedHouseOfRepMembers(districtId))
        }
      } else {
        setMembers(await leadersService.getActiveElectedHouseOfRepMembers(districtId))
      }
      setEditingMember(null)
    } catch (updateError) {
      setEditError(updateError instanceof Error ? updateError.message : 'Unable to update elected House member.')
    } finally {
      setIsUpdating(false)
    }
  }

  const terminateElectedMember = async (member: ElectedLeader) => {
    const memberId = Number(member.id)
    if (!Number.isInteger(memberId) || memberId <= 0) {
      setTerminateError('This elected-member record does not have a valid ID.')
      return
    }

    setTerminatingMemberId(memberId)
    setTerminateError('')
    try {
      await leadersService.terminateElectedHouseOfRepMember(memberId)
      setMembers((current) => displayedElectionYear
        ? current.map((item) => Number(item.id) === memberId ? { ...item, status: 'Terminated' } : item)
        : current.filter((item) => Number(item.id) !== memberId))
    } catch (terminationError) {
      setTerminateError(terminationError instanceof Error ? terminationError.message : 'Unable to terminate elected House member.')
    } finally {
      setTerminatingMemberId(null)
    }
  }

  const removeElectedMember = async (member: ElectedLeader) => {
    const memberId = Number(member.id)
    if (!Number.isInteger(memberId) || memberId <= 0) {
      setRemoveError('This elected-member record does not have a valid ID.')
      return
    }

    setRemovingMemberId(memberId)
    setRemoveError('')
    try {
      await leadersService.removeElectedHouseOfRepMember(memberId)
      setMembers((current) => current.filter((item) => Number(item.id) !== memberId))
    } catch (removeFailure) {
      setRemoveError(removeFailure instanceof Error ? removeFailure.message : 'Unable to delete elected House member.')
    } finally {
      setRemovingMemberId(null)
    }
  }

  const openConfirmation = (type: 'terminate' | 'delete', member: ElectedLeader) => {
    setConfirmAction({ type, member })
  }

  const confirmActionHandler = async () => {
    if (!confirmAction.member) return

    const member = confirmAction.member
    setConfirmAction({ type: confirmAction.type, member: null })

    if (confirmAction.type === 'terminate') {
      await terminateElectedMember(member)
      return
    }

    await removeElectedMember(member)
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
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Elected Federal House Member</p>
                <h1 className="mt-1 text-2xl font-bold text-gray-900">{district?.name ?? 'Federal Constituency'}</h1>
                <p className="text-sm text-gray-500">{district?.state?.name ?? 'State not specified'}</p>
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
                  disabled={isLoadingOptions || isSearching}
                />
                <Button type="button" size="sm" variant="outline" onClick={searchElectedMembers} disabled={isSearching || isLoadingOptions}>
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={showActiveMembers} disabled={isSearching}>
                  Show Active
                </Button>
              </div>
              <Button
                type="button"
                size="sm"
                className="bg-[#146c4f] hover:bg-[#10563f]"
                disabled={loading || isLoadingOptions}
                onClick={() => {
                  setFormError('')
                  setIsAddOpen(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Elected Member
              </Button>
            </div>
          </div>
          {searchOptionsError && <div role="alert" className="px-6 pt-4 text-sm text-red-600">{searchOptionsError}</div>}
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
          {searchError && <div role="alert" className="px-6 pt-4 text-sm text-red-600">{searchError}</div>}
          {terminateError && <div role="alert" className="px-6 pt-4 text-sm text-red-600">{terminateError}</div>}
          {removeError && <div role="alert" className="px-6 pt-4 text-sm text-red-600">{removeError}</div>}
          {!loading && error && <div role="alert" className="p-8 text-center text-sm text-red-600">{error}</div>}
          {!loading && !isSearching && !error && members.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              {displayedElectionYear ? `No elected members found for ${displayedElectionYear} in this constituency.` : 'No active elected members found for this constituency.'}
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
                    <div className="mb-4 flex items-center justify-between gap-3 border-b border-gray-100 pb-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="h-12 w-12 border border-gray-200">
                          {photoUrl && <AvatarImage src={photoUrl} alt={name} className="object-cover" />}
                          <AvatarFallback className="bg-[#146c4f]/10 font-bold text-[#146c4f]">
                            {name.charAt(0)?.toUpperCase() || 'E'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <h2 className="truncate font-bold text-gray-900">{name}</h2>
                          <p className="text-xs font-semibold text-[#146c4f]">{member.position || 'Federal House Representative'}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
                          {member.status || 'Active'}
                        </span>
                        <Button type="button" size="sm" variant="outline" onClick={() => openEditMember(member)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => openConfirmation('terminate', member)}
                          disabled={terminatingMemberId !== null || removingMemberId !== null}
                        >
                          {terminatingMemberId === Number(member.id)
                            ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            : <CircleStop className="mr-2 h-4 w-4" />}
                          Terminate
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => openConfirmation('delete', member)}
                          disabled={terminatingMemberId !== null || removingMemberId !== null}
                        >
                          {removingMemberId === Number(member.id)
                            ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            : <Trash2 className="mr-2 h-4 w-4" />}
                          Delete
                        </Button>
                      </div>
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
                        <p className="truncate font-semibold text-gray-800">{member.stateName || 'N/A'}</p>
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

      <Dialog open={Boolean(confirmAction.member)} onOpenChange={(open) => {
        if (!open) {
          setConfirmAction({ type: 'terminate', member: null })
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{confirmAction.type === 'terminate' ? 'Terminate elected member' : 'Delete elected member'}</DialogTitle>
            <DialogDescription>
              {confirmAction.type === 'terminate'
                ? `Are you sure you want to terminate ${confirmAction.member?.name || 'this elected House member'}?`
                : `Are you sure you want to permanently delete ${confirmAction.member?.name || 'this elected House member'}? This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setConfirmAction({ type: 'terminate', member: null })}>
              Cancel
            </Button>
            <Button type="button" variant={confirmAction.type === 'terminate' ? 'destructive' : 'destructive'} onClick={confirmActionHandler}>
              {confirmAction.type === 'terminate' ? 'Terminate' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingMember)} onOpenChange={(open) => {
        if (!open && !isUpdating) {
          setEditingMember(null)
          setEditError('')
        }
      }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Elected Federal House Member</DialogTitle>
            <DialogDescription>Update the elected member’s office, election, tenure, dates, and administrative remark.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border bg-gray-50 p-3 text-sm">
              <p><span className="text-gray-500">Candidate:</span> <strong>{editingMember?.name || 'N/A'}</strong></p>
              <p><span className="text-gray-500">Party:</span> <strong>{editingMember?.party?.name ?? editingMember?.partyName ?? 'N/A'}</strong></p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-gray-700">
                Office *
                <select
                  className="h-10 w-full rounded-md border border-input bg-white px-3"
                  value={editData.office_id}
                  onChange={(event) => setEditData((current) => ({ ...current, office_id: Number(event.target.value) }))}
                >
                  <option value={0}>Select office</option>
                  {offices.map((office) => <option key={office.id} value={office.id}>{office.title}</option>)}
                  {editData.office_id > 0 && !offices.some((office) => office.id === editData.office_id) && (
                    <option value={editData.office_id}>{editingMember?.office?.title ?? editingMember?.position ?? `Office ${editData.office_id}`}</option>
                  )}
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium text-gray-700">
                Election *
                <select
                  className="h-10 w-full rounded-md border border-input bg-white px-3"
                  value={editData.election_id}
                  onChange={(event) => setEditData((current) => ({ ...current, election_id: Number(event.target.value) }))}
                >
                  <option value={0}>Select election</option>
                  {[...elections, ...searchElections]
                    .filter((election, index, all) => all.findIndex((item) => item.id === election.id) === index)
                    .map((election) => <option key={election.id} value={election.id}>{election.year} - {election.details}</option>)}
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium text-gray-700">
                Tenure *
                <Input value={editData.tenure} onChange={(event) => setEditData((current) => ({ ...current, tenure: event.target.value }))} />
              </label>
              <label className="space-y-2 text-sm font-medium text-gray-700">
                Start date *
                <Input type="date" value={editData.start_date} onChange={(event) => setEditData((current) => ({ ...current, start_date: event.target.value }))} />
              </label>
              <label className="space-y-2 text-sm font-medium text-gray-700">
                End date *
                <Input type="date" value={editData.end_date} onChange={(event) => setEditData((current) => ({ ...current, end_date: event.target.value }))} />
              </label>
              <label className="space-y-2 text-sm font-medium text-gray-700 sm:col-span-2">
                Remark
                <Textarea value={editData.remark} onChange={(event) => setEditData((current) => ({ ...current, remark: event.target.value }))} rows={3} />
              </label>
            </div>
            {editError && <p role="alert" className="text-sm text-red-600">{editError}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditingMember(null)} disabled={isUpdating}>Cancel</Button>
              <Button type="button" onClick={updateElectedMember} disabled={isUpdating} className="bg-[#146c4f] hover:bg-[#10563f]">
                {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isUpdating ? 'Updating...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddOpen} onOpenChange={handleAddDialogChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Elected Federal House Member</DialogTitle>
            <DialogDescription>
              Verify the candidate’s leadership registration for an election, then enter their elected-member details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {metaError && <p role="alert" className="text-sm text-red-600">{metaError}</p>}
            <label className="block space-y-2 text-sm font-medium text-gray-700">
              Election *
              <select
                className="h-10 w-full rounded-md border border-input bg-white px-3"
                value={formData.election_id}
                onChange={(event) => {
                  setFormData((current) => ({ ...current, election_id: event.target.value }))
                  setSelectedCandidate(null)
                  setCandidateSearchError('')
                }}
              >
                <option value="">Select election</option>
                {elections.map((election) => (
                  <option key={election.id} value={election.id}>{election.year} - {election.details}</option>
                ))}
              </select>
            </label>
            <div className="space-y-2">
              <label htmlFor="elected-house-candidate-search" className="text-sm font-medium text-gray-700">
                Candidate NIN or phone number *
              </label>
              <div className="flex gap-2">
                <Input
                  id="elected-house-candidate-search"
                  value={candidateSearch}
                  onChange={(event) => {
                    setCandidateSearch(event.target.value)
                    setSelectedCandidate(null)
                    setCandidateSearchError('')
                  }}
                  placeholder="Enter NIN or phone number"
                />
                <Button type="button" variant="outline" onClick={verifyCandidate} disabled={isVerifying}>
                  {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
                </Button>
              </div>
              {candidateSearchError && <p role="alert" className="text-sm text-red-600">{candidateSearchError}</p>}
            </div>
            {selectedCandidate && (
              <>
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <p className="mb-3 font-semibold text-green-900">Candidate verified</p>
                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <p><span className="block text-xs text-green-700">Full name</span><strong>{selectedCandidate.full_name || 'N/A'}</strong></p>
                    <p><span className="block text-xs text-green-700">NIN</span><strong>{selectedCandidate.nin || 'N/A'}</strong></p>
                    <p><span className="block text-xs text-green-700">Phone</span><strong>{selectedCandidate.phoneNo || 'N/A'}</strong></p>
                    <p><span className="block text-xs text-green-700">Political party</span><strong>{selectedCandidate.party?.name || selectedCandidate.political_party || 'N/A'}</strong></p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2 text-sm font-medium text-gray-700">
                    Office *
                    <select
                      className="h-10 w-full rounded-md border border-input bg-white px-3"
                      value={formData.office_id}
                      onChange={(event) => setFormData((current) => ({ ...current, office_id: event.target.value }))}
                    >
                      <option value="">Select office</option>
                      {offices.map((office) => <option key={office.id} value={office.id}>{office.title}</option>)}
                    </select>
                  </label>
                  <label className="space-y-2 text-sm font-medium text-gray-700">
                    Tenure *
                    <Input
                      value={formData.tenure}
                      onChange={(event) => setFormData((current) => ({ ...current, tenure: event.target.value }))}
                      placeholder="e.g. 2027-2031"
                    />
                  </label>
                  <label className="space-y-2 text-sm font-medium text-gray-700">
                    Start date *
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(event) => setFormData((current) => ({ ...current, start_date: event.target.value }))}
                    />
                  </label>
                  <label className="space-y-2 text-sm font-medium text-gray-700">
                    End date *
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(event) => setFormData((current) => ({ ...current, end_date: event.target.value }))}
                    />
                  </label>
                  <label className="space-y-2 text-sm font-medium text-gray-700 sm:col-span-2">
                    Remark
                    <Textarea
                      value={formData.remark}
                      onChange={(event) => setFormData((current) => ({ ...current, remark: event.target.value }))}
                      placeholder="Administrative notes"
                      rows={3}
                    />
                  </label>
                </div>
              </>
            )}
            {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => handleAddDialogChange(false)} disabled={isSaving}>Cancel</Button>
              <Button
                type="button"
                className="bg-[#146c4f] hover:bg-[#10563f]"
                onClick={addElectedMember}
                disabled={isSaving || !selectedCandidate}
              >
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isSaving ? 'Saving...' : 'Add Elected Member'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
