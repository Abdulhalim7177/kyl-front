import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2, MapPin, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { candidateService, Candidate, UpdateSenatorialCandidateData } from '@/services/candidates'
import { districtsService, District } from '@/services/districts'
import { Election, electionService } from '@/services/elections'
import { useAuth } from '@/contexts/AuthContext'
import { getLogoUrl, getPartyLogoValue } from '@/lib/utils'

type OfficeOption = { id: number; title: string; status?: number }

const normalizeCandidateIdentifier = (value: string | number | undefined) =>
  String(value ?? '').toLowerCase().replace(/[\s()+-]/g, '')

export default function SenatorialCandidatesPage() {
  const { id } = useParams<{ id: string }>()
  const { isAuthenticated } = useAuth()
  const [district, setDistrict] = useState<District | null>(null)
  const [senatorialDistricts, setSenatorialDistricts] = useState<District[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [candidateDirectory, setCandidateDirectory] = useState<Candidate[]>([])
  const [elections, setElections] = useState<Election[]>([])
  const [offices, setOffices] = useState<OfficeOption[]>([])
  const [electionId, setElectionId] = useState('')
  const [search, setSearch] = useState('')
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
  const [editData, setEditData] = useState<UpdateSenatorialCandidateData>({
    candidate_id: 0,
    office_id: 0,
    party_id: 0,
    election_id: 0,
    senetorial_district_id: 0,
    manifesto: ''
  })
  const [editError, setEditError] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState('')
  const [dataError, setDataError] = useState('')
  const [candidatesError, setCandidatesError] = useState('')
  const districtId = district?.id ?? Number(id)
  const districtName = district?.name ?? `Senatorial District ${id ?? ''}`

  const handleAddDialogChange = (open: boolean) => {
    setIsAddOpen(open)
    if (!open) {
      setCandidateSearch('')
      setCandidateSearchError('')
      setFormError('')
      setSelectedCandidate(null)
      setOfficeId('')
      setManifesto('')
    }
  }

  useEffect(() => {
    if (!districtId) {
      setCandidates([])
      return
    }

    let isCurrent = true
    setCandidatesLoading(true)
    candidateService.getActiveElectionSenatorialCandidates(districtId)
      .then((data) => {
        if (isCurrent) {
          setCandidates(data)
          setCandidatesError('')
        }
      })
      .catch((loadError: unknown) => {
        if (isCurrent) {
          setCandidates([])
          setCandidatesError(loadError instanceof Error ? loadError.message : 'Unable to load senatorial candidates.')
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
      const districts = await districtsService.getSenatorialDistricts()
      const currentDistrict = districts.find((item) => item.id === Number(id))
      if (!currentDistrict) throw new Error('Senatorial district not found.')

      setSenatorialDistricts(districts)
      setDistrict(currentDistrict)
      setLoading(false)

      const [electionResult, candidateResult, officeResult] = await Promise.allSettled([
        electionService.getActiveElections(),
        candidateService.getAllCandidates(),
        electionService.getSenateOffices()
      ])
      const errors: string[] = []
      if (electionResult.status === 'fulfilled') {
        setElections(electionResult.value)
        setElectionId((current) => current || String(electionResult.value[0]?.id ?? ''))
      } else {
        errors.push('Unable to load elections.')
        console.error('Failed to load active elections:', electionResult.reason)
      }
      if (candidateResult.status === 'fulfilled') {
        setCandidateDirectory(candidateResult.value)
      } else {
        errors.push('Unable to load the candidate directory.')
        console.error('Failed to load candidate directory:', candidateResult.reason)
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
        errors.push('Unable to load offices.')
        console.error('Failed to load offices:', officeResult.reason)
      }
      setDataError(errors.join(' '))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load senatorial district.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (!isAuthenticated || !id) return
    void loadPage()
  }, [id, isAuthenticated, loadPage])

  const filteredCandidates = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return candidates
    return candidates.filter((candidate) => [
      candidate.full_name,
      candidate.office_title,
      candidate.political_party,
      candidate.party?.name,
      candidate.email,
      candidate.phoneNo,
      candidate.nin,
      candidate.state,
      candidate.election?.year,
      candidate.election?.details,
      candidate.manifesto
    ].some((value) => String(value ?? '').toLowerCase().includes(query)))
  }, [candidates, search])

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
      const candidate = candidateDirectory.find((item) =>
        normalizeCandidateIdentifier(item.nin) === identifier ||
        normalizeCandidateIdentifier(item.phoneNo) === identifier
      )
      if (!candidate) throw new Error('No candidate found with that NIN or phone number.')

      await electionService.checkCandidateRegistration({
        candidate_id: Number(candidate.id),
        election_id: Number(electionId)
      })
      setSelectedCandidate(candidate)
    } catch (verifyError) {
      setCandidateSearchError(verifyError instanceof Error ? verifyError.message : 'Unable to verify candidate.')
    } finally {
      setIsVerifying(false)
    }
  }

  const addCandidate = async () => {
    if (!districtId || !selectedCandidate || !electionId || !officeId || !selectedCandidate.party_id) {
      setFormError('Select an election and office, and make sure the verified candidate has a political party assigned.')
      return
    }

    try {
      setIsSaving(true)
      setFormError('')
      await electionService.checkCandidateRegistration({
        candidate_id: Number(selectedCandidate.id),
        election_id: Number(electionId)
      })
      await candidateService.addSenatorialCandidate({
        candidate_id: Number(selectedCandidate.id),
        office_id: Number(officeId),
        party_id: Number(selectedCandidate.party_id),
        election_id: Number(electionId),
        senetorial_district_id: districtId,
        manifesto
      })
      const updatedCandidates = await candidateService.getActiveElectionSenatorialCandidates(districtId)
      setCandidates(updatedCandidates)
      setIsAddOpen(false)
      setCandidateSearch('')
      setCandidateSearchError('')
      setFormError('')
      setSelectedCandidate(null)
      setOfficeId('')
      setManifesto('')
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : 'Unable to add senatorial candidate.')
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
      election_id: Number(candidate.election?.id) || 0,
      senetorial_district_id: districtId || 0,
      manifesto: candidate.manifesto ?? ''
    })
  }

  const updateSenatorialCandidate = async () => {
    const assignment = editingCandidate as (Candidate & { assignment_id?: number }) | null
    const assignmentId = Number(assignment?.assignment_id)
    if (!Number.isInteger(assignmentId) || assignmentId <= 0) {
      setEditError('This senatorial assignment does not have a valid record ID.')
      return
    }
    if (
      !editData.candidate_id || !editData.office_id || !editData.party_id ||
      !editData.election_id || !editData.senetorial_district_id
    ) {
      setEditError('Complete all required fields before saving.')
      return
    }

    setIsUpdating(true)
    setEditError('')
    try {
      await candidateService.updateSenatorialCandidate(assignmentId, editData)
      const updatedCandidates = await candidateService.getActiveElectionSenatorialCandidates(districtId)
      setCandidates(updatedCandidates)
      setEditingCandidate(null)
    } catch (updateError) {
      setEditError(updateError instanceof Error ? updateError.message : 'Unable to update senatorial candidate.')
    } finally {
      setIsUpdating(false)
    }
  }

  const removeSenatorialCandidate = async () => {
    const assignmentId = Number(deletingCandidate?.assignment_id)
    if (!Number.isInteger(assignmentId) || assignmentId <= 0) {
      setDeleteError('This senatorial assignment does not have a valid record ID.')
      return
    }

    setIsDeleting(true)
    setDeleteError('')
    try {
      await candidateService.removeSenatorialCandidate(assignmentId)
      const updatedCandidates = await candidateService.getActiveElectionSenatorialCandidates(districtId)
      setCandidates(updatedCandidates)
      setDeletingCandidate(null)
    } catch (removeError) {
      setDeleteError(removeError instanceof Error ? removeError.message : 'Unable to remove senatorial candidate.')
    } finally {
      setIsDeleting(false)
    }
  }

  const editCandidateOptions = [...candidateDirectory, ...(editingCandidate ? [editingCandidate] : [])]
    .filter((candidate, index, all) => all.findIndex((item) => item.id === candidate.id) === index)
  const editPartyOptions = [...candidateDirectory, ...candidates]
    .filter((candidate) => Number(candidate.party_id) > 0)
    .reduce<Array<{ id: number; name: string }>>((options, candidate) => {
      const partyId = Number(candidate.party_id)
      if (!options.some((party) => party.id === partyId)) {
        options.push({
          id: partyId,
          name: candidate.party?.name || candidate.political_party || `Party ${partyId}`
        })
      }
      return options
    }, [])
  const editOffices = offices.some((office) => office.id === editData.office_id)
    ? offices
    : editingCandidate?.office_id
      ? [...offices, { id: editingCandidate.office_id, title: editingCandidate.office_title || `Office ${editingCandidate.office_id}` }]
      : offices
  const editElections = elections.some((election) => election.id === editData.election_id)
    ? elections
    : editingCandidate?.election?.id
      ? [...elections, {
          id: editingCandidate.election.id,
          year: editingCandidate.election.year ?? '',
          details: editingCandidate.election.details,
          status: editingCandidate.election.current_status ?? ''
        }]
      : elections
  const editDistricts = senatorialDistricts.some((item) => item.id === editData.senetorial_district_id)
    ? senatorialDistricts
    : district
      ? [...senatorialDistricts, district]
      : senatorialDistricts

  return (
    <div className="space-y-6 p-4 md:p-0">
      <Link to="/k8s9d7f3-districts/senatorial" className="inline-flex items-center gap-2 text-sm font-medium text-[#146c4f] hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to senatorial districts
      </Link>
      <Card className="border border-gray-100 shadow-md">
        <CardContent className="p-0">
          <div className="flex flex-col gap-4 border-b border-gray-100 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100"><MapPin className="h-6 w-6 text-blue-600" /></div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Senatorial Candidates</p>
                <h1 className="mt-1 text-2xl font-bold text-gray-900">{districtName}</h1>
                <p className="text-sm text-gray-500">{district?.state?.name ?? 'State not specified'}</p>
              </div>
            </div>
            <Button type="button" onClick={() => handleAddDialogChange(true)} className="bg-[#146c4f] hover:bg-[#10563f]">
              <Plus className="mr-2 h-4 w-4" /> Add Candidate
            </Button>
          </div>

          {loading && <div className="flex items-center gap-2 border-b border-gray-100 px-6 py-3 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading district details...</div>}
          {(error || dataError || candidatesError) && (
            <div role="alert" className="border-b border-amber-200 bg-amber-50 px-6 py-3 text-sm text-amber-800">
              {[error, dataError, candidatesError].filter(Boolean).join(' ')}
            </div>
          )}

          <Dialog open={isAddOpen} onOpenChange={handleAddDialogChange}>
            {isAddOpen && (
              <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add candidate to {districtName}</DialogTitle>
                  <DialogDescription>Verify the candidate with their NIN or phone number before completing the assignment.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
              <label className="block max-w-xl space-y-2 text-sm font-medium text-gray-700">
                Election *
                <select
                  className="h-10 w-full rounded-md border border-input bg-white px-3"
                  value={electionId}
                  disabled={isVerifying}
                  onChange={(event) => {
                    setElectionId(event.target.value)
                    setSelectedCandidate(null)
                    setCandidateSearchError('')
                    setFormError('')
                  }}
                >
                  <option value="">Select election</option>
                  {elections.map((election) => <option key={election.id} value={election.id}>{election.year}{election.details ? ` - ${election.details}` : ''}</option>)}
                </select>
              </label>
              <div className="max-w-xl">
                <label className="space-y-2 text-sm font-medium text-gray-700">
                  Candidate NIN or phone number *
                  <div className="flex gap-2">
                    <Input
                      value={candidateSearch}
                      disabled={isVerifying}
                      onChange={(event) => {
                        setCandidateSearch(event.target.value)
                        setSelectedCandidate(null)
                        setCandidateSearchError('')
                        setFormError('')
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          void verifyCandidate()
                        }
                      }}
                      placeholder="Enter NIN or phone number"
                    />
                    <Button type="button" variant="outline" onClick={verifyCandidate} disabled={isVerifying}>
                      {isVerifying ? 'Checking...' : 'Verify Candidate'}
                    </Button>
                  </div>
                </label>
              </div>
              {candidateSearchError && <p role="alert" className="text-sm text-red-600">{candidateSearchError}</p>}
              {selectedCandidate && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <p className="mb-3 font-semibold text-green-900">Candidate verified</p>
                    <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                      <p><span className="block text-xs text-green-700">Full name</span><strong>{selectedCandidate.full_name || 'N/A'}</strong></p>
                      <p><span className="block text-xs text-green-700">NIN</span><strong>{selectedCandidate.nin || 'N/A'}</strong></p>
                      <p><span className="block text-xs text-green-700">Phone</span><strong>{selectedCandidate.phoneNo || 'N/A'}</strong></p>
                      <p><span className="block text-xs text-green-700">Email</span><strong>{selectedCandidate.email || 'N/A'}</strong></p>
                      <p><span className="block text-xs text-green-700">State</span><strong>{selectedCandidate.state || 'N/A'}</strong></p>
                      <p><span className="block text-xs text-green-700">Political party</span><strong>{selectedCandidate.party?.name || selectedCandidate.political_party || 'N/A'}</strong></p>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2 text-sm font-medium text-gray-700">
                      Office *
                      <select className="h-10 w-full rounded-md border border-input bg-white px-3" value={officeId} onChange={(event) => setOfficeId(event.target.value)}>
                        <option value="">Select office</option>
                        {offices.map((office) => <option key={office.id} value={office.id}>{office.title}</option>)}
                      </select>
                    </label>
                    <label className="space-y-2 text-sm font-medium text-gray-700 md:col-span-2">
                      Manifesto
                      <Textarea value={manifesto} onChange={(event) => setManifesto(event.target.value)} placeholder="Candidate manifesto" rows={3} />
                    </label>
                  </div>
                  {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}
                  <div className="flex justify-end">
                    <Button type="button" onClick={addCandidate} disabled={isSaving} className="bg-[#146c4f] hover:bg-[#10563f]">
                      {isSaving ? 'Saving...' : 'Add Senatorial Candidate'}
                    </Button>
                  </div>
                </div>
              )}
              </div>
            </DialogContent>
          )}
          </Dialog>

          <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <label className="relative block w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input aria-label="Search senatorial candidates" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search candidates by name, office, or party" className="pl-9" />
            </label>
            <p className="text-sm text-gray-500">Showing {filteredCandidates.length} candidates</p>
          </div>

          {filteredCandidates.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              {loading || candidatesLoading
                ? 'Loading active senatorial candidates...'
                : candidatesError
                  ? 'Unable to load active senatorial candidates.'
                  : search.trim()
                    ? `No candidates match "${search.trim()}".`
                    : 'No active senatorial candidates found for this district.'}
            </div>
          ) : (
            <div className="grid w-full grid-cols-1 gap-4 p-6">
              {filteredCandidates.map((candidate) => {
                const partyName = candidate.party?.name || candidate.political_party || 'N/A'
                const photoUrl = getLogoUrl(candidate.image)
                const partyLogoUrl = getPartyLogoValue(candidate.party)
                const electionLabel = [candidate.election?.year, candidate.election?.details]
                  .filter(Boolean)
                  .join(' - ') || 'N/A'
                const nameInitial = candidate.full_name?.trim().charAt(0).toUpperCase() || 'C'
                return (
                  <article key={`${candidate.assignment_id ?? candidate.id}-${candidate.office_id ?? 'office'}`} className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                    <div className="border-b border-gray-100 bg-gradient-to-r from-[#146c4f]/5 to-transparent p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar className="h-14 w-14 shrink-0 border border-gray-200">
                            {photoUrl && <AvatarImage src={photoUrl} alt={candidate.full_name} className="object-cover" />}
                            <AvatarFallback className="bg-[#146c4f]/10 font-semibold text-[#146c4f]">{nameInitial}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <h3 className="truncate font-semibold text-gray-900">{candidate.full_name || 'Candidate'}</h3>
                            <p className="mt-0.5 text-xs text-gray-500">{candidate.office_title || 'Senatorial candidate'}</p>
                            <p className="text-xs text-gray-500">Candidate ID {candidate.user_id || candidate.id}</p>
                          </div>
                        </div>
                        <Button type="button" size="sm" variant="outline" className="shrink-0" onClick={() => openEditForm(candidate)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => {
                            setDeleteError('')
                            setDeletingCandidate(candidate)
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-3 p-4 text-sm text-gray-600">
                      <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-2.5">
                        <Avatar className="h-9 w-9 shrink-0 border border-gray-200 bg-white">
                          {partyLogoUrl && <AvatarImage src={partyLogoUrl} alt={`${partyName} logo`} className="object-contain" />}
                          <AvatarFallback className="bg-gray-100 text-xs font-semibold text-gray-600">{partyName.charAt(0).toUpperCase() || 'P'}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Political party</p>
                          <p className="truncate font-medium text-gray-800">{partyName}</p>
                        </div>
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
                        <div className="min-w-0 rounded-lg bg-gray-50 p-2.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Date of birth</p>
                          <p className="mt-1 font-medium text-gray-800">{candidate.dob || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="min-w-0 rounded-lg bg-gray-50 p-2.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Gender</p>
                          <p className="mt-1 font-medium text-gray-800">{candidate.gender || 'N/A'}</p>
                        </div>
                        <div className="min-w-0 rounded-lg bg-gray-50 p-2.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">State</p>
                          <p className="mt-1 font-medium text-gray-800">{candidate.state || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Election</p>
                        <p className="mt-1 font-medium text-gray-800">{electionLabel}</p>
                        {candidate.election?.current_status && <p className="mt-1 text-xs text-gray-500">{candidate.election.current_status}</p>}
                      </div>
                      <div className="rounded-lg bg-gray-50 p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Senatorial district</p>
                        <p className="mt-1 font-medium text-gray-800">{candidate.senatorial_district || districtName}</p>
                      </div>
                      {candidate.address && (
                        <div className="rounded-lg bg-gray-50 p-2.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Address</p>
                          <p className="mt-1 break-words font-medium text-gray-800">{candidate.address}</p>
                        </div>
                      )}
                      {candidate.manifesto && (
                        <div className="rounded-lg bg-gray-50 p-2.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Manifesto</p>
                          <p className="mt-1 whitespace-pre-wrap font-medium text-gray-800">{candidate.manifesto}</p>
                        </div>
                      )}
                      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Status</span>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${candidate.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
                          {candidate.status || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
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
            <DialogTitle>Edit Senatorial Candidate</DialogTitle>
            <DialogDescription>Update the senatorial candidate registration.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="edit-senatorial-candidate" className="mb-2 block text-sm font-medium text-gray-700">Candidate *</label>
                <select
                  id="edit-senatorial-candidate"
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
                <label htmlFor="edit-senatorial-office" className="mb-2 block text-sm font-medium text-gray-700">Office *</label>
                <select
                  id="edit-senatorial-office"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={editData.office_id || ''}
                  onChange={(event) => setEditData((current) => ({ ...current, office_id: Number(event.target.value) || 0 }))}
                >
                  <option value="">Select office</option>
                  {editOffices.map((office) => <option key={office.id} value={office.id}>{office.title}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="edit-senatorial-party" className="mb-2 block text-sm font-medium text-gray-700">Political Party *</label>
                <select
                  id="edit-senatorial-party"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={editData.party_id || ''}
                  onChange={(event) => setEditData((current) => ({ ...current, party_id: Number(event.target.value) || 0 }))}
                >
                  <option value="">Select party</option>
                  {editPartyOptions.map((party) => <option key={party.id} value={party.id}>{party.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="edit-senatorial-election" className="mb-2 block text-sm font-medium text-gray-700">Election *</label>
                <select
                  id="edit-senatorial-election"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={editData.election_id || ''}
                  onChange={(event) => setEditData((current) => ({ ...current, election_id: Number(event.target.value) || 0 }))}
                >
                  <option value="">Select election</option>
                  {editElections.map((election) => (
                    <option key={election.id} value={election.id}>
                      {election.year}{election.details ? ` - ${election.details}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="edit-senatorial-district" className="mb-2 block text-sm font-medium text-gray-700">Senatorial District *</label>
                <select
                  id="edit-senatorial-district"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={editData.senetorial_district_id || ''}
                  onChange={(event) => setEditData((current) => ({ ...current, senetorial_district_id: Number(event.target.value) || 0 }))}
                >
                  <option value="">Select senatorial district</option>
                  {editDistricts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="edit-senatorial-manifesto" className="mb-2 block text-sm font-medium text-gray-700">Manifesto</label>
                <Textarea
                  id="edit-senatorial-manifesto"
                  rows={3}
                  value={editData.manifesto}
                  onChange={(event) => setEditData((current) => ({ ...current, manifesto: event.target.value }))}
                />
              </div>
            </div>
            {editError && <p role="alert" className="text-sm text-red-600">{editError}</p>}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setEditingCandidate(null)} disabled={isUpdating}>Cancel</Button>
              <Button type="button" onClick={updateSenatorialCandidate} disabled={isUpdating} className="bg-[#146c4f] hover:bg-[#10563f]">
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
            <DialogTitle>Remove Senatorial Candidate</DialogTitle>
            <DialogDescription>
              Remove {deletingCandidate?.full_name || 'this candidate'} from this senatorial assignment? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteError && <p role="alert" className="text-sm text-red-600">{deleteError}</p>}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setDeletingCandidate(null)} disabled={isDeleting}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={removeSenatorialCandidate} disabled={isDeleting}>
              {isDeleting ? 'Removing...' : 'Remove Candidate'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
