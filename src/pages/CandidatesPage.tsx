import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AnimatedConfirmDialog } from '@/components/AnimatedConfirmDialog'
import { PaginationControls } from '@/components/PaginationControls'
import { useClientPagination } from '@/components/useClientPagination'
import { cn, getLogoUrl } from '@/lib/utils'
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
  X, 
  Plus,
  Check,
  Trash2,
  Edit,
  Eye,
  RefreshCw,
  ToggleRight,
} from 'lucide-react'
import { candidateService, Candidate, Party, State } from '@/services/candidates'
import { useAuth } from '@/contexts/AuthContext'
import Can from '@/components/Can'
import { Permissions } from '@/lib/permissions'

export default function CandidatesPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, user } = useAuth()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [parties, setParties] = useState<Party[]>([])
  const [states, setStates] = useState<State[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [stateFilter, setStateFilter] = useState('all')
  const [partyFilter, setPartyFilter] = useState('all')
  const [districtFilter, setDistrictFilter] = useState('all')
  const [stateSearch, setStateSearch] = useState('')
  const [partySearch, setPartySearch] = useState('')
  const [districtSearch, setDistrictSearch] = useState('')
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [candidateToDelete, setCandidateToDelete] = useState<number | null>(null)
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set())

  // Load candidates, parties, and states
  useEffect(() => {
    if (isAuthenticated) {
      loadData()
    } else {
      setLoading(false)
      setError('You must be logged in to view candidates.')
    }
  }, [isAuthenticated, user, location.pathname])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [candidatesData, partiesData, statesData] = await Promise.all([
        candidateService.getAllCandidates(),
        candidateService.getAllParties(),
        candidateService.getAllStates()
      ])
      setCandidates(candidatesData)
      setParties(partiesData)
      setStates(statesData)
    } catch (err) {
      console.error('Failed to load data:', err)
      setError('Failed to load candidates. Please check your connection and try again.')
      setCandidates([])
    } finally {
      setLoading(false)
    }
  }

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

  const {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    paginatedData,
    handlePageChange,
    handleItemsPerPageChange
  } = useClientPagination(filteredCandidates, 21)

  const toggleSelectAll = () => {
    const pageIds = paginatedData.map(candidate => candidate.id)
    const allPageCandidatesSelected = pageIds.every(id => selectedIds.has(id))
    setSelectedIds(current => {
      const next = new Set(current)
      pageIds.forEach(id => {
        if (allPageCandidatesSelected) next.delete(id)
        else next.add(id)
      })
      return next
    })
  }

  const numSelected = selectedIds.size
  const isSelectionActive = numSelected > 0

  // Get unique values for filters from candidates data
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
             <RefreshCw aria-hidden="true" className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
             Refresh
           </Button>
           <Can permission={Permissions.CREATE_CANDIDATE}>
             <Button 
               className="bg-[#146c4f] hover:bg-[#115a42] text-white rounded-lg px-4 py-2 h-10 flex items-center justify-center shadow w-full sm:w-auto"
               onClick={() => navigate('/k8s9d7f3-candidates-add')}
             >
               <Plus aria-hidden="true" className="w-4 h-4 mr-2" />
               Add Candidate
             </Button>
           </Can>
         </div>
      </div>

      {/* Filter Bar - Scrollable on mobile */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
         <div className="relative flex-1 w-full min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input 
              type="text" 
              placeholder="Search by name, state, or district..." 
              aria-label="Search candidates"
              className="pl-9 bg-gray-50/50 border-gray-200 shadow-none rounded-xl h-10 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
         </div>
         
         <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0 hide-scrollbar">
           <Select value={stateFilter} onValueChange={setStateFilter}>
             <SelectTrigger aria-label="Filter by state" className="w-[130px] shrink-0 h-10 rounded-xl bg-gray-50/50 border-gray-200">
               <span className="text-gray-500 mr-1">State:</span> <SelectValue />
             </SelectTrigger>
             <SelectContent
               searchable
               searchValue={stateSearch}
               onSearchChange={setStateSearch}
             >
               <SelectItem value="all">All</SelectItem>
               {states
                 .filter((state) =>
                   state.name.toLowerCase().includes(stateSearch.toLowerCase())
                 )
                 .map((state) => (
                   <SelectItem key={state.id} value={state.name}>{state.name}</SelectItem>
                 ))}
             </SelectContent>
           </Select>

           <Select value={partyFilter} onValueChange={setPartyFilter}>
             <SelectTrigger aria-label="Filter by party" className="w-[130px] shrink-0 h-10 rounded-xl bg-gray-50/50 border-gray-200">
               <span className="text-gray-500 mr-1">Party:</span> <SelectValue />
             </SelectTrigger>
             <SelectContent
               searchable
               searchValue={partySearch}
               onSearchChange={setPartySearch}
             >
               <SelectItem value="all">All</SelectItem>
               {parties
                 .filter((party) =>
                   party.name.toLowerCase().includes(partySearch.toLowerCase())
                 )
                 .map((party) => (
                   <SelectItem key={party.id} value={party.name}>{party.name}</SelectItem>
                 ))}
             </SelectContent>
           </Select>

           <Select value={districtFilter} onValueChange={setDistrictFilter}>
             <SelectTrigger aria-label="Filter by district" className="w-[160px] shrink-0 h-10 rounded-xl bg-gray-50/50 border-gray-200">
               <span className="text-gray-500 mr-1">District:</span> <SelectValue />
             </SelectTrigger>
             <SelectContent
               searchable
               searchValue={districtSearch}
               onSearchChange={setDistrictSearch}
             >
               <SelectItem value="all">All</SelectItem>
               {uniqueDistricts
                 .filter((district) =>
                   district.toLowerCase().includes(districtSearch.toLowerCase())
                 )
                 .map((district) => (
                   <SelectItem key={district} value={district}>{district}</SelectItem>
                 ))}
             </SelectContent>
           </Select>
           
         </div>
      </div>

      {isSelectionActive && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-[#187555] px-4 py-3 text-white shadow-sm sm:px-6">
          <div className="flex items-center gap-3">
            <button type="button" className="flex h-8 w-8 items-center justify-center rounded bg-white/20 hover:bg-white/30" onClick={toggleSelectAll} aria-label="Select all candidates on this page">
              <Check aria-hidden="true" className="h-5 w-5" />
            </button>
            <span className="font-semibold">{numSelected} Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <Can permission={Permissions.DELETE_CANDIDATE}>
              <Button className="h-9 rounded-lg border border-red-500 bg-red-500 px-3 text-sm text-white hover:bg-red-600 sm:px-5" onClick={() => {
                setCandidateToDelete(null)
                setIsDeleteOpen(true)
              }}>
                <Trash2 aria-hidden="true" className="mr-2 h-4 w-4" />Delete
              </Button>
            </Can>
            <button type="button" className="p-1.5 text-emerald-100 hover:text-white" onClick={() => setSelectedIds(new Set())} aria-label="Clear selection">
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      <section className="space-y-4">
        {!loading && !error && filteredCandidates.length > 0 && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-gray-500">{totalItems} candidate{totalItems === 1 ? '' : 's'}</p>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <Checkbox
                checked={paginatedData.length > 0 && paginatedData.every(candidate => selectedIds.has(candidate.id))}
                onCheckedChange={toggleSelectAll}
                aria-label="Select all candidates on this page"
              />
              Select page
            </label>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-3 rounded-2xl border border-gray-100 bg-white py-16 text-sm text-gray-500 shadow-sm">
            <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 border-[#146c4f]" />
            Loading candidates...
          </div>
        ) : error ? (
          <div role="alert" className="rounded-2xl border border-red-100 bg-white px-5 py-12 text-center shadow-sm">
            <p className="mb-2 font-medium text-red-600">Error Loading Candidates</p>
            <p className="text-sm text-gray-600">{error}</p>
            <Button
              onClick={isAuthenticated ? loadCandidates : () => navigate('/k8s9d7f3-auth-login')}
              className="mt-4 bg-[#146c4f] text-white hover:bg-[#115a42]"
            >
              {isAuthenticated ? 'Try Again' : 'Login'}
            </Button>
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-5 py-16 text-center text-gray-500">
            No candidates found
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {paginatedData.map(item => {
              const imageUrl = getLogoUrl(item.image)
              const isSelected = selectedIds.has(item.id)
              return (
                <article key={item.id} className={cn(
                  'group relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_30px_rgb(0,0,0,0.08)]',
                  isSelected ? 'border-[#146c4f] ring-2 ring-[#146c4f]/20' : 'border-gray-100'
                )}>
                  <div className="absolute inset-0 bg-gradient-to-b from-[#146c4f]/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="relative z-10 p-6 pb-5 text-center">
                    <div className="absolute left-4 top-4">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(item.id)}
                        aria-label={`Select ${item.full_name}`}
                        className="border-gray-300 data-[state=checked]:border-[#146c4f] data-[state=checked]:bg-[#146c4f]"
                      />
                    </div>
                    <div className="mx-auto mb-4 h-24 w-24 rounded-full bg-gradient-to-tr from-gray-200 to-gray-300 p-1 shadow-sm transition-all group-hover:from-[#146c4f] group-hover:to-emerald-400">
                      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-2 border-white bg-gray-50">
                        {imageUrl ? (
                          <img src={imageUrl} alt={item.full_name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-3xl font-light uppercase text-gray-400">{item.full_name?.charAt(0) || '?'}</span>
                        )}
                      </div>
                    </div>
                    <h2 className="line-clamp-2 min-h-14 text-lg font-bold tracking-tight text-gray-900">{item.full_name}</h2>
                    <span className="mt-2 inline-flex max-w-full rounded-full bg-[#146c4f]/10 px-3 py-1 text-xs font-bold text-[#146c4f]">
                      <span className="truncate">{item.political_party || item.party?.name || 'Independent'}</span>
                    </span>
                    <div className="mt-3 flex items-center justify-center gap-2">
                      <span className={cn(
                        'rounded-full px-2.5 py-1 text-xs font-semibold',
                        item.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      )}>
                        {item.status}
                      </span>
                      <Can permission={Permissions.TOGGLE_CANDIDATE_STATUS}>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(item.id)}
                          disabled={togglingIds.has(item.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label={`Toggle status for ${item.full_name}`}
                          title="Toggle candidate status"
                        >
                          <ToggleRight aria-hidden="true" className="h-4 w-4" />
                        </button>
                      </Can>
                    </div>
                    <div className="mt-4 space-y-1 text-sm text-gray-500">
                      <p>{item.senatorial_district || item.federal_house_district || item.office_title || 'District unavailable'}</p>
                      <p>{item.state || 'State unavailable'}</p>
                    </div>
                  </div>
                  <div className="relative z-10 mt-auto flex justify-end border-t border-gray-100 bg-gray-50/60 px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-[#146c4f] hover:bg-[#146c4f]/10 hover:text-[#115a42]" onClick={() => navigate(`/k8s9d7f3-candidates-view/${item.id}`)} aria-label={`View ${item.full_name}`} title="View candidate">
                        <Eye aria-hidden="true" className="h-4 w-4" />
                      </Button>
                      <Can permission={Permissions.UPDATE_CANDIDATE}>
                        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-gray-600 hover:bg-gray-100 hover:text-gray-900" onClick={() => navigate(`/k8s9d7f3-candidates-edit/${item.id}`)} aria-label={`Edit ${item.full_name}`} title="Edit candidate">
                          <Edit aria-hidden="true" className="h-4 w-4" />
                        </Button>
                      </Can>
                      <Can permission={Permissions.DELETE_CANDIDATE}>
                        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleDelete(item.id)} aria-label={`Delete ${item.full_name}`} title="Delete candidate">
                          <Trash2 aria-hidden="true" className="h-4 w-4" />
                        </Button>
                      </Can>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      </section>

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