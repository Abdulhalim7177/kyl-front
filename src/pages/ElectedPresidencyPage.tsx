import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Ban, CheckCircle2, Loader2, MapPin, Pencil, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { getLogoUrl } from '@/lib/utils'
import { candidateService, Candidate } from '@/services/candidates'
import { Election, electionService, StateOffice } from '@/services/elections'
import { AddElectedPresidencyData, ElectedLeader, leadersService, UpdateElectedPresidencyData } from '@/services/leaders'
import { Party, partyService } from '@/services/parties'
import Can from '@/components/Can'
import { Permissions } from '@/lib/permissions'

const leadershipRoles = [
  { title: 'President', matches: ['president'] },
  { title: 'Vice President', matches: ['vice president', 'vice-president'] }
]

const getCandidateName = (leader: ElectedLeader) =>
  leader.candidate?.fullName ?? leader.candidate?.full_name ?? 'Name not available'

const normalizeIdentifier = (value: string | number | undefined) =>
  String(value ?? '').replace(/\D/g, '')

const formatDate = (date?: string | null) => {
  if (!date) return 'Not specified'
  const parsedDate = new Date(`${date.slice(0, 10)}T00:00:00`)
  return Number.isNaN(parsedDate.getTime())
    ? date
    : parsedDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function LeaderCard({
  role,
  leader,
  onEdit,
  onTerminate,
  onDelete,
  isDeleting,
  isTerminating
}: {
  role: string
  leader?: ElectedLeader
  onEdit: (leader: ElectedLeader) => void
  onTerminate: (leader: ElectedLeader) => void
  onDelete: (leader: ElectedLeader) => void
  isDeleting: boolean
  isTerminating: boolean
}) {
  const candidate = leader?.candidate
  const candidateName = leader ? getCandidateName(leader) : ''
  const imageUrl = getLogoUrl(candidate?.image)
  const party = leader?.party ?? candidate?.party
  const partyLogo = getLogoUrl(party?.logopath)

  return (
    <Card className="h-full overflow-hidden border border-gray-100 shadow-md">
      <div className="h-2 bg-gradient-to-r from-[#146c4f] to-emerald-300" />
      <CardContent className="p-6 sm:p-8">
        {leader && (
          <div className="mb-4 flex items-start justify-between">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold capitalize text-emerald-700">
              {leader.status || 'Active'}
            </span>
            <div className="flex flex-wrap justify-end gap-1 sm:gap-2">
              <Can permission={Permissions.UPDATE_LEADER}>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  aria-label={`Edit ${candidateName}`}
                  title="Edit leader"
                  className="h-8 px-2 sm:h-9 sm:px-3"
                  onClick={() => onEdit(leader)}
                >
                  <Pencil className="h-4 w-4 sm:mr-2" aria-hidden="true" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
              </Can>
              <Can permission={Permissions.DELETE_LEADER}>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  aria-label={`Terminate ${candidateName}`}
                  title="Terminate leader"
                  className="h-8 px-2 sm:h-9 sm:px-3"
                  onClick={() => onTerminate(leader)}
                  disabled={isTerminating}
                >
                  {isTerminating
                    ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    : <><Ban className="h-4 w-4 sm:mr-2" aria-hidden="true" /><span className="hidden sm:inline">Terminate</span></>}
                </Button>
              </Can>
              <Can permission={Permissions.DELETE_LEADER}>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  aria-label={`Delete ${candidateName}`}
                  title="Delete leader"
                  className="h-8 px-2 sm:h-9 sm:px-3"
                  onClick={() => onDelete(leader)}
                  disabled={isDeleting}
                >
                  {isDeleting
                    ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    : <><Trash2 className="h-4 w-4 sm:mr-2" aria-hidden="true" /><span className="hidden sm:inline">Delete</span></>}
                </Button>
              </Can>
            </div>
          </div>
        )}
        <div className="flex flex-col items-center text-center">
          <Avatar className="h-28 w-28 border-4 border-white shadow-lg ring-2 ring-[#146c4f]/20">
            {imageUrl && <AvatarImage src={imageUrl} alt={candidateName} className="object-cover" />}
            <AvatarFallback className="bg-[#146c4f]/10 text-2xl font-bold text-[#146c4f]">
              {leader ? candidateName.slice(0, 1).toUpperCase() : role.slice(0, 1)}
            </AvatarFallback>
          </Avatar>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-[#146c4f]">{role}</p>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">
            {leader ? candidateName : `No ${role.toLowerCase()} record found`}
          </h2>
        </div>

        {leader ? (
          <div className="mt-7 grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Political Party</p>
              <div className="mt-2 flex items-center gap-2">
                <Avatar className="h-12 w-12 border border-gray-200 bg-white">
                  {partyLogo && <AvatarImage src={partyLogo} alt={`${party?.name ?? 'Party'} logo`} className="object-contain p-1" />}
                  <AvatarFallback className="text-sm font-bold text-gray-500">{party?.name?.slice(0, 1) ?? 'P'}</AvatarFallback>
                </Avatar>
                <p className="truncate font-semibold text-gray-800">{party?.name ?? 'Not specified'}</p>
              </div>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Election</p>
              <p className="mt-2 font-semibold text-gray-800">
                {leader.election?.year ?? leader.election?.details ?? 'Not specified'}
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Phone</p>
              <p className="mt-2 truncate font-semibold text-gray-800">
                {candidate?.phoneNo ?? candidate?.phone_no ?? 'Not specified'}
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Email</p>
              <p className="mt-2 truncate font-semibold text-gray-800">{candidate?.email ?? 'Not specified'}</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Term</p>
              <p className="mt-2 font-semibold text-gray-800">{leader.tenure || 'Not specified'}</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Term Dates</p>
              <p className="mt-2 font-semibold text-gray-800">
                {formatDate(leader.start_date)} – {formatDate(leader.end_date)}
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4 sm:col-span-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Remark</p>
              <p className="mt-2 whitespace-pre-wrap text-gray-800">{leader.remark || 'No remark provided'}</p>
            </div>
          </div>
        ) : (
          <p className="mt-6 text-center text-sm text-gray-500">
            No active record was returned for this office.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default function ElectedPresidencyPage() {
  const [leaders, setLeaders] = useState<ElectedLeader[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [electionYearSearch, setElectionYearSearch] = useState('')
  const [selectedElection, setSelectedElection] = useState<{ id: number; year: string } | null>(null)
  const [searchError, setSearchError] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [deletingLeaderId, setDeletingLeaderId] = useState<number | null>(null)
  const [pendingDeleteLeader, setPendingDeleteLeader] = useState<ElectedLeader | null>(null)
  const [terminateError, setTerminateError] = useState('')
  const [isTerminating, setIsTerminating] = useState(false)
  const [terminatingLeader, setTerminatingLeader] = useState<ElectedLeader | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [activeElections, setActiveElections] = useState<Election[]>([])
  const [offices, setOffices] = useState<StateOffice[]>([])
  const [parties, setParties] = useState<Party[]>([])
  const [isLoadingOptions, setIsLoadingOptions] = useState(false)
  const [optionsError, setOptionsError] = useState('')
  const [candidateIdentifier, setCandidateIdentifier] = useState('')
  const [electionId, setElectionId] = useState('')
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [officeId, setOfficeId] = useState('')
  const [partyId, setPartyId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [tenure, setTenure] = useState('')
  const [remark, setRemark] = useState('')
  const [verificationError, setVerificationError] = useState('')
  const [formError, setFormError] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingLeader, setEditingLeader] = useState<ElectedLeader | null>(null)
  const [editElectionId, setEditElectionId] = useState('')
  const [editOfficeId, setEditOfficeId] = useState('')
  const [editPartyId, setEditPartyId] = useState('')
  const [editStartDate, setEditStartDate] = useState('')
  const [editEndDate, setEditEndDate] = useState('')
  const [editTenure, setEditTenure] = useState('')
  const [editRemark, setEditRemark] = useState('')
  const [editError, setEditError] = useState('')
  const [isLoadingEditOptions, setIsLoadingEditOptions] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const loadLeaders = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const records = selectedElection
        ? await leadersService.getElectedPresidency(selectedElection.id)
        : await leadersService.getActiveElectedPresidency()
      setLeaders(records)
    } catch (loadError) {
      console.error('Failed to load active elected presidency:', loadError)
      setError(loadError instanceof Error ? loadError.message : 'Unable to load elected presidency.')
    } finally {
      setLoading(false)
    }
  }, [selectedElection])

  useEffect(() => {
    void loadLeaders()
  }, [loadLeaders, reloadKey])

  const searchElectedPresidency = async () => {
    const year = electionYearSearch.trim()
    if (!year) {
      setSearchError('Enter an election year to search.')
      return
    }

    setIsSearching(true)
    setSearchError('')
    try {
      const elections = await electionService.getAllElections()
      const election = elections.find((item) => String(item.year).trim() === year)
      if (!election) {
        setSearchError(`No election was found for the year ${year}.`)
        return
      }

      setSelectedElection({ id: Number(election.id), year })
    } catch (searchFailure) {
      setSearchError(searchFailure instanceof Error ? searchFailure.message : 'Unable to search elected presidency.')
    } finally {
      setIsSearching(false)
    }
  }

  const showActivePresidency = () => {
    setElectionYearSearch('')
    setSearchError('')
    setSelectedElection(null)
    setReloadKey((key) => key + 1)
  }

  const removeElectedLeader = async () => {
    if (!pendingDeleteLeader) return

    const leader = pendingDeleteLeader
    const leaderId = Number(leader.id)
    if (!Number.isInteger(leaderId) || leaderId <= 0) {
      setDeleteError('This elected leader record does not have a valid ID.')
      return
    }

    setDeletingLeaderId(leaderId)
    setDeleteError('')
    try {
      await leadersService.removeElectedPresidency(leaderId)
      setLeaders((current) => current.filter((item) => Number(item.id) !== leaderId))
      setPendingDeleteLeader(null)
    } catch (deleteFailure) {
      setDeleteError(deleteFailure instanceof Error ? deleteFailure.message : 'Unable to remove elected presidency leader.')
    } finally {
      setDeletingLeaderId(null)
    }
  }

  const terminateElectedLeader = async () => {
    if (!terminatingLeader) return

    const leaderId = Number(terminatingLeader.id)
    if (!Number.isInteger(leaderId) || leaderId <= 0) {
      setTerminateError('This elected leader record does not have a valid ID.')
      return
    }

    setIsTerminating(true)
    setTerminateError('')
    try {
      await leadersService.terminateElectedPresidency(leaderId)
      setLeaders((current) => selectedElection
        ? current.map((leader) => Number(leader.id) === leaderId ? { ...leader, status: 'Terminated' } : leader)
        : current.filter((leader) => Number(leader.id) !== leaderId))
      setTerminatingLeader(null)
    } catch (terminationFailure) {
      setTerminateError(terminationFailure instanceof Error ? terminationFailure.message : 'Unable to terminate elected presidency leader.')
    } finally {
      setIsTerminating(false)
    }
  }

  const resetAddForm = () => {
    setCandidateIdentifier('')
    setElectionId('')
    setSelectedCandidate(null)
    setOfficeId('')
    setPartyId('')
    setStartDate('')
    setEndDate('')
    setTenure('')
    setRemark('')
    setVerificationError('')
    setFormError('')
    setOptionsError('')
    setActiveElections([])
    setOffices([])
    setParties([])
  }

  const openAddDialog = async () => {
    resetAddForm()
    setIsAddOpen(true)
    setIsLoadingOptions(true)

    const [electionResult, officeResult, partyResult] = await Promise.allSettled([
      electionService.getActiveElections(),
      electionService.getPresidencyOffices(),
      partyService.getAllParties()
    ])
    const errors: string[] = []

    if (electionResult.status === 'fulfilled') {
      setActiveElections(electionResult.value)
      setElectionId(String(electionResult.value[0]?.id ?? ''))
      if (electionResult.value.length === 0) errors.push('No active elections are available.')
    } else {
      errors.push(electionResult.reason instanceof Error ? electionResult.reason.message : 'Unable to load active elections.')
    }

    if (officeResult.status === 'fulfilled') {
      const activeOffices = officeResult.value.filter((office) => office.status !== 0)
      setOffices(activeOffices)
      if (activeOffices.length === 0) errors.push('No active presidency offices are available.')
    } else {
      errors.push(officeResult.reason instanceof Error ? officeResult.reason.message : 'Unable to load presidency offices.')
    }

    if (partyResult.status === 'fulfilled') {
      const activeParties = partyResult.value.filter((party) => party.status === 1 || party.status === true)
      setParties(activeParties)
      if (activeParties.length === 0) errors.push('No active political parties are available.')
    } else {
      errors.push(partyResult.reason instanceof Error ? partyResult.reason.message : 'Unable to load political parties.')
    }

    setOptionsError(errors.join(' '))
    setIsLoadingOptions(false)
  }

  const findCandidate = async () => {
    const identifier = normalizeIdentifier(candidateIdentifier)
    const parsedElectionId = Number(electionId)
    if (!identifier) {
      setVerificationError('Enter the candidate NIN or phone number.')
      return
    }
    if (!Number.isInteger(parsedElectionId) || parsedElectionId <= 0) {
      setVerificationError('Select an active election before verifying the candidate.')
      return
    }

    setIsVerifying(true)
    setVerificationError('')
    setFormError('')
    setSelectedCandidate(null)
    try {
      const candidates = await candidateService.getAllCandidates()
      const candidate = candidates.find((item) =>
        normalizeIdentifier(item.nin) === identifier ||
        normalizeIdentifier(item.phoneNo) === identifier
      )
      if (!candidate) {
        throw new Error('No candidate found with that NIN or phone number.')
      }

      const registration = await leadersService.checkLeadershipRegistration({
        candidate_id: Number(candidate.id),
        election_id: parsedElectionId
      })
      if (!registration.can_register) {
        throw new Error(registration.message || 'This candidate is already registered for a leadership position in this election.')
      }

      setSelectedCandidate(candidate)
      const candidatePartyId = Number(candidate.party_id)
      setPartyId(parties.some((party) => party.id === candidatePartyId) ? String(candidatePartyId) : '')
      setOfficeId(offices.length === 1 ? String(offices[0].id) : '')
    } catch (verificationFailure) {
      setVerificationError(verificationFailure instanceof Error ? verificationFailure.message : 'Candidate verification failed.')
    } finally {
      setIsVerifying(false)
    }
  }

  const addElectedLeader = async () => {
    if (!selectedCandidate) {
      setFormError('Verify a candidate before adding them.')
      return
    }

    const payload: AddElectedPresidencyData = {
      candidate_id: Number(selectedCandidate.id),
      office_id: Number(officeId),
      party_id: Number(partyId),
      election_id: Number(electionId),
      start_date: startDate,
      end_date: endDate,
      tenure: tenure.trim(),
      remark: remark.trim()
    }
    if (!Number.isInteger(payload.office_id) || payload.office_id <= 0) {
      setFormError('Select a presidency office.')
      return
    }
    if (!Number.isInteger(payload.party_id) || payload.party_id <= 0) {
      setFormError('Select a political party.')
      return
    }
    if (!Number.isInteger(payload.election_id) || payload.election_id <= 0) {
      setFormError('Select an active election.')
      return
    }
    if (!payload.start_date || !payload.end_date || !payload.tenure) {
      setFormError('Complete the start date, end date, and tenure fields.')
      return
    }
    if (payload.end_date < payload.start_date) {
      setFormError('The end date must be after the start date.')
      return
    }

    setIsSaving(true)
    setFormError('')
    try {
      const registration = await leadersService.checkLeadershipRegistration({
        candidate_id: payload.candidate_id,
        election_id: payload.election_id
      })
      if (!registration.can_register) {
        throw new Error(registration.message || 'This candidate is already assigned to a leadership position for the selected election.')
      }
      await leadersService.addElectedPresidency(payload)
      setIsAddOpen(false)
      resetAddForm()
      setReloadKey((key) => key + 1)
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : 'Unable to add elected presidency leader.')
    } finally {
      setIsSaving(false)
    }
  }

  const openEditDialog = async (leader: ElectedLeader) => {
    setEditingLeader(leader)
    setEditElectionId(String(leader.election_id ?? leader.election?.id ?? ''))
    setEditOfficeId(String(leader.office_id ?? leader.office?.id ?? ''))
    setEditPartyId(String(leader.party_id ?? leader.party?.id ?? ''))
    setEditStartDate(leader.start_date?.slice(0, 10) ?? '')
    setEditEndDate(leader.end_date?.slice(0, 10) ?? '')
    setEditTenure(leader.tenure ?? '')
    setEditRemark(leader.remark ?? '')
    setEditError('')
    setIsLoadingEditOptions(true)

    const [electionResult, officeResult, partyResult] = await Promise.allSettled([
      electionService.getActiveElections(),
      electionService.getPresidencyOffices(),
      partyService.getAllParties()
    ])
    const errors: string[] = []

    if (electionResult.status === 'fulfilled') {
      const elections = [...electionResult.value]
      const leaderElectionId = Number(leader.election_id ?? leader.election?.id)
      if (leaderElectionId && !elections.some((election) => election.id === leaderElectionId)) {
        elections.push({
          id: leaderElectionId,
          year: Number(leader.election?.year) || leaderElectionId,
          details: leader.election?.details,
          status: ''
        })
      }
      setActiveElections(elections)
    } else {
      errors.push(electionResult.reason instanceof Error ? electionResult.reason.message : 'Unable to load elections.')
    }

    if (officeResult.status === 'fulfilled') {
      const availableOffices = [...officeResult.value]
      const leaderOfficeId = Number(leader.office_id ?? leader.office?.id)
      if (leaderOfficeId && !availableOffices.some((office) => office.id === leaderOfficeId)) {
        availableOffices.push({
          id: leaderOfficeId,
          title: leader.office?.title ?? leader.position,
          status: 1
        })
      }
      setOffices(availableOffices)
    } else {
      errors.push(officeResult.reason instanceof Error ? officeResult.reason.message : 'Unable to load presidency offices.')
    }

    if (partyResult.status === 'fulfilled') {
      const availableParties = [...partyResult.value]
      const leaderPartyId = Number(leader.party_id ?? leader.party?.id)
      if (leaderPartyId && !availableParties.some((party) => party.id === leaderPartyId)) {
        availableParties.push({
          id: leaderPartyId,
          name: leader.party?.name ?? leader.partyName ?? 'Current party',
          description: '',
          slogan: '',
          philosophy: '',
          address: null,
          status: 1,
          registrationYear: null,
          logopath: leader.party?.logopath ?? leader.partyLogo ?? null,
          created_at: null,
          updated_at: null
        })
      }
      setParties(availableParties)
    } else {
      errors.push(partyResult.reason instanceof Error ? partyResult.reason.message : 'Unable to load political parties.')
    }

    setEditError(errors.join(' '))
    setIsLoadingEditOptions(false)
  }

  const updateElectedLeader = async () => {
    if (!editingLeader) return
    const payload: UpdateElectedPresidencyData = {
      candidate_id: Number(editingLeader.candidate_id ?? editingLeader.candidateId ?? editingLeader.candidate?.id),
      office_id: Number(editOfficeId),
      party_id: Number(editPartyId),
      election_id: Number(editElectionId),
      start_date: editStartDate,
      end_date: editEndDate,
      tenure: editTenure.trim(),
      remark: editRemark.trim()
    }

    if (!Number.isInteger(payload.candidate_id) || payload.candidate_id <= 0 ||
      !Number.isInteger(payload.office_id) || payload.office_id <= 0 ||
      !Number.isInteger(payload.party_id) || payload.party_id <= 0 ||
      !Number.isInteger(payload.election_id) || payload.election_id <= 0) {
      setEditError('Select a valid election, office, and political party.')
      return
    }
    if (!payload.start_date || !payload.end_date || !payload.tenure) {
      setEditError('Complete the start date, end date, and tenure fields.')
      return
    }
    if (payload.end_date < payload.start_date) {
      setEditError('The end date must be after the start date.')
      return
    }

    const leaderId = Number(editingLeader.id)
    if (!Number.isInteger(leaderId) || leaderId <= 0) {
      setEditError('This elected leader record has an invalid ID.')
      return
    }

    setIsUpdating(true)
    setEditError('')
    try {
      await leadersService.updateElectedPresidency(leaderId, payload)
      setEditingLeader(null)
      setReloadKey((key) => key + 1)
    } catch (updateError) {
      setEditError(updateError instanceof Error ? updateError.message : 'Unable to update elected presidency leader.')
    } finally {
      setIsUpdating(false)
    }
  }

  const getLeaderForRole = (roleMatches: string[]) =>
    leaders.find((leader) => {
      const office = (leader.office?.title ?? leader.position ?? '').toLowerCase().trim()
      return roleMatches.some((role) =>
        (office === role || office.includes(role)) &&
        !(role === 'president' && office.includes('vice'))
      )
    })

  return (
    <div className="space-y-6 p-4 md:p-0">
      <Link to="/k8s9d7f3-districts/presidency" className="inline-flex items-center gap-2 text-sm font-medium text-[#146c4f] hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to Presidency
      </Link>

      <Card className="border border-gray-100 shadow-md">
        <CardContent className="p-0">
          <div className="flex flex-col gap-4 border-b border-gray-100 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Active Elected Leaders</p>
                <h1 className="mt-1 text-2xl font-bold text-gray-900">Manage Elected Presidency</h1>
                <p className="text-sm text-gray-500">
                  {selectedElection
                    ? `President and Vice President for the ${selectedElection.year} election`
                    : 'Current President and Vice President'}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:items-end">
              <Can permission={Permissions.CREATE_LEADER}>
                <Button type="button" className="bg-[#146c4f] hover:bg-[#10563f]" onClick={() => void openAddDialog()}>
                  <Plus className="mr-2 h-4 w-4" aria-hidden="true" /> Add Elected Leader
                </Button>
              </Can>
              <div className="flex flex-wrap items-end justify-end gap-2">
                <label className="space-y-1 text-xs font-medium text-gray-600">
                  Election year
                  <Input
                    aria-label="Enter election year to search elected presidency"
                    className="h-9 w-36"
                    type="number"
                    inputMode="numeric"
                    placeholder="Election year"
                    value={electionYearSearch}
                    onChange={(event) => {
                      setElectionYearSearch(event.target.value)
                      setSearchError('')
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        void searchElectedPresidency()
                      }
                    }}
                    disabled={isSearching}
                  />
                </label>
                <Button type="button" size="sm" variant="outline" onClick={() => void searchElectedPresidency()} disabled={isSearching}>
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="mr-2 h-4 w-4" aria-hidden="true" /> Search</>}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={showActivePresidency} disabled={isSearching}>
                  <X className="mr-2 h-4 w-4" aria-hidden="true" /> Show Active
                </Button>
                <Button type="button" variant="outline" onClick={() => setReloadKey((key) => key + 1)} disabled={loading}>
                  {loading
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <><RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" /> Refresh</>}
                </Button>
              </div>
            </div>
          </div>

          {searchError && <div role="alert" className="px-6 pt-4 text-sm text-red-600">{searchError}</div>}
          {loading ? (
            <div role="status" className="flex items-center justify-center gap-2 p-16 text-sm text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin text-[#146c4f]" />
              {selectedElection ? `Loading elected presidency for ${selectedElection.year}...` : 'Loading active presidency...'}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-4 p-12 text-center">
              <p role="alert" className="text-sm text-red-600">{error}</p>
              <Button type="button" variant="outline" onClick={() => setReloadKey((key) => key + 1)}>
                <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" /> Try again
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-2">
              {leadershipRoles.map((role) => (
                <LeaderCard
                  key={role.title}
                  role={role.title}
                  leader={getLeaderForRole(role.matches)}
                  onEdit={(leader) => void openEditDialog(leader)}
                  onTerminate={(leader) => {
                    setTerminateError('')
                    setTerminatingLeader(leader)
                  }}
                  onDelete={(leader) => {
                    setDeleteError('')
                    setPendingDeleteLeader(leader)
                  }}
                  isDeleting={deletingLeaderId === Number(getLeaderForRole(role.matches)?.id)}
                  isTerminating={isTerminating && Number(terminatingLeader?.id) === Number(getLeaderForRole(role.matches)?.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isAddOpen}
        onOpenChange={(open) => {
          if (!open && !isSaving) {
            setIsAddOpen(false)
            resetAddForm()
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Elected Presidency Leader</DialogTitle>
            <DialogDescription>
              Select an active election, verify a candidate, and complete their presidency term details.
            </DialogDescription>
          </DialogHeader>
          {isLoadingOptions ? (
            <div role="status" className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin text-[#146c4f]" />
              Loading active elections and form options...
            </div>
          ) : (
            <div className="space-y-4">
              {optionsError && <p role="alert" className="text-sm text-red-600">{optionsError}</p>}
              <div>
                <label htmlFor="presidency-leader-election" className="mb-1 block text-sm font-medium">Active election *</label>
                <select
                  id="presidency-leader-election"
                  value={electionId}
                  onChange={(event) => {
                    setElectionId(event.target.value)
                    setSelectedCandidate(null)
                    setVerificationError('')
                  }}
                  disabled={activeElections.length === 0 || Boolean(selectedCandidate)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">Select active election</option>
                  {activeElections.map((election) => (
                    <option key={election.id} value={election.id}>
                      {election.year}{election.details ? ` - ${election.details}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {!selectedCandidate ? (
                <div>
                  <label htmlFor="presidency-leader-candidate" className="mb-1 block text-sm font-medium">Candidate NIN or phone number *</label>
                  <div className="flex gap-2">
                    <Input
                      id="presidency-leader-candidate"
                      value={candidateIdentifier}
                      onChange={(event) => {
                        setCandidateIdentifier(event.target.value)
                        setVerificationError('')
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          void findCandidate()
                        }
                      }}
                      placeholder="Enter candidate NIN or phone number"
                      disabled={!electionId || isVerifying}
                    />
                    <Can permission={Permissions.UPDATE_LEADER}>
                      <Button
                        type="button"
                        onClick={() => void findCandidate()}
                        disabled={isVerifying || !electionId}
                      >
                        {isVerifying
                          ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Checking</>
                          : <><Search className="h-4 w-4" aria-hidden="true" /> Verify</>}
                      </Button>
                    </Can>
                  </div>
                  {verificationError && <p role="alert" className="mt-2 text-sm text-red-600">{verificationError}</p>}
                </div>
              ) : (
                <>
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <div className="mb-3 flex items-center gap-3">
                      <Avatar className="h-14 w-14 border">
                        <AvatarImage src={getLogoUrl(selectedCandidate.image) ?? undefined} alt={selectedCandidate.full_name} />
                        <AvatarFallback>{selectedCandidate.full_name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-gray-900">{selectedCandidate.full_name}</p>
                        <p className="flex items-center gap-1 text-sm text-green-700">
                          <CheckCircle2 className="h-4 w-4" /> Candidate verified for this election
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-2 text-sm sm:grid-cols-2">
                      <p><span className="font-medium">NIN:</span> {selectedCandidate.nin || 'Not available'}</p>
                      <p><span className="font-medium">Phone:</span> {selectedCandidate.phoneNo || 'Not available'}</p>
                      <p><span className="font-medium">Email:</span> {selectedCandidate.email || 'Not available'}</p>
                      <p><span className="font-medium">Party:</span> {selectedCandidate.party?.name || selectedCandidate.political_party || 'Not available'}</p>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="presidency-leader-office" className="mb-1 block text-sm font-medium">Office *</label>
                    <select
                      id="presidency-leader-office"
                      value={officeId}
                      onChange={(event) => setOfficeId(event.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select office</option>
                      {offices.map((office) => (
                        <option key={office.id} value={office.id}>{office.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="presidency-leader-party" className="mb-1 block text-sm font-medium">Political party *</label>
                    <select
                      id="presidency-leader-party"
                      value={partyId}
                      onChange={(event) => setPartyId(event.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select political party</option>
                      {parties.map((party) => (
                        <option key={party.id} value={party.id}>{party.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="presidency-leader-start" className="mb-1 block text-sm font-medium">Start date *</label>
                      <Input id="presidency-leader-start" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
                    </div>
                    <div>
                      <label htmlFor="presidency-leader-end" className="mb-1 block text-sm font-medium">End date *</label>
                      <Input id="presidency-leader-end" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="presidency-leader-tenure" className="mb-1 block text-sm font-medium">Tenure *</label>
                    <Input
                      id="presidency-leader-tenure"
                      value={tenure}
                      onChange={(event) => setTenure(event.target.value)}
                      placeholder="e.g. 2027-2031"
                    />
                  </div>
                  <div>
                    <label htmlFor="presidency-leader-remark" className="mb-1 block text-sm font-medium">Remark</label>
                    <Textarea
                      id="presidency-leader-remark"
                      value={remark}
                      onChange={(event) => setRemark(event.target.value)}
                      placeholder="Enter any administrative notes"
                      rows={3}
                    />
                  </div>
                  {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}
                  <DialogFooter className="gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSelectedCandidate(null)
                        setVerificationError('')
                        setFormError('')
                      }}
                      disabled={isSaving}
                    >
                      Back
                    </Button>
                    <Can permission={Permissions.CREATE_LEADER}>
                      <Button
                        type="button"
                        onClick={() => void addElectedLeader()}
                        disabled={isSaving}
                        className="bg-[#146c4f] hover:bg-[#10563f]"
                      >
                        {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> Adding...</> : 'Add Elected Leader'}
                      </Button>
                    </Can>
                  </DialogFooter>
                </>
              )}

              {!selectedCandidate && (
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => {
                    setIsAddOpen(false)
                    resetAddForm()
                  }}>
                    Cancel
                  </Button>
                </DialogFooter>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editingLeader)}
        onOpenChange={(open) => {
          if (!open && !isUpdating) setEditingLeader(null)
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Elected Presidency Leader</DialogTitle>
            <DialogDescription>
              Update the elected leader’s election, office, party, and term details.
            </DialogDescription>
          </DialogHeader>
          {isLoadingEditOptions ? (
            <div role="status" className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin text-[#146c4f]" />
              Loading edit options...
            </div>
          ) : (
            <div className="space-y-4">
              {editingLeader && (
                <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4">
                  <Avatar className="h-12 w-12 border">
                    <AvatarImage src={getLogoUrl(editingLeader.candidate?.image) ?? undefined} alt={getCandidateName(editingLeader)} />
                    <AvatarFallback>{getCandidateName(editingLeader).slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <p className="font-semibold text-gray-900">{getCandidateName(editingLeader)}</p>
                </div>
              )}
              <div>
                <label htmlFor="edit-elected-election" className="mb-1 block text-sm font-medium">Election *</label>
                <select
                  id="edit-elected-election"
                  value={editElectionId}
                  onChange={(event) => setEditElectionId(event.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select election</option>
                  {activeElections.map((election) => (
                    <option key={election.id} value={election.id}>
                      {election.year}{election.details ? ` - ${election.details}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="edit-elected-office" className="mb-1 block text-sm font-medium">Office *</label>
                <select
                  id="edit-elected-office"
                  value={editOfficeId}
                  onChange={(event) => setEditOfficeId(event.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select office</option>
                  {offices.map((office) => (
                    <option key={office.id} value={office.id}>{office.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="edit-elected-party" className="mb-1 block text-sm font-medium">Political party *</label>
                <select
                  id="edit-elected-party"
                  value={editPartyId}
                  disabled
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">Select political party</option>
                  {parties.map((party) => (
                    <option key={party.id} value={party.id}>{party.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="edit-elected-start" className="mb-1 block text-sm font-medium">Start date *</label>
                  <Input id="edit-elected-start" type="date" value={editStartDate} onChange={(event) => setEditStartDate(event.target.value)} />
                </div>
                <div>
                  <label htmlFor="edit-elected-end" className="mb-1 block text-sm font-medium">End date *</label>
                  <Input id="edit-elected-end" type="date" value={editEndDate} onChange={(event) => setEditEndDate(event.target.value)} />
                </div>
              </div>
              <div>
                <label htmlFor="edit-elected-tenure" className="mb-1 block text-sm font-medium">Tenure *</label>
                <Input id="edit-elected-tenure" value={editTenure} onChange={(event) => setEditTenure(event.target.value)} placeholder="e.g. 2027-2031" />
              </div>
              <div>
                <label htmlFor="edit-elected-remark" className="mb-1 block text-sm font-medium">Remark</label>
                <Textarea id="edit-elected-remark" value={editRemark} onChange={(event) => setEditRemark(event.target.value)} placeholder="Enter any administrative notes" rows={3} />
              </div>
              {editError && <p role="alert" className="text-sm text-red-600">{editError}</p>}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingLeader(null)} disabled={isUpdating}>
                  Cancel
                </Button>
                <Can permission={Permissions.UPDATE_LEADER}>
                  <Button
                    type="button"
                    onClick={() => void updateElectedLeader()}
                    disabled={isUpdating || isLoadingEditOptions}
                    className="bg-[#146c4f] hover:bg-[#10563f]"
                  >
                    {isUpdating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> Saving...</> : 'Save changes'}
                  </Button>
                </Can>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(pendingDeleteLeader)}
        onOpenChange={(open) => {
          if (!open && deletingLeaderId === null) {
            setPendingDeleteLeader(null)
            setDeleteError('')
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove elected presidency leader?</DialogTitle>
            <DialogDescription>
              This will remove {pendingDeleteLeader ? getCandidateName(pendingDeleteLeader) : 'this elected leader'} from the elected presidency. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteError && <p role="alert" className="text-sm text-red-600">{deleteError}</p>}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setPendingDeleteLeader(null)
                setDeleteError('')
              }}
              disabled={deletingLeaderId !== null}
            >
              Cancel
            </Button>
            <Can permission={Permissions.DELETE_LEADER}>
              <Button
                type="button"
                variant="destructive"
                onClick={() => void removeElectedLeader()}
                disabled={deletingLeaderId !== null}
              >
                {deletingLeaderId !== null
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> Removing...</>
                  : <><Trash2 className="mr-2 h-4 w-4" aria-hidden="true" /> Remove elected leader</>}
              </Button>
            </Can>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(terminatingLeader)}
        onOpenChange={(open) => {
          if (!open && !isTerminating) {
            setTerminatingLeader(null)
            setTerminateError('')
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Terminate elected presidency leader</DialogTitle>
            <DialogDescription>
              Are you sure you want to terminate {terminatingLeader ? getCandidateName(terminatingLeader) : 'this elected leader'}?
            </DialogDescription>
          </DialogHeader>
          {terminateError && <div role="alert" className="text-sm text-red-600">{terminateError}</div>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setTerminatingLeader(null)} disabled={isTerminating}>
              Cancel
            </Button>
            <Can permission={Permissions.DELETE_LEADER}>
              <Button type="button" variant="destructive" onClick={() => void terminateElectedLeader()} disabled={isTerminating}>
                {isTerminating && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                {isTerminating ? 'Terminating...' : 'Terminate'}
              </Button>
            </Can>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
