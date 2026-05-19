import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu'
import { Plus, User, Clock, Flag, RefreshCw, ChevronLeft, ChevronRight, MoreHorizontal, Trash2, Eye, MoreVertical, Edit } from 'lucide-react'
import { electionService, Election, ElectionStats } from '@/services/elections'
import { useAuth } from '@/contexts/AuthContext'

export default function ElectionsPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [elections, setElections] = useState<Election[]>([])
  const [stats, setStats] = useState<ElectionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showOnlyActive, setShowOnlyActive] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      loadData()
    } else {
      setLoading(false)
    }
  }, [isAuthenticated, showOnlyActive])

  const loadData = async () => {
    try {
      setLoading(true)
      const [allElections, statsData] = await Promise.all([
        electionService.getAllElections(),
        electionService.getElectionStats()
      ])
      
      if (showOnlyActive) {
        setElections(allElections.filter(e => e.status === 'Ongoing' || e.status === 'Upcoming'))
      } else {
        setElections(allElections)
      }
      
      setStats(statsData)
    } catch (err) {
      console.error('Failed to load elections data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (electionId: number, newStatus: 'Upcoming' | 'Ongoing' | 'Completed') => {
    try {
      await electionService.changeElectionStatus(electionId, newStatus)
      await loadData()
    } catch (err) {
      console.error('Failed to change election status:', err)
    }
  }

  const handleDelete = async (electionId: number) => {
    if (!confirm('Are you sure you want to delete this election?')) return
    try {
      await electionService.deleteElection(electionId)
      // Reload data after deletion
      await loadData()
    } catch (err) {
      console.error('Failed to delete election:', err)
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Elections</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage registered political entities, their chairmen, and candidate status across all active election cycles.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            className={`text-white transition-colors ${showOnlyActive ? 'bg-[#115a42] shadow-inner' : 'bg-[#146c4f] hover:bg-[#115a42]'}`}
            onClick={() => setShowOnlyActive(!showOnlyActive)}
          >
            {showOnlyActive ? 'Viewing Active Elections' : 'View Active Elections'}
          </Button>
          <Button
            className="bg-[#146c4f] hover:bg-[#115a42] text-white"
            onClick={() => navigate('/k8s9d7f3-elections-add')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Election
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-gray-100">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total</p>
              <h3 className="text-3xl font-bold text-gray-900">{stats?.total || 0}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-[#146c4f]">
              <User className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-gray-100">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Upcoming</p>
              <h3 className="text-3xl font-bold text-gray-900">{stats?.upcoming || 0}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-[#146c4f]">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-gray-100">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Completed</p>
              <h3 className="text-3xl font-bold text-gray-900">{stats?.completed || 0}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-[#146c4f]">
              <Flag className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-gray-100">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Ongoing</p>
              <h3 className="text-3xl font-bold text-gray-900">{stats?.ongoing || 0}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-[#146c4f]">
              <RefreshCw className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Elections</h2>
          <button className="text-sm text-[#146c4f] hover:underline font-medium">
            View All
          </button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-gray-100 bg-gray-50/50">
                <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider h-11 px-6">NAME</TableHead>
                <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider h-11">CATEGORY</TableHead>
                <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider h-11">TYPE</TableHead>
                <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider h-11">DATE</TableHead>
                <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider h-11">STATUS</TableHead>
                <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider">ACTION</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#146c4f]"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : elections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No elections found
                  </TableCell>
                </TableRow>
              ) : (
                elections.map((election, index) => (
                  <TableRow
                    key={`${election.id}-${index}`}
                    className="hover:bg-gray-50/50 transition-colors border-gray-50 cursor-pointer"
                    onClick={() => navigate(`/k8s9d7f3-elections-view/${election.id}`)}
                  >
                    <TableCell className="px-6 py-4">
                      <span className="text-sm text-gray-900 font-medium hover:underline hover:text-[#146c4f]">
                        {election.details || `${election.year} Election`}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 text-sm text-gray-500">
                      {election.category || '—'}
                    </TableCell>
                    <TableCell className="py-4 text-sm text-gray-500">
                      {election.type || 'General'}
                    </TableCell>
                    <TableCell className="py-4 text-sm text-gray-500">
                      {election.created_at ? new Date(election.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : `Jan 1, ${election.year}`}
                    </TableCell>
                    <TableCell className="py-4" onClick={(e) => e.stopPropagation()}>
                      {renderStatusBadge(election.status)}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[#146c4f] hover:text-[#115a42] hover:bg-[#146c4f]/10"
                          onClick={() => navigate(`/k8s9d7f3-elections-view/${election.id}`)}
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
                            <DropdownMenuItem className="cursor-pointer" onClick={() => navigate(`/k8s9d7f3-elections-edit/${election.id}`)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger className="cursor-pointer">
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Update Status
                              </DropdownMenuSubTrigger>
                              <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                  <DropdownMenuItem className="cursor-pointer" onClick={() => handleStatusChange(election.id, 'Upcoming')}>
                                    Upcoming
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="cursor-pointer" onClick={() => handleStatusChange(election.id, 'Ongoing')}>
                                    On-going
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="cursor-pointer" onClick={() => handleStatusChange(election.id, 'Completed')}>
                                    Completed
                                  </DropdownMenuItem>
                                </DropdownMenuSubContent>
                              </DropdownMenuPortal>
                            </DropdownMenuSub>
                            <DropdownMenuItem
                              className="cursor-pointer text-red-600 focus:text-red-600"
                              onClick={() => handleDelete(election.id)}
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

        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <div>
            Showing {elections.length} election{elections.length !== 1 ? 's' : ''}
          </div>
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded bg-[#146c4f] text-white font-medium">
              1
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 font-medium transition-colors">
              2
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 font-medium transition-colors">
              3
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded text-gray-400 cursor-default">
              <MoreHorizontal className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 font-medium transition-colors">
              125
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
