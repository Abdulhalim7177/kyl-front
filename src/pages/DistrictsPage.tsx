/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { MapPin, Loader2, Map } from 'lucide-react'
import { districtsService, District } from '@/services/districts'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PaginationControls } from '@/components/PaginationControls'
import { useClientPagination } from '@/components/useClientPagination'

interface DistrictsPageProps {
  type: 'states' | 'senatorial' | 'federal' | 'state-house' | 'lgas' | 'wards'
  title: string
}

export default function DistrictsPage({ type, title }: DistrictsPageProps) {
  const { isAuthenticated } = useAuth()
  const [districts, setDistricts] = useState<District[]>([])
  const [loading, setLoading] = useState(true)
  const [searchParams] = useSearchParams()
  const [stateNames, setStateNames] = useState<Record<number, string>>({})

  useEffect(() => {
    if (isAuthenticated) {
      loadData()
    }
  }, [isAuthenticated, type])

  const loadData = async () => {
    try {
      setLoading(true)
      let data: District[] = []
      switch (type) {
        case 'states': data = await districtsService.getStates(); break;
        case 'senatorial': data = await districtsService.getSenatorialDistricts(); break;
        case 'federal': data = await districtsService.getFederalHouseDistricts(); break;
        case 'state-house': data = await districtsService.getStateHouseDistricts(); break;
        case 'lgas': data = await districtsService.getLgaDistricts(); break;
        case 'wards': {
          const [wards, states] = await Promise.all([
            districtsService.getWards(),
            districtsService.getStates()
          ])
          data = wards
          setStateNames(Object.fromEntries(states.map((state) => [state.id, state.name])))
          break;
        }
      }
      setDistricts(data)
    } catch (err) {
      console.error('Failed to load districts:', err)
    } finally {
      setLoading(false)
    }
  }
  const filteredDistricts = type === 'states'
    ? districts.filter((district) => district.name.toLowerCase().includes((searchParams.get('stateSearch') || '').toLowerCase()))
    : districts

  const {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    paginatedData,
    handlePageChange,
    handleItemsPerPageChange
  } = useClientPagination(filteredDistricts, 20)
  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      {/* Banner matching Dashboard */}
      <Card className="shadow-md border border-gray-100 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-4 md:p-6">
          <div>
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Map className="w-6 h-6 text-[#146c4f]" />
                {title} Management
              </h2>
              <p className="text-gray-500 mt-1 text-sm">Manage and view {title.toLowerCase()} across the electoral system.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table and total count */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto relative min-h-[300px]">
        {loading && (
          <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#146c4f]" />
          </div>
        )}
        
        <div className="w-full">
          <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 md:px-6">
            <p className="text-sm font-semibold text-gray-900">Total {title}</p>
            <span className="rounded-full bg-teal-50 px-3 py-1 text-sm font-bold text-[#146c4f]">{districts.length}</span>
          </div>
          <Table>
            <TableHeader className="bg-white border-b border-gray-100">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider w-[140px]">S/N</TableHead>
                <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider">NAME</TableHead>
                {type !== 'states' && <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider">PARENT REGION</TableHead>}
                <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider text-right pr-6">{type === 'states' || type === 'wards' ? 'ACTION' : 'TYPE'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDistricts.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={type === 'states' ? 3 : 4} className="h-32 text-center text-gray-500 font-medium text-sm">
                    No {title.toLowerCase()} found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((district) => (
                  <TableRow 
                    key={district.id} 
                    className="group transition-colors border-gray-50 hover:bg-gray-50/50"
                  >
                    <TableCell className="font-medium text-gray-400 text-xs tracking-wide py-5">
                      S/N {district.id}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full border border-gray-100 shadow-sm bg-blue-100 shrink-0 flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="font-semibold text-gray-900 whitespace-nowrap">{district.name}</span>
                      </div>
                    </TableCell>
                    {type !== 'states' && (
                      <TableCell className="text-gray-500 font-medium whitespace-nowrap">
                        {type === 'wards' 
                          ? (district.lga_district?.name
                            ? `${district.lga_district.name} LGA, ${district.lga_district.state?.name || stateNames[district.lga_district.state_id ?? district.state_id ?? 0] || 'N/A'}`
                            : 'N/A')
                          : (district.state?.name || 'N/A')}
                      </TableCell>
                    )}
                    <TableCell className="text-right pr-6">
                      {type === 'states' ? (
                        <Button asChild size="sm" className="bg-[#146c4f] hover:bg-[#10563f]">
                          <Link to={`/k8s9d7f3-districts/states/${district.id}`}>Manage State</Link>
                        </Button>
                      ) : type === 'wards' ? (
                        <Button asChild size="sm" className="bg-[#146c4f] hover:bg-[#10563f]">
                          <Link to={`/k8s9d7f3-districts/wards/${district.id}`}>View Ward</Link>
                        </Button>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-[0.8rem] whitespace-nowrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#146c4f]"></span>
                          <span className="text-[#146c4f] uppercase tracking-wider">{type.replace('-', ' ')}</span>
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        {!loading && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        )}
      </div>
    </div>
  )
}
