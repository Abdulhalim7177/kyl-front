import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Ban, ChevronLeft, ChevronRight, Loader2, MapPin, Pencil, Plus, Trash2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { AddLgaCandidateData, Candidate, candidateService } from '@/services/candidates'
import { District, districtsService } from '@/services/districts'
import { AddElectedLgaChairmanData, ElectedLeader, ElectedLgaActionResponse, leadersService } from '@/services/leaders'
import { Election, electionService, StateOffice } from '@/services/elections'
import { partyService } from '@/services/parties'
import { getLogoUrl, getPartyLogoValue } from '@/lib/utils'

interface LgaLeadershipPageProps {
  mode: 'candidates' | 'elected'
}

export default function LgaLeadershipPage({ mode }: LgaLeadershipPageProps) {
  const { id } = useParams<{ id: string }>()
  const lgaId = Number(id)
  const [lga, setLga] = useState<District | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [leaders, setLeaders] = useState<ElectedLeader[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [detailsError, setDetailsError] = useState('')
  const [candidatePage, setCandidatePage] = useState(1)
  const [searchElectionYear, setSearchElectionYear] = useState('')
  const [searchPartyName, setSearchPartyName] = useState('')
  const [displayedElection, setDisplayedElection] = useState<{ id: number; year: string; partyId?: number } | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null)
  const [deletingCandidate, setDeletingCandidate] = useState<Candidate | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [editData, setEditData] = useState<AddLgaCandidateData>({
    candidate_id: 0,
    office_id: 0,
    party_id: 0,
    election_id: 0,
    lga_district_id: lgaId,
    manifesto: ''
  })
  const [editElections, setEditElections] = useState<Election[]>([])
  const [isLoadingEditOptions, setIsLoadingEditOptions] = useState(false)
  const [editError, setEditError] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [activeElections, setActiveElections] = useState<Election[]>([])
  const [lgaOffices, setLgaOffices] = useState<StateOffice[]>([])
  const [isLoadingElections, setIsLoadingElections] = useState(false)
  const [electionLoadError, setElectionLoadError] = useState('')
  const [officeLoadError, setOfficeLoadError] = useState('')
  const [electionId, setElectionId] = useState('')
  const [candidateSearch, setCandidateSearch] = useState('')
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [candidateSearchError, setCandidateSearchError] = useState('')
  const [candidateOfficeId, setCandidateOfficeId] = useState('')
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [manifesto, setManifesto] = useState('')
  const [isElectedAddOpen, setIsElectedAddOpen] = useState(false)
  const [isLoadingElectedOptions, setIsLoadingElectedOptions] = useState(false)
  const [electedElections, setElectedElections] = useState<Election[]>([])
  const [electedOffices, setElectedOffices] = useState<StateOffice[]>([])
  const [electedElectionId, setElectedElectionId] = useState('')
  const [electedOfficeId, setElectedOfficeId] = useState('')
  const [electedCandidateSearch, setElectedCandidateSearch] = useState('')
  const [electedCandidate, setElectedCandidate] = useState<Candidate | null>(null)
  const [isVerifyingElectedCandidate, setIsVerifyingElectedCandidate] = useState(false)
  const [electedVerifyError, setElectedVerifyError] = useState('')
  const [electedFormError, setElectedFormError] = useState('')
  const [electedOptionsError, setElectedOptionsError] = useState('')
  const [electedStartDate, setElectedStartDate] = useState('')
  const [electedEndDate, setElectedEndDate] = useState('')
  const [electedTenure, setElectedTenure] = useState('')
  const [electedRemark, setElectedRemark] = useState('')
  const [isAddingElected, setIsAddingElected] = useState(false)
  const [editingElectedLeader, setEditingElectedLeader] = useState<ElectedLeader | null>(null)
  const [electedEditData, setElectedEditData] = useState<AddElectedLgaChairmanData>({
    candidate_id: 0,
    office_id: 0,
    party_id: 0,
    election_id: 0,
    lga_district_id: lgaId,
    start_date: '',
    end_date: '',
    tenure: '',
    remark: ''
  })
  const [electedEditElections, setElectedEditElections] = useState<Election[]>([])
  const [electedEditOffices, setElectedEditOffices] = useState<StateOffice[]>([])
  const [electedEditCandidateName, setElectedEditCandidateName] = useState('')
  const [electedEditPartyName, setElectedEditPartyName] = useState('')
  const [isLoadingElectedEditOptions, setIsLoadingElectedEditOptions] = useState(false)
  const [isUpdatingElected, setIsUpdatingElected] = useState(false)
  const [electedEditError, setElectedEditError] = useState('')
  const [electedAction, setElectedAction] = useState<{ type: 'delete' | 'terminate'; leader: ElectedLeader } | null>(null)
  const [electedActionError, setElectedActionError] = useState('')
  const [isProcessingElectedAction, setIsProcessingElectedAction] = useState(false)
  const [terminationResponse, setTerminationResponse] = useState<ElectedLgaActionResponse | null>(null)
  const [electedSearchYear, setElectedSearchYear] = useState('')
  const [displayedElectedYear, setDisplayedElectedYear] = useState('')
  const [isSearchingElected, setIsSearchingElected] = useState(false)
  const [electedSearchError, setElectedSearchError] = useState('')
  const candidatesPerPage = 4

  useEffect(() => {
    let isCurrent = true
    if (!Number.isInteger(lgaId) || lgaId <= 0) {
      setError('Invalid Local Government Area.')
      setLoading(false)
      return
    }

    const loadPage = async () => {
      setLoading(true)
      setError('')
      setDetailsError('')
      setSearchError('')
      setCandidates([])
      setLeaders([])
      setTerminationResponse(null)
      setElectedSearchYear('')
      setDisplayedElectedYear('')
      setElectedSearchError('')
      setDisplayedElection(null)
      setSearchElectionYear('')
      setSearchPartyName('')
      const lgaRequest = districtsService.getLgaDistrict(lgaId)

      if (mode === 'candidates') {
        const [lgaResult, candidatesResult] = await Promise.allSettled([
          lgaRequest,
          candidateService.getActiveElectionLgaCandidates(lgaId)
        ])
        if (!isCurrent) return
        if (lgaResult.status === 'fulfilled') setLga(lgaResult.value)
        else setDetailsError(lgaResult.reason instanceof Error ? lgaResult.reason.message : 'Unable to load Local Government Area details.')
        if (candidatesResult.status === 'fulfilled') setCandidates(candidatesResult.value)
        else setError(candidatesResult.reason instanceof Error ? candidatesResult.reason.message : 'Unable to load active Local Government candidates.')
      } else {
        const [lgaResult, leadersResult] = await Promise.allSettled([
          lgaRequest,
          leadersService.getActiveElectedLgaChairman(lgaId)
        ])
        if (!isCurrent) return
        if (lgaResult.status === 'fulfilled') setLga(lgaResult.value)
        else setDetailsError(lgaResult.reason instanceof Error ? lgaResult.reason.message : 'Unable to load Local Government Area details.')
        if (leadersResult.status === 'fulfilled') setLeaders(leadersResult.value)
        else setError(leadersResult.reason instanceof Error ? leadersResult.reason.message : 'Unable to load active elected Local Government Chairman.')
      }
      setLoading(false)
    }

    void loadPage()
    return () => { isCurrent = false }
  }, [lgaId, mode])

  const title = mode === 'candidates' ? 'Active Local Government Candidates' : 'Active Elected LGA Chairman and Deputy Chairman'
  const backPath = '/k8s9d7f3-districts/lgas'
  const totalCandidatePages = Math.max(1, Math.ceil(candidates.length / candidatesPerPage))
  const paginatedCandidates = candidates.slice(
    (candidatePage - 1) * candidatesPerPage,
    candidatePage * candidatesPerPage
  )
  const deputyChairman = leaders.find((leader) => /deputy|vice/i.test(leader.position ?? ''))
  const chairman = leaders.find((leader) =>
    /chair/i.test(leader.position ?? '') && !/deputy|vice/i.test(leader.position ?? '')
  ) ?? leaders.find((leader) => leader !== deputyChairman)
  const electedChairmanRoles = [
    { title: 'Chairman', leader: chairman },
    { title: 'Deputy Chairman', leader: deputyChairman ?? leaders.find((leader) => leader !== chairman) }
  ]

  const getDisplayedCandidates = () => displayedElection
    ? candidateService.getElectionLgaCandidates(
        lgaId,
        displayedElection.id,
        displayedElection.partyId
      )
    : candidateService.getActiveElectionLgaCandidates(lgaId)

  const searchLgaCandidates = async () => {
    const year = searchElectionYear.trim()
    if (!year) {
      setSearchError('Enter an election year to search candidates.')
      return
    }
    const partyName = searchPartyName.trim()

    setIsSearching(true)
    setSearchError('')
    try {
      const [elections, parties] = await Promise.all([
        electionService.getAllElections(),
        partyName ? partyService.getAllParties() : Promise.resolve([])
      ])
      const election = elections.find((item) => String(item.year).trim() === year)
      if (!election) throw new Error(`No election was found for the year ${year}.`)
      const party = partyName
        ? parties.find((item) => item.name.trim().toLocaleLowerCase() === partyName.toLocaleLowerCase())
        : undefined
      if (partyName && !party) {
        throw new Error('Enter a political party name that exists in the party records, or leave the field blank.')
      }

      const results = await candidateService.getElectionLgaCandidates(lgaId, election.id, party?.id)
      setCandidates(results)
      setDisplayedElection({ id: election.id, year, partyId: party?.id })
      setCandidatePage(1)
    } catch (searchFailure) {
      setSearchError(searchFailure instanceof Error ? searchFailure.message : 'Unable to search LGA candidates.')
    } finally {
      setIsSearching(false)
    }
  }

  const showActiveCandidates = async () => {
    setIsSearching(true)
    setSearchError('')
    try {
      setCandidates(await candidateService.getActiveElectionLgaCandidates(lgaId))
      setDisplayedElection(null)
      setSearchElectionYear('')
      setSearchPartyName('')
      setCandidatePage(1)
    } catch (loadError) {
      setSearchError(loadError instanceof Error ? loadError.message : 'Unable to load active LGA candidates.')
    } finally {
      setIsSearching(false)
    }
  }

  const searchElectedLgaLeaders = async () => {
    const year = electedSearchYear.trim()
    if (!year) {
      setElectedSearchError('Enter an election year to search elected LGA leaders.')
      return
    }

    setIsSearchingElected(true)
    setElectedSearchError('')
    try {
      const elections = await electionService.getAllElections()
      const election = elections.find((item) => String(item.year).trim() === year)
      if (!election) throw new Error(`No election was found for the year ${year}.`)

      setLeaders(await leadersService.getElectedLgaChairman(lgaId, election.id))
      setDisplayedElectedYear(year)
    } catch (searchFailure) {
      setElectedSearchError(searchFailure instanceof Error ? searchFailure.message : 'Unable to search elected LGA leaders.')
    } finally {
      setIsSearchingElected(false)
    }
  }

  const showActiveElectedLgaLeaders = async () => {
    setIsSearchingElected(true)
    setElectedSearchError('')
    try {
      setLeaders(await leadersService.getActiveElectedLgaChairman(lgaId))
      setElectedSearchYear('')
      setDisplayedElectedYear('')
    } catch (loadError) {
      setElectedSearchError(loadError instanceof Error ? loadError.message : 'Unable to load active elected LGA leaders.')
    } finally {
      setIsSearchingElected(false)
    }
  }

  const openAddDialog = async () => {
    setIsAddOpen(true)
    setSelectedCandidate(null)
    setCandidateSearch('')
    setCandidateSearchError('')
    setFormError('')
    setSuccessMessage('')
    setActiveElections([])
    setLgaOffices([])
    setElectionId('')
    setElectionLoadError('')
    setOfficeLoadError('')
    setCandidateOfficeId('')
    setManifesto('')
    setIsLoadingElections(true)
    const [electionResult, officeResult] = await Promise.allSettled([
      electionService.getActiveElections(),
      electionService.getLgaOffices()
    ])

    if (electionResult.status === 'fulfilled') {
      setActiveElections(electionResult.value)
      setElectionId(String(electionResult.value[0]?.id ?? ''))
      if (electionResult.value.length === 0) setElectionLoadError('There are no active elections available.')
    } else {
      setElectionLoadError(electionResult.reason instanceof Error ? electionResult.reason.message : 'Unable to load active elections.')
    }

    if (officeResult.status === 'fulfilled') {
      setLgaOffices(officeResult.value)
      if (officeResult.value.length === 0) setOfficeLoadError('No active LGA offices were returned by the API.')
    } else {
      setOfficeLoadError(officeResult.reason instanceof Error ? officeResult.reason.message : 'Unable to load LGA offices.')
    }
    setIsLoadingElections(false)
  }

  const handleAddDialogChange = (open: boolean) => {
    if (!open && isSaving) return
    setIsAddOpen(open)
    if (!open) {
      setSelectedCandidate(null)
      setCandidateSearch('')
      setCandidateSearchError('')
      setFormError('')
      setElectionId('')
      setElectionLoadError('')
      setOfficeLoadError('')
      setActiveElections([])
      setLgaOffices([])
      setCandidateOfficeId('')
      setManifesto('')
    }
  }

  const verifyCandidate = async () => {
    const identifier = candidateSearch.trim().replace(/\D/g, '')
    if (!identifier) {
      setCandidateSearchError('Enter the candidate NIN or phone number.')
      return
    }
    if (!electionId) {
      setCandidateSearchError('Select an active election before verifying the candidate.')
      return
    }

    setIsVerifying(true)
    setCandidateSearchError('')
    setFormError('')
    setSelectedCandidate(null)
    try {
      const directory = await candidateService.getAllCandidates()
      const candidate = directory.find((item) =>
        String(item.nin ?? '').replace(/\D/g, '') === identifier ||
        String(item.phoneNo ?? '').replace(/\D/g, '') === identifier
      )
      if (!candidate) throw new Error('No candidate matched that NIN or phone number in the candidate directory.')

      await electionService.checkCandidateRegistration({
        candidate_id: Number(candidate.id),
        election_id: Number(electionId)
      })
      if (!Number.isInteger(Number(candidate.party_id)) || Number(candidate.party_id) <= 0) {
        throw new Error('The verified candidate must have a political party assigned.')
      }
      setSelectedCandidate(candidate)
    } catch (verificationError) {
      setCandidateSearchError(verificationError instanceof Error ? verificationError.message : 'Candidate verification failed.')
    } finally {
      setIsVerifying(false)
    }
  }

  const addLgaCandidate = async () => {
    const officeId = Number(candidateOfficeId)
    const selectedElectionId = Number(electionId)
    if (
      !selectedCandidate ||
      !Number.isInteger(officeId) || officeId <= 0 ||
      !Number.isInteger(selectedElectionId) || selectedElectionId <= 0
    ) {
      setFormError('Select an office and election, and verify a candidate before saving.')
      return
    }

    setIsSaving(true)
    setFormError('')
    try {
      await electionService.checkCandidateRegistration({
        candidate_id: Number(selectedCandidate.id),
        election_id: selectedElectionId
      })
      await candidateService.addLgaCandidate({
        candidate_id: Number(selectedCandidate.id),
        office_id: officeId,
        party_id: Number(selectedCandidate.party_id),
        election_id: selectedElectionId,
        lga_district_id: lgaId,
        manifesto: manifesto.trim()
      })
      const candidateName = selectedCandidate.full_name
      handleAddDialogChange(false)
      setSuccessMessage(`${candidateName} was added as a Local Government candidate.`)
      try {
        const refreshedCandidates = await getDisplayedCandidates()
        setCandidates(refreshedCandidates)
        setCandidatePage(1)
      } catch (refreshError) {
        setSuccessMessage(
          `${candidateName} was added, but the candidate list could not be refreshed. ${refreshError instanceof Error ? refreshError.message : ''}`
        )
      }
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : 'Unable to add Local Government candidate.')
    } finally {
      setIsSaving(false)
    }
  }

  const openEditCandidate = async (candidate: Candidate) => {
    const assignmentId = Number(candidate.assignment_id)
    if (!Number.isInteger(assignmentId) || assignmentId <= 0) {
      setDetailsError('This candidate assignment does not have a valid record ID and cannot be edited.')
      return
    }

    setEditingCandidate(candidate)
    setEditError('')
    setIsLoadingEditOptions(true)
    setEditData({
      candidate_id: Number(candidate.candidate_id ?? candidate.id),
      office_id: Number(candidate.office_id ?? 0),
      party_id: Number(candidate.party_id ?? 0),
      election_id: Number(candidate.election_id ?? candidate.election?.id ?? 0),
      lga_district_id: lgaId,
      manifesto: candidate.manifesto ?? ''
    })

    const [electionResult, officeResult] = await Promise.allSettled([
      electionService.getAllElections(),
      electionService.getLgaOffices()
    ])
    if (electionResult.status === 'fulfilled') {
      const elections = electionResult.value
      if (candidate.election?.id && !elections.some((election) => election.id === Number(candidate.election?.id))) {
        elections.push({
          id: Number(candidate.election.id),
          year: Number(candidate.election.year) || Number(candidate.election.id),
          details: candidate.election.details,
          status: candidate.election.current_status ?? ''
        })
      }
      setEditElections(elections)
    } else {
      setEditError(electionResult.reason instanceof Error ? electionResult.reason.message : 'Unable to load elections.')
    }
    if (officeResult.status === 'fulfilled') {
      setLgaOffices(officeResult.value)
    } else {
      setEditError((current) => [current, officeResult.reason instanceof Error ? officeResult.reason.message : 'Unable to load LGA offices.'].filter(Boolean).join(' '))
    }
    setIsLoadingEditOptions(false)
  }

  const updateLgaCandidate = async () => {
    const assignmentId = Number(editingCandidate?.assignment_id)
    if (!Number.isInteger(assignmentId) || assignmentId <= 0) {
      setEditError('This candidate assignment does not have a valid record ID.')
      return
    }
    if (
      !editData.candidate_id || !editData.office_id || !editData.party_id ||
      !editData.election_id || !editData.lga_district_id
    ) {
      setEditError('Complete all required fields before saving.')
      return
    }

    setIsUpdating(true)
    setEditError('')
    try {
      await candidateService.updateLgaCandidate(assignmentId, {
        ...editData,
        lga_district_id: lgaId,
        manifesto: editData.manifesto.trim()
      })
      setEditingCandidate(null)
      setSuccessMessage(`${editingCandidate?.full_name || 'Candidate'} was updated successfully.`)
      try {
        const refreshedCandidates = await getDisplayedCandidates()
        setCandidates(refreshedCandidates)
      } catch (refreshError) {
        setDetailsError(
          `Candidate was updated, but the list could not be refreshed. ${refreshError instanceof Error ? refreshError.message : ''}`
        )
      }
    } catch (updateError) {
      setEditError(updateError instanceof Error ? updateError.message : 'Unable to update LGA candidate.')
    } finally {
      setIsUpdating(false)
    }
  }

  const removeLgaCandidate = async (candidate: Candidate) => {
    const assignmentId = Number(candidate.assignment_id)
    if (!Number.isInteger(assignmentId) || assignmentId <= 0) {
      setDeleteError('This LGA candidate assignment does not have a valid record ID and cannot be deleted.')
      return
    }

    setIsDeleting(true)
    setDeleteError('')
    try {
      await candidateService.removeLgaCandidate(assignmentId)
      setCandidates(await getDisplayedCandidates())
      setCandidatePage(1)
      setDeletingCandidate(null)
      setSuccessMessage(`${candidate.full_name || 'Candidate'} was removed from this Local Government Area.`)
    } catch (removeError) {
      setDeleteError(removeError instanceof Error ? removeError.message : 'Unable to remove LGA candidate.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleElectedAddDialog = async (open: boolean, force = false) => {
    if (!open && isAddingElected && !force) return
    setIsElectedAddOpen(open)
    if (!open) {
      setElectedCandidate(null)
      setElectedCandidateSearch('')
      setElectedVerifyError('')
      setElectedFormError('')
      setElectedOptionsError('')
      setElectedElections([])
      setElectedOffices([])
      setElectedElectionId('')
      setElectedOfficeId('')
      setElectedStartDate('')
      setElectedEndDate('')
      setElectedTenure('')
      setElectedRemark('')
      return
    }

    setElectedCandidate(null)
    setElectedCandidateSearch('')
    setElectedVerifyError('')
    setElectedFormError('')
    setElectedOptionsError('')
    setElectedElectionId('')
    setElectedOfficeId('')
    setElectedStartDate('')
    setElectedEndDate('')
    setElectedTenure('')
    setElectedRemark('')
    setIsLoadingElectedOptions(true)
    const [electionResult, officeResult] = await Promise.allSettled([
      electionService.getActiveElections(),
      electionService.getLgaOffices()
    ])

    const optionErrors: string[] = []
    if (electionResult.status === 'fulfilled') {
      setElectedElections(electionResult.value)
      setElectedElectionId(String(electionResult.value[0]?.id ?? ''))
      if (!electionResult.value.length) optionErrors.push('There are no active elections available.')
    } else {
      optionErrors.push(electionResult.reason instanceof Error ? electionResult.reason.message : 'Unable to load active elections.')
    }
    if (officeResult.status === 'fulfilled') {
      setElectedOffices(officeResult.value)
      if (!officeResult.value.length) optionErrors.push('No LGA offices were returned by the API.')
    } else {
      optionErrors.push(officeResult.reason instanceof Error ? officeResult.reason.message : 'Unable to load LGA offices.')
    }
    setElectedOptionsError(optionErrors.join(' '))
    setIsLoadingElectedOptions(false)
  }

  const verifyElectedCandidate = async () => {
    const identifier = electedCandidateSearch.trim().replace(/\D/g, '')
    if (!identifier) {
      setElectedVerifyError('Enter the candidate NIN or phone number.')
      return
    }
    if (!electedElectionId) {
      setElectedVerifyError('Select an active election before verifying the candidate.')
      return
    }

    setIsVerifyingElectedCandidate(true)
    setElectedVerifyError('')
    setElectedFormError('')
    setElectedCandidate(null)
    try {
      const directory = await candidateService.getAllCandidates()
      const candidate = directory.find((item) =>
        String(item.nin ?? '').replace(/\D/g, '') === identifier ||
        String(item.phoneNo ?? '').replace(/\D/g, '') === identifier
      )
      if (!candidate) throw new Error('No candidate matched that NIN or phone number in the candidate directory.')

      const registration = await leadersService.checkLeadershipRegistration({
        candidate_id: Number(candidate.id),
        election_id: Number(electedElectionId)
      })
      if (!registration.can_register) {
        throw new Error(registration.message || 'This candidate is already assigned to a leadership position for this election.')
      }
      if (!Number.isInteger(Number(candidate.party_id)) || Number(candidate.party_id) <= 0) {
        throw new Error('The verified candidate must have a political party assigned.')
      }
      setElectedCandidate(candidate)
    } catch (verificationError) {
      setElectedVerifyError(verificationError instanceof Error ? verificationError.message : 'Candidate verification failed.')
    } finally {
      setIsVerifyingElectedCandidate(false)
    }
  }

  const addElectedLgaChairman = async () => {
    const candidateId = Number(electedCandidate?.id)
    const electionIdValue = Number(electedElectionId)
    const officeId = Number(electedOfficeId)
    if (
      !Number.isInteger(candidateId) || candidateId <= 0 ||
      !Number.isInteger(electionIdValue) || electionIdValue <= 0 ||
      !Number.isInteger(officeId) || officeId <= 0 ||
      !electedStartDate || !electedEndDate || !electedTenure.trim()
    ) {
      setElectedFormError('Complete all required fields and verify a candidate before saving.')
      return
    }
    if (electedEndDate < electedStartDate) {
      setElectedFormError('End date must be on or after the start date.')
      return
    }

    setIsAddingElected(true)
    setElectedFormError('')
    try {
      const registration = await leadersService.checkLeadershipRegistration({
        candidate_id: candidateId,
        election_id: electionIdValue
      })
      if (!registration.can_register) {
        throw new Error(registration.message || 'This candidate is already assigned to a leadership position for this election.')
      }

      await leadersService.addElectedLgaChairman({
        candidate_id: candidateId,
        office_id: officeId,
        party_id: Number(electedCandidate?.party_id),
        election_id: electionIdValue,
        lga_district_id: lgaId,
        start_date: electedStartDate,
        end_date: electedEndDate,
        tenure: electedTenure.trim(),
        remark: electedRemark.trim()
      })
      const name = electedCandidate?.full_name || 'Candidate'
      setIsAddingElected(false)
      await handleElectedAddDialog(false, true)
      setSuccessMessage(`${name} was added as an elected LGA official.`)
      try {
        setLeaders(await leadersService.getActiveElectedLgaChairman(lgaId))
      } catch (refreshError) {
        setDetailsError(`Elected official was added, but the list could not be refreshed. ${refreshError instanceof Error ? refreshError.message : ''}`)
      }
    } catch (saveError) {
      setElectedFormError(saveError instanceof Error ? saveError.message : 'Unable to add elected LGA chairman.')
    } finally {
      setIsAddingElected(false)
    }
  }

  const openEditElectedLeader = async (leader: ElectedLeader) => {
    const recordId = Number(leader.id)
    if (!Number.isInteger(recordId) || recordId <= 0) {
      setDetailsError('This elected LGA record does not have a valid ID and cannot be edited.')
      return
    }

    setEditingElectedLeader(leader)
    setElectedEditError('')
    setElectedEditCandidateName(leader.name || '')
    setElectedEditPartyName(leader.party?.name ?? leader.partyName ?? '')
    setIsLoadingElectedEditOptions(true)
    setElectedEditData({
      candidate_id: Number(leader.candidate_id ?? leader.candidateId ?? 0),
      office_id: Number(leader.office_id ?? leader.office?.id ?? 0),
      party_id: Number(leader.party_id ?? leader.party?.id ?? 0),
      election_id: Number(leader.election_id ?? leader.election?.id ?? 0),
      lga_district_id: lgaId,
      start_date: String(leader.start_date ?? '').slice(0, 10),
      end_date: String(leader.end_date ?? '').slice(0, 10),
      tenure: String(leader.tenure ?? ''),
      remark: String(leader.remark ?? '')
    })

    const [electionResult, officeResult, candidateResult, partyResult] = await Promise.allSettled([
      electionService.getAllElections(),
      electionService.getLgaOffices(),
      candidateService.getAllCandidates(),
      partyService.getAllParties()
    ])
    const errors: string[] = []
    if (electionResult.status === 'fulfilled') {
      const options = electionResult.value
      const currentElectionId = Number(leader.election_id ?? leader.election?.id ?? 0)
      if (currentElectionId && !options.some((election) => election.id === currentElectionId)) {
        options.push({
          id: currentElectionId,
          year: Number(leader.election?.year) || currentElectionId,
          details: leader.election?.details,
          status: ''
        })
      }
      setElectedEditElections(options)
    } else {
      errors.push(electionResult.reason instanceof Error ? electionResult.reason.message : 'Unable to load elections.')
    }
    if (officeResult.status === 'fulfilled') {
      const options = officeResult.value
      const currentOfficeId = Number(leader.office_id ?? leader.office?.id ?? 0)
      if (currentOfficeId && !options.some((office) => office.id === currentOfficeId)) {
        options.push({
          id: currentOfficeId,
          title: String(leader.office_title ?? leader.office?.title ?? `Office ${currentOfficeId}`),
          status: 1
        })
      }
      setElectedEditOffices(options)
    } else {
      errors.push(officeResult.reason instanceof Error ? officeResult.reason.message : 'Unable to load LGA offices.')
    }
    if (candidateResult.status === 'fulfilled') {
      const candidateId = Number(leader.candidate_id ?? leader.candidateId ?? 0)
      const candidate = candidateResult.value.find((item) => Number(item.id) === candidateId)
      if (candidate?.full_name) setElectedEditCandidateName(candidate.full_name)
      else if (!leader.name) errors.push(`Candidate name could not be found for candidate ID ${candidateId}.`)
    } else if (!leader.name) {
      errors.push(candidateResult.reason instanceof Error ? candidateResult.reason.message : 'Unable to load candidate name.')
    }
    if (partyResult.status === 'fulfilled') {
      const partyId = Number(leader.party_id ?? leader.party?.id ?? 0)
      const party = partyResult.value.find((item) => Number(item.id) === partyId)
      if (party?.name) setElectedEditPartyName(party.name)
      else if (!leader.partyName && !leader.party?.name) errors.push(`Party name could not be found for party ID ${partyId}.`)
    } else if (!leader.partyName && !leader.party?.name) {
      errors.push(partyResult.reason instanceof Error ? partyResult.reason.message : 'Unable to load party name.')
    }
    setElectedEditError(errors.join(' '))
    setIsLoadingElectedEditOptions(false)
  }

  const updateElectedLgaLeader = async () => {
    const recordId = Number(editingElectedLeader?.id)
    if (!Number.isInteger(recordId) || recordId <= 0) {
      setElectedEditError('This elected LGA record does not have a valid ID.')
      return
    }
    if (
      !electedEditData.candidate_id ||
      !electedEditData.office_id ||
      !electedEditData.party_id ||
      !electedEditData.election_id ||
      !electedEditData.start_date ||
      !electedEditData.end_date ||
      !electedEditData.tenure.trim()
    ) {
      setElectedEditError('Complete all required fields before saving.')
      return
    }
    if (electedEditData.end_date < electedEditData.start_date) {
      setElectedEditError('End date must be on or after the start date.')
      return
    }

    setIsUpdatingElected(true)
    setElectedEditError('')
    try {
      await leadersService.updateElectedLgaChairman(recordId, {
        ...electedEditData,
        lga_district_id: lgaId,
        tenure: electedEditData.tenure.trim(),
        remark: electedEditData.remark.trim()
      })
      setEditingElectedLeader(null)
      setSuccessMessage(`${editingElectedLeader?.name || 'Elected official'} was updated successfully.`)
      try {
        setLeaders(await leadersService.getActiveElectedLgaChairman(lgaId))
      } catch (refreshError) {
        setDetailsError(
          `Elected official was updated, but the list could not be refreshed. ${refreshError instanceof Error ? refreshError.message : ''}`
        )
      }
    } catch (updateError) {
      setElectedEditError(updateError instanceof Error ? updateError.message : 'Unable to update elected LGA official.')
    } finally {
      setIsUpdatingElected(false)
    }
  }

  const performElectedAction = async () => {
    const action = electedAction
    if (!action) return
    const recordId = Number(action.leader.id)
    if (!Number.isInteger(recordId) || recordId <= 0) {
      setElectedActionError('This elected LGA record does not have a valid ID.')
      return
    }

    setIsProcessingElectedAction(true)
    setElectedActionError('')
    try {
      if (action.type === 'delete') {
        await leadersService.removeElectedLgaChairman(recordId)
      } else {
        setTerminationResponse(await leadersService.terminateElectedLgaChairman(recordId))
      }
      const actionLabel = action.type === 'delete' ? 'deleted' : 'terminated'
      setElectedAction(null)
      setSuccessMessage(`${action.leader.name || 'Elected official'} was ${actionLabel} successfully.`)
      try {
        setLeaders(await leadersService.getActiveElectedLgaChairman(lgaId))
      } catch (refreshError) {
        setDetailsError(
          `Elected official was ${actionLabel}, but the active list could not be refreshed. ${refreshError instanceof Error ? refreshError.message : ''}`
        )
      }
    } catch (actionError) {
      setElectedActionError(actionError instanceof Error
        ? actionError.message
        : `Unable to ${action.type} elected LGA official.`)
    } finally {
      setIsProcessingElectedAction(false)
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-0">
      <Link to={backPath} className="inline-flex items-center gap-2 text-sm font-medium text-[#146c4f] hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to LGAs
      </Link>
      <Card className="border border-gray-100 shadow-md">
        <CardContent className="p-0">
          <div className="flex flex-col gap-4 border-b border-gray-100 p-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  {mode === 'candidates' ? 'Local Government Candidates' : title}
                </p>
                <h1 className="mt-1 text-2xl font-bold text-gray-900">{lga?.name ?? 'Local Government Area'}</h1>
                <p className="text-sm text-gray-500">{lga?.state?.name ?? 'State not specified'}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{mode === 'candidates' ? 'Candidates' : 'Elected'}</p>
                <p className="font-semibold text-[#146c4f]">
                  {mode === 'candidates' ? candidates.length : leaders.length} {mode === 'candidates' ? 'candidates' : 'elected'}
                </p>
              </div>
              {mode === 'candidates' && (
                <>
                  <Button type="button" size="sm" className="bg-[#146c4f] hover:bg-[#10563f]" onClick={() => void openAddDialog()}>
                    <Plus className="mr-2 h-4 w-4" /> Add Candidate
                  </Button>
                </>
              )}
              {mode === 'elected' && (
                <Button
                  type="button"
                  size="sm"
                  className="bg-[#146c4f] hover:bg-[#10563f]"
                  onClick={() => void handleElectedAddDialog(true)}
                  disabled={loading || isLoadingElectedOptions || isAddingElected}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Elected Chairman
                </Button>
              )}
            </div>
          </div>

          {successMessage && <div role="status" className="border-b border-green-100 bg-green-50 px-6 py-3 text-sm text-green-800">{successMessage}</div>}
          {detailsError && <div role="alert" className="border-b border-amber-100 bg-amber-50 px-6 py-3 text-sm text-amber-800">{detailsError}</div>}
          {mode === 'elected' && terminationResponse && (
            <section aria-label="Termination response details" className="border-b border-green-100 bg-green-50/70 px-6 py-4">
              <h2 className="font-semibold text-green-900">{terminationResponse.message}</h2>
              <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt className="text-xs font-medium text-green-700">Candidate</dt>
                  <dd className="font-semibold text-gray-900">{terminationResponse.leader.name} (ID: {terminationResponse.leader.candidate_id ?? terminationResponse.leader.candidateId ?? 'N/A'})</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-green-700">Office</dt>
                  <dd className="font-semibold text-gray-900">{terminationResponse.leader.office?.title ?? terminationResponse.leader.position ?? 'N/A'} (ID: {terminationResponse.leader.office_id ?? 'N/A'})</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-green-700">Political party</dt>
                  <dd className="font-semibold text-gray-900">{terminationResponse.leader.party?.name ?? terminationResponse.leader.partyName ?? 'N/A'} (ID: {terminationResponse.leader.party_id ?? 'N/A'})</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-green-700">Election</dt>
                  <dd className="font-semibold text-gray-900">{terminationResponse.leader.election?.year ?? 'N/A'} (ID: {terminationResponse.leader.election_id ?? 'N/A'})</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-green-700">Tenure</dt>
                  <dd className="font-semibold text-gray-900">{terminationResponse.leader.tenure || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-green-700">Start / End</dt>
                  <dd className="font-semibold text-gray-900">{terminationResponse.leader.start_date || 'N/A'} / {terminationResponse.leader.end_date || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-green-700">Status returned by API</dt>
                  <dd className="font-semibold capitalize text-gray-900">{terminationResponse.leader.status || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-green-700">Record ID</dt>
                  <dd className="font-semibold text-gray-900">{terminationResponse.leader.id}</dd>
                </div>
                {terminationResponse.leader.remark && (
                  <div className="sm:col-span-2 lg:col-span-4">
                    <dt className="text-xs font-medium text-green-700">Remark</dt>
                    <dd className="whitespace-pre-wrap break-words text-gray-900">{terminationResponse.leader.remark}</dd>
                  </div>
                )}
              </dl>
            </section>
          )}
          {mode === 'candidates' && (
            <div className="space-y-3 border-b border-gray-100 bg-gray-50/70 p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="flex-1 text-sm font-medium text-gray-700">
                  Election year
                  <Input
                    type="text"
                    inputMode="numeric"
                    aria-label="Search candidates by election year"
                    value={searchElectionYear}
                    onChange={(event) => {
                      const year = event.target.value
                      setSearchElectionYear(year)
                      if (!year.trim() && displayedElection) void showActiveCandidates()
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') void searchLgaCandidates()
                    }}
                    placeholder="Enter election year"
                    className="mt-1 bg-white"
                  />
                </label>
                <label className="w-full text-sm font-medium text-gray-700 sm:w-40">
                  Political party (optional)
                  <Input
                    type="text"
                    aria-label="Filter candidates by political party name"
                    value={searchPartyName}
                    onChange={(event) => setSearchPartyName(event.target.value)}
                    placeholder="Enter party name"
                    className="mt-1 bg-white"
                  />
                </label>
                <Button type="button" onClick={() => void searchLgaCandidates()} disabled={isSearching || loading}>
                  {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Search
                </Button>
                <Button type="button" variant="outline" onClick={() => void showActiveCandidates()} disabled={isSearching || loading}>
                  Show Active
                </Button>
              </div>
              {searchError && <p role="alert" className="text-sm text-red-600">{searchError}</p>}
              {displayedElection && (
                <p className="text-xs text-gray-500">
                  Showing candidates for the {displayedElection.year} election.
                </p>
              )}
            </div>
          )}
          {mode === 'elected' && (
            <div className="space-y-3 border-b border-gray-100 bg-gray-50/70 p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="flex-1 text-sm font-medium text-gray-700">
                  Election year
                  <Input
                    type="text"
                    inputMode="numeric"
                    aria-label="Search elected LGA chairman and deputy by election year"
                    value={electedSearchYear}
                    onChange={(event) => {
                      setElectedSearchYear(event.target.value)
                      setElectedSearchError('')
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        void searchElectedLgaLeaders()
                      }
                    }}
                    placeholder="Enter election year"
                    className="mt-1 bg-white"
                    disabled={isSearchingElected || loading}
                  />
                </label>
                <Button
                  type="button"
                  onClick={() => void searchElectedLgaLeaders()}
                  disabled={isSearchingElected || loading}
                >
                  {isSearchingElected && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Search
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void showActiveElectedLgaLeaders()}
                  disabled={isSearchingElected || loading}
                >
                  Show Active
                </Button>
              </div>
              {electedSearchError && <p role="alert" className="text-sm text-red-600">{electedSearchError}</p>}
              {displayedElectedYear && (
                <p className="text-xs text-gray-500">
                  Showing chairman and deputy chairman records for the {displayedElectedYear} election.
                </p>
              )}
            </div>
          )}
          {loading && (
            <div className="flex items-center justify-center gap-2 p-12 text-sm text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin text-[#146c4f]" /> Loading {title.toLowerCase()}...
            </div>
          )}
          {!loading && error && <div role="alert" className="p-8 text-center text-sm text-red-600">{error}</div>}
          {!loading && !error && mode === 'candidates' && isSearching && (
            <div className="flex items-center justify-center gap-2 p-12 text-sm text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin text-[#146c4f]" /> Searching candidates...
            </div>
          )}
          {!loading && !error && !isSearching && mode === 'candidates' && candidates.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              {displayedElection
                ? `No candidates found for the ${displayedElection.year} election.`
                : 'No active candidates found for this Local Government Area.'}
            </div>
          )}
          {!loading && !error && !isSearching && mode === 'candidates' && candidates.length > 0 && (
            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
              {paginatedCandidates.map((candidate) => {
                const candidateName = candidate.full_name || 'Candidate'
                const partyName = candidate.party?.name ?? candidate.political_party ?? 'N/A'
                const photoUrl = getLogoUrl(candidate.image)
                const partyPhotoUrl = getPartyLogoValue(candidate.party)
                const election = candidate.election?.year
                  ? `${candidate.election.year}${candidate.election.details ? ` - ${candidate.election.details}` : ''}`
                  : candidate.election?.details ?? 'N/A'
                return (
                  <article key={`${candidate.assignment_id ?? candidate.id}-${candidate.election_id ?? ''}`} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-start justify-between gap-3 border-b border-gray-100 pb-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="h-12 w-12 border border-gray-200">
                          {photoUrl && <AvatarImage src={photoUrl} alt={candidateName} className="object-cover" />}
                          <AvatarFallback className="bg-[#146c4f]/10 font-bold text-[#146c4f]">
                            {candidateName.charAt(0)?.toUpperCase() || 'C'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <h2 className="truncate font-bold text-gray-900">{candidateName}</h2>
                          <p className="text-xs font-semibold text-[#146c4f]">{candidate.office_title || 'Local Government Candidate'}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setDeleteError('')
                            setDeletingCandidate(candidate)
                          }}
                          disabled={!candidate.assignment_id || isDeleting}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => void openEditCandidate(candidate)}
                          disabled={!candidate.assignment_id || isUpdating || isDeleting}
                        >
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
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
                  </article>
                )
              })}
            </div>
          )}
          {!loading && !error && !isSearching && mode === 'candidates' && candidates.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                Showing {(candidatePage - 1) * candidatesPerPage + 1}–{Math.min(candidatePage * candidatesPerPage, candidates.length)} of {candidates.length} candidates
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
          {!loading && !error && mode === 'elected' && isSearchingElected && (
            <div className="flex items-center justify-center gap-2 p-12 text-sm text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin text-[#146c4f]" /> Searching elected chairman and deputy chairman...
            </div>
          )}
          {!loading && !error && !isSearchingElected && mode === 'elected' && (
            <div className="grid w-full grid-cols-1 gap-4 p-4 sm:p-6 md:grid-cols-2">
              {electedChairmanRoles.map(({ title: roleTitle, leader }) => {
                if (!leader) {
                  return (
                    <article key={roleTitle} className="flex min-h-48 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-center text-sm text-gray-500">
                      No active elected {roleTitle.toLowerCase()} found for this Local Government Area.
                    </article>
                  )
                }
                const leaderName = leader.name || `Elected ${roleTitle}`
                const imageUrl = getLogoUrl(leader.candidatePhoto)
                const partyName = leader.party?.name ?? leader.partyName ?? 'N/A'
                const partyImageUrl = getLogoUrl(leader.partyLogo)
                const election = leader.election?.year
                  ? `${leader.election.year}${leader.election.details ? ` - ${leader.election.details}` : ''}`
                  : leader.election?.details ?? 'N/A'
                return (
                  <article key={`${leader.id}-${roleTitle}`} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex flex-col items-start gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="h-12 w-12 border border-gray-200">
                          {imageUrl && <AvatarImage src={imageUrl} alt={leaderName} className="object-cover" />}
                          <AvatarFallback className="bg-[#146c4f]/10 font-bold text-[#146c4f]">
                            {leaderName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <h2 className="truncate font-bold text-gray-900">{leaderName}</h2>
                          <p className="text-xs font-semibold text-[#146c4f]">Local Government {roleTitle}</p>
                        </div>
                      </div>
                      <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
                        <span className="col-span-2 w-fit rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-800 sm:col-span-1">
                          {leader.status || 'Active'}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => void openEditElectedLeader(leader)}
                          disabled={isUpdatingElected || isProcessingElectedAction}
                          className="w-full sm:w-auto"
                        >
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setElectedActionError('')
                            setTerminationResponse(null)
                            setElectedAction({ type: 'terminate', leader })
                          }}
                          disabled={!Number.isInteger(Number(leader.id)) || Number(leader.id) <= 0 || isProcessingElectedAction}
                          className="w-full sm:w-auto"
                        >
                          <Ban className="mr-2 h-4 w-4" /> Terminate
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setElectedActionError('')
                            setTerminationResponse(null)
                            setElectedAction({ type: 'delete', leader })
                          }}
                          disabled={!Number.isInteger(Number(leader.id)) || Number(leader.id) <= 0 || isProcessingElectedAction}
                          className="w-full sm:w-auto"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                      <div className="rounded-xl bg-gray-50 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Political Party</p>
                        <div className="mt-1 flex min-w-0 items-center gap-2">
                          <Avatar className="h-8 w-8 shrink-0 border border-gray-200 bg-white">
                            {partyImageUrl && <AvatarImage src={partyImageUrl} alt={`${partyName} logo`} className="object-contain p-0.5" />}
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
                        <p className="truncate font-semibold text-gray-800">{leader.tenure || 'N/A'}</p>
                      </div>
                      <div className="rounded-xl bg-gray-50 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Start / End</p>
                        <p className="truncate font-semibold text-gray-800">{leader.start_date || 'N/A'} / {leader.end_date || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-3 rounded-xl border border-gray-100 p-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">NIN</p>
                        <p className="truncate font-semibold text-gray-800">{leader.candidateNin || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Phone</p>
                        <p className="truncate font-semibold text-gray-800">{leader.candidatePhone || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Email</p>
                        <p className="truncate font-semibold text-gray-800">{leader.candidateEmail || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">LGA</p>
                        <p className="truncate font-semibold text-gray-800">{lga?.name || 'N/A'}</p>
                      </div>
                    </div>
                    {leader.remark && (
                      <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50/60 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Remark</p>
                        <p className="mt-1 line-clamp-3 text-sm text-amber-900">{leader.remark}</p>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
      {mode === 'candidates' && (
        <Dialog open={isAddOpen} onOpenChange={handleAddDialogChange}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Local Government candidate</DialogTitle>
              <DialogDescription>
                {selectedCandidate
                  ? 'Step 2 of 2: Review the verified candidate and complete the Local Government candidate assignment.'
                  : 'Step 1 of 2: Select an active election and verify candidate registration.'}
              </DialogDescription>
            </DialogHeader>
            {!selectedCandidate ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor="lga-candidate-election" className="mb-1 block text-sm font-medium">Active election *</label>
                  <select
                    id="lga-candidate-election"
                    value={electionId}
                    disabled={isLoadingElections || activeElections.length === 0}
                    onChange={(event) => {
                      setElectionId(event.target.value)
                      setCandidateSearchError('')
                      setSelectedCandidate(null)
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">{isLoadingElections ? 'Loading active elections...' : 'Select active election'}</option>
                    {activeElections.map((election) => (
                      <option key={election.id} value={election.id}>
                        {election.year}{election.details ? ` - ${election.details}` : ''}
                      </option>
                    ))}
                  </select>
                  {electionLoadError && <p role="alert" className="mt-1 text-sm text-red-600">{electionLoadError}</p>}
                </div>
                <div>
                  <label htmlFor="lga-candidate-search" className="mb-1 block text-sm font-medium">
                    Candidate NIN or phone number *
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="lga-candidate-search"
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
                    />
                    <Button type="button" onClick={() => void verifyCandidate()} disabled={isVerifying || isLoadingElections || !electionId}>
                      {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
                    </Button>
                  </div>
                </div>
                {candidateSearchError && <p role="alert" className="text-sm text-red-600">{candidateSearchError}</p>}
                {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}
                <div className="flex justify-end">
                  <Button type="button" variant="outline" onClick={() => handleAddDialogChange(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <p className="mb-3 font-semibold text-green-900">Candidate verified</p>
                  <div className="mb-3 flex items-center gap-3">
                    <Avatar className="h-12 w-12 border">
                      {getLogoUrl(selectedCandidate.image) && <AvatarImage src={getLogoUrl(selectedCandidate.image) ?? undefined} alt={selectedCandidate.full_name} />}
                      <AvatarFallback>{selectedCandidate.full_name?.charAt(0)?.toUpperCase() || 'C'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-gray-900">{selectedCandidate.full_name}</p>
                      <p className="text-sm text-green-800">
                        Registration verified for election {activeElections.find((election) => election.id === Number(electionId))?.year ?? electionId}
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <p><span className="text-green-700">NIN:</span> {selectedCandidate.nin || 'N/A'}</p>
                    <p><span className="text-green-700">Phone:</span> {selectedCandidate.phoneNo || 'N/A'}</p>
                    <p><span className="text-green-700">Email:</span> {selectedCandidate.email || 'N/A'}</p>
                    <p><span className="text-green-700">Political party:</span> {selectedCandidate.party?.name || selectedCandidate.political_party || 'N/A'}</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1 text-sm font-medium sm:col-span-2">
                    Office *
                    <select
                      value={candidateOfficeId}
                      onChange={(event) => setCandidateOfficeId(event.target.value)}
                      disabled={isLoadingElections || lgaOffices.length === 0}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="">{isLoadingElections ? 'Loading LGA offices...' : 'Select office'}</option>
                      {lgaOffices.map((office) => <option key={office.id} value={office.id}>{office.title}</option>)}
                    </select>
                    {officeLoadError && <span role="alert" className="block text-sm font-normal text-red-600">{officeLoadError}</span>}
                  </label>
                  <label className="space-y-1 text-sm font-medium sm:col-span-2">
                    Manifesto
                    <Textarea value={manifesto} onChange={(event) => setManifesto(event.target.value)} rows={4} placeholder="Enter candidate manifesto" />
                  </label>
                </div>
                {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}
                <div className="flex justify-between gap-2">
                  <Button type="button" variant="outline" disabled={isSaving} onClick={() => {
                    setSelectedCandidate(null)
                    setFormError('')
                  }}>Back</Button>
                  <Button
                    type="button"
                    className="bg-[#146c4f] hover:bg-[#10563f]"
                    onClick={() => void addLgaCandidate()}
                    disabled={isSaving}
                  >
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSaving ? 'Saving...' : 'Add Candidate'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
      {mode === 'candidates' && (
        <Dialog open={Boolean(editingCandidate)} onOpenChange={(open) => !open && !isUpdating && setEditingCandidate(null)}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Local Government candidate</DialogTitle>
              <DialogDescription>Update this candidate's Local Government election assignment.</DialogDescription>
            </DialogHeader>
            {isLoadingEditOptions ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin text-[#146c4f]" /> Loading election and office options...
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Candidate</label>
                  <Input value={editingCandidate?.full_name ?? ''} disabled />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1 text-sm font-medium">
                    Office *
                    <select
                      value={editData.office_id || ''}
                      onChange={(event) => setEditData((current) => ({ ...current, office_id: Number(event.target.value) }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select office</option>
                      {lgaOffices.map((office) => <option key={office.id} value={office.id}>{office.title}</option>)}
                    </select>
                  </label>
                  <label className="space-y-1 text-sm font-medium">
                    Election *
                    <select
                      value={editData.election_id || ''}
                      onChange={(event) => setEditData((current) => ({ ...current, election_id: Number(event.target.value) }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select election</option>
                      {editElections.map((election) => (
                        <option key={election.id} value={election.id}>{election.year}{election.details ? ` - ${election.details}` : ''}</option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1 text-sm font-medium">
                    Political party
                    <Input value={editingCandidate?.party?.name || editingCandidate?.political_party || `Party ${editData.party_id}`} disabled />
                  </label>
                  <label className="space-y-1 text-sm font-medium">
                    LGA
                    <Input value={lga?.name ?? ''} disabled />
                  </label>
                  <label className="space-y-1 text-sm font-medium sm:col-span-2">
                    Manifesto
                    <Textarea value={editData.manifesto} onChange={(event) => setEditData((current) => ({ ...current, manifesto: event.target.value }))} rows={4} />
                  </label>
                </div>
                {editError && <p role="alert" className="text-sm text-red-600">{editError}</p>}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setEditingCandidate(null)} disabled={isUpdating}>Cancel</Button>
                  <Button type="button" onClick={() => void updateLgaCandidate()} disabled={isUpdating} className="bg-[#146c4f] hover:bg-[#10563f]">
                    {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isUpdating ? 'Saving...' : 'Save changes'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
      {mode === 'candidates' && (
        <Dialog open={Boolean(deletingCandidate)} onOpenChange={(open) => !open && !isDeleting && setDeletingCandidate(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delete LGA candidate</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove {deletingCandidate?.full_name || 'this candidate'} from this Local Government Area?
              </DialogDescription>
            </DialogHeader>
            {deleteError && <p role="alert" className="text-sm text-red-600">{deleteError}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDeletingCandidate(null)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => deletingCandidate && void removeLgaCandidate(deletingCandidate)}
                disabled={isDeleting}
              >
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {mode === 'elected' && (
        <Dialog
          open={Boolean(electedAction)}
          onOpenChange={(open) => {
            if (!open && !isProcessingElectedAction) {
              setElectedAction(null)
              setElectedActionError('')
            }
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {electedAction?.type === 'delete' ? 'Delete elected official' : 'Terminate elected official'}
              </DialogTitle>
              <DialogDescription>
                {electedAction?.type === 'delete'
                  ? `Are you sure you want to permanently remove ${electedAction.leader.name || 'this elected official'} from the LGA?`
                  : `Are you sure you want to terminate ${electedAction?.leader.name || 'this elected official'}'s active tenure?`}
              </DialogDescription>
            </DialogHeader>
            {electedActionError && <p role="alert" className="text-sm text-red-600">{electedActionError}</p>}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setElectedAction(null)}
                disabled={isProcessingElectedAction}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => void performElectedAction()}
                disabled={isProcessingElectedAction}
              >
                {isProcessingElectedAction && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isProcessingElectedAction
                  ? electedAction?.type === 'delete' ? 'Deleting...' : 'Terminating...'
                  : electedAction?.type === 'delete' ? 'Delete' : 'Terminate'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {mode === 'elected' && (
        <Dialog open={Boolean(editingElectedLeader)} onOpenChange={(open) => !open && !isUpdatingElected && setEditingElectedLeader(null)}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit elected LGA official</DialogTitle>
              <DialogDescription>
                Update {editingElectedLeader?.name || 'this elected official'} and their LGA leadership details.
              </DialogDescription>
            </DialogHeader>
            {isLoadingElectedEditOptions ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin text-[#146c4f]" /> Loading election and office options...
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1 text-sm font-medium">
                    Candidate
                    <Input value={electedEditCandidateName || `Candidate ${electedEditData.candidate_id}`} disabled />
                  </label>
                  <label className="space-y-1 text-sm font-medium">
                    Political party
                    <Input value={electedEditPartyName || `Party ${electedEditData.party_id}`} disabled />
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1 text-sm font-medium">
                    Office *
                    <select
                      value={electedEditData.office_id || ''}
                      onChange={(event) => setElectedEditData((current) => ({ ...current, office_id: Number(event.target.value) }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select chairman or deputy chairman office</option>
                      {electedEditOffices.map((office) => (
                        <option key={office.id} value={office.id}>{office.title}</option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1 text-sm font-medium">
                    Election *
                    <select
                      value={electedEditData.election_id || ''}
                      onChange={(event) => setElectedEditData((current) => ({ ...current, election_id: Number(event.target.value) }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select election</option>
                      {electedEditElections.map((election) => (
                        <option key={election.id} value={election.id}>
                          {election.year}{election.details ? ` - ${election.details}` : ''}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1 text-sm font-medium">
                    LGA
                    <Input value={lga?.name ?? ''} disabled />
                  </label>
                  <label className="space-y-1 text-sm font-medium">
                    Start date *
                    <Input
                      type="date"
                      value={electedEditData.start_date}
                      onChange={(event) => setElectedEditData((current) => ({ ...current, start_date: event.target.value }))}
                    />
                  </label>
                  <label className="space-y-1 text-sm font-medium">
                    End date *
                    <Input
                      type="date"
                      value={electedEditData.end_date}
                      onChange={(event) => setElectedEditData((current) => ({ ...current, end_date: event.target.value }))}
                    />
                  </label>
                  <label className="space-y-1 text-sm font-medium sm:col-span-2">
                    Tenure *
                    <Input
                      value={electedEditData.tenure}
                      onChange={(event) => setElectedEditData((current) => ({ ...current, tenure: event.target.value }))}
                    />
                  </label>
                  <label className="space-y-1 text-sm font-medium sm:col-span-2">
                    Remark
                    <Textarea
                      value={electedEditData.remark}
                      onChange={(event) => setElectedEditData((current) => ({ ...current, remark: event.target.value }))}
                      rows={4}
                    />
                  </label>
                </div>
                {electedEditError && <p role="alert" className="text-sm text-red-600">{electedEditError}</p>}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setEditingElectedLeader(null)} disabled={isUpdatingElected}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={() => void updateElectedLgaLeader()}
                    disabled={isUpdatingElected || isLoadingElectedEditOptions}
                    className="bg-[#146c4f] hover:bg-[#10563f]"
                  >
                    {isUpdatingElected && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isUpdatingElected ? 'Saving...' : 'Save changes'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
      {mode === 'elected' && (
        <Dialog open={isElectedAddOpen} onOpenChange={(open) => void handleElectedAddDialog(open)}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Elected LGA Chairman or Deputy Chairman</DialogTitle>
              <DialogDescription>
                {electedCandidate
                  ? 'Step 2 of 2: Review the verified candidate and complete the elected LGA official details.'
                  : 'Step 1 of 2: Select an active election and verify candidate leadership registration.'}
              </DialogDescription>
            </DialogHeader>
            {isLoadingElectedOptions ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin text-[#146c4f]" /> Loading active elections and LGA offices...
              </div>
            ) : !electedCandidate ? (
              <div className="space-y-4">
                <label className="block space-y-1 text-sm font-medium">
                  Active election *
                  <select
                    value={electedElectionId}
                    onChange={(event) => {
                      setElectedElectionId(event.target.value)
                      setElectedCandidate(null)
                      setElectedVerifyError('')
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select active election</option>
                    {electedElections.map((election) => (
                      <option key={election.id} value={election.id}>
                        {election.year}{election.details ? ` - ${election.details}` : ''}
                      </option>
                    ))}
                  </select>
                </label>
                {electedOptionsError && <p role="alert" className="text-sm text-red-600">{electedOptionsError}</p>}
                <div>
                  <label htmlFor="elected-lga-candidate-search" className="mb-1 block text-sm font-medium">
                    Candidate NIN or phone number *
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="elected-lga-candidate-search"
                      value={electedCandidateSearch}
                      onChange={(event) => {
                        setElectedCandidateSearch(event.target.value)
                        setElectedVerifyError('')
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          void verifyElectedCandidate()
                        }
                      }}
                      placeholder="Enter candidate NIN or phone number"
                    />
                    <Button
                      type="button"
                      onClick={() => void verifyElectedCandidate()}
                      disabled={isVerifyingElectedCandidate || !electedElectionId || Boolean(electedOptionsError)}
                    >
                      {isVerifyingElectedCandidate ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
                    </Button>
                  </div>
                </div>
                {electedVerifyError && <p role="alert" className="text-sm text-red-600">{electedVerifyError}</p>}
                <div className="flex justify-end">
                  <Button type="button" variant="outline" onClick={() => void handleElectedAddDialog(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <p className="mb-3 font-semibold text-green-900">Candidate verified</p>
                  <div className="mb-3 flex items-center gap-3">
                    <Avatar className="h-12 w-12 border">
                      {getLogoUrl(electedCandidate.image) && (
                        <AvatarImage src={getLogoUrl(electedCandidate.image) ?? undefined} alt={electedCandidate.full_name} />
                      )}
                      <AvatarFallback>{electedCandidate.full_name?.charAt(0)?.toUpperCase() || 'C'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-gray-900">{electedCandidate.full_name}</p>
                      <p className="text-sm text-green-800">
                        Leadership registration verified for election {electedElections.find((election) => election.id === Number(electedElectionId))?.year ?? electedElectionId}
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <p><span className="text-green-700">NIN:</span> {electedCandidate.nin || 'N/A'}</p>
                    <p><span className="text-green-700">Phone:</span> {electedCandidate.phoneNo || 'N/A'}</p>
                    <p><span className="text-green-700">Email:</span> {electedCandidate.email || 'N/A'}</p>
                    <p><span className="text-green-700">Party:</span> {electedCandidate.party?.name || electedCandidate.political_party || 'N/A'}</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1 text-sm font-medium">
                    Office *
                    <select
                      value={electedOfficeId}
                      onChange={(event) => setElectedOfficeId(event.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select chairman or deputy chairman office</option>
                      {electedOffices.map((office) => (
                        <option key={office.id} value={office.id}>{office.title}</option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1 text-sm font-medium">
                    Election
                    <Input
                      value={`${electedElections.find((election) => election.id === Number(electedElectionId))?.year ?? electedElectionId}`}
                      disabled
                    />
                  </label>
                  <label className="space-y-1 text-sm font-medium">
                    Start date *
                    <Input type="date" value={electedStartDate} onChange={(event) => setElectedStartDate(event.target.value)} />
                  </label>
                  <label className="space-y-1 text-sm font-medium">
                    End date *
                    <Input type="date" value={electedEndDate} onChange={(event) => setElectedEndDate(event.target.value)} />
                  </label>
                  <label className="space-y-1 text-sm font-medium">
                    Tenure *
                    <Input value={electedTenure} onChange={(event) => setElectedTenure(event.target.value)} placeholder="e.g. 4 years" />
                  </label>
                  <label className="space-y-1 text-sm font-medium sm:col-span-2">
                    Remark
                    <Textarea value={electedRemark} onChange={(event) => setElectedRemark(event.target.value)} rows={3} />
                  </label>
                </div>
                {electedFormError && <p role="alert" className="text-sm text-red-600">{electedFormError}</p>}
                <div className="flex justify-between gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setElectedCandidate(null)
                      setElectedFormError('')
                    }}
                    disabled={isAddingElected}
                  >
                    Back
                  </Button>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => void handleElectedAddDialog(false)} disabled={isAddingElected}>
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={() => void addElectedLgaChairman()}
                      disabled={isAddingElected || electedOffices.length === 0}
                      className="bg-[#146c4f] hover:bg-[#10563f]"
                    >
                      {isAddingElected && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isAddingElected ? 'Saving...' : 'Add Elected Official'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
