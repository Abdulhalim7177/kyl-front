import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Loader2, MapPin, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { candidateService, Candidate } from '@/services/candidates'
import { districtsService, District } from '@/services/districts'
import { Election, electionService } from '@/services/elections'
import { AddElectedSenatorData, ElectedLeader, leadersService, UpdateElectedSenatorData } from '@/services/leaders'
import { getLogoUrl } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

type OfficeOption = { id: number; title: string; status?: number }

const normalizeCandidateIdentifier = (value: string | number | undefined) =>
  String(value ?? '').toLowerCase().replace(/[\s()+-]/g, '')

export default function ElectedSenatorsPage() {
  const { id } = useParams<{ id: string }>()
  const { isAuthenticated } = useAuth()
  const [district, setDistrict] = useState<District | null>(null)
  const [leaders, setLeaders] = useState<ElectedLeader[]>([])
  const [candidateDirectory, setCandidateDirectory] = useState<Candidate[]>([])
  const [elections, setElections] = useState<Election[]>([])
  const [offices, setOffices] = useState<OfficeOption[]>([])
  const [candidateSearch, setCandidateSearch] = useState('')
  const [candidateSearchError, setCandidateSearchError] = useState('')
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [search, setSearch] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingLeader, setEditingLeader] = useState<ElectedLeader | null>(null)
  const [editData, setEditData] = useState<UpdateElectedSenatorData>({
    candidate_id: 0,
    office_id: 0,
    party_id: 0,
    election_id: 0,
    senetorial_district_id: 0,
    start_date: '',
    end_date: '',
    tenure: '',
    remark: ''
  })
  const [editError, setEditError] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formError, setFormError] = useState('')
  const [formData, setFormData] = useState({
    office_id: '',
    election_id: '',
    start_date: '',
    end_date: '',
    tenure: '',
    remark: ''
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dataError, setDataError] = useState('')
  const districtId = district?.id ?? Number(id)
  const districtName = district?.name ?? `Senatorial District ${id ?? ''}`

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

  const loadPage = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      setDataError('')
      const districts = await districtsService.getSenatorialDistricts()
      const currentDistrict = districts.find((item) => item.id === Number(id))
      if (!currentDistrict) throw new Error('Senatorial district not found.')

      setDistrict(currentDistrict)
      setLoading(false)

      const [leadersResult, candidateResult, electionResult, officeResult] = await Promise.allSettled([
        leadersService.getActiveElectedSenators(currentDistrict.id),
        candidateService.getAllCandidates(),
        electionService.getActiveElections(),
        electionService.getSenateOffices()
      ])
      const errors: string[] = []
      if (leadersResult.status === 'fulfilled') {
        setLeaders(leadersResult.value)
      } else {
        errors.push('Unable to load elected senators.')
        console.error('Failed to load active elected senators:', leadersResult.reason)
      }
      if (candidateResult.status === 'fulfilled') {
        setCandidateDirectory(candidateResult.value)
      } else {
        errors.push('Unable to load the candidate directory.')
        console.error('Failed to load candidate directory:', candidateResult.reason)
      }
      if (electionResult.status === 'fulfilled') {
        setElections(electionResult.value)
        setFormData((current) => ({ ...current, election_id: current.election_id || String(electionResult.value[0]?.id ?? '') }))
      } else {
        errors.push('Unable to load elections.')
        console.error('Failed to load active elections:', electionResult.reason)
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
      setError(loadError instanceof Error ? loadError.message : 'Unable to load elected senators.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (!isAuthenticated || !id) return
    void loadPage()
  }, [id, isAuthenticated, loadPage])

  const filteredLeaders = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return leaders
    return leaders.filter((leader) => [
      leader.name,
      leader.position,
      leader.partyName,
      leader.tenure,
      leader.election?.year,
      leader.candidate?.nin,
      leader.candidate?.phoneNo,
      leader.candidate?.email,
      leader.candidate?.code,
      leader.candidate?.state?.name
    ].some((value) => String(value ?? '').toLowerCase().includes(query)))
  }, [leaders, search])

  const verifyCandidate = async () => {
    const identifier = normalizeCandidateIdentifier(candidateSearch)
    if (!identifier) {
      setCandidateSearchError('Enter the candidate NIN or phone number.')
      return
    }
    if (!formData.election_id) {
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
        election_id: Number(formData.election_id)
      })
      setSelectedCandidate(candidate)
    } catch (verifyError) {
      setCandidateSearchError(verifyError instanceof Error ? verifyError.message : 'Unable to verify candidate.')
    } finally {
      setIsVerifying(false)
    }
  }

  const addElectedSenator = async () => {
    if (!districtId || !selectedCandidate || !selectedCandidate.party_id || !formData.office_id || !formData.election_id || !formData.start_date || !formData.end_date || !formData.tenure) {
      setFormError('Complete all required fields and verify a candidate before saving.')
      return
    }

    try {
      setIsSaving(true)
      setFormError('')
      await electionService.checkCandidateRegistration({
        candidate_id: Number(selectedCandidate.id),
        election_id: Number(formData.election_id)
      })
      const registration = await leadersService.checkLeadershipRegistration({
        candidate_id: Number(selectedCandidate.id),
        election_id: Number(formData.election_id)
      })
      if (!registration.can_register) {
        throw new Error(registration.message || 'This candidate is already assigned to a leadership position for this election.')
      }

      const payload: AddElectedSenatorData = {
        candidate_id: Number(selectedCandidate.id),
        office_id: Number(formData.office_id),
        party_id: Number(selectedCandidate.party_id),
        election_id: Number(formData.election_id),
        senetorial_district_id: districtId,
        start_date: formData.start_date,
        end_date: formData.end_date,
        tenure: formData.tenure,
        remark: formData.remark
      }
      await leadersService.addElectedSenator(payload)
      setLeaders(await leadersService.getActiveElectedSenators(districtId))
      setIsAddOpen(false)
      setCandidateSearch('')
      setCandidateSearchError('')
      setSelectedCandidate(null)
      setFormData((current) => ({
        ...current,
        office_id: '',
        start_date: '',
        end_date: '',
        tenure: '',
        remark: ''
      }))
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : 'Unable to add elected senator.')
    } finally {
      setIsSaving(false)
    }
  }

  const openEditForm = (leader: ElectedLeader) => {
    const dateOnly = (value: unknown) => typeof value === 'string' ? value.slice(0, 10) : ''
    setEditingLeader(leader)
    setEditError('')
    setEditData({
      candidate_id: Number(leader.candidate_id ?? leader.candidateId ?? leader.candidate?.id) || 0,
      office_id: Number(leader.office_id ?? leader.office?.id) || 0,
      party_id: Number(leader.party_id ?? leader.party?.id ?? leader.candidate?.party_id) || 0,
      election_id: Number(leader.election_id ?? leader.election?.id) || 0,
      senetorial_district_id: Number(leader.senetorial_district_id ?? leader.senetorial_district?.id ?? leader.senatorial_district?.id ?? districtId) || 0,
      start_date: dateOnly(leader.start_date),
      end_date: dateOnly(leader.end_date),
      tenure: String(leader.tenure ?? ''),
      remark: String(leader.remark ?? '')
    })
  }

  const updateElectedSenator = async () => {
    const leaderId = Number(editingLeader?.id)
    if (!Number.isInteger(leaderId) || leaderId <= 0) {
      setEditError('This elected-senator record does not have a valid ID.')
      return
    }
    if (
      !editData.candidate_id || !editData.office_id || !editData.party_id ||
      !editData.election_id || !editData.senetorial_district_id ||
      !editData.start_date || !editData.end_date || !editData.tenure.trim()
    ) {
      setEditError('Complete all required fields before saving.')
      return
    }

    setIsUpdating(true)
    setEditError('')
    try {
      await leadersService.updateElectedSenator(leaderId, editData)
      setLeaders(await leadersService.getActiveElectedSenators(districtId))
      setEditingLeader(null)
    } catch (updateError) {
      setEditError(updateError instanceof Error ? updateError.message : 'Unable to update elected senator.')
    } finally {
      setIsUpdating(false)
    }
  }

  const removeElectedSenator = async (leader: ElectedLeader) => {
    const leaderId = Number(leader.id)
    if (!Number.isInteger(leaderId) || leaderId <= 0) {
      setEditError('This elected-senator record does not have a valid ID.')
      return
    }
    if (!window.confirm(`Are you sure you want to remove ${leader.name || 'this elected senator'}? This action cannot be undone.`)) {
      return
    }

    setIsDeleting(true)
    setEditError('')
    try {
      await leadersService.removeElectedSenator(leaderId)
      setLeaders((current) => current.filter((item) => Number(item.id) !== leaderId))
      if (editingLeader && Number(editingLeader.id) === leaderId) {
        setEditingLeader(null)
      }
    } catch (deleteError) {
      setEditError(deleteError instanceof Error ? deleteError.message : 'Unable to remove elected senator.')
    } finally {
      setIsDeleting(false)
    }
  }

  const editPartyOptions = candidateDirectory.reduce<Array<{ id: number; name: string }>>((options, candidate) => {
    const partyId = Number(candidate.party_id)
    if (partyId > 0 && !options.some((party) => party.id === partyId)) {
      options.push({ id: partyId, name: candidate.party?.name || candidate.political_party || `Party ${partyId}` })
    }
    return options
  }, editingLeader && editData.party_id > 0
    ? [{ id: editData.party_id, name: editingLeader.partyName || editingLeader.party?.name || `Party ${editData.party_id}` }]
    : [])
  const editOfficeOptions = offices.some((office) => office.id === editData.office_id)
    ? offices
    : editingLeader && editData.office_id > 0
      ? [...offices, { id: editData.office_id, title: editingLeader.office?.title ?? editingLeader.position ?? `Office ${editData.office_id}` }]
      : offices
  const editCandidateOptions = candidateDirectory.some((candidate) => candidate.id === editData.candidate_id)
    ? candidateDirectory
    : editingLeader?.candidate
      ? [...candidateDirectory, {
          id: editData.candidate_id,
          full_name: editingLeader.candidate.fullName ?? editingLeader.candidate.full_name ?? editingLeader.name,
          user_id: String(editData.candidate_id),
          political_party: editingLeader.partyName ?? '',
          senatorial_district: districtName,
          state: editingLeader.stateName ?? '',
          status: 'Active',
          created_at: ''
        } as Candidate]
      : candidateDirectory
  const editElectionOptions = elections.some((election) => election.id === editData.election_id)
    ? elections
    : editingLeader?.election
      ? [...elections, {
          id: editData.election_id,
          year: editingLeader.election.year ?? '',
          details: editingLeader.election.details,
          status: editingLeader.election.current_status ?? ''
        }]
      : elections

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
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Elected Senator</p>
                <h1 className="mt-1 text-2xl font-bold text-gray-900">{districtName}</h1>
                <p className="text-sm text-gray-500">{district?.state?.name ?? 'State not specified'}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Records</p>
                <p className="flex items-center gap-1.5 font-semibold text-[#146c4f]"><CheckCircle2 className="h-4 w-4" />{filteredLeaders.length} elected</p>
              </div>
              <Button type="button" onClick={() => handleAddDialogChange(true)} className="bg-[#146c4f] hover:bg-[#10563f]">
                <Plus className="mr-2 h-4 w-4" /> Add Elected Senator
              </Button>
            </div>
          </div>

          {loading && <div className="flex items-center gap-2 border-b border-gray-100 px-6 py-3 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading district details...</div>}
          {(error || dataError) && (
            <div role="alert" className="border-b border-amber-200 bg-amber-50 px-6 py-3 text-sm text-amber-800">
              {[error, dataError].filter(Boolean).join(' ')}
            </div>
          )}

          <Dialog open={isAddOpen} onOpenChange={handleAddDialogChange}>
            {isAddOpen && (
              <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add elected senator for {districtName}</DialogTitle>
                  <DialogDescription>Verify the candidate with their NIN or phone number before completing the elected-senator record.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
              <label className="block max-w-xl space-y-2 text-sm font-medium text-gray-700">
                Election *
                <select
                  className="h-10 w-full rounded-md border border-input bg-white px-3"
                  value={formData.election_id}
                  disabled={isVerifying}
                  onChange={(event) => {
                    setFormData((current) => ({ ...current, election_id: event.target.value }))
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
                      <select className="h-10 w-full rounded-md border border-input bg-white px-3" value={formData.office_id} onChange={(event) => setFormData((current) => ({ ...current, office_id: event.target.value }))}>
                        <option value="">Select office</option>
                        {offices.map((office) => <option key={office.id} value={office.id}>{office.title}</option>)}
                      </select>
                    </label>
                    <label className="space-y-2 text-sm font-medium text-gray-700">
                      Tenure *
                      <Input value={formData.tenure} onChange={(event) => setFormData((current) => ({ ...current, tenure: event.target.value }))} placeholder="e.g. 2027-2031" />
                    </label>
                    <label className="space-y-2 text-sm font-medium text-gray-700">
                      Start date *
                      <Input type="date" value={formData.start_date} onChange={(event) => setFormData((current) => ({ ...current, start_date: event.target.value }))} />
                    </label>
                    <label className="space-y-2 text-sm font-medium text-gray-700">
                      End date *
                      <Input type="date" value={formData.end_date} onChange={(event) => setFormData((current) => ({ ...current, end_date: event.target.value }))} />
                    </label>
                    <label className="space-y-2 text-sm font-medium text-gray-700 md:col-span-2">
                      Remark
                      <Textarea value={formData.remark} onChange={(event) => setFormData((current) => ({ ...current, remark: event.target.value }))} placeholder="Administrative notes" rows={3} />
                    </label>
                  </div>
                  {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}
                  <div className="flex justify-end">
                    <Button type="button" onClick={addElectedSenator} disabled={isSaving} className="bg-[#146c4f] hover:bg-[#10563f]">
                      {isSaving ? 'Saving...' : 'Save Elected Senator'}
                    </Button>
                  </div>
                </div>
              )}
              </div>
            </DialogContent>
          )}
          </Dialog>

          <div className="border-b border-gray-100 px-6 py-4">
            <label className="relative block w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input aria-label="Search elected senators" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, party, year, or tenure" className="pl-9" />
            </label>
          </div>

          {filteredLeaders.length === 0 ? (
            <div className="p-10 text-center text-gray-500">{loading ? 'Loading elected senator records...' : search ? 'No elected senators match your search.' : 'No elected senators found for this district.'}</div>
          ) : (
            <div className="grid w-full grid-cols-1 gap-4 p-6">
              {filteredLeaders.map((leader) => {
                const candidateName = leader.name || 'Senator'
                const partyName = leader.partyName || 'N/A'
                const photoUrl = getLogoUrl(leader.candidatePhoto)
                const candidate = leader.candidate
                const electionLabel = [leader.election?.year, leader.election?.details]
                  .filter(Boolean)
                  .join(' - ') || 'N/A'
                return (
                  <article key={leader.id} className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-4 border-b border-gray-100 bg-gradient-to-r from-[#146c4f]/5 to-transparent p-5 sm:flex-row sm:items-center">
                      <div className="flex min-w-0 items-center gap-4">
                        <Avatar className="h-16 w-16 shrink-0 border border-gray-200">
                          {photoUrl && <AvatarImage src={photoUrl} alt={candidateName} className="object-cover" />}
                          <AvatarFallback className="bg-[#146c4f]/10 text-lg font-bold text-[#146c4f]">{candidateName.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-lg font-bold text-gray-900">{candidateName}</p>
                          <p className="text-sm font-semibold text-[#146c4f]">{leader.position || 'Senator'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:ml-auto">
                        <span className="self-start rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold uppercase text-emerald-800 sm:self-center">{leader.status || 'Active'}</span>
                        <Button type="button" size="sm" variant="outline" onClick={() => openEditForm(leader)} className="self-start sm:self-center">
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </Button>
                        <Button type="button" size="sm" variant="destructive" onClick={() => removeElectedSenator(leader)} disabled={isDeleting} className="self-start sm:self-center">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-4 p-5">
                      <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-lg bg-gray-50 p-3"><dt className="text-xs text-gray-500">Political party</dt><dd className="mt-1 font-medium text-gray-800">{partyName}</dd></div>
                        <div className="rounded-lg bg-gray-50 p-3"><dt className="text-xs text-gray-500">Election</dt><dd className="mt-1 font-medium text-gray-800">{electionLabel}</dd></div>
                        <div className="rounded-lg bg-gray-50 p-3"><dt className="text-xs text-gray-500">Tenure</dt><dd className="mt-1 font-medium text-gray-800">{leader.tenure || 'N/A'}</dd></div>
                        <div className="rounded-lg bg-gray-50 p-3"><dt className="text-xs text-gray-500">Term dates</dt><dd className="mt-1 font-medium text-gray-800">{leader.start_date || 'N/A'} – {leader.end_date || 'N/A'}</dd></div>
                        <div className="rounded-lg bg-gray-50 p-3"><dt className="text-xs text-gray-500">NIN</dt><dd className="mt-1 break-words font-medium text-gray-800">{candidate?.nin || 'N/A'}</dd></div>
                        <div className="rounded-lg bg-gray-50 p-3"><dt className="text-xs text-gray-500">Phone</dt><dd className="mt-1 break-words font-medium text-gray-800">{candidate?.phoneNo || 'N/A'}</dd></div>
                        <div className="rounded-lg bg-gray-50 p-3"><dt className="text-xs text-gray-500">Email</dt><dd className="mt-1 break-all font-medium text-gray-800">{candidate?.email || 'N/A'}</dd></div>
                        <div className="rounded-lg bg-gray-50 p-3"><dt className="text-xs text-gray-500">State</dt><dd className="mt-1 font-medium text-gray-800">{candidate?.state?.name || leader.stateName || district?.state?.name || 'N/A'}</dd></div>
                        <div className="rounded-lg bg-gray-50 p-3"><dt className="text-xs text-gray-500">Gender</dt><dd className="mt-1 font-medium text-gray-800">{candidate?.gender || 'N/A'}</dd></div>
                        <div className="rounded-lg bg-gray-50 p-3"><dt className="text-xs text-gray-500">Date of birth</dt><dd className="mt-1 font-medium text-gray-800">{candidate?.dob || 'N/A'}</dd></div>
                        <div className="rounded-lg bg-gray-50 p-3 sm:col-span-2"><dt className="text-xs text-gray-500">Address</dt><dd className="mt-1 whitespace-pre-wrap break-words font-medium text-gray-800">{candidate?.address || 'N/A'}</dd></div>
                        <div className="rounded-lg bg-gray-50 p-3"><dt className="text-xs text-gray-500">Senatorial district</dt><dd className="mt-1 font-medium text-gray-800">{leader.senetorial_district?.name || leader.senatorial_district?.name || districtName}</dd></div>
                      </dl>
                      {candidate?.bio && (
                        <div className="rounded-lg bg-gray-50 p-3">
                          <p className="text-xs text-gray-500">Biography</p>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">{candidate.bio}</p>
                        </div>
                      )}
                      {leader.remark && <p className="whitespace-pre-wrap break-words rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{leader.remark}</p>}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(editingLeader)}
        onOpenChange={(open) => {
          if (!open && !isUpdating) {
            setEditingLeader(null)
            setEditError('')
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Elected Senator</DialogTitle>
            <DialogDescription>Update the elected-senator record.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="edit-elected-senator-candidate" className="mb-2 block text-sm font-medium text-gray-700">Candidate *</label>
                <select
                  id="edit-elected-senator-candidate"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={editData.candidate_id || ''}
                  onChange={(event) => setEditData((current) => ({ ...current, candidate_id: Number(event.target.value) || 0 }))}
                >
                  <option value="">Select candidate</option>
                  {editCandidateOptions.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.full_name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="edit-elected-senator-office" className="mb-2 block text-sm font-medium text-gray-700">Office *</label>
                <select
                  id="edit-elected-senator-office"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={editData.office_id || ''}
                  onChange={(event) => setEditData((current) => ({ ...current, office_id: Number(event.target.value) || 0 }))}
                >
                  <option value="">Select office</option>
                  {editOfficeOptions.map((office) => <option key={office.id} value={office.id}>{office.title}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="edit-elected-senator-party" className="mb-2 block text-sm font-medium text-gray-700">Party *</label>
                <select
                  id="edit-elected-senator-party"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={editData.party_id || ''}
                  onChange={(event) => setEditData((current) => ({ ...current, party_id: Number(event.target.value) || 0 }))}
                >
                  <option value="">Select party</option>
                  {editPartyOptions.map((party) => <option key={party.id} value={party.id}>{party.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="edit-elected-senator-election" className="mb-2 block text-sm font-medium text-gray-700">Election *</label>
                <select
                  id="edit-elected-senator-election"
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
                <label htmlFor="edit-elected-senator-district" className="mb-2 block text-sm font-medium text-gray-700">Senatorial District *</label>
                <Input id="edit-elected-senator-district" value={districtName} readOnly />
              </div>
              <div>
                <label htmlFor="edit-elected-senator-start" className="mb-2 block text-sm font-medium text-gray-700">Start Date *</label>
                <Input
                  id="edit-elected-senator-start"
                  type="date"
                  value={editData.start_date}
                  onChange={(event) => setEditData((current) => ({ ...current, start_date: event.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="edit-elected-senator-end" className="mb-2 block text-sm font-medium text-gray-700">End Date *</label>
                <Input
                  id="edit-elected-senator-end"
                  type="date"
                  value={editData.end_date}
                  onChange={(event) => setEditData((current) => ({ ...current, end_date: event.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="edit-elected-senator-tenure" className="mb-2 block text-sm font-medium text-gray-700">Tenure *</label>
                <Input
                  id="edit-elected-senator-tenure"
                  value={editData.tenure}
                  onChange={(event) => setEditData((current) => ({ ...current, tenure: event.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="edit-elected-senator-remark" className="mb-2 block text-sm font-medium text-gray-700">Remark</label>
                <Textarea
                  id="edit-elected-senator-remark"
                  rows={3}
                  value={editData.remark}
                  onChange={(event) => setEditData((current) => ({ ...current, remark: event.target.value }))}
                />
              </div>
            </div>
            {editError && <p role="alert" className="text-sm text-red-600">{editError}</p>}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setEditingLeader(null)} disabled={isUpdating}>Cancel</Button>
              <Button type="button" onClick={updateElectedSenator} disabled={isUpdating} className="bg-[#146c4f] hover:bg-[#10563f]">
                {isUpdating ? 'Updating...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
