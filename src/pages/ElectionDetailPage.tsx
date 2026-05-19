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
import { ArrowLeft, Edit, Loader2, AlertCircle, Trash2, Eye, MoreVertical } from 'lucide-react'
import { electionService, Election } from '@/services/elections'
import { candidateService, Candidate } from '@/services/candidates'
import { useAuth } from '@/contexts/AuthContext'

export default function ElectionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const [election, setElection] = useState<Election | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [changingStatus, setChangingStatus] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (isAuthenticated && id) {
      loadData(Number(id))
    }
  }, [isAuthenticated, id])

  const loadData = async (electionId: number) => {
    try {
      setLoading(true)
      const [electionData, candidatesData] = await Promise.all([
        electionService.getElectionById(electionId),
        candidateService.getAllCandidates()
      ])
      
      if (electionData) {
        setElection(electionData)
        setCandidates(candidatesData.slice(0, 5))
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
      const updated = await electionService.changeElectionStatus(
        Number(id),
        newStatus as 'Upcoming' | 'Ongoing' | 'Completed'
      )
      setElection(updated)
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
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={() => navigate(`/k8s9d7f3-elections-edit/${election.id}`)}
            className="rounded-xl flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit Election
          </Button>
          <Button 
            variant="outline"
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded-xl flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
            disabled={deleting}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
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

      {/* Change Status Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Change Election Status</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant={election.status === 'Upcoming' ? 'default' : 'outline'}
            onClick={() => handleStatusChange('Upcoming')}
            disabled={changingStatus || election.status === 'Upcoming'}
            className={`rounded-xl px-5 ${
              election.status === 'Upcoming' 
                ? 'bg-amber-500 hover:bg-amber-600 text-white border-transparent' 
                : 'text-gray-600 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200'
            }`}
          >
            Upcoming
          </Button>
          <Button
            variant={election.status === 'Ongoing' ? 'default' : 'outline'}
            onClick={() => handleStatusChange('Ongoing')}
            disabled={changingStatus || election.status === 'Ongoing'}
            className={`rounded-xl px-5 ${
              election.status === 'Ongoing' 
                ? 'bg-blue-500 hover:bg-blue-600 text-white border-transparent' 
                : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200'
            }`}
          >
            On-going
          </Button>
          <Button
            variant={election.status === 'Completed' ? 'default' : 'outline'}
            onClick={() => handleStatusChange('Completed')}
            disabled={changingStatus || election.status === 'Completed'}
            className={`rounded-xl px-5 ${
              election.status === 'Completed' 
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-transparent' 
                : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
            }`}
          >
            Completed
          </Button>
          {changingStatus && <Loader2 className="w-5 h-5 animate-spin text-gray-400 ml-2" />}
        </div>
      </div>

      {/* Candidates Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Participating Candidates</h2>
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
              {candidates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                    No candidates registered for this election yet.
                  </TableCell>
                </TableRow>
              ) : (
                candidates.map((candidate) => (
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
                    <TableCell>
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
    </div>
  )
}
