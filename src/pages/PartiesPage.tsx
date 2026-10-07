import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Party, partyService } from '@/services/parties'
import { PaginationControls } from '@/components/PaginationControls'
import { useClientPagination } from '@/components/useClientPagination'
import { Search, ToggleRight } from 'lucide-react'
import AddPartyDialog from '@/components/AddPartyDialog'
import { getLogoUrl, cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'

interface PartiesPageState {
  parties: Party[]
  search: string
  loading: boolean
  error: string | null
}

export default function PartiesPage() {
  const [state, setState] = useState<PartiesPageState>({
    parties: [],
    search: '',
    loading: true,
    error: null,
  })
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    loadParties()
  }, [])

  const loadParties = async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const parties = await partyService.getAllParties()
      setState((prev) => ({
        ...prev,
        parties,
        loading: false,
      }))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load parties'
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }))
    }
  }

  const handleToggleParty = async (partyId: number) => {
    setTogglingIds((prev) => new Set(prev).add(partyId))
    setState((prev) => ({ ...prev, error: null }))
    try {
      const updatedParty = await partyService.togglePartyStatus(partyId)
      setState((prev) => ({
        ...prev,
        parties: prev.parties.map((party) =>
          party.id === partyId ? { ...party, status: updatedParty.status } : party
        ),
      }))
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to change party status',
      }))
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev)
        next.delete(partyId)
        return next
      })
    }
  }

  const toggleSelect = (id: number) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const handleToggleSelectedParties = async () => {
    if (selectedIds.size === 0) return
    setTogglingIds(new Set(selectedIds))
    setState((prev) => ({ ...prev, error: null }))

    try {
      const updatedParties = await Promise.all(
        Array.from(selectedIds).map((partyId) => partyService.togglePartyStatus(partyId))
      )
      setState((prev) => ({
        ...prev,
        parties: prev.parties.map((party) => {
          const updated = updatedParties.find((item) => item.id === party.id)
          return updated ? { ...party, status: updated.status } : party
        }),
      }))
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to toggle selected parties',
      }))
    } finally {
      setTogglingIds(new Set())
    }
  }

  const filteredParties = useMemo(() => {
    const term = state.search.trim().toLowerCase()
    if (!term) return state.parties

    return state.parties.filter((party) =>
      [party.name, party.description, party.slogan, party.philosophy, party.registrationYear ?? '']
        .join(' ')
        .toLowerCase()
        .includes(term)
    )
  }, [state.parties, state.search])

  const {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    paginatedData,
    handlePageChange,
    handleItemsPerPageChange
  } = useClientPagination(filteredParties, 12)

  const toggleSelectAll = () => {
    const allVisibleSelected = paginatedData.length > 0 && paginatedData.every((party) => selectedIds.has(party.id))
    const next = new Set(selectedIds)
    if (allVisibleSelected) {
      paginatedData.forEach((party) => next.delete(party.id))
      setSelectedIds(next)
      return
    }
    paginatedData.forEach((party) => next.add(party.id))
    setSelectedIds(next)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-gray-900">Political Parties</h2>
          <p className="text-sm text-gray-500">
            Manage registered political parties, update their logos, and control their active status.
          </p>
        </div>
        <AddPartyDialog onPartyAdded={loadParties} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            value={state.search}
            onChange={(e) => setState(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search parties by name or slogan..."
            className="pl-9 bg-gray-50 border-transparent focus:bg-white transition-colors h-10"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Checkbox 
            id="selectAll"
            checked={paginatedData.length > 0 && paginatedData.every((party) => selectedIds.has(party.id))}
            onCheckedChange={toggleSelectAll} 
            className="data-[state=checked]:bg-[#146c4f] data-[state=checked]:border-[#146c4f]"
          />
          <label htmlFor="selectAll" className="text-sm font-medium text-gray-600 cursor-pointer select-none">
            Select All Visible
          </label>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-green-50/50 border border-green-100 rounded-lg px-4 py-3 animate-in fade-in slide-in-from-top-2">
          <p className="text-sm font-medium text-green-800">{selectedIds.size} party{selectedIds.size > 1 ? 'ies' : ''} selected</p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleToggleSelectedParties}
              disabled={togglingIds.size > 0}
              className="bg-white text-green-700 hover:bg-green-50 border border-green-200"
            >
              Toggle Status for Selected
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
              disabled={togglingIds.size > 0}
              className="text-gray-500 hover:text-gray-700"
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {state.error && (
        <div className="px-4 py-3 text-sm text-red-800 bg-red-50 border border-red-100 rounded-lg">
          {state.error}
        </div>
      )}

      {state.loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-xl"></div>
          ))}
        </div>
      ) : paginatedData.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedData.map((party) => {
            const isSelected = selectedIds.has(party.id)
            const isToggling = togglingIds.has(party.id)
            const abbreviation = party.name.split(' ').map((word) => word[0] ?? '').join('').slice(0, 4).toUpperCase()

            return (
              <Card 
                key={party.id} 
                className={cn(
                  "relative overflow-hidden group transition-all duration-200 hover:shadow-md border",
                  isSelected ? "border-[#146c4f] ring-1 ring-[#146c4f] shadow-sm" : "border-gray-200"
                )}
              >
                <div className="absolute top-3 left-3 z-10">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleSelect(party.id)}
                    className="rounded-sm border-gray-300 data-[state=checked]:bg-[#146c4f] data-[state=checked]:border-[#146c4f] shadow-sm bg-white"
                  />
                </div>
                
                <div className="absolute top-3 right-3 z-10 flex gap-2">
                  <span className={cn(
                    "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-md",
                    party.status 
                      ? "bg-green-100/90 text-green-800 border border-green-200/50" 
                      : "bg-red-100/90 text-red-800 border border-red-200/50"
                  )}>
                    {party.status ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="p-6 flex flex-col items-center text-center space-y-4 pt-10">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center bg-gray-50 border border-gray-100 shadow-sm overflow-hidden p-2">
                    {party.logopath && getLogoUrl(party.logopath) ? (
                      <img 
                        src={getLogoUrl(party.logopath) || ''} 
                        alt={party.name} 
                        className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-gray-300">{abbreviation}</span>
                    )}
                  </div>
                  
                  <div className="space-y-1.5 w-full">
                    <h3 className="font-bold text-gray-900 leading-tight truncate px-2" title={party.name}>
                      {party.name}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                      {abbreviation} • {party.registrationYear || 'N/A'}
                    </p>
                  </div>
                  
                  {party.slogan && (
                    <p className="text-sm text-gray-600 line-clamp-2 italic px-2 min-h-[40px]">
                      "{party.slogan}"
                    </p>
                  )}
                </div>
                
                <div className="p-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleParty(party.id)}
                    disabled={isToggling}
                    className={cn(
                      "flex-1 h-9 text-xs font-medium",
                      party.status ? "text-red-600 hover:text-red-700 hover:bg-red-50" : "text-green-600 hover:text-green-700 hover:bg-green-50"
                    )}
                  >
                    <ToggleRight className="w-3.5 h-3.5 mr-1.5" />
                    {party.status ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    asChild
                    variant="default"
                    size="sm"
                    className="flex-1 h-9 bg-gray-900 hover:bg-gray-800 text-xs font-medium"
                  >
                    <Link to={`/k8s9d7f3-parties/${party.id}`}>Manage</Link>
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="py-20 text-center bg-white rounded-xl border border-gray-100">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No parties found</h3>
          <p className="text-gray-500 text-sm">We couldn't find any parties matching your search criteria.</p>
        </div>
      )}

      {paginatedData.length > 0 && (
        <div className="bg-white px-4 py-3 rounded-xl border border-gray-100">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </div>
      )}
    </div>
  )
}
