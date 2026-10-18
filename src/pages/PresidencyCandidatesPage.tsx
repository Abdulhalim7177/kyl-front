import { useEffect, useState } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, MapPin, Pencil, RefreshCw, Search, Trash2, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { getLogoUrl, getPartyLogoValue } from '@/lib/utils'
import { candidateService, CandidateDetail } from '@/services/candidates'
import { partyService, Party } from '@/services/parties'
import {
  AddPresidencyCandidateData,
  electionService,
  Election,
  Office,
  PaginatedPresidencyCandidates,
  PresidencyCandidate,
  UpdatePresidencyCandidateData,
} from '@/services/elections'
import Can from '@/components/Can'
import { Permissions } from '@/lib/permissions'

type PresidencyOffice = { id: number; title: string }

const normalizeCandidateIdentifier = (value: string | number | undefined) =>
  String(value ?? '').replace(/\D/g, '')

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()

function CandidateCard({
  candidate,
  onEdit,
  onDelete
}: {
  candidate: PresidencyCandidate
  onEdit: (candidate: PresidencyCandidate) => void
  onDelete: (candidate: PresidencyCandidate) => void
}) {
  const imageUrl = getLogoUrl(candidate.candidate.image?.image_path)
  const partyLogoUrl = getLogoUrl(candidate.party.logopath)
  const election = candidate.election.year
    ? `${candidate.election.year}${candidate.election.details ? ` - ${candidate.election.details}` : ''}`
    : candidate.election.details ?? 'N/A'

  return (
    <Card className="h-full min-w-0 overflow-hidden border border-gray-100 shadow-md">
      <div className="h-2 bg-gradient-to-r from-[#146c4f] to-emerald-300" />
      <CardContent className="p-4 sm:p-8">
        <div className="mb-4 flex items-center justify-between gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${candidate.status?.toLowerCase() === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
            {candidate.status || 'Active'}
          </span>
          <div className="flex shrink-0 gap-1 sm:gap-2">
            <Can permission={Permissions.UPDATE_CANDIDATE}>
            <Button
              type="button"
              size="sm"
              variant="outline"
              aria-label={`Edit ${candidate.candidate.fullName}`}
              title="Edit candidate"
              className="h-8 px-2 sm:h-9 sm:px-3"
              onClick={() => onEdit(candidate)}
            >
              <Pencil aria-hidden="true" className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
            </Can>
            <Can permission={Permissions.DELETE_CANDIDATE}>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              aria-label={`Delete ${candidate.candidate.fullName}`}
              title="Delete candidate"
              className="h-8 px-2 sm:h-9 sm:px-3"
              onClick={() => onDelete(candidate)}
            >
              <Trash2 aria-hidden="true" className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
            </Can>
          </div>
        </div>
        <div className="flex flex-col items-center text-center">
          <Avatar className="h-28 w-28 border-4 border-white shadow-lg ring-2 ring-[#146c4f]/20">
            {imageUrl && <AvatarImage src={imageUrl} alt={candidate.candidate.fullName} className="object-cover" />}
            <AvatarFallback className="bg-[#146c4f]/10 text-2xl font-bold text-[#146c4f]">
              {getInitials(candidate.candidate.fullName) || 'C'}
            </AvatarFallback>
          </Avatar>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-[#146c4f]">{candidate.office.title}</p>
          <h2 className="mt-2 break-words text-2xl font-bold text-gray-900">{candidate.candidate.fullName || 'Candidate'}</h2>
        </div>
        <div className="mt-7 grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Political Party</p>
            <div className="mt-2 flex min-w-0 items-center gap-3">
              <Avatar className="h-12 w-12 shrink-0 border border-gray-200 bg-white">
                {partyLogoUrl && <AvatarImage src={partyLogoUrl} alt={`${candidate.party.name} logo`} className="object-contain p-1" />}
                <AvatarFallback className="text-sm font-bold text-gray-500">
                  {candidate.party.name.charAt(0)?.toUpperCase() || 'P'}
                </AvatarFallback>
              </Avatar>
              <p className="truncate font-semibold text-gray-800">{candidate.party.name}</p>
            </div>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Election</p>
            <p className="mt-2 font-semibold text-gray-800">{election}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Phone</p>
            <p className="mt-2 break-words font-semibold text-gray-800">{candidate.candidate.phoneNo || 'Not specified'}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Email</p>
            <p className="mt-2 break-all font-semibold text-gray-800">{candidate.candidate.email || 'Not specified'}</p>
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
}
export default function PresidencyCandidatesPage() {
  const [candidatesPage, setCandidatesPage] = useState<PaginatedPresidencyCandidates | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchElectionYear, setSearchElectionYear] = useState('')
  const [appliedElectionId, setAppliedElectionId] = useState<number | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [activeElections, setActiveElections] = useState<Election[]>([])
  const [presidencyOffices, setPresidencyOffices] = useState<PresidencyOffice[]>([])
  const [parties, setParties] = useState<Party[]>([])
  const [isLoadingFormOptions, setIsLoadingFormOptions] = useState(false)
  const [formOptionsError, setFormOptionsError] = useState('')
  const [candidateIdentifier, setCandidateIdentifier] = useState('')
  const [electionId, setElectionId] = useState('')
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateDetail | null>(null)
  const [officeId, setOfficeId] = useState('')
  const [partyId, setPartyId] = useState('')
  const [manifesto, setManifesto] = useState('')
  const [verificationError, setVerificationError] = useState('')
  const [formError, setFormError] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingCandidate, setEditingCandidate] = useState<PresidencyCandidate | null>(null)
  const [editElectionId, setEditElectionId] = useState('')
  const [editOfficeId, setEditOfficeId] = useState('')
  const [editPartyId, setEditPartyId] = useState('')
  const [editManifesto, setEditManifesto] = useState('')
  const [isLoadingEditOptions, setIsLoadingEditOptions] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [editError, setEditError] = useState('')
  const [deletingCandidate, setDeletingCandidate] = useState<PresidencyCandidate | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    let isCurrentRequest = true

    const loadCandidates = async () => {
      setLoading(true)
      setError(null)

      try {
        const result = appliedElectionId === null
          ? await electionService.getActiveElectionPresidency(currentPage)
          : await electionService.getElectionPresidencyCandidates(appliedElectionId, currentPage)
        if (isCurrentRequest) {
          setCandidatesPage(result.data)
        }
      } catch (err) {
        console.error('Failed to load presidency candidates:', err)
        if (isCurrentRequest) {
          setError(err instanceof Error ? err.message : 'Failed to load presidential candidates.')
        }
      } finally {
        if (isCurrentRequest) {
          setLoading(false)
        }
      }
    }

    void loadCandidates()
    return () => {
      isCurrentRequest = false
    }
  }, [appliedElectionId, currentPage, reloadKey])

  const searchCandidatesByElectionYear = async () => {
    const year = searchElectionYear.trim()
    if (!year) {
      setError('Enter an election year to search.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const elections = await electionService.getAllElections()
      const election = elections.find((item) => String(item.year).trim() === year)
      if (!election) {
        setCandidatesPage(null)
        setError(`No election was found for ${year}.`)
        setLoading(false)
        return
      }

      setCurrentPage(1)
      if (appliedElectionId === election.id && currentPage === 1) {
        setReloadKey((key) => key + 1)
      }
      setAppliedElectionId(election.id)
    } catch (searchError) {
      console.error('Failed to search presidency candidates by election year:', searchError)
      setError(searchError instanceof Error ? searchError.message : 'Unable to search by election year.')
      setLoading(false)
    }
  }

  const showActiveCandidates = () => {
    setSearchElectionYear('')
    setError(null)
    setCurrentPage(1)
    if (appliedElectionId === null && currentPage === 1) {
      setReloadKey((key) => key + 1)
    }
    setAppliedElectionId(null)
  }

  const resetAddForm = () => {
    setCandidateIdentifier('')
    setElectionId('')
    setSelectedCandidate(null)
    setOfficeId('')
    setPartyId('')
    setManifesto('')
    setVerificationError('')
    setFormError('')
    setFormOptionsError('')
    setActiveElections([])
    setPresidencyOffices([])
    setParties([])
  }

  const handleAddDialogChange = (open: boolean) => {
    setIsAddOpen(open)
    if (!open && !isSaving) resetAddForm()
  }

  const openAddDialog = async () => {
    resetAddForm()
    setIsAddOpen(true)
    setIsLoadingFormOptions(true)

    const [electionResult, officeResult, partyResult] = await Promise.allSettled([
      electionService.getActiveElections(),
      electionService.getAllOffices(),
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
      const offices = officeResult.value
        .map((office: Office) => ({
          id: Number(office.id),
          title: String(office.name ?? office.title ?? ''),
          status: office.status
        }))
        .filter((office) =>
          Number.isInteger(office.id) &&
          office.id > 0 &&
          /president/i.test(office.title) &&
          office.status !== 0 &&
          office.status !== '0'
        )
        .map(({ id, title }) => ({ id, title }))
      setPresidencyOffices(offices)
      if (offices.length === 0) errors.push('No active presidential offices were returned by the API.')
    } else {
      errors.push(officeResult.reason instanceof Error ? officeResult.reason.message : 'Unable to load presidential offices.')
    }

    if (partyResult.status === 'fulfilled') {
      const availableParties = partyResult.value.filter((party) => party.status === 1 || party.status === true)
      setParties(availableParties)
      if (availableParties.length === 0) errors.push('No active political parties are available.')
    } else {
      errors.push(partyResult.reason instanceof Error ? partyResult.reason.message : 'Unable to load political parties.')
    }

    setFormOptionsError(errors.join(' '))
    setIsLoadingFormOptions(false)
  }

  const verifyCandidate = async () => {
    const parsedElectionId = Number(electionId)
    const identifier = normalizeCandidateIdentifier(candidateIdentifier)
    if (!identifier) {
      setVerificationError('Enter the candidate phone number or NIN.')
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
      const match = candidates.find((candidate) =>
        normalizeCandidateIdentifier(candidate.nin) === identifier ||
        normalizeCandidateIdentifier(candidate.phoneNo) === identifier
      )
      if (!match) {
        throw new Error('No candidate matched that phone number or NIN. Check the number or make sure the candidate profile exists.')
      }

      const candidateId = Number(match.id)
      if (!Number.isInteger(candidateId) || candidateId <= 0) {
        throw new Error('The matching candidate record has an invalid ID.')
      }

      const [candidate] = await Promise.all([
        candidateService.getCandidateById(candidateId),
        electionService.checkCandidateRegistration({
          candidate_id: candidateId,
          election_id: parsedElectionId
        })
      ])
      setSelectedCandidate(candidate)
      const assignedPartyId = Number(candidate.party_id ?? candidate.party?.id)
      setPartyId(
        parties.some((party) => party.id === assignedPartyId)
          ? String(assignedPartyId)
          : ''
      )
      setOfficeId(presidencyOffices.length === 1 ? String(presidencyOffices[0].id) : '')
    } catch (verificationFailure) {
      setVerificationError(
        verificationFailure instanceof Error
          ? verificationFailure.message
          : 'Candidate verification failed.'
      )
    } finally {
      setIsVerifying(false)
    }
  }

  const addCandidate = async () => {
    if (!selectedCandidate) {
      setFormError('Verify a candidate before adding them.')
      return
    }
    const data: AddPresidencyCandidateData = {
      candidate_id: selectedCandidate.id,
      office_id: Number(officeId),
      party_id: Number(partyId),
      election_id: Number(electionId),
      manifesto: manifesto.trim()
    }
    if (!Number.isInteger(data.office_id) || data.office_id <= 0) {
      setFormError('Select a presidential office.')
      return
    }
    if (!Number.isInteger(data.party_id) || data.party_id <= 0) {
      setFormError('Select a political party.')
      return
    }
    if (!Number.isInteger(data.election_id) || data.election_id <= 0) {
      setFormError('Select an active election.')
      return
    }

    setIsSaving(true)
    setFormError('')
    try {
      await electionService.checkCandidateRegistration({
        candidate_id: data.candidate_id,
        election_id: data.election_id
      })
      await electionService.addPresidencyCandidate(data)
      setIsAddOpen(false)
      resetAddForm()
      setCurrentPage(1)
      setReloadKey((key) => key + 1)
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : 'Unable to add presidential candidate.')
    } finally {
      setIsSaving(false)
    }
  }

  const openEditDialog = async (candidate: PresidencyCandidate) => {
    setEditingCandidate(candidate)
    setEditElectionId(String(candidate.election_id))
    setEditOfficeId(String(candidate.office_id))
    setEditPartyId(String(candidate.party_id))
    setEditManifesto(candidate.manifesto ?? '')
    setEditError('')
    setIsLoadingEditOptions(true)

    const [electionResult, officeResult, partyResult] = await Promise.allSettled([
      electionService.getActiveElections(),
      electionService.getAllOffices(),
      partyService.getAllParties()
    ])
    const errors: string[] = []

    if (electionResult.status === 'fulfilled') {
      const elections = electionResult.value
      const currentElection = candidate.election
      if (!elections.some((election) => election.id === candidate.election_id)) {
        elections.push({
          id: candidate.election_id,
          year: Number(currentElection.year) || candidate.election_id,
          details: currentElection.details ?? undefined,
          status: ''
        })
      }
      setActiveElections(elections)
    } else {
      errors.push(electionResult.reason instanceof Error ? electionResult.reason.message : 'Unable to load elections.')
    }

    if (officeResult.status === 'fulfilled') {
      const offices = officeResult.value
        .map((office: Office) => ({
          id: Number(office.id),
          title: String(office.name ?? office.title ?? ''),
          status: office.status
        }))
        .filter((office) =>
          Number.isInteger(office.id) &&
          office.id > 0 &&
          /president/i.test(office.title) &&
          office.status !== 0 &&
          office.status !== '0'
        )
        .map(({ id, title }) => ({ id, title }))
      if (!offices.some((office) => office.id === candidate.office_id)) {
        offices.push({ id: candidate.office_id, title: candidate.office.title })
      }
      setPresidencyOffices(offices)
    } else {
      errors.push(officeResult.reason instanceof Error ? officeResult.reason.message : 'Unable to load presidential offices.')
    }

    if (partyResult.status === 'fulfilled') {
      const loadedParties = partyResult.value
      if (!loadedParties.some((party) => party.id === candidate.party_id)) {
        loadedParties.push({
          id: candidate.party_id,
          name: candidate.party.name,
          description: candidate.party.description ?? '',
          slogan: '',
          philosophy: '',
          address: null,
          status: 1,
          registrationYear: null,
          logopath: candidate.party.logopath ?? null,
          created_at: null,
          updated_at: null
        })
      }
      setParties(loadedParties)
    } else {
      errors.push(partyResult.reason instanceof Error ? partyResult.reason.message : 'Unable to load political parties.')
    }

    setEditError(errors.join(' '))
    setIsLoadingEditOptions(false)
  }

  const updateCandidate = async () => {
    if (!editingCandidate) return

    const data: UpdatePresidencyCandidateData = {
      candidate_id: editingCandidate.candidate_id,
      office_id: Number(editOfficeId),
      party_id: Number(editPartyId),
      election_id: Number(editElectionId),
      manifesto: editManifesto.trim()
    }
    if (!Number.isInteger(data.office_id) || data.office_id <= 0) {
      setEditError('Select a presidential office.')
      return
    }
    if (!Number.isInteger(data.party_id) || data.party_id <= 0) {
      setEditError('Select a political party.')
      return
    }
    if (!Number.isInteger(data.election_id) || data.election_id <= 0) {
      setEditError('Select an election.')
      return
    }

    setIsUpdating(true)
    setEditError('')
    try {
      await electionService.updatePresidencyCandidate(editingCandidate.id, data)
      setEditingCandidate(null)
      setReloadKey((key) => key + 1)
    } catch (updateError) {
      setEditError(updateError instanceof Error ? updateError.message : 'Unable to update presidential candidate.')
    } finally {
      setIsUpdating(false)
    }
  }

  const deleteCandidate = async () => {
    if (!deletingCandidate) return

    setIsDeleting(true)
    setDeleteError('')
    try {
      await electionService.removePresidencyCandidate(deletingCandidate.id)
      setDeletingCandidate(null)
      setReloadKey((key) => key + 1)
    } catch (removeError) {
      setDeleteError(removeError instanceof Error ? removeError.message : 'Unable to remove presidential candidate.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-0">
      <Link to="/k8s9d7f3-districts/presidency" className="inline-flex items-center gap-2 text-sm font-medium text-[#146c4f] hover:underline">
        <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Back to Presidency
      </Link>
      <Card className="border border-gray-100 shadow-md">
        <CardContent className="p-0">
          <div className="flex flex-col gap-4 border-b border-gray-100 p-4 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Presidential Candidates</p>
                <h1 className="mt-1 break-words text-xl font-bold text-gray-900 sm:text-2xl">Manage Presidential Candidates</h1>
                <p className="mt-1 text-sm text-gray-500">
                  {candidatesPage?.data[0]?.election.details
                    ?? (appliedElectionId === null ? 'Candidates in the active presidency election' : 'Candidates for the selected election')}
                </p>
              </div>
            </div>
            <div className="flex min-w-0 flex-col gap-3 lg:items-end">
              <Can permission={Permissions.CREATE_CANDIDATE}>
              <Button type="button" className="w-full bg-[#146c4f] hover:bg-[#10563f] lg:w-auto" onClick={() => void openAddDialog()}>
                Add Candidate
              </Button>
              </Can>
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end lg:justify-end">
                <label className="min-w-0 flex-1 space-y-1 text-xs font-medium text-gray-600 sm:min-w-36 sm:flex-none">
                  Election year
                  <Input
                    aria-label="Search candidates by election year"
                    type="text"
                    inputMode="numeric"
                    placeholder="Enter election year"
                    value={searchElectionYear}
                    onChange={(event) => setSearchElectionYear(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        void searchCandidatesByElectionYear()
                      }
                    }}
                    className="h-9 w-full sm:w-36"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={loading}
                    onClick={() => void searchCandidatesByElectionYear()}
                  >
                    {loading && appliedElectionId !== null
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <><Search aria-hidden="true" className="mr-2 h-4 w-4" /> Search</>}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={loading && appliedElectionId === null}
                    onClick={showActiveCandidates}
                  >
                    <X aria-hidden="true" className="mr-2 h-4 w-4" /> Show Active
                  </Button>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-2 sm:justify-start lg:ml-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 sm:mr-3">Matching Candidates</p>
                  <p className="font-semibold text-[#146c4f]">{candidatesPage?.total ?? 0} candidates</p>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex flex-col items-center gap-4 p-8 text-center">
              <p role="alert" className="text-sm text-red-600">{error}</p>
              <Button variant="outline" onClick={() => setReloadKey((key) => key + 1)}>
                <RefreshCw aria-hidden="true" className="mr-2 h-4 w-4" />
                Try again
              </Button>
            </div>
          )}
          {loading && (
            <div role="status" className="flex items-center justify-center gap-2 p-12 text-sm text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin text-[#146c4f]" />
              Loading candidates...
            </div>
          )}
          {!loading && !error && candidatesPage?.data.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              No candidates were found for the active presidency election.
            </div>
          )}
          {!loading && !error && candidatesPage && candidatesPage.data.length > 0 && (
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-6">
              {candidatesPage.data.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  onEdit={(selected) => void openEditDialog(selected)}
                  onDelete={(selected) => {
                    setDeleteError('')
                    setDeletingCandidate(selected)
                  }}
                />
              ))}
            </div>
          )}
          {!loading && !error && candidatesPage && candidatesPage.data.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-sm text-gray-500">
                Showing {(candidatesPage.current_page - 1) * candidatesPage.per_page + 1}–{Math.min(candidatesPage.current_page * candidatesPage.per_page, candidatesPage.total)} of {candidatesPage.total} candidates
              </p>
              <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={loading || !candidatesPage.prev_page_url}
                >
                  <ChevronLeft aria-hidden="true" className="mr-1 h-4 w-4" /> Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {candidatesPage.current_page} of {candidatesPage.last_page}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage((page) => Math.min(candidatesPage.last_page, page + 1))}
                  disabled={loading || !candidatesPage.next_page_url}
                >
                  Next <ChevronRight aria-hidden="true" className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={handleAddDialogChange}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Presidential Candidate</DialogTitle>
            <DialogDescription>
              {!selectedCandidate
                ? 'Select an active election and verify the candidate by ID to continue.'
                : 'Review the verified candidate and complete the presidential assignment.'}
            </DialogDescription>
          </DialogHeader>
          {isLoadingFormOptions ? (
            <div role="status" className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin text-[#146c4f]" />
              Loading active elections and form options...
            </div>
          ) : (
            <div className="space-y-4">
              {formOptionsError && <p role="alert" className="text-sm text-red-600">{formOptionsError}</p>}
              {!selectedCandidate ? (
                <>
                  <div>
                    <label htmlFor="presidency-election" className="mb-1 block text-sm font-medium">Active election *</label>
                    <select
                      id="presidency-election"
                      value={electionId}
                      onChange={(event) => {
                        setElectionId(event.target.value)
                        setVerificationError('')
                      }}
                      disabled={activeElections.length === 0}
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
                  <div>
                    <label htmlFor="presidency-candidate-identifier" className="mb-1 block text-sm font-medium">Candidate phone number or NIN *</label>
                    <div className="flex gap-2">
                      <Input
                        id="presidency-candidate-identifier"
                        type="text"
                        inputMode="numeric"
                        value={candidateIdentifier}
                        onChange={(event) => {
                          setCandidateIdentifier(event.target.value)
                          setVerificationError('')
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault()
                            void verifyCandidate()
                          }
                        }}
                        placeholder="Enter phone number or NIN"
                        className="flex-1"
                      />
                      <Can permission={Permissions.TOGGLE_CANDIDATE_STATUS}>
                      <Button
                        type="button"
                        onClick={() => void verifyCandidate()}
                        disabled={isVerifying || activeElections.length === 0 || presidencyOffices.length === 0}
                      >
                        {isVerifying ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying</> : 'Verify'}
                      </Button>
                      </Can>
                    </div>
                  </div>
                  {verificationError && <p role="alert" className="text-sm text-red-600">{verificationError}</p>}
                  <div className="flex justify-end">
                    <Button type="button" variant="outline" onClick={() => handleAddDialogChange(false)}>Cancel</Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <div className="mb-3 flex items-center gap-3">
                      <Avatar className="h-14 w-14 border">
                        <AvatarImage src={getLogoUrl(selectedCandidate.image) ?? undefined} alt={selectedCandidate.fullName} />
                        <AvatarFallback>{getInitials(selectedCandidate.fullName) || 'C'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{selectedCandidate.fullName}</p>
                        <p className="text-sm text-muted-foreground">Verified candidate • ID {selectedCandidate.id}</p>
                      </div>
                    </div>
                    <div className="grid gap-3 text-sm sm:grid-cols-2">
                      <p><span className="font-medium">NIN:</span> {selectedCandidate.nin || 'N/A'}</p>
                      <p><span className="font-medium">Phone:</span> {selectedCandidate.phoneNo || 'N/A'}</p>
                      <p><span className="font-medium">Email:</span> {selectedCandidate.email || 'N/A'}</p>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Party:</span>
                        <Avatar className="h-6 w-6 border">
                          {getPartyLogoValue(selectedCandidate.party) && (
                            <AvatarImage
                              src={getPartyLogoValue(selectedCandidate.party) ?? undefined}
                              alt={`${selectedCandidate.party?.name || 'Party'} logo`}
                            />
                          )}
                          <AvatarFallback className="text-[10px]">
                            {(selectedCandidate.party?.name || 'P').slice(0, 1).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{selectedCandidate.party?.name || parties.find((party) => party.id === Number(selectedCandidate.party_id))?.name || 'Not assigned'}</span>
                      </div>
                      <p><span className="font-medium">Election:</span> {activeElections.find((election) => election.id === Number(electionId))?.year ?? electionId}</p>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="presidency-office" className="mb-1 block text-sm font-medium">Office *</label>
                    <select
                      id="presidency-office"
                      value={officeId}
                      onChange={(event) => setOfficeId(event.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select office</option>
                      {presidencyOffices.map((office) => (
                        <option key={office.id} value={office.id}>{office.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="presidency-party" className="mb-1 block text-sm font-medium">Political party *</label>
                    <select
                      id="presidency-party"
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
                  <div>
                    <label htmlFor="presidency-manifesto" className="mb-1 block text-sm font-medium">Manifesto</label>
                    <Textarea
                      id="presidency-manifesto"
                      value={manifesto}
                      onChange={(event) => setManifesto(event.target.value)}
                      placeholder="Enter manifesto details"
                      rows={4}
                    />
                  </div>
                  {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}
                  <div className="flex justify-between gap-2">
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
                    <Can permission={Permissions.CREATE_CANDIDATE}>
                    <Button
                      type="button"
                      onClick={() => void addCandidate()}
                      disabled={isSaving}
                      className="bg-[#146c4f] hover:bg-[#10563f]"
                    >
                      {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</> : 'Add candidate'}
                    </Button>
                    </Can>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingCandidate)} onOpenChange={(open) => !open && !isUpdating && setEditingCandidate(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Presidential Candidate</DialogTitle>
            <DialogDescription>
              Update the candidate’s election, office, party, or manifesto details.
            </DialogDescription>
          </DialogHeader>
          {isLoadingEditOptions ? (
            <div role="status" className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin text-[#146c4f]" />
              Loading edit options...
            </div>
          ) : (
            <div className="space-y-4">
              {editingCandidate && (
                <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4">
                  <Avatar className="h-12 w-12 border">
                    <AvatarImage
                      src={getLogoUrl(editingCandidate.candidate.image?.image_path) ?? undefined}
                      alt={editingCandidate.candidate.fullName}
                    />
                    <AvatarFallback>{getInitials(editingCandidate.candidate.fullName) || 'C'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{editingCandidate.candidate.fullName}</p>
                  </div>
                </div>
              )}
              <div>
                <label htmlFor="edit-presidency-election" className="mb-1 block text-sm font-medium">Election *</label>
                <select
                  id="edit-presidency-election"
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
                <label htmlFor="edit-presidency-office" className="mb-1 block text-sm font-medium">Office *</label>
                <select
                  id="edit-presidency-office"
                  value={editOfficeId}
                  onChange={(event) => setEditOfficeId(event.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select office</option>
                  {presidencyOffices.map((office) => (
                    <option key={office.id} value={office.id}>{office.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="edit-presidency-party" className="mb-1 block text-sm font-medium">Political party *</label>
                <select
                  id="edit-presidency-party"
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
              <div>
                <label htmlFor="edit-presidency-manifesto" className="mb-1 block text-sm font-medium">Manifesto</label>
                <Textarea
                  id="edit-presidency-manifesto"
                  value={editManifesto}
                  onChange={(event) => setEditManifesto(event.target.value)}
                  placeholder="Enter manifesto details"
                  rows={4}
                />
              </div>
              {editError && <p role="alert" className="text-sm text-red-600">{editError}</p>}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingCandidate(null)}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Can permission={Permissions.UPDATE_CANDIDATE}>
                <Button
                  type="button"
                  onClick={() => void updateCandidate()}
                  disabled={isUpdating || isLoadingEditOptions}
                  className="bg-[#146c4f] hover:bg-[#10563f]"
                >
                  {isUpdating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save changes'}
                </Button>
                </Can>
              </div>
            </div>
          )}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove presidential candidate?</DialogTitle>
            <DialogDescription>
              This will remove {deletingCandidate?.candidate.fullName ?? 'this candidate'} from the presidential election. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteError && <p role="alert" className="text-sm text-red-600">{deleteError}</p>}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingCandidate(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Can permission={Permissions.DELETE_CANDIDATE}>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void deleteCandidate()}
              disabled={isDeleting}
            >
              {isDeleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Removing...</> : <><Trash2 aria-hidden="true" className="mr-2 h-4 w-4" /> Remove candidate</>}
            </Button>
            </Can>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
