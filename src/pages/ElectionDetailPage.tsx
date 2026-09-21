/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Edit, Loader2, AlertCircle, Trash2, Eye, MoreVertical, RefreshCw, Plus } from 'lucide-react'
import { electionService, Election } from '@/services/elections'
import { candidateService, Candidate } from '@/services/candidates'
import { useAuth } from '@/contexts/AuthContext'

export default function ElectionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const [election, setElection] = useState<Election | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [timetables, setTimetables] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [changingStatus, setChangingStatus] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Timetable Form State
  const [offices, setOffices] = useState<any[]>([])
  const [electionTypes, setElectionTypes] = useState<any[]>([])
  const [showTimetableModal, setShowTimetableModal] = useState(false)
  const [savingTimetable, setSavingTimetable] = useState(false)
  const [timetableForm, setTimetableForm] = useState({
    office_id: '',
    election_type_id: '',
    description: '',
    date: '',
    starttime: '',
    endtime: ''
  })

  // Candidates filtering by selected timetable
  const [selectedTimetableId, setSelectedTimetableId] = useState<string>('all')

  useEffect(() => {
    if (isAuthenticated && id) {
      loadData(Number(id))
    }
  }, [isAuthenticated, id])

  const loadData = async (electionId: number) => {
    try {
      setLoading(true)
      const [electionData, candidatesData, timetablesData, officesData, typesData] = await Promise.all([
        electionService.getElectionById(electionId),
        candidateService.getAllCandidates(),
        electionService.getElectionTimetables(electionId).catch(() => null as any),
        electionService.getOffices().catch(() => null as any),
        electionService.getElectionTypes().catch(() => null as any)
      ])
      
      if (electionData) {
        setElection(electionData)
        setCandidates(candidatesData)
        setTimetables(Array.isArray(timetablesData) ? timetablesData : (timetablesData?.data || []))
        setOffices(Array.isArray(officesData) ? officesData : (officesData?.data || []))
        setElectionTypes(Array.isArray(typesData) ? typesData : (typesData?.data || []))
      } else {
        setError('Election not found')
      }
    } catch (err) {
      console.error('Failed to load data:', err)
      setError('Failed to load election details.')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!election || !id) return
    try {
      setChangingStatus(true)
      await electionService.changeElectionStatus(
        Number(id),
        newStatus as 'Upcoming' | 'Ongoing' | 'Completed'
      )
      await loadData(Number(id))
      sessionStorage.setItem('electionsRefresh', '1')
    } catch (err) {
      console.error('Failed to change status:', err)
      setError('Failed to change election status.')
    } finally {
      setChangingStatus(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return
    try {
      setDeleting(true)
      await electionService.deleteElection(Number(id))
      navigate('/k8s9d7f3-elections')
    } catch (err) {
      console.error('Failed to delete election:', err)
      setError('Failed to delete election.')
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'Upcoming':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#dcfce7] text-[#166534] text-[0.75rem] font-medium">
            Upcoming
          </span>
        )
      case 'Completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800 text-[0.75rem] font-medium">
            Completed
          </span>
        )
      case 'Ongoing':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[0.75rem] font-medium">
            On-going
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800 text-[0.75rem] font-medium">
            {status}
          </span>
        )
    }
  }

  const handleTimetableSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!election) return
    try {
      setSavingTimetable(true)
      await electionService.createElectionTimetable({
        election_id: election.id,
        office_id: timetableForm.office_id,
        election_type_id: timetableForm.election_type_id,
        description: timetableForm.description,
        date: timetableForm.date,
        starttime: timetableForm.starttime,
        endtime: timetableForm.endtime
      })
      // Refresh timetables
      const newTimetables: any = await electionService.getElectionTimetables(election.id)
      setTimetables(Array.isArray(newTimetables) ? newTimetables : (newTimetables?.data || []))
      setShowTimetableModal(false)
      setTimetableForm({ office_id: '', election_type_id: '', description: '', date: '', starttime: '', endtime: '' })
    } catch (err: any) {
      alert(err.message || 'Failed to save timetable')
    } finally {
      setSavingTimetable(false)
    }
  }

  const displayedCandidates = candidates.filter(candidate => {
    if (selectedTimetableId === 'all') return true
    const selectedTimetable = timetables.find(t => String(t.id) === selectedTimetableId)
    if (!selectedTimetable) return true
    
    const officeName = (selectedTimetable.office?.title || selectedTimetable.office?.name || '').toLowerCase()
    const candState = (candidate.state || '').toLowerCase()
    const candDistrict = (candidate.senatorial_district || '').toLowerCase()

    if (officeName.includes('president')) {
      // Presidential candidates don't have specific state/district usually, or show all
      return true
    }
    if (officeName.includes('governor') || officeName.includes('state')) {
      // Must have state
      return !!candState
    }
    if (officeName.includes('senate') || officeName.includes('senatorial')) {
      // Must have district
      return !!candDistrict
    }
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#146c4f]" />
      </div>
    )
  }

  if (error || !election) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h2>
        <p className="text-gray-500 mb-6">{error || 'Election not found.'}</p>
        <Button onClick={() => navigate('/k8s9d7f3-elections')} variant="outline">
          Back to Elections
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/k8s9d7f3-elections')}
            className="text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Election {election.year}</h1>
              {renderStatusBadge(election.status)}
            </div>
            {election.details && (
              <p className="text-sm text-gray-500 mt-1">
                <span>{election.details}</span>
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button 
            variant="outline"
            onClick={() => navigate(`/k8s9d7f3-elections-edit/${election.id}`)}
            className="rounded-xl flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit Election
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="rounded-xl px-5 flex items-center gap-2"
                disabled={changingStatus}
              >
                <RefreshCw className="w-4 h-4" />
                Update Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => handleStatusChange('Upcoming')}
              >
                Upcoming
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => handleStatusChange('Ongoing')}
              >
                On-going
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => handleStatusChange('Completed')}
              >
                Completed
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button 
            variant="outline"
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded-xl flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
            disabled={deleting}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
          {changingStatus && <Loader2 className="w-5 h-5 animate-spin text-gray-400" />}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Delete Election?</h3>
          <p className="text-sm text-red-600 mb-4">
            Are you sure you want to delete this election? This action cannot be undone.
          </p>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              className="rounded-xl"
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white"
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Yes, Delete Election'
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Timetables Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Election Timetables</h2>
          <Button variant="outline" size="sm" onClick={() => setShowTimetableModal(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Timetable
          </Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-gray-100 bg-gray-50/50">
                <TableHead className="text-xs font-semibold text-gray-500 tracking-wider h-11 px-6">DESCRIPTION</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 tracking-wider h-11">OFFICE</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 tracking-wider h-11">DATE</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 tracking-wider h-11">TIME</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 tracking-wider h-11">STATUS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timetables.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No timetables scheduled for this election.
                  </TableCell>
                </TableRow>
              ) : (
                timetables.map((t: any) => (
                  <TableRow key={t.id} className="hover:bg-gray-50/50 transition-colors border-gray-50">
                    <TableCell className="px-6 py-4 font-medium text-gray-800">{t.description}</TableCell>
                    <TableCell className="py-4 text-gray-600">{t.office?.title || t.office?.name || 'N/A'}</TableCell>
                    <TableCell className="py-4 text-gray-600">{t.date}</TableCell>
                    <TableCell className="py-4 text-gray-600">{t.starttime} - {t.endtime}</TableCell>
                    <TableCell className="py-4">
                      <Badge variant="outline" className={t.status === 'Completed' ? 'bg-gray-100' : 'bg-green-100 text-green-800'}>
                        {t.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Candidates Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Participating Candidates</h2>
          <select 
            value={selectedTimetableId}
            onChange={(e) => setSelectedTimetableId(e.target.value)}
            className="text-sm border-gray-200 rounded-md shadow-sm focus:border-[#146c4f] focus:ring-[#146c4f]"
          >
            <option value="all">All Timetables / Offices</option>
            {timetables.map(t => (
              <option key={t.id} value={t.id}>{t.description} ({t.office?.title || t.office?.name})</option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-gray-100 bg-gray-50/50">
                <TableHead className="text-xs font-semibold text-gray-500 tracking-wider h-11 px-6">CANDIDATE</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 tracking-wider h-11">PARTY</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 tracking-wider h-11">POSITION</TableHead>
                <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedCandidates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                    No candidates found for this selection.
                  </TableCell>
                </TableRow>
              ) : (
                displayedCandidates.map((candidate) => (
                  <TableRow key={candidate.id} className="hover:bg-gray-50/50 transition-colors border-gray-50">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#146c4f]/10 flex items-center justify-center text-[#146c4f] font-semibold text-xs">
                          {candidate.full_name.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-800">{candidate.full_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant="outline" className="border-[#146c4f]/30 text-[#146c4f] bg-[#146c4f]/5 font-medium">
                        {candidate.political_party}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 text-sm text-gray-500">
                      {candidate.senatorial_district || candidate.state || 'N/A'}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-[#146c4f] hover:text-[#115a42] hover:bg-[#146c4f]/10"
                          onClick={() => navigate(`/k8s9d7f3-candidates-view/${candidate.id}`)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 rounded hover:bg-gray-100">
                              <MoreVertical className="w-4 h-4 text-gray-400" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[140px]">
                            <DropdownMenuItem className="cursor-pointer" onClick={() => navigate(`/k8s9d7f3-candidates-edit/${candidate.id}`)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="cursor-pointer text-red-600 focus:text-red-600"
                              onClick={() => {
                                // Add delete handler if needed later
                                console.log('Delete candidate', candidate.id)
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Timetable Form Modal */}
      <Dialog open={showTimetableModal} onOpenChange={setShowTimetableModal}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleTimetableSubmit}>
            <DialogHeader>
              <DialogTitle>Add Election Timetable</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="description" className="text-sm font-medium">Description</label>
                <Input
                  id="description"
                  required
                  value={timetableForm.description}
                  onChange={(e) => setTimetableForm({ ...timetableForm, description: e.target.value })}
                  placeholder="e.g. Presidential Election Timetable"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="office_id">Office</label>
                <select
                  id="office_id"
                  required
                  className="flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#146c4f] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={timetableForm.office_id}
                  onChange={(e) => setTimetableForm({ ...timetableForm, office_id: e.target.value })}
                >
                  <option value="" disabled>Select Office...</option>
                  {offices.map((office) => (
                    <option key={office.id} value={office.id}>{office.title || office.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="election_type_id">Election Type</label>
                <select
                  id="election_type_id"
                  required
                  className="flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#146c4f] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={timetableForm.election_type_id}
                  onChange={(e) => setTimetableForm({ ...timetableForm, election_type_id: e.target.value })}
                >
                  <option value="" disabled>Select Type...</option>
                  {electionTypes.map((type) => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="date">Date</label>
                <Input
                  id="date"
                  type="date"
                  required
                  value={timetableForm.date}
                  onChange={(e) => setTimetableForm({ ...timetableForm, date: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium" htmlFor="starttime">Start Time</label>
                  <Input
                    id="starttime"
                    type="time"
                    required
                    value={timetableForm.starttime}
                    onChange={(e) => setTimetableForm({ ...timetableForm, starttime: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium" htmlFor="endtime">End Time</label>
                  <Input
                    id="endtime"
                    type="time"
                    required
                    value={timetableForm.endtime}
                    onChange={(e) => setTimetableForm({ ...timetableForm, endtime: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowTimetableModal(false)} disabled={savingTimetable}>
                Cancel
              </Button>
              <Button type="submit" disabled={savingTimetable} className="bg-[#146c4f] hover:bg-[#115a42]">
                {savingTimetable ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Save Timetable
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
