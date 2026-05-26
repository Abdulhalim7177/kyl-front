import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Party, partyService } from '@/services/parties'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Search, ChevronLeft, ChevronRight, ToggleRight } from 'lucide-react'
import AddPartyDialog from '@/components/AddPartyDialog'
import { getLogoUrl, cn } from '@/lib/utils'

// Types/Interfaces
interface PartiesPageState {
  parties: Party[]
  search: string
  loading: boolean
  error: string | null
}

// Component
export default function PartiesPage() {
  // State
  const [state, setState] = useState<PartiesPageState>({
    parties: [],
    search: '',
    loading: true,
    error: null,
  })
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set())

  // Effects
  useEffect(() => {
    loadParties()
  }, [])

  // Handlers
  const loadParties = async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const parties = await partyService.getAllParties()
      console.log('Loaded parties:', parties)
      console.log('Party logos:', parties.map(p => ({ name: p.name, logopath: p.logopath })))
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
      console.error('Failed to load parties:', err)
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to change party status'
      setState((prev) => ({
        ...prev,
        error: errorMessage,
      }))
      console.error('Failed to toggle party status:', err)
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev)
        next.delete(partyId)
        return next
      })
    }
  }

  const handleSearchChange = (value: string) => {
    setState((prev) => ({ ...prev, search: value }))
  }

  const toggleSelectAll = () => {
    const allVisibleSelected = filteredParties.length > 0 && filteredParties.every((party) => selectedIds.has(party.id))
    const next = new Set(selectedIds)

    if (allVisibleSelected) {
      filteredParties.forEach((party) => next.delete(party.id))
      setSelectedIds(next)
      return
    }

    filteredParties.forEach((party) => next.add(party.id))
    setSelectedIds(next)
  }

  const toggleSelect = (id: number) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const selectedCount = selectedIds.size

  const handleToggleSelectedParties = async () => {
    if (selectedCount === 0) return

    setTogglingIds(new Set(selectedIds))
    setState((prev) => ({ ...prev, error: null }))

    try {
      const updatedParties = await Promise.all(
        Array.from(selectedIds).map(async (partyId) => {
          return await partyService.togglePartyStatus(partyId)
        })
      )

      setState((prev) => ({
        ...prev,
        parties: prev.parties.map((party) => {
          const updated = updatedParties.find((item) => item.id === party.id)
          return updated ? { ...party, status: updated.status } : party
        }),
      }))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle selected parties'
      setState((prev) => ({
        ...prev,
        error: errorMessage,
      }))
      console.error('Failed to toggle selected parties:', err)
    } finally {
      setTogglingIds(new Set())
    }
  }

  // Computed values
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

  const total = state.parties.length
  const count = filteredParties.length

  // Render
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-gray-900">Parties</h2>
          <p className="text-sm text-gray-500">
            Manage registered political parties, their slogans, and candidate status across all election cycles.
          </p>
        </div>
        <AddPartyDialog onPartyAdded={loadParties} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            value={state.search}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Search by party name, slogan or year..."
            className="pl-9 bg-white border-gray-200 rounded-lg h-10"
          />
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-green-50 border border-green-100 rounded-lg px-4 py-3">
          <p className="text-sm text-green-700">{selectedCount} party{selectedCount > 1 ? 'ies' : ''} selected</p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={handleToggleSelectedParties}
              disabled={togglingIds.size > 0}
            >
              Toggle selected status
            </Button>
            <Button
              variant="outline"
              onClick={() => setSelectedIds(new Set())}
              disabled={togglingIds.size > 0}
            >
              Clear selection
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-x-auto">
        {state.error && (
          <div className="px-4 py-3 text-sm text-red-800 bg-red-50 border-b border-red-100">
            {state.error}
          </div>
        )}

        <div className="min-w-full">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-100 bg-gray-50/50">
                <TableHead className="w-12 px-4 py-3">
                  <Checkbox
                    checked={filteredParties.length > 0 && filteredParties.every((party) => selectedIds.has(party.id))}
                    onCheckedChange={toggleSelectAll}
                    className="rounded-[4px] border-gray-300"
                  />
                </TableHead>
                <TableHead className="text-[0.7rem] font-semibold text-gray-600 tracking-wider py-3">ABBR</TableHead>
                <TableHead className="text-[0.7rem] font-semibold text-gray-600 tracking-wider py-3">PARTY NAME</TableHead>
                <TableHead className="text-[0.7rem] font-semibold text-gray-600 tracking-wider py-3">SLOGAN</TableHead>
                <TableHead className="text-[0.7rem] font-semibold text-gray-600 tracking-wider py-3 text-center">STATUS</TableHead>
                <TableHead className="text-[0.7rem] font-semibold text-gray-600 tracking-wider py-3">REGISTERED YEAR</TableHead>
                <TableHead className="text-[0.7rem] font-semibold text-gray-600 tracking-wider py-3 text-center">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-gray-500">
                    Loading parties...
                  </TableCell>
                </TableRow>
              ) : filteredParties.length > 0 ? (
                filteredParties.map((party) => {
                  const isSelected = selectedIds.has(party.id)
                  const abbreviation = party.name
                    .split(' ')
                    .map((word) => word[0] ?? '')
                    .join('')
                    .slice(0, 4)
                    .toUpperCase()

                  return (
                    <TableRow key={party.id} className={`border-gray-50 ${isSelected ? 'bg-green-50/70' : 'hover:bg-gray-50/50'} transition-colors`}>
                      <TableCell className="px-4 py-4">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(party.id)}
                          className="rounded-[4px] border-gray-300 data-[state=checked]:bg-[#146c4f] data-[state=checked]:border-[#146c4f]"
                        />
                      </TableCell>
                      <TableCell className="font-semibold text-gray-900 text-sm py-4">{abbreviation}</TableCell>
                      <TableCell className="font-medium text-gray-900 py-4">
                        <div className="flex items-center gap-3">
                          {party.logopath && getLogoUrl(party.logopath) ? (
                            <img 
                              src={getLogoUrl(party.logopath) || ''} 
                              alt={`${party.name} logo`} 
                              className="h-8 w-8 object-contain rounded" 
                              onError={(e) => {
                                console.error(`Failed to load logo for ${party.name}:`, getLogoUrl(party.logopath))
                                console.error('Error event:', e)
                              }}
                              onLoad={() => {
                                console.log(`Logo loaded successfully for ${party.name}:`, getLogoUrl(party.logopath))
                              }}
                            />
                          ) : (
                            <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center">
                              <span className="text-xs font-semibold text-gray-600">{abbreviation}</span>
                            </div>
                          )}
                          <span>{party.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm py-4 max-w-xs truncate">{party.slogan}</TableCell>
                      <TableCell className="text-gray-600 py-4">
                        <div className="inline-flex items-center gap-2">
                          <span className={cn(
                            'rounded-full px-2 py-1 text-[0.7rem] font-semibold',
                            party.status
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          )}>
                            {party.status ? 'Active' : 'Inactive'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleParty(party.id)}
                            disabled={togglingIds.has(party.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label={`Toggle status for ${party.name}`}
                          >
                            <ToggleRight className="w-4 h-4" />
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm py-4">{party.registrationYear || 'N/A'}</TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            asChild
                            variant="ghost"
                            className="h-8 px-2 text-xs text-green-700 hover:bg-green-50 rounded"
                          >
                            <Link to={`/k8s9d7f3-parties/${party.id}`}>View</Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-gray-500">
                    No parties match your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="bg-gray-50/50 px-4 py-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between text-xs gap-3">
          <span className="text-gray-500">Showing {count} of {total} parties</span>
          <div className="flex items-center gap-1">
            <button className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 text-gray-400 hover:bg-white bg-transparent transition-colors">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button className="w-7 h-7 flex items-center justify-center rounded bg-green-700 text-white font-medium border border-green-700 text-xs">1</button>
            <button className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 text-gray-600 hover:bg-white bg-white transition-colors">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
