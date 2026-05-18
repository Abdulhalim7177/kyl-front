import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { AnimatedConfirmDialog } from '@/components/AnimatedConfirmDialog'
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
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

import { 
  Search, 
  Download, 
  List as ListIcon, 
  LayoutGrid, 
  MoreVertical, 
  X, 
  Plus,
  Check,
  Trash2,
  Edit,
  Eye,
  RefreshCw,
  ToggleRight,
} from 'lucide-react'
import { candidateService, Candidate } from '@/services/candidates'
import { useAuth } from '@/contexts/AuthContext'

export default function CandidatesPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, user } = useAuth()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [stateFilter, setStateFilter] = useState('all')
  const [partyFilter, setPartyFilter] = useState('all')
  const [districtFilter, setDistrictFilter] = useState('all')
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [candidateToDelete, setCandidateToDelete] = useState<number | null>(null)
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set())

  // Load candidates
  useEffect(() => {
    if (isAuthenticated) {
      loadCandidates()
    } else {
      setLoading(false)
      setError('You must be logged in to view candidates.')
    }
  }, [isAuthenticated, user, location.pathname])

  const loadCandidates = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await candidateService.getAllCandidates()
      setCandidates(data)
    } catch (err) {
      console.error('Failed to load candidates:', err)
      setError('Failed to load candidates. Please check your connection and try again.')
      setCandidates([])
    } finally {
      setLoading(false)
    }
  }



  const toggleSelectAll = () => {
    if (selectedIds.size === (candidates || []).length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set((candidates || []).map(c => c.id)))
    }
  }

  const toggleSelect = (id: number) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const handleDelete = (id: number) => {
    setCandidateToDelete(id)
    setIsDeleteOpen(true)
  }

  const confirmDelete = async () => {
    if (candidateToDelete === null) return

    try {
      await candidateService.deleteCandidate(candidateToDelete)
      setCandidates((candidates || []).filter(c => c.id !== candidateToDelete))
    } catch (err) {
      console.error('Failed to delete candidate:', err)
      setCandidates((candidates || []).filter(c => c.id !== candidateToDelete))
    } finally {
      setCandidateToDelete(null)
      setIsDeleteOpen(false)
    }
  }

  const handleToggleStatus = async (id: number) => {
    setTogglingIds((prev) => new Set(prev).add(id))

    try {
      const updated = await candidateService.toggleCandidateStatus(id)
      setCandidates((prev) => prev.map((candidate) =>
        candidate.id === id ? { ...candidate, status: updated.status } : candidate
      ))
    } catch (err) {
      console.error(`Failed to toggle status for candidate ${id}:`, err)
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const handleBulkDelete = async () => {
    for (const id of selectedIds) {
      try {
        await candidateService.deleteCandidate(id)
      } catch (err) {
        console.error(`Failed to delete candidate ${id}:`, err)
      }
    }
    setCandidates((candidates || []).filter(c => !selectedIds.has(c.id)))
    setSelectedIds(new Set())
    setIsDeleteOpen(false)
  }

  // Filter candidates based on search and filters
  const filteredCandidates = (candidates || []).filter(candidate => {
    const matchesSearch = searchQuery === '' || 
      candidate.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.state?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.senatorial_district?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesState = stateFilter === 'all' || candidate.state === stateFilter
    const matchesParty = partyFilter === 'all' || candidate.political_party === partyFilter
    const matchesDistrict = districtFilter === 'all' || candidate.senatorial_district === districtFilter
    
    return matchesSearch && matchesState && matchesParty && matchesDistrict
  })

  const numSelected = selectedIds.size
  const isSelectionActive = numSelected > 0

  // Get unique values for filters
  const uniqueStates = [...new Set((candidates || []).map(c => c.state).filter(Boolean))]
  const uniqueParties = [...new Set((candidates || []).map(c => c.political_party).filter(Boolean))]
  const uniqueDistricts = [...new Set((candidates || []).map(c => c.senatorial_district).filter(Boolean))]

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-2 sm:mt-4">
         <p className="text-sm text-gray-500 max-w-2xl">Manage political candidates, track their information, and control access levels across National and State hierarchies within the KYL database.</p>
         <div className="flex items-center gap-3">
           <Button 
             variant="outline"
             onClick={loadCandidates}
             disabled={loading}
             className="flex items-center gap-2"
           >
             <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
             Refresh
           </Button>
           <Button 
             className="bg-[#146c4f] hover:bg-[#115a42] text-white rounded-lg px-4 py-2 h-10 flex items-center justify-center shadow w-full sm:w-auto"
             onClick={() => navigate('/k8s9d7f3-candidates-add')}
           >
             <Plus className="w-4 h-4 mr-2" />
             Add Candidate
           </Button>
         </div>
      </div>

      {/* Filter Bar - Scrollable on mobile */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
         <div className="relative flex-1 w-full min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input 
              type="text" 
              placeholder="Search by name, state, or district..." 
              className="pl-9 bg-gray-50/50 border-gray-200 shadow-none rounded-xl h-10 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
         </div>
         
         <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0 hide-scrollbar">
           <Select value={stateFilter} onValueChange={setStateFilter}>
             <SelectTrigger className="w-[130px] shrink-0 h-10 rounded-xl bg-gray-50/50 border-gray-200">
               <span className="text-gray-500 mr-1">State:</span> <SelectValue />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">All</SelectItem>
               {uniqueStates.map(state => (
                 <SelectItem key={state} value={state}>{state}</SelectItem>
               ))}
             </SelectContent>
           </Select>

           <Select value={partyFilter} onValueChange={setPartyFilter}>
             <SelectTrigger className="w-[130px] shrink-0 h-10 rounded-xl bg-gray-50/50 border-gray-200">
               <span className="text-gray-500 mr-1">Party:</span> <SelectValue />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">All</SelectItem>
               {uniqueParties.map(party => (
                 <SelectItem key={party} value={party}>{party}</SelectItem>
               ))}
             </SelectContent>
           </Select>

           <Select value={districtFilter} onValueChange={setDistrictFilter}>
             <SelectTrigger className="w-[160px] shrink-0 h-10 rounded-xl bg-gray-50/50 border-gray-200">
               <span className="text-gray-500 mr-1">District:</span> <SelectValue />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">All</SelectItem>
               {uniqueDistricts.map(district => (
                 <SelectItem key={district} value={district}>{district}</SelectItem>
               ))}
             </SelectContent>
           </Select>
           
           <div className="h-8 w-px bg-gray-200 mx-1 shrink-0 hidden sm:block" />

           <button className="p-2 text-gray-500 hover:text-gray-800 transition-colors shrink-0 hidden sm:block">
              <Download className="w-5 h-5" />
           </button>
           
           <div className="flex items-center bg-gray-100 rounded-lg p-1 shrink-0 hidden sm:flex">
              <button className="p-1 px-3 bg-[#146c4f] text-white rounded shadow-sm"><ListIcon className="w-4 h-4" /></button>
              <button className="p-1 px-3 text-gray-500 hover:text-gray-800"><LayoutGrid className="w-4 h-4" /></button>
           </div>
         </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto relative">
         {/* Contextual Action Bar Overlay */}
         {isSelectionActive && (
           <div className="absolute inset-x-0 top-0 h-16 min-h-[64px] bg-[#187555] text-white z-20 flex items-center justify-between px-4 sm:px-6 lg:px-8 animate-in slide-in-from-top-2 fade-in duration-200 shadow-md whitespace-nowrap overflow-x-auto hide-scrollbar">
             <div className="flex items-center gap-3 sm:gap-4 shrink-0 mr-4">
                <button className="w-8 h-8 rounded shrink-0 bg-white/20 flex items-center justify-center text-white cursor-pointer hover:bg-white/30" onClick={toggleSelectAll}>
                   <Check className="w-5 h-5" />
                </button>
                <div>
                   <span className="font-semibold block leading-tight text-sm sm:text-base">{numSelected} Selected</span>
                   <span className="text-[10px] sm:text-xs text-emerald-100 block opacity-90 hidden sm:block">Apply actions to the selected records</span>
                </div>
             </div>
             <div className="flex items-center gap-2 shrink-0">
                <Button className="bg-red-500 hover:bg-red-600 border border-red-500 text-white rounded-lg h-8 sm:h-9 text-xs sm:text-sm font-medium px-3 sm:px-5" onClick={() => {
                  setCandidateToDelete(null)
                  setIsDeleteOpen(true)
                }}>
                   <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 opacity-80" />
                   DELETE
                </Button>
                <button className="ml-2 sm:ml-4 p-1.5 text-emerald-200 hover:text-white transition-colors" onClick={() => setSelectedIds(new Set())}>
                   <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
             </div>
           </div>
         )}

         <div className="min-w-[800px]">
           <Table>
             <TableHeader>
               <TableRow className="hover:bg-transparent border-gray-100">
                  <TableHead className="w-12 px-6">
                   <Checkbox 
                     checked={selectedIds.size === (candidates || []).length && (candidates || []).length > 0} 
                     onCheckedChange={toggleSelectAll} 
                     className="rounded-[4px] border-gray-300"
                   />
                 </TableHead>
                 <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider">USER ID</TableHead>
                 <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider">FULL NAME</TableHead>
                 <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider">POLITICAL PARTY</TableHead>
                 <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider">SENATORIAL DISTRICT</TableHead>
                 <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider">STATE</TableHead>
                 <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider">STATUS</TableHead>
                 <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider">ACTIONS</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {loading ? (
                 <TableRow>
                   <TableCell colSpan={7} className="text-center py-8">
                     <div className="flex items-center justify-center">
                       <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#146c4f]"></div>
                     </div>
                   </TableCell>
                 </TableRow>
               ) : error ? (
                 <TableRow>
                   <TableCell colSpan={7} className="text-center py-8">
                     <div className="text-red-600">
                       <p className="font-medium mb-2">Error Loading Candidates</p>
                       <p className="text-sm text-gray-600">{error}</p>
                       {isAuthenticated ? (
                         <Button 
                           onClick={loadCandidates}
                           className="mt-4 bg-[#146c4f] hover:bg-[#115a42] text-white"
                         >
                           Try Again
                         </Button>
                       ) : (
                         <Button 
                           onClick={() => navigate('/k8s9d7f3-auth-login')}
                           className="mt-4 bg-[#146c4f] hover:bg-[#115a42] text-white"
                         >
                           Login
                         </Button>
                       )}
                     </div>
                   </TableCell>
                 </TableRow>
               ) : filteredCandidates.length === 0 ? (
                 <TableRow>
                   <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                     No candidates found
                   </TableCell>
                 </TableRow>
               ) : (
                 filteredCandidates.map((item) => {
                   const isSelected = selectedIds.has(item.id)
                   return (
                     <TableRow 
                       key={item.id} 
                       className={`group transition-colors border-gray-50 ${isSelected ? 'bg-[#dcfce7]/20 border-[#146c4f]/20' : 'hover:bg-gray-50/50'}`}
                     >
                        <TableCell className="px-6 py-5">
                          <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(item.id)} className="rounded-[4px] border-gray-300 data-[state=checked]:bg-[#146c4f] data-[state=checked]:border-[#146c4f]" />
                        </TableCell>
                        <TableCell className="font-medium text-gray-400 text-xs tracking-wide">
                          {item.user_id}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#146c4f]/10 flex items-center justify-center text-[#146c4f] font-semibold text-xs">
                              {item.full_name.charAt(0)}
                            </div>
                            <span className="font-medium text-gray-800">{item.full_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-[#146c4f]/30 text-[#146c4f] bg-[#146c4f]/5 font-medium">
                            {item.political_party}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {item.senatorial_district || '-'}
                        </TableCell>
                         <TableCell className="text-gray-600">
                           {item.state || '-'}
                         </TableCell>
                        <TableCell className="text-gray-600">
                          <div className="inline-flex items-center gap-2">
                            <span className={cn(
                              'rounded-full px-2 py-1 text-[0.7rem] font-semibold',
                              item.status === 'Active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            )}
                            >
                              {item.status}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(item.id)}
                              disabled={togglingIds.has(item.id)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                              aria-label={`Toggle status for ${item.full_name}`}
                            >
                              <ToggleRight className="w-4 h-4" />
                            </button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-[#146c4f] hover:text-[#115a42] hover:bg-[#146c4f]/10"
                              onClick={() => navigate(`/k8s9d7f3-candidates-view/${item.id}`)}
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
                                <DropdownMenuItem className="cursor-pointer" onClick={() => navigate(`/k8s9d7f3-candidates-edit/${item.id}`)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="cursor-pointer text-red-600 focus:text-red-600"
                                  onClick={() => handleDelete(item.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                     </TableRow>
                   )
                 })
               )}
             </TableBody>
           </Table>
         </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AnimatedConfirmDialog
        open={isDeleteOpen}
        onOpenChange={(open) => {
          setIsDeleteOpen(open)
          if (!open) setCandidateToDelete(null)
        }}
        title={candidateToDelete ? 'Delete Candidate' : 'Delete Candidates'}
        description={
          candidateToDelete
            ? 'Are you sure you want to delete this candidate? This action cannot be undone.'
            : `Are you sure you want to delete ${numSelected} selected candidate${numSelected > 1 ? 's' : ''}? This action cannot be undone.`
        }
        confirmText="Delete"
        onConfirm={candidateToDelete ? confirmDelete : handleBulkDelete}
      />
    </div>
  )
}