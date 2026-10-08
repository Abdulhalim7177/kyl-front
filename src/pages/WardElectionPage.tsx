import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Ban, ChevronLeft, ChevronRight, Loader2, MapPin, Pencil, Plus, Trash2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { AddWardCandidateData, Candidate, candidateService } from '@/services/candidates'
import { Election, electionService, StateOffice } from '@/services/elections'
import { AddElectedWardCouncillorData, ElectedLeader, leadersService } from '@/services/leaders'
import { Party, partyService } from '@/services/parties'
import { useAuth } from '@/contexts/AuthContext'
import { getLogoUrl, getPartyLogoValue } from '@/lib/utils'

interface WardElectionPageProps {
  mode: 'candidates' | 'elected'
}

const mapElectedWardCouncillors = (leaders: ElectedLeader[]): Candidate[] =>
  leaders.map((leader) => {
    const candidateRecord = leader.candidate ?? {}
    const partyRecord = leader.party ?? candidateRecord.party ?? {}
    const electionRecord = leader.election ?? {}
    const candidateId = Number(leader.candidateId ?? candidateRecord.id)
    return {
      id: candidateId,
      candidate_id: candidateId,
      assignment_id: Number(leader.id),
      user_id: String(candidateId),
      full_name: String(leader.name ?? 'Candidate'),
      email: leader.candidateEmail ?? candidateRecord.email,
      phoneNo: leader.candidatePhone ?? candidateRecord.phoneNo ?? candidateRecord.phone_no,
      nin: leader.candidateNin ?? candidateRecord.nin,
      image: leader.candidatePhoto ?? candidateRecord.image,
      party_id: Number(leader.party_id ?? partyRecord.id),
      political_party: String(leader.partyName ?? partyRecord.name ?? 'N/A'),
      party: {
        name: String(leader.partyName ?? partyRecord.name ?? 'N/A'),
        logopath: leader.partyLogo ?? partyRecord.logopath ?? null
      },
      office_id: Number(leader.office_id ?? leader.office?.id),
      office_title: String(leader.position ?? leader.office?.title ?? 'Ward Councillor'),
      election_id: Number(leader.election_id ?? electionRecord.id),
      election: {
        id: Number(electionRecord.id),
        year: electionRecord.year,
        details: electionRecord.details,
        current_status: electionRecord.current_status
      },
      state: '',
      senatorial_district: '',
      status: String(leader.status ?? 'Active'),
      created_at: String(leader.created_at ?? ''),
      start_date: leader.start_date,
      end_date: leader.end_date,
      tenure: leader.tenure,
      remark: leader.remark
    }
  })

export default function WardElectionPage({ mode }: WardElectionPageProps) {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const wardId = Number(id)
  const { isAuthenticated } = useAuth()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [searchElections, setSearchElections] = useState<Election[]>([])
  const [searchParties, setSearchParties] = useState<Party[]>([])
  const [searchElectionYear, setSearchElectionYear] = useState('')
  const [searchPartyName, setSearchPartyName] = useState('')
  const [appliedSearch, setAppliedSearch] = useState<{ electionId: number; partyId?: number } | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [searchOptionsError, setSearchOptionsError] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [activeElections, setActiveElections] = useState<Election[]>([])
  const [offices, setOffices] = useState<StateOffice[]>([])
  const [electionId, setElectionId] = useState('')
  const [officeId, setOfficeId] = useState('')
  const [candidateSearch, setCandidateSearch] = useState('')
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [manifesto, setManifesto] = useState('')
  const [isLoadingOptions, setIsLoadingOptions] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [candidateSearchError, setCandidateSearchError] = useState('')
  const [optionsError, setOptionsError] = useState('')
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null)
  const [editData, setEditData] = useState<AddWardCandidateData>({
    candidate_id: 0,
    office_id: 0,
    party_id: 0,
    election_id: 0,
    ward_id: wardId,
    manifesto: ''
  })
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isLoadingEditOptions, setIsLoadingEditOptions] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [editError, setEditError] = useState('')
  const [deletingCandidate, setDeletingCandidate] = useState<Candidate | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [isAddElectedOpen, setIsAddElectedOpen] = useState(false)
  const [electedElections, setElectedElections] = useState<Election[]>([])
  const [electedOffices, setElectedOffices] = useState<StateOffice[]>([])
  const [electedElectionId, setElectedElectionId] = useState('')
  const [electedOfficeId, setElectedOfficeId] = useState('')
  const [electedCandidateSearch, setElectedCandidateSearch] = useState('')
  const [electedCandidate, setElectedCandidate] = useState<Candidate | null>(null)
  const [electedStartDate, setElectedStartDate] = useState('')
  const [electedEndDate, setElectedEndDate] = useState('')
  const [electedTenure, setElectedTenure] = useState('')
  const [electedRemark, setElectedRemark] = useState('')
  const [isLoadingElectedOptions, setIsLoadingElectedOptions] = useState(false)
  const [isVerifyingElectedCandidate, setIsVerifyingElectedCandidate] = useState(false)
  const [isAddingElected, setIsAddingElected] = useState(false)
  const [electedVerifyError, setElectedVerifyError] = useState('')
  const [electedFormError, setElectedFormError] = useState('')
  const [electedOptionsError, setElectedOptionsError] = useState('')
  const [electedSuccessMessage, setElectedSuccessMessage] = useState('')
  const [electedSearchYear, setElectedSearchYear] = useState('')
  const [electedSearchError, setElectedSearchError] = useState('')
  const [hasSearchedElected, setHasSearchedElected] = useState(false)
  const [editingElectedCandidate, setEditingElectedCandidate] = useState<Candidate | null>(null)
  const [electedEditData, setElectedEditData] = useState<AddElectedWardCouncillorData>({
    candidate_id: 0,
    office_id: 0,
    party_id: 0,
    election_id: 0,
    ward_id: wardId,
    start_date: '',
    end_date: '',
    tenure: '',
    remark: ''
  })
  const [isLoadingElectedEditOptions, setIsLoadingElectedEditOptions] = useState(false)
  const [isUpdatingElected, setIsUpdatingElected] = useState(false)
  const [electedEditError, setElectedEditError] = useState('')
  const [electedAction, setElectedAction] = useState<{ type: 'delete' | 'terminate'; candidate: Candidate } | null>(null)
  const [electedActionError, setElectedActionError] = useState('')
  const [isProcessingElectedAction, setIsProcessingElectedAction] = useState(false)
  const pageSize = 8
  const totalPages = Math.max(1, Math.ceil(candidates.length / pageSize))
  const visibleCandidates = candidates.slice((page - 1) * pageSize, page * pageSize)
  const pageTitle = mode === 'candidates' ? 'Ward Candidates' : 'Elected Ward Members'
  const wardName = searchParams.get('name') || 'Ward'

  useEffect(() => {
    if (!isAuthenticated || mode !== 'candidates') return

    let current = true
    void Promise.allSettled([
      electionService.getAllElections(),
      partyService.getAllParties()
    ]).then(([electionResult, partyResult]) => {
      if (!current) return
      const errors: string[] = []
      if (electionResult.status === 'fulfilled') setSearchElections(electionResult.value)
      else errors.push(electionResult.reason instanceof Error ? electionResult.reason.message : 'Unable to load elections for search.')
      if (partyResult.status === 'fulfilled') setSearchParties(partyResult.value)
      else errors.push(partyResult.reason instanceof Error ? partyResult.reason.message : 'Unable to load parties for search.')
      setSearchOptionsError(errors.join(' '))
    })

    return () => {
      current = false
    }
  }, [isAuthenticated, mode])

  useEffect(() => {
    if (!isAuthenticated || mode !== 'elected') return

    let current = true
    electionService.getAllElections()
      .then((elections) => {
        if (current) {
          setSearchElections(elections)
          setSearchOptionsError('')
        }
      })
      .catch((optionsError: unknown) => {
        if (current) {
          setSearchOptionsError(optionsError instanceof Error ? optionsError.message : 'Unable to load elections for search.')
        }
      })

    return () => {
      current = false
    }
  }, [isAuthenticated, mode])

  const searchCandidates = async () => {
    const year = searchElectionYear.trim()
    if (!year) {
      setSearchError('Enter an election year to search.')
      return
    }

    const election = searchElections.find((item) => String(item.year) === year)
    if (!election) {
      setSearchError('Enter an election year that exists in the election list.')
      return
    }

    const partyName = searchPartyName.trim()
    const party = partyName
      ? searchParties.find((item) => item.name.trim().toLocaleLowerCase() === partyName.toLocaleLowerCase())
      : undefined
    if (partyName && !party) {
      setSearchError('Enter a party name from the party list, or leave it blank for all parties.')
      return
    }

    setIsSearching(true)
    setSearchError('')
    try {
      const partyId = party?.id
      const results = await candidateService.getElectionWardCandidates(wardId, election.id, partyId)
      setCandidates(results)
      setAppliedSearch({ electionId: election.id, partyId })
      setPage(1)
    } catch (searchFailure) {
      setSearchError(searchFailure instanceof Error ? searchFailure.message : 'Unable to search ward candidates.')
      setCandidates([])
    } finally {
      setIsSearching(false)
    }
  }

  const showActiveCandidates = async () => {
    setIsSearching(true)
    setSearchError('')
    try {
      setCandidates(await candidateService.getActiveElectionWardCandidates(wardId))
      setAppliedSearch(null)
      setSearchElectionYear('')
      setSearchPartyName('')
      setPage(1)
    } catch (searchFailure) {
      setSearchError(searchFailure instanceof Error ? searchFailure.message : 'Unable to load active ward candidates.')
      setCandidates([])
    } finally {
      setIsSearching(false)
    }
  }

  const searchElectedCouncillors = async () => {
    const year = electedSearchYear.trim()
    if (!year) {
      setElectedSearchError('Enter an election year to search.')
      return
    }
    const election = searchElections.find((item) => String(item.year) === year)
    if (!election) {
      setElectedSearchError('Enter an election year that exists in the election list.')
      return
    }

    setIsSearching(true)
    setElectedSearchError('')
    try {
      const leaders = await leadersService.getElectedWardCouncillor(wardId, election.id)
      setCandidates(mapElectedWardCouncillors(leaders))
      setHasSearchedElected(true)
      setPage(1)
    } catch (searchFailure) {
      setElectedSearchError(searchFailure instanceof Error ? searchFailure.message : 'Unable to search elected ward councillors.')
      setCandidates([])
    } finally {
      setIsSearching(false)
    }
  }

  const showActiveElectedCouncillors = async () => {
    setIsSearching(true)
    setElectedSearchError('')
    try {
      const leaders = await leadersService.getActiveElectedWardCouncillor(wardId)
      setCandidates(mapElectedWardCouncillors(leaders))
      setElectedSearchYear('')
      setHasSearchedElected(false)
      setPage(1)
    } catch (searchFailure) {
      setElectedSearchError(searchFailure instanceof Error ? searchFailure.message : 'Unable to load active elected ward councillors.')
      setCandidates([])
    } finally {
      setIsSearching(false)
    }
  }

  const performElectedCouncillorAction = async () => {
    const action = electedAction
    if (!action) return
    const recordId = Number(action.candidate.assignment_id)
    if (!Number.isInteger(recordId) || recordId <= 0) {
      setElectedActionError('This elected ward councillor does not have a valid record ID.')
      return
    }

    setIsProcessingElectedAction(true)
    setElectedActionError('')
    try {
      if (action.type === 'delete') {
        await leadersService.removeElectedWardCouncillor(recordId)
      } else {
        await leadersService.terminateElectedWardCouncillor(recordId)
      }
      const actionLabel = action.type === 'delete' ? 'deleted' : 'terminated'
      setElectedAction(null)
      setElectedSuccessMessage(`${action.candidate.full_name || 'Elected councillor'} was ${actionLabel} successfully.`)
      try {
        const leaders = hasSearchedElected
          ? await leadersService.getElectedWardCouncillor(
            wardId,
            Number(searchElections.find((election) => String(election.year) === electedSearchYear.trim())?.id)
          )
          : await leadersService.getActiveElectedWardCouncillor(wardId)
        setCandidates(mapElectedWardCouncillors(leaders))
        setPage(1)
      } catch (refreshError) {
        setElectedSuccessMessage(
          `Elected councillor was ${actionLabel}, but the list could not be refreshed. ${refreshError instanceof Error ? refreshError.message : ''}`
        )
      }
    } catch (actionError) {
      setElectedActionError(actionError instanceof Error
        ? actionError.message
        : `Unable to ${action.type} elected ward councillor.`)
    } finally {
      setIsProcessingElectedAction(false)
    }
  }

  const removeWardCandidate = async (candidate: Candidate) => {
    const assignmentId = Number(candidate.assignment_id)
    if (!Number.isInteger(assignmentId) || assignmentId <= 0) {
      setDeleteError('This ward candidate does not have a valid record ID and cannot be deleted.')
      return
    }

    setIsDeleting(true)
    setDeleteError('')
    try {
      await candidateService.removeWardCandidate(assignmentId)
      setCandidates((current) => current.filter((item) => item.assignment_id !== candidate.assignment_id))
      setPage((current) => Math.min(current, Math.max(1, Math.ceil((candidates.length - 1) / pageSize))))
      setDeletingCandidate(null)
    } catch (removeError) {
      setDeleteError(removeError instanceof Error ? removeError.message : 'Unable to remove ward candidate.')
    } finally {
      setIsDeleting(false)
    }
  }

  const openAddElectedDialog = async () => {
      setIsAddElectedOpen(true)
      setElectedCandidate(null)
      setElectedCandidateSearch('')
      setElectedElectionId('')
      setElectedOfficeId('')
      setElectedStartDate('')
      setElectedEndDate('')
      setElectedTenure('')
      setElectedRemark('')
      setElectedVerifyError('')
      setElectedFormError('')
      setElectedOptionsError('')
      setElectedSuccessMessage('')
      setIsLoadingElectedOptions(true)

      const [electionsResult, officesResult] = await Promise.allSettled([
        electionService.getActiveElections(),
        electionService.getWardOffices()
      ])

      const optionErrors: string[] = []
      if (electionsResult.status === 'fulfilled') {
        setElectedElections(electionsResult.value)
        setElectedElectionId(String(electionsResult.value[0]?.id ?? ''))
        if (electionsResult.value.length === 0) optionErrors.push('There are no active elections available.')
      } else {
        setElectedElections([])
        optionErrors.push(electionsResult.reason instanceof Error ? electionsResult.reason.message : 'Unable to load active elections.')
      }
      if (officesResult.status === 'fulfilled') {
        setElectedOffices(officesResult.value)
        if (officesResult.value.length === 0) optionErrors.push('No active ward offices are available.')
      } else {
        setElectedOffices([])
        optionErrors.push(officesResult.reason instanceof Error ? officesResult.reason.message : 'Unable to load ward offices.')
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

    const addElectedWardCouncillor = async () => {
      const candidateId = Number(electedCandidate?.id)
      const selectedElectionId = Number(electedElectionId)
      const selectedOfficeId = Number(electedOfficeId)
      if (
        !Number.isInteger(candidateId) || candidateId <= 0 ||
        !Number.isInteger(selectedElectionId) || selectedElectionId <= 0 ||
        !Number.isInteger(selectedOfficeId) || selectedOfficeId <= 0 ||
        !electedStartDate || !electedEndDate || !electedTenure.trim()
      ) {
        setElectedFormError('Complete all required fields and verify a candidate before saving.')
        return
      }
      if (electedEndDate < electedStartDate) {
        setElectedFormError('End date must be on or after the start date.')
        return
      }

      const data: AddElectedWardCouncillorData = {
        candidate_id: candidateId,
        office_id: selectedOfficeId,
        party_id: Number(electedCandidate?.party_id),
        election_id: selectedElectionId,
        ward_id: wardId,
        start_date: electedStartDate,
        end_date: electedEndDate,
        tenure: electedTenure.trim(),
        remark: electedRemark.trim()
      }

      setIsAddingElected(true)
      setElectedFormError('')
      try {
        const registration = await leadersService.checkLeadershipRegistration({
          candidate_id: candidateId,
          election_id: selectedElectionId
        })
        if (!registration.can_register) {
          throw new Error(registration.message || 'This candidate is already assigned to a leadership position for this election.')
        }
        await leadersService.addElectedWardCouncillor(data)
        setIsAddElectedOpen(false)
        setElectedCandidate(null)
        setElectedSuccessMessage(`${electedCandidate?.full_name || 'Candidate'} was added as an elected ward councillor.`)
        try {
          const electedLeaders = await leadersService.getActiveElectedWardCouncillor(wardId)
          setCandidates(mapElectedWardCouncillors(electedLeaders))
          setPage(1)
        } catch (refreshError) {
          setElectedSuccessMessage(
            `Elected councillor was added, but the list could not be refreshed. ${refreshError instanceof Error ? refreshError.message : ''}`
          )
        }
      } catch (saveError) {
        setElectedFormError(saveError instanceof Error ? saveError.message : 'Unable to add elected ward councillor.')
      } finally {
        setIsAddingElected(false)
      }
    }

    const openEditElectedCouncillor = async (candidate: Candidate) => {
      const assignmentId = Number(candidate.assignment_id)
      if (!Number.isInteger(assignmentId) || assignmentId <= 0) {
        setElectedEditError('This elected ward councillor does not have a valid record ID and cannot be edited.')
        return
      }

      setEditingElectedCandidate(candidate)
      setElectedEditError('')
      setIsLoadingElectedEditOptions(true)
      setElectedEditData({
        candidate_id: Number(candidate.candidate_id ?? candidate.id),
        office_id: Number(candidate.office_id ?? 0),
        party_id: Number(candidate.party_id ?? 0),
        election_id: Number(candidate.election_id ?? candidate.election?.id ?? 0),
        ward_id: wardId,
        start_date: String(candidate.start_date ?? '').slice(0, 10),
        end_date: String(candidate.end_date ?? '').slice(0, 10),
        tenure: String(candidate.tenure ?? ''),
        remark: String(candidate.remark ?? '')
      })

      const [electionResult, officeResult] = await Promise.allSettled([
        electionService.getAllElections(),
        electionService.getWardOffices()
      ])
      const errors: string[] = []
      if (electionResult.status === 'fulfilled') {
        const options = electionResult.value
        const currentElectionId = Number(candidate.election_id ?? candidate.election?.id ?? 0)
        if (currentElectionId && !options.some((election) => election.id === currentElectionId)) {
          options.push({
            id: currentElectionId,
            year: Number(candidate.election?.year) || currentElectionId,
            details: candidate.election?.details,
            status: candidate.election?.current_status ?? ''
          })
        }
        setElectedElections(options)
      } else {
        errors.push(electionResult.reason instanceof Error ? electionResult.reason.message : 'Unable to load elections.')
      }
      if (officeResult.status === 'fulfilled') {
        const options = officeResult.value
        const currentOfficeId = Number(candidate.office_id ?? 0)
        if (currentOfficeId && !options.some((office) => office.id === currentOfficeId)) {
          options.push({
            id: currentOfficeId,
            title: candidate.office_title || `Office ${currentOfficeId}`,
            status: 1
          })
        }
        setElectedOffices(options)
      } else {
        errors.push(officeResult.reason instanceof Error ? officeResult.reason.message : 'Unable to load ward offices.')
      }
      setElectedEditError(errors.join(' '))
      setIsLoadingElectedEditOptions(false)
    }

    const updateElectedCouncillor = async () => {
      const assignmentId = Number(editingElectedCandidate?.assignment_id)
      if (!Number.isInteger(assignmentId) || assignmentId <= 0) {
        setElectedEditError('This elected ward councillor does not have a valid record ID.')
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
        await leadersService.updateElectedWardCouncillor(assignmentId, {
          ...electedEditData,
          ward_id: wardId,
          tenure: electedEditData.tenure.trim(),
          remark: electedEditData.remark.trim()
        })
        setEditingElectedCandidate(null)
        setElectedSuccessMessage(`${editingElectedCandidate?.full_name || 'Elected councillor'} was updated successfully.`)
        try {
          setCandidates(mapElectedWardCouncillors(await leadersService.getActiveElectedWardCouncillor(wardId)))
        } catch (refreshError) {
          setElectedSuccessMessage(
            `Elected councillor was updated, but the list could not be refreshed. ${refreshError instanceof Error ? refreshError.message : ''}`
          )
        }
      } catch (updateError) {
        setElectedEditError(updateError instanceof Error ? updateError.message : 'Unable to update elected ward councillor.')
      } finally {
        setIsUpdatingElected(false)
      }
    }

    const openAddDialog = async () => {
    setIsAddOpen(true)
    setSelectedCandidate(null)
    setCandidateSearch('')
    setOfficeId('')
    setManifesto('')
    setElectionId('')
    setFormError('')
    setCandidateSearchError('')
    setOptionsError('')
    setIsLoadingOptions(true)

    const [electionsResult, officesResult] = await Promise.allSettled([
      electionService.getActiveElections(),
      electionService.getWardOffices()
    ])

    if (electionsResult.status === 'fulfilled') {
      setActiveElections(electionsResult.value)
      setElectionId(String(electionsResult.value[0]?.id ?? ''))
      if (electionsResult.value.length === 0) setOptionsError('No active elections are available.')
    } else {
      setActiveElections([])
      setOptionsError(electionsResult.reason instanceof Error ? electionsResult.reason.message : 'Unable to load active elections.')
    }

    if (officesResult.status === 'fulfilled') {
      setOffices(officesResult.value)
      if (officesResult.value.length === 0) {
        setOptionsError((current) => [current, 'No active ward offices are available.'].filter(Boolean).join(' '))
      }
    } else {
      setOffices([])
      setOptionsError((current) => [current, officesResult.reason instanceof Error ? officesResult.reason.message : 'Unable to load ward offices.'].filter(Boolean).join(' '))
    }
    setIsLoadingOptions(false)
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
      if (!candidate) {
        throw new Error('No candidate matched that NIN or phone number in the candidate directory.')
      }
      await electionService.checkCandidateRegistration({
        candidate_id: Number(candidate.id),
        election_id: Number(electionId)
      })
      setSelectedCandidate(candidate)
    } catch (verifyError) {
      setCandidateSearchError(verifyError instanceof Error ? verifyError.message : 'Unable to verify candidate registration.')
    } finally {
      setIsVerifying(false)
    }
  }

  const addCandidate = async () => {
    const partyId = Number(selectedCandidate?.party_id)
    if (!selectedCandidate || !Number.isInteger(partyId) || partyId <= 0) {
      setFormError('Verify a candidate with a political party assigned before saving.')
      return
    }
    if (!officeId || !electionId) {
      setFormError('Select an office and active election before saving.')
      return
    }

    const data: AddWardCandidateData = {
      candidate_id: Number(selectedCandidate.id),
      office_id: Number(officeId),
      party_id: partyId,
      election_id: Number(electionId),
      ward_id: wardId,
      manifesto: manifesto.trim()
    }

    setIsSaving(true)
    setFormError('')
    try {
      await electionService.checkCandidateRegistration({
        candidate_id: data.candidate_id,
        election_id: data.election_id
      })
      await candidateService.addWardCandidate(data)
      setIsAddOpen(false)
      setLoading(true)
      const updated = await candidateService.getActiveElectionWardCandidates(wardId)
      setCandidates(updated)
      setPage(1)
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : 'Unable to add ward candidate.')
    } finally {
      setIsSaving(false)
      setLoading(false)
    }
  }

  const openEditDialog = async (candidate: Candidate) => {
    setEditingCandidate(candidate)
    setEditError('')
    setIsEditOpen(true)
    setIsLoadingEditOptions(true)
    setEditData({
      candidate_id: Number(candidate.candidate_id ?? candidate.id),
      office_id: Number(candidate.office_id ?? 0),
      party_id: Number(candidate.party_id ?? 0),
      election_id: Number(candidate.election_id ?? candidate.election?.id ?? 0),
      ward_id: wardId,
      manifesto: candidate.manifesto ?? ''
    })

    const [electionsResult, officesResult] = await Promise.allSettled([
      electionService.getActiveElections(),
      electionService.getWardOffices()
    ])
    const errors: string[] = []
    if (electionsResult.status === 'fulfilled') {
      const elections = electionsResult.value
      const currentElectionId = Number(candidate.election_id ?? candidate.election?.id)
      if (currentElectionId > 0 && !elections.some((election) => election.id === currentElectionId)) {
        elections.push({
          id: currentElectionId,
          year: Number(candidate.election?.year) || currentElectionId,
          details: candidate.election?.details,
          status: candidate.election?.current_status ?? ''
        })
      }
      setActiveElections(elections)
    }
    else {
      setActiveElections([])
      errors.push(electionsResult.reason instanceof Error ? electionsResult.reason.message : 'Unable to load active elections.')
    }
    if (officesResult.status === 'fulfilled') setOffices(officesResult.value)
    else {
      setOffices([])
      errors.push(officesResult.reason instanceof Error ? officesResult.reason.message : 'Unable to load ward offices.')
    }
    setEditError(errors.join(' '))
    setIsLoadingEditOptions(false)
  }

  const updateCandidate = async () => {
    if (!editingCandidate || !editingCandidate.assignment_id) {
      setEditError('The ward candidate assignment ID is missing, so this record cannot be edited.')
      return
    }
    if (!editData.candidate_id || !editData.party_id || !editData.office_id || !editData.election_id) {
      setEditError('Candidate, party, office, and election information must all be available.')
      return
    }

    setIsUpdating(true)
    setEditError('')
    try {
      await candidateService.updateWardCandidate(Number(editingCandidate.assignment_id), editData)
      setIsEditOpen(false)
      setEditingCandidate(null)
      setLoading(true)
      setCandidates(await candidateService.getActiveElectionWardCandidates(wardId))
      setPage(1)
    } catch (updateError) {
      setEditError(updateError instanceof Error ? updateError.message : 'Unable to update ward candidate.')
    } finally {
      setIsUpdating(false)
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return
    if (!Number.isInteger(wardId) || wardId <= 0) {
      setError('Invalid ward.')
      setCandidates([])
      setLoading(false)
      return
    }

    let current = true
    setLoading(true)
    setError('')
    const loadCandidates = mode === 'elected'
      ? leadersService.getActiveElectedWardCouncillor(wardId).then(mapElectedWardCouncillors)
      : candidateService.getActiveElectionWardCandidates(wardId)
    loadCandidates
      .then((result) => {
        if (current) {
          setCandidates(result)
          setPage(1)
        }
      })
      .catch((loadError: unknown) => {
        if (current) {
          setCandidates([])
          setError(loadError instanceof Error ? loadError.message : `Unable to load ${pageTitle.toLowerCase()}.`)
        }
      })
      .finally(() => {
        if (current) setLoading(false)
      })

    return () => {
      current = false
    }
  }, [isAuthenticated, wardId, mode, pageTitle])

  return (
    <div className="space-y-4 p-4 md:space-y-6 md:p-0">
      <Link
        to="/k8s9d7f3-districts/wards"
        className="inline-flex items-center gap-2 text-sm font-medium text-[#146c4f] hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to wards
      </Link>

      <Card className="border border-gray-100 shadow-md">
        <CardContent className="p-0">
          <div className="flex flex-col gap-4 border-b border-gray-100 p-4 sm:p-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{pageTitle}</p>
                <h1 className="mt-1 break-words text-2xl font-bold text-gray-900">{wardName}</h1>
                <p className="text-sm text-gray-500">Active election records</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  {mode === 'candidates' ? 'Candidates' : 'Elected'}
                </p>
                <p className="font-semibold text-[#146c4f]">
                  {candidates.length} {mode === 'candidates' ? 'candidates' : 'elected'}
                </p>
              </div>
              {mode === 'candidates' && (
                <Button
                  type="button"
                  size="sm"
                  className="bg-[#146c4f] hover:bg-[#10563f]"
                  onClick={() => void openAddDialog()}
                  disabled={loading}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Candidate
                </Button>
              )}
              {mode === 'elected' && (
                <Button
                  type="button"
                  size="sm"
                  className="bg-[#146c4f] hover:bg-[#10563f]"
                  onClick={() => void openAddElectedDialog()}
                  disabled={loading}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Elected Councillor
                </Button>
              )}
            </div>
          </div>

          {mode === 'candidates' && (
            <div className="space-y-3 border-b border-gray-100 bg-gray-50/70 p-4 sm:p-6">
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
                <label className="text-sm font-medium text-gray-700">
                  Election year
                  <input
                    type="text"
                    inputMode="numeric"
                    aria-label="Search ward candidates by election year"
                    className="mt-1 flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                    placeholder="Type an election year"
                    value={searchElectionYear}
                    onChange={(event) => {
                      setSearchElectionYear(event.target.value)
                      setSearchError('')
                    }}
                    list="ward-election-years"
                  />
                  <datalist id="ward-election-years">
                    {Array.from(new Set(searchElections.map((election) => String(election.year)))).map((year) => (
                      <option key={year} value={year} />
                    ))}
                  </datalist>
                </label>
                <label className="text-sm font-medium text-gray-700">
                  Political party (optional)
                  <input
                    type="text"
                    aria-label="Filter ward candidates by party"
                    className="mt-1 flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                    placeholder="Type a party name or leave blank"
                    value={searchPartyName}
                    onChange={(event) => {
                      setSearchPartyName(event.target.value)
                      setSearchError('')
                    }}
                    list="ward-party-names"
                  />
                  <datalist id="ward-party-names">
                    {searchParties.map((party) => (
                      <option key={party.id} value={party.name} />
                    ))}
                  </datalist>
                </label>
                <Button type="button" onClick={() => void searchCandidates()} disabled={isSearching || loading}>
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                </Button>
                <Button type="button" variant="outline" onClick={() => void showActiveCandidates()} disabled={isSearching || loading}>
                  Show Active
                </Button>
              </div>
              {searchOptionsError && <p role="alert" className="text-sm text-red-600">{searchOptionsError}</p>}
              {searchError && <p role="alert" className="text-sm text-red-600">{searchError}</p>}
            </div>
          )}

          {mode === 'elected' && (
            <div className="space-y-3 border-b border-gray-100 bg-gray-50/70 p-4 sm:p-6">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
                <label className="text-sm font-medium text-gray-700">
                  Election year
                  <input
                    type="text"
                    inputMode="numeric"
                    aria-label="Search elected ward councillors by election year"
                    className="mt-1 flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                    placeholder="Type an election year"
                    value={electedSearchYear}
                    onChange={(event) => {
                      setElectedSearchYear(event.target.value)
                      setElectedSearchError('')
                    }}
                    list="elected-ward-election-years"
                  />
                  <datalist id="elected-ward-election-years">
                    {Array.from(new Set(searchElections.map((election) => String(election.year)))).map((year) => (
                      <option key={year} value={year} />
                    ))}
                  </datalist>
                </label>
                <Button type="button" onClick={() => void searchElectedCouncillors()} disabled={isSearching || loading}>
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                </Button>
                <Button type="button" variant="outline" onClick={() => void showActiveElectedCouncillors()} disabled={isSearching || loading}>
                  Show Active
                </Button>
              </div>
              {searchOptionsError && <p role="alert" className="text-sm text-red-600">{searchOptionsError}</p>}
              {electedSearchError && <p role="alert" className="text-sm text-red-600">{electedSearchError}</p>}
            </div>
          )}

          {electedSuccessMessage && mode === 'elected' && (
            <p role="status" className="border-b border-green-100 bg-green-50 px-4 py-3 text-sm text-green-800 sm:px-6">
              {electedSuccessMessage}
            </p>
          )}

          {loading || isSearching ? (
            <div className="flex items-center justify-center gap-2 p-12 text-sm text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin text-[#146c4f]" />
              {isSearching ? 'Searching ward candidates...' : `Loading ${pageTitle.toLowerCase()}...`}
            </div>
          ) : error ? (
            <div role="alert" className="p-8 text-center text-sm text-red-600">{error}</div>
          ) : candidates.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              {mode === 'elected' && hasSearchedElected
                ? 'No elected ward councillors found for the selected election.'
                : appliedSearch
                ? 'No ward candidates found for the selected election and party.'
                : `No active ${mode === 'candidates' ? 'candidates' : 'elected ward members'} found for this ward.`}
            </div>
          ) : (
            <div className={`grid grid-cols-1 gap-4 p-4 sm:p-6 ${mode === 'candidates' ? 'md:grid-cols-2' : ''}`}>
              {visibleCandidates.map((candidate) => {
                const candidateName = candidate.full_name || 'Candidate'
                const partyName = candidate.party?.name ?? candidate.political_party ?? 'N/A'
                const partyLogo = getPartyLogoValue(candidate.party)
                const election = candidate.election?.year
                  ? `${candidate.election.year}${candidate.election.details ? ` - ${candidate.election.details}` : ''}`
                  : candidate.election?.details ?? 'N/A'

                return (
                  <article
                    key={`${candidate.assignment_id ?? candidate.id}-${candidate.election_id ?? ''}`}
                    className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                  >
                    <div className="mb-4 flex min-w-0 items-center gap-3 border-b border-gray-100 pb-4">
                      <Avatar className="h-12 w-12 shrink-0 border border-gray-200">
                        <AvatarImage src={getLogoUrl(candidate.image) ?? undefined} alt={candidateName} className="object-cover" />
                        <AvatarFallback className="bg-[#146c4f]/10 font-bold text-[#146c4f]">
                          {candidateName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h2 className="truncate font-bold text-gray-900">{candidateName}</h2>
                        <p className="text-xs font-semibold text-[#146c4f]">{candidate.office_title || 'Ward Candidate'}</p>
                      </div>
                      {mode === 'candidates' && (
                        <div className="ml-auto flex shrink-0 gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => void openEditDialog(candidate)}
                            disabled={!candidate.assignment_id || isUpdating || isDeleting}
                          >
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </Button>
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
                        </div>
                      )}
                      {mode === 'elected' && (
                        <div className="ml-auto flex shrink-0 flex-wrap justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => void openEditElectedCouncillor(candidate)}
                            disabled={!candidate.assignment_id || isUpdatingElected || isProcessingElectedAction}
                          >
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setElectedActionError('')
                              setElectedAction({ type: 'terminate', candidate })
                            }}
                            disabled={!candidate.assignment_id || isProcessingElectedAction}
                          >
                            <Ban className="mr-2 h-4 w-4" /> Terminate
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setElectedActionError('')
                              setElectedAction({ type: 'delete', candidate })
                            }}
                            disabled={!candidate.assignment_id || isProcessingElectedAction}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </Button>
                        </div>
                      )}
                      <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
                        {candidate.status || 'Active'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                      <div className="rounded-xl bg-gray-50 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Political Party</p>
                        <div className="mt-1 flex min-w-0 items-center gap-2">
                          <Avatar className="h-8 w-8 shrink-0 border border-gray-200 bg-white">
                            {partyLogo && <AvatarImage src={partyLogo} alt={`${partyName} logo`} className="object-contain p-0.5" />}
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
                      {mode === 'elected' && (
                        <>
                          <div className="rounded-xl bg-gray-50 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Tenure</p>
                            <p className="truncate font-semibold text-gray-800">{candidate.tenure || 'N/A'}</p>
                          </div>
                          <div className="rounded-xl bg-gray-50 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Term dates</p>
                            <p className="truncate font-semibold text-gray-800">
                              {candidate.start_date || 'N/A'} – {candidate.end_date || 'N/A'}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                    {(mode === 'elected' ? candidate.remark : candidate.manifesto) && (
                      <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50/60 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                          {mode === 'elected' ? 'Remark' : 'Manifesto'}
                        </p>
                        <p className="mt-1 line-clamp-3 text-sm text-amber-900">
                          {mode === 'elected' ? candidate.remark : candidate.manifesto}
                        </p>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}

          {!loading && !error && candidates.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, candidates.length)} of {candidates.length} {mode === 'candidates' ? 'candidates' : 'elected records'}
              </p>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}>
                    <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                  </Button>
                  <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
                  <Button type="button" size="sm" variant="outline" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages}>
                    Next <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
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
              {electedAction?.type === 'delete' ? 'Delete elected ward councillor' : 'Terminate elected ward councillor'}
            </DialogTitle>
            <DialogDescription>
              {electedAction?.type === 'delete'
                ? `Are you sure you want to permanently remove ${electedAction.candidate.full_name || 'this elected councillor'} from the ward?`
                : `Are you sure you want to terminate ${electedAction?.candidate.full_name || 'this councillor'}'s active tenure?`}
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
              onClick={() => void performElectedCouncillorAction()}
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
      <Dialog
        open={isAddElectedOpen}
        onOpenChange={(open) => {
          if (!open && isAddingElected) return
          setIsAddElectedOpen(open)
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Elected Ward Councillor</DialogTitle>
            <DialogDescription>
              {electedCandidate
                ? 'Step 2 of 2: Review the verified candidate and complete the elected councillor details.'
                : 'Step 1 of 2: Select an active election and verify the candidate’s leadership registration.'}
            </DialogDescription>
          </DialogHeader>
          {isLoadingElectedOptions ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin text-[#146c4f]" />
              Loading active elections and ward offices...
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
                <label htmlFor="elected-ward-candidate-search" className="mb-1 block text-sm font-medium">
                  Candidate NIN or phone number *
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="elected-ward-candidate-search"
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
                <Button type="button" variant="outline" onClick={() => setIsAddElectedOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="mb-3 font-semibold text-green-900">Candidate verified</p>
                <div className="mb-3 flex items-center gap-3">
                  <Avatar className="h-12 w-12 border">
                    <AvatarImage
                      src={getLogoUrl(electedCandidate.image) ?? undefined}
                      alt={electedCandidate.full_name}
                    />
                    <AvatarFallback>{electedCandidate.full_name?.charAt(0)?.toUpperCase() || 'C'}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900">{electedCandidate.full_name}</p>
                    <p className="text-sm text-green-800">
                      Leadership registration verified for election{' '}
                      {electedElections.find((election) => election.id === Number(electedElectionId))?.year ?? electedElectionId}
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
                    <option value="">Select ward office</option>
                    {electedOffices.map((office) => (
                      <option key={office.id} value={office.id}>{office.title}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-sm font-medium">
                  Election
                  <Input
                    value={String(electedElections.find((election) => election.id === Number(electedElectionId))?.year ?? electedElectionId)}
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
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
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
                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                  <Button type="button" variant="outline" onClick={() => setIsAddElectedOpen(false)} disabled={isAddingElected}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="bg-[#146c4f] hover:bg-[#10563f]"
                    onClick={() => void addElectedWardCouncillor()}
                    disabled={isAddingElected || electedOffices.length === 0}
                  >
                    {isAddingElected && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isAddingElected ? 'Saving...' : 'Add Elected Councillor'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(editingElectedCandidate)}
        onOpenChange={(open) => {
          if (!open && !isUpdatingElected) {
            setEditingElectedCandidate(null)
            setElectedEditError('')
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Elected Ward Councillor</DialogTitle>
            <DialogDescription>
              Update {editingElectedCandidate?.full_name || 'this councillor'} and their ward leadership details.
            </DialogDescription>
          </DialogHeader>
          {isLoadingElectedEditOptions ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin text-[#146c4f]" />
              Loading election and ward office options...
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1 text-sm font-medium">
                  Candidate
                  <Input value={editingElectedCandidate?.full_name ?? ''} disabled />
                </label>
                <label className="space-y-1 text-sm font-medium">
                  Political party
                  <Input value={editingElectedCandidate?.party?.name ?? editingElectedCandidate?.political_party ?? ''} disabled />
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
                    <option value="">Select ward office</option>
                    {electedOffices.map((office) => (
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
                    {electedElections.map((election) => (
                      <option key={election.id} value={election.id}>
                        {election.year}{election.details ? ` - ${election.details}` : ''}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-sm font-medium">
                  Ward
                  <Input value={wardName} disabled />
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingElectedCandidate(null)}
                  disabled={isUpdatingElected}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => void updateElectedCouncillor()}
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
        <Dialog
          open={Boolean(deletingCandidate)}
          onOpenChange={(open) => {
            if (!open && !isDeleting) {
              setDeletingCandidate(null)
              setDeleteError('')
            }
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delete ward candidate</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove {deletingCandidate?.full_name || 'this candidate'} from this ward?
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
                onClick={() => deletingCandidate && void removeWardCandidate(deletingCandidate)}
                disabled={isDeleting}
              >
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Ward Candidate</DialogTitle>
            <DialogDescription>
              {selectedCandidate
                ? 'Candidate verified. Complete the ward assignment details.'
                : 'Select an active election and verify the candidate registration.'}
            </DialogDescription>
          </DialogHeader>
          {!selectedCandidate ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="ward-candidate-election" className="mb-1 block text-sm font-medium">Active election *</label>
                <select
                  id="ward-candidate-election"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={electionId}
                  disabled={isLoadingOptions || activeElections.length === 0}
                  onChange={(event) => {
                    setElectionId(event.target.value)
                    setSelectedCandidate(null)
                  }}
                >
                  <option value="">{isLoadingOptions ? 'Loading elections...' : 'Select active election'}</option>
                  {activeElections.map((election) => (
                    <option key={election.id} value={election.id}>
                      {election.year}{election.details ? ` - ${election.details}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <label className="block space-y-1 text-sm font-medium">
                Candidate NIN or phone number *
                <div className="flex flex-col gap-2 sm:flex-row">
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
                  <Button type="button" onClick={() => void verifyCandidate()} disabled={isVerifying || isLoadingOptions || !electionId}>
                    {isVerifying ? 'Verifying...' : 'Verify'}
                  </Button>
                </div>
              </label>
              {optionsError && <p role="alert" className="text-sm text-red-600">{optionsError}</p>}
              {candidateSearchError && <p role="alert" className="text-sm text-red-600">{candidateSearchError}</p>}
              <div className="flex justify-end">
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="mb-3 flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={getLogoUrl(selectedCandidate.image) ?? undefined} alt={selectedCandidate.full_name} />
                    <AvatarFallback>{selectedCandidate.full_name.slice(0, 2).toUpperCase() || 'CA'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{selectedCandidate.full_name}</p>
                    <p className="text-sm text-muted-foreground">Verified candidate</p>
                  </div>
                </div>
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <p><span className="font-medium">NIN:</span> {selectedCandidate.nin || 'N/A'}</p>
                  <p><span className="font-medium">Phone:</span> {selectedCandidate.phoneNo || 'N/A'}</p>
                  <p><span className="font-medium">Email:</span> {selectedCandidate.email || 'N/A'}</p>
                  <p><span className="font-medium">Party:</span> {selectedCandidate.party?.name || selectedCandidate.political_party || 'N/A'}</p>
                  <p><span className="font-medium">Election:</span> {activeElections.find((election) => election.id === Number(electionId))?.year ?? electionId}</p>
                </div>
              </div>
              <div>
                <label htmlFor="ward-candidate-office" className="mb-1 block text-sm font-medium">Office *</label>
                <select
                  id="ward-candidate-office"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={officeId}
                  disabled={isLoadingOptions || offices.length === 0}
                  onChange={(event) => setOfficeId(event.target.value)}
                >
                  <option value="">{isLoadingOptions ? 'Loading offices...' : 'Select office'}</option>
                  {offices.map((office) => <option key={office.id} value={office.id}>{office.title}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="ward-candidate-manifesto" className="mb-1 block text-sm font-medium">Manifesto</label>
                <Textarea
                  id="ward-candidate-manifesto"
                  value={manifesto}
                  onChange={(event) => setManifesto(event.target.value)}
                  placeholder="Enter candidate manifesto"
                  rows={4}
                />
              </div>
              {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                <Button type="button" variant="outline" onClick={() => setSelectedCandidate(null)}>Back</Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                  <Button type="button" className="bg-[#146c4f] hover:bg-[#10563f]" disabled={isSaving || offices.length === 0} onClick={() => void addCandidate()}>
                    {isSaving ? 'Adding...' : 'Add Candidate'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open)
          if (!open) {
            setEditingCandidate(null)
            setEditError('')
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Ward Candidate</DialogTitle>
            <DialogDescription>Update this candidate&apos;s ward election assignment.</DialogDescription>
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
                    {offices.map((office) => <option key={office.id} value={office.id}>{office.title}</option>)}
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
                    {activeElections.map((election) => (
                      <option key={election.id} value={election.id}>
                        {election.year}{election.details ? ` - ${election.details}` : ''}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-sm font-medium">
                  Political party
                  <Input value={editingCandidate?.party?.name || editingCandidate?.political_party || `Party ${editData.party_id}`} disabled />
                </label>
                <label className="space-y-1 text-sm font-medium">
                  Ward
                  <Input value={wardName} disabled />
                </label>
                <label className="space-y-1 text-sm font-medium sm:col-span-2">
                  Manifesto
                  <Textarea
                    value={editData.manifesto}
                    onChange={(event) => setEditData((current) => ({ ...current, manifesto: event.target.value }))}
                    rows={4}
                  />
                </label>
              </div>
              {editError && <p role="alert" className="text-sm text-red-600">{editError}</p>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} disabled={isUpdating}>Cancel</Button>
                <Button type="button" onClick={() => void updateCandidate()} disabled={isUpdating} className="bg-[#146c4f] hover:bg-[#10563f]">
                  {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isUpdating ? 'Saving...' : 'Save changes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
