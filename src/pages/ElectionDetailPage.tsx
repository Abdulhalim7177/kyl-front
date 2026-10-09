/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ArrowLeft, Edit, Loader2, AlertCircle, Trash2, Calendar, Clock3, Eye } from 'lucide-react'
import { electionService, Election, ElectionTimetable, Office, ElectionType, isElectionCompleted } from '@/services/elections'
import { useAuth } from '@/contexts/AuthContext'

export default function ElectionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const [election, setElection] = useState<Election | null>(null)
  const [electionTimetables, setElectionTimetables] = useState<ElectionTimetable[]>([])
  const [offices, setOffices] = useState<Office[]>([])
  const [electionTypes, setElectionTypes] = useState<ElectionType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [timetableToDelete, setTimetableToDelete] = useState<number | null>(null)
  const [changingStatus, setChangingStatus] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showTimetableForm, setShowTimetableForm] = useState(false)
  const [savingTimetable, setSavingTimetable] = useState(false)
  const [editingTimetableId, setEditingTimetableId] = useState<number | null>(null)
  const [viewingTimetable, setViewingTimetable] = useState<ElectionTimetable | null>(null)
  const [loadingTimetableDetails, setLoadingTimetableDetails] = useState(false)
  const [timetableForm, setTimetableForm] = useState({
    office_id: '1',
    election_type_id: '1',
    description: '',
    date: '',
    starttime: '',
    endtime: '',
  })

  const resetTimetableForm = () => {
    setTimetableForm({
      office_id: offices.length > 0 ? String(offices[0].id) : '1',
      election_type_id: electionTypes.length > 0 ? String(electionTypes[0].id) : '1',
      description: '',
      date: '',
      starttime: '',
      endtime: '',
    })
  }
  useEffect(() => {
    if (isAuthenticated && id) {
      loadData(Number(id))
    }
  }, [isAuthenticated, id])

  const loadData = async (electionId: number) => {
    try {
      setLoading(true)
      setError(null)

      const [electionData, timetablesData, officesResult, electionTypesData] = await Promise.allSettled([
        electionService.getElectionById(electionId),
        electionService.getElectionTimetables(electionId),
        electionService.getAllOffices(),
        electionService.getAllElectionTypes()
      ])

      const resolvedElection = electionData.status === 'fulfilled' ? electionData.value : null
      const resolvedTimetables = timetablesData.status === 'fulfilled' ? timetablesData.value : []
      const resolvedOffices = officesResult.status === 'fulfilled' ? officesResult.value : []
      const resolvedElectionTypes = electionTypesData.status === 'fulfilled' ? electionTypesData.value : []
      if (resolvedElection) {
        setElection(resolvedElection)
        setElectionTimetables(resolvedTimetables)
        setOffices(resolvedOffices)
        setElectionTypes(resolvedElectionTypes)
        if (isElectionCompleted(resolvedElection)) {
          setShowTimetableForm(false)
          setEditingTimetableId(null)
          setTimetableToDelete(null)
          setShowDeleteConfirm(false)
        }
        if (resolvedOffices.length > 0 && !timetableForm.office_id) {
          setTimetableForm((prev) => ({ ...prev, office_id: String(resolvedOffices[0].id) }))
        }
        if (resolvedElectionTypes.length > 0 && !timetableForm.election_type_id) {
          setTimetableForm((prev) => ({ ...prev, election_type_id: String(resolvedElectionTypes[0].id) }))
        }
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

  const handleAddTimetable = async () => {
    if (!election || !id || isElectionCompleted(election)) return

    if (!timetableForm.date || !timetableForm.starttime || !timetableForm.endtime || !timetableForm.description.trim()) {
      setError('Please complete all timetable fields before saving.')
      return
    }

    try {
      setSavingTimetable(true)
      setError(null)
      setSuccessMessage(null)

      const payload = {
        office_id: Number(timetableForm.office_id || 1),
        election_type_id: Number(timetableForm.election_type_id || 1),
        description: timetableForm.description.trim(),
        date: timetableForm.date,
        starttime: timetableForm.starttime,
        endtime: timetableForm.endtime,
      }

      const savedTimetable = editingTimetableId
        ? await electionService.updateElectionTimetable(editingTimetableId, payload)
        : await electionService.createElectionTimetable({
          election_id: Number(id),
          ...payload,
        })

      setElectionTimetables((prev) => {
        if (editingTimetableId) {
          return prev.map((item) => item.id === editingTimetableId ? savedTimetable : item)
        }
        return [savedTimetable, ...prev]
      })

      const successText = editingTimetableId ? 'Timetable Updated Successfully' : 'Timetable created successfully'
      setEditingTimetableId(null)
      resetTimetableForm()
      setShowTimetableForm(false)
      setSuccessMessage(successText)
      setShowSuccessDialog(true)
    } catch (err) {
      console.error('Failed to save election timetable:', err)
      setError(editingTimetableId ? 'Failed to update the election timetable.' : 'Failed to add the election timetable.')
    } finally {
      setSavingTimetable(false)
    }
  }

  const handleEditTimetable = (item: ElectionTimetable) => {
    if (!election || isElectionCompleted(election)) return

    setEditingTimetableId(item.id ?? null)
    setTimetableForm({
      office_id: item.office_id ? String(item.office_id) : (offices[0]?.id ? String(offices[0].id) : '1'),
      election_type_id: item.election_type_id ? String(item.election_type_id) : (electionTypes[0]?.id ? String(electionTypes[0].id) : '1'),
      description: item.description || '',
      date: item.date || '',
      starttime: item.starttime || '',
      endtime: item.endtime || '',
    })
    setShowTimetableForm(true)
  }

  const handleViewTimetable = async (id: number) => {
    if (!id) return

    try {
      setLoadingTimetableDetails(true)
      const timetable = await electionService.getElectionTimetableById(id)
      setViewingTimetable(timetable)
    } catch (err) {
      console.error('Failed to fetch timetable details:', err)
      setError('Failed to load timetable details.')
    } finally {
      setLoadingTimetableDetails(false)
    }
  }

  const handleDeleteTimetable = async (id: number) => {
    if (!election || isElectionCompleted(election)) return

    setTimetableToDelete(id)
  }

  const confirmDeleteTimetable = async () => {
    if (!timetableToDelete || !election || isElectionCompleted(election)) return

    try {
      await electionService.deleteElectionTimetable(timetableToDelete)
      setElectionTimetables((prev) => prev.filter((item) => item.id !== timetableToDelete))
      setSuccessMessage('Timetable Deleted Successfully')
      setShowSuccessDialog(true)
      setTimetableToDelete(null)
    } catch (err) {
      console.error('Failed to delete timetable:', err)
      setError('Failed to delete timetable.')
      setTimetableToDelete(null)
    }
  }

  const handleTimetableStatusChange = async (id: number, status: 'Upcoming' | 'Ongoing' | 'Completed') => {
    if (!election || isElectionCompleted(election)) return

    try {
      const updated = await electionService.changeElectionTimetableStatus(id, status)
      setElectionTimetables((prev) => prev.map((item) => item.id === id ? { ...item, ...updated, status: updated.status || status } : item))
    } catch (err) {
      console.error('Failed to change timetable status:', err)
      setError('Failed to update timetable status.')
    }
  }

  const formatDate = (date?: string) => {
    if (!date) return 'N/A'
    const parsed = new Date(date)
    if (Number.isNaN(parsed.getTime())) return date
    return parsed.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatDisplayTime = (timeValue?: string) => {
    if (!timeValue) return 'N/A'

    const normalized = timeValue.trim()
    const match = normalized.match(/^([0-9]{1,2}):([0-9]{2})(?::[0-9]{2})?$/)
    if (!match) return normalized

    const hours = Number(match[1])
    const minutes = match[2]
    const suffix = hours >= 12 ? 'PM' : 'AM'
    const displayHour = hours % 12 === 0 ? 12 : hours % 12

    return `${displayHour}:${minutes} ${suffix}`
  }

  const timeSelectOptions = Array.from({ length: 48 }, (_, index) => {
    const totalMinutes = index * 30
    const hours24 = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12
    const suffix = hours24 >= 12 ? 'PM' : 'AM'
    const value = `${String(hours24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    const label = `${hours12}:${String(minutes).padStart(2, '0')} ${suffix}`
    return { value, label }
  })

  const handleStatusChange = async (newStatus: string) => {
    if (!election || !id || isElectionCompleted(election)) return
    try {
      setChangingStatus(true)
      await electionService.changeElectionStatus(
        Number(id),
        newStatus as 'Upcoming' | 'Ongoing' | 'Completed'
      )
      setElection((current) => current
        ? { ...current, status: newStatus }
        : current)
    } catch (err) {
      console.error('Failed to change status:', err)
      setError('Failed to change election status.')
    } finally {
      setChangingStatus(false)
    }
  }

  const handleDelete = async () => {
    if (!id || !election || isElectionCompleted(election)) return
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

  const isCompletedElection = isElectionCompleted(election)

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
          {!isCompletedElection && <Button
            variant="outline"
            onClick={() => navigate(`/k8s9d7f3-elections-edit/${election.id}`)}
            className="rounded-xl flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit Election
          </Button>}
          {!isCompletedElection && <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white shadow-sm">
            <select
              value={election.status || 'Upcoming'}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={changingStatus}
              className="h-10 rounded-xl border-0 bg-transparent px-3 text-sm font-medium text-gray-700 outline-none"
              aria-label="Change election status"
            >
              {(['Upcoming', 'Ongoing', 'Completed'] as const).map((statusOption) => (
                <option key={statusOption} value={statusOption}>
                  {statusOption}
                </option>
              ))}
            </select>
          </div>}
          {!isCompletedElection && <Button 
            variant="outline"
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded-xl flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
            disabled={deleting}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>}
          {changingStatus && <Loader2 className="w-5 h-5 animate-spin text-gray-400" />}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && !isCompletedElection && (
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

      {/* Election Timetable */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-gray-900">Election Timetable</h2>
          {!isCompletedElection && <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingTimetableId(null)
              resetTimetableForm()
              setShowTimetableForm((prev) => !prev)
            }}
            className="rounded-xl flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            {showTimetableForm ? 'Close' : 'Add Election Timetable'}
          </Button>}
        </div>

        {!isCompletedElection && showTimetableForm && (
          <div className="p-6 border-b border-gray-100 bg-gray-50/40">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <Textarea
                  value={timetableForm.description}
                  onChange={(e) => setTimetableForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g. Presidential election voting window"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Date</label>
                <Input
                  type="date"
                  value={timetableForm.date}
                  onChange={(e) => setTimetableForm((prev) => ({ ...prev, date: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Office</label>
                <select
                  value={timetableForm.office_id}
                  onChange={(e) => setTimetableForm((prev) => ({ ...prev, office_id: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {offices.length === 0 ? (
                    <option value="">Loading offices...</option>
                  ) : (
                    offices.map((office) => (
                      <option key={office.id} value={String(office.id)}>
                        {office.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Election Type</label>
                <select
                  value={timetableForm.election_type_id}
                  onChange={(e) => setTimetableForm((prev) => ({ ...prev, election_type_id: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {electionTypes.length === 0 ? (
                    <option value="">Loading election types...</option>
                  ) : (
                    electionTypes.map((type) => (
                      <option key={type.id} value={String(type.id)}>
                        {type.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Start Time</label>
                <select
                  value={timetableForm.starttime}
                  onChange={(e) => setTimetableForm((prev) => ({ ...prev, starttime: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Select start time</option>
                  {timeSelectOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">End Time</label>
                <select
                  value={timetableForm.endtime}
                  onChange={(e) => setTimetableForm((prev) => ({ ...prev, endtime: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Select end time</option>
                  {timeSelectOptions.map((option) => (
                    <option key={`${option.value}-end`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <Button
                variant="outline"
                onClick={() => {
                  setEditingTimetableId(null)
                  resetTimetableForm()
                  setShowTimetableForm(false)
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleAddTimetable} disabled={savingTimetable} className="bg-[#146c4f] hover:bg-[#115a42] text-white">
                {savingTimetable ? 'Saving...' : editingTimetableId ? 'Update Timetable' : 'Save Timetable'}
              </Button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-gray-100 bg-gray-50/50">
                <TableHead className="text-xs font-semibold text-gray-500 tracking-wider h-11 px-6">DATE</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 tracking-wider h-11">OFFICE</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 tracking-wider h-11">DESCRIPTION</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 tracking-wider h-11">START</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 tracking-wider h-11">END</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 tracking-wider h-11 text-right">ACTION</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {electionTimetables.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No election timetable created for this election yet.
                  </TableCell>
                </TableRow>
              ) : (
                electionTimetables.map((item) => (
                  <TableRow key={item.id ?? `${item.date}-${item.starttime}-${item.endtime}`} className="hover:bg-gray-50/50 transition-colors border-gray-50">
                    <TableCell className="px-6 py-4 text-sm font-medium text-gray-800">
                      {formatDate(item.date)}
                    </TableCell>
                    <TableCell className="py-4 text-sm text-gray-700 min-w-[140px]">
                      {item.office_name || offices.find((office) => String(office.id) === String(item.office_id))?.name || item.office_id || 'N/A'}
                    </TableCell>
                    <TableCell className="py-4 text-sm text-gray-700 max-w-[260px] align-top break-words whitespace-normal">
                      {item.description || 'Election timetable'}
                    </TableCell>
                    <TableCell className="py-4 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <Clock3 className="w-4 h-4 text-gray-400" />
                        {formatDisplayTime(item.starttime)}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <Clock3 className="w-4 h-4 text-gray-400" />
                        {formatDisplayTime(item.endtime)}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!isCompletedElection && <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white shadow-sm">
                          <select
                            value={item.status || 'Upcoming'}
                            onChange={(e) => item.id && handleTimetableStatusChange(item.id, e.target.value as 'Upcoming' | 'Ongoing' | 'Completed')}
                            className="h-8 rounded-md border-0 bg-transparent px-2 text-xs font-medium text-gray-700 outline-none"
                            aria-label="Change timetable status"
                          >
                            {(['Upcoming', 'Ongoing', 'Completed'] as const).map((statusOption) => (
                              <option key={statusOption} value={statusOption}>
                                {statusOption}
                              </option>
                            ))}
                          </select>
                        </div>}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => item.id && handleViewTimetable(item.id)}
                          className="h-8 w-8 text-blue-600 hover:text-blue-800"
                          aria-label="View timetable"
                          disabled={loadingTimetableDetails}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {!isCompletedElection && <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditTimetable(item)}
                          className="h-8 w-8 text-gray-600 hover:text-gray-900"
                          aria-label="Edit timetable"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>}
                        {!isCompletedElection && <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => item.id && handleDeleteTimetable(item.id)}
                          className="h-8 w-8 text-red-500 hover:text-red-700"
                          aria-label="Delete timetable"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={Boolean(viewingTimetable)} onOpenChange={(open) => !open && setViewingTimetable(null)}>
        <DialogContent className="sm:max-w-lg rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Timetable Details</DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              View the selected election timetable information.
            </DialogDescription>
          </DialogHeader>

          {loadingTimetableDetails ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-[#146c4f]" />
            </div>
          ) : viewingTimetable ? (
            <div className="space-y-4 text-sm text-gray-700">
              <div className="rounded-xl bg-gray-50 p-4 space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Description</p>
                  <p className="whitespace-pre-wrap break-words">{viewingTimetable.description || '—'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Date</p>
                    <p>{formatDate(viewingTimetable.date)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Status</p>
                    <p>{viewingTimetable.status || 'Upcoming'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Start</p>
                    <p>{viewingTimetable.starttime || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">End</p>
                    <p>{viewingTimetable.endtime || '—'}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Office</p>
                  <p>{offices.find((office) => String(office.id) === String(viewingTimetable.office_id))?.name || viewingTimetable.office_id || '—'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Election Type</p>
                  <p>{viewingTimetable.election_type_name || electionTypes.find((type) => String(type.id) === String(viewingTimetable.election_type_id))?.name || viewingTimetable.election_type_id || '—'}</p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-4 flex justify-end">
            <Button onClick={() => setViewingTimetable(null)} className="bg-[#146c4f] hover:bg-[#115a42] text-white px-6">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Calendar className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl">Success</DialogTitle>
            <DialogDescription className="text-center text-sm text-gray-600">
              {successMessage || 'Operation completed successfully.'}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 flex justify-center">
            <Button onClick={() => setShowSuccessDialog(false)} className="bg-[#146c4f] hover:bg-[#115a42] text-white px-6">
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!isCompletedElection && timetableToDelete !== null} onOpenChange={(open) => !open && setTimetableToDelete(null)}>
        <AlertDialogContent className="sm:max-w-md rounded-xl">
          <AlertDialogHeader>
            <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-600">
              <Trash2 className="h-5 w-5" />
            </div>
            <AlertDialogTitle className="text-center">Delete Timetable?</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-sm text-gray-600">
              This action cannot be undone. The timetable will be removed permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-2">
            <AlertDialogCancel onClick={() => setTimetableToDelete(null)} className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTimetable} className="rounded-xl bg-red-600 text-white hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


    </div>
  )
}



