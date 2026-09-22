import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Loader2, MapPin } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { districtsService, District } from '@/services/districts'
import { candidateService, Candidate, Party } from '@/services/candidates'
import { electionService, Election } from '@/services/elections'
import { useAuth } from '@/contexts/AuthContext'

export default function StateDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const { isAuthenticated } = useAuth()
  const [state, setState] = useState<District | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [candidateOptions, setCandidateOptions] = useState<Candidate[]>([])
  const [parties, setParties] = useState<Party[]>([])
  const [elections, setElections] = useState<Election[]>([])
  const [offices, setOffices] = useState<any[]>([])
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [formData, setFormData] = useState({
    candidate_id: '',
    office_id: '',
    party_id: '',
    election_id: '',
    manifesto: ''
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (searchParams.get('addGovernatorial') === 'true') {
      setIsAddOpen(true)
    }
  }, [searchParams])

  useEffect(() => {
    const openForm = () => setIsAddOpen(true)
    window.addEventListener('open-governatorial-form', openForm)
    return () => window.removeEventListener('open-governatorial-form', openForm)
  }, [])

  useEffect(() => {
    if (!isAuthenticated || !id) return

    const loadState = async () => {
      try {
        setLoading(true)
        setError('')
        const stateData = await districtsService.getState(Number(id))
        setState(stateData)

        const [candidateResult, allCandidateResult, partyResult, electionResult, officeResult] = await Promise.allSettled([
          candidateService.getActiveGovernatorialCandidates(),
          candidateService.getAllCandidates(),
          candidateService.getAllParties(),
          electionService.getActiveElections(),
          electionService.getStateOffices(stateData.id)
        ])

        if (candidateResult.status === 'fulfilled') {
          setCandidates(candidateResult.value.filter((candidate) =>
            candidate.state_id === stateData.id ||
            candidate.state?.toLowerCase() === stateData.name.toLowerCase()
          ))
        }
        if (allCandidateResult.status === 'fulfilled') {
          setCandidateOptions(allCandidateResult.value.filter((candidate) =>
            candidate.state_id === stateData.id ||
            candidate.state?.toLowerCase() === stateData.name.toLowerCase()
          ))
        }
        if (partyResult.status === 'fulfilled') setParties(partyResult.value)
        if (electionResult.status === 'fulfilled') setElections(electionResult.value)
        if (officeResult.status === 'fulfilled') setOffices(officeResult.value)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load state')
      } finally {
        setLoading(false)
      }
    }

    loadState()
  }, [id, isAuthenticated])

  const addCandidate = async () => {
    if (!state || !formData.candidate_id || !formData.office_id || !formData.party_id || !formData.election_id) {
      setFormError('Please complete all required fields.')
      return
    }

    try {
      setIsSaving(true)
      setFormError('')
      await candidateService.addGovernatorialCandidate({
        candidate_id: Number(formData.candidate_id),
        office_id: Number(formData.office_id),
        party_id: Number(formData.party_id),
        election_id: Number(formData.election_id),
        state_id: state.id,
        manifesto: formData.manifesto
      })
      setIsAddOpen(false)
      setFormData({ candidate_id: '', office_id: '', party_id: '', election_id: '', manifesto: '' })
      const updatedCandidates = await candidateService.getActiveGovernatorialCandidates()
      setCandidates(updatedCandidates.filter((candidate) => candidate.state_id === state.id || candidate.state?.toLowerCase() === state.name.toLowerCase()))
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to add candidate')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#146c4f]" />
      </div>
    )
  }

  if (error || !state) {
    return (
      <div className="space-y-4 p-4 md:p-0">
        <Link to="/k8s9d7f3-districts/states" className="inline-flex items-center gap-2 text-sm font-medium text-[#146c4f] hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to states
        </Link>
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            {error || 'State not found'}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-0">
      <Link to="/k8s9d7f3-districts/states" className="inline-flex items-center gap-2 text-sm font-medium text-[#146c4f] hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to states
      </Link>

      <Card className="border border-gray-100 shadow-md">
        <CardContent className="p-0">
          <div className="border-b border-gray-100 p-6 md:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100">
                  <MapPin className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Manage Governatorial</p>
                  <h1 className="mt-1 text-2xl font-bold text-gray-900">{state.name}</h1>
                </div>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Status</p>
                <div className="mt-1 flex items-center gap-2 font-semibold text-[#146c4f]">
                  <CheckCircle2 className="h-4 w-4" />
                  {state.status === 1 ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-500">Manage active governatorial candidates for {state.name}.</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NAME</TableHead>
                <TableHead>POLITICAL PARTY</TableHead>
                <TableHead>STATUS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-gray-500">
                    No active gubernatorial candidates found.
                  </TableCell>
                </TableRow>
              ) : (
                candidates.map((candidate) => (
                  <TableRow key={candidate.id}>
                    <TableCell className="font-medium text-gray-900">{candidate.full_name}</TableCell>
                    <TableCell>{candidate.political_party || candidate.party?.name || 'N/A'}</TableCell>
                    <TableCell className="text-[#146c4f]">{candidate.status || 'Active'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={isAddOpen}
        onOpenChange={(open) => {
          setIsAddOpen(open)
          if (!open) {
            const nextParams = new URLSearchParams(searchParams)
            nextParams.delete('addGovernatorial')
            setSearchParams(nextParams)
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Governatorial Candidate</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">Candidate *</label>
            <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={formData.candidate_id} onChange={(event) => setFormData({ ...formData, candidate_id: event.target.value })}>
              <option value="">Select candidate</option>
              {candidateOptions.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.full_name}</option>)}
            </select>

            <label className="block text-sm font-medium text-gray-700">Office *</label>
            <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={formData.office_id} onChange={(event) => setFormData({ ...formData, office_id: event.target.value })}>
              <option value="">Select office</option>
              {offices.map((office) => <option key={office.id} value={office.id}>{office.name || office.title}</option>)}
            </select>

            <label className="block text-sm font-medium text-gray-700">Political Party *</label>
            <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={formData.party_id} onChange={(event) => setFormData({ ...formData, party_id: event.target.value })}>
              <option value="">Select party</option>
              {parties.map((party) => <option key={party.id} value={party.id}>{party.name}</option>)}
            </select>

            <label className="block text-sm font-medium text-gray-700">Election *</label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={formData.election_id}
              onChange={async (event) => {
                const electionId = event.target.value
                setFormData({ ...formData, election_id: electionId })
                if (!electionId) return
                try {
                  setFormError('')
                  await electionService.getElectionById(Number(electionId))
                } catch (err) {
                  setFormError(err instanceof Error ? err.message : 'Unable to load election')
                }
              }}
            >
              <option value="">Select election</option>
              {elections.map((election) => <option key={election.id} value={election.id}>{election.year} {election.details ? `- ${election.details}` : ''}</option>)}
            </select>

            <Textarea value={formData.manifesto} onChange={(event) => setFormData({ ...formData, manifesto: event.target.value })} placeholder="Manifesto" />
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <Button type="button" onClick={addCandidate} disabled={isSaving} className="w-full bg-[#146c4f] hover:bg-[#10563f]">
              {isSaving ? 'Adding...' : 'Add Governatorial'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}