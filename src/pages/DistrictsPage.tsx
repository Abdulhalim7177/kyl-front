/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { MapPin, Loader2, Map, Search } from 'lucide-react'
import { districtsService, District } from '@/services/districts'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PaginationControls } from '@/components/PaginationControls'
import { Input } from '@/components/ui/input'

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
  const [districtPage, setDistrictPage] = useState(1)
  const [districtPerPage, setDistrictPerPage] = useState(20)
  const [districtTotal, setDistrictTotal] = useState(0)
  const [districtLastPage, setDistrictLastPage] = useState(1)
  const [senatorialSearch, setSenatorialSearch] = useState('')
  const [federalSearch, setFederalSearch] = useState('')
  const [lgaSearch, setLgaSearch] = useState('')
  const [wardSearch, setWardSearch] = useState('')
  const [allSearchResults, setAllSearchResults] = useState<{ endpoint: string; districts: District[] } | null>(null)
  const [searchDataLoading, setSearchDataLoading] = useState(false)
  const [searchDataError, setSearchDataError] = useState('')
  const [stateHousePage, setStateHousePage] = useState(1)
  const [stateHousePerPage, setStateHousePerPage] = useState(20)
  const [stateHouseTotal, setStateHouseTotal] = useState(0)
  const [stateHouseLastPage, setStateHouseLastPage] = useState(1)
  const [stateHouseSearch, setStateHouseSearch] = useState('')
  const allSearchDistrictsRequest = useRef<{ endpoint: string; promise: Promise<District[]> } | null>(null)
  const districtRequestId = useRef(0)

  useEffect(() => {
    if (isAuthenticated) {
      if (getDistrictSearchQuery()) return
      if (type === 'state-house') {
        void loadData(stateHousePage, stateHousePerPage)
      } else {
        void loadData(districtPage, districtPerPage)
      }
    }
  }, [isAuthenticated, type, stateHousePage, stateHousePerPage, districtPage, districtPerPage, senatorialSearch, federalSearch, lgaSearch, wardSearch, searchParams])

  useEffect(() => {
    const searchQuery = getDistrictSearchQuery()
    const endpoint = getDistrictSearchEndpoint()
    if (!isAuthenticated || !searchQuery || !endpoint) return

    let active = true
    const timeout = window.setTimeout(async () => {
      if (allSearchResults?.endpoint === endpoint) return

      setSearchDataLoading(true)
      setSearchDataError('')
      const request = allSearchDistrictsRequest.current?.endpoint === endpoint
        ? allSearchDistrictsRequest.current.promise
        : districtsService.getAllDistrictsPaged(endpoint)
      allSearchDistrictsRequest.current = { endpoint, promise: request }
      try {
        const results = await request
        if (active) {
          setAllSearchResults({ endpoint, districts: results })
        }
      } catch (err) {
        if (allSearchDistrictsRequest.current?.promise === request) {
          allSearchDistrictsRequest.current = null
        }
        if (active) {
          setSearchDataError(err instanceof Error ? err.message : `Unable to search ${title.toLowerCase()}.`)
        }
      } finally {
        if (active) setSearchDataLoading(false)
      }
    }, 300)

    return () => {
      active = false
      window.clearTimeout(timeout)
    }
  }, [isAuthenticated, type, title, senatorialSearch, federalSearch, lgaSearch, wardSearch, stateHouseSearch, searchParams, allSearchResults])

  function getDistrictSearchQuery() {
    switch (type) {
      case 'states': return searchParams.get('stateSearch')?.trim() || ''
      case 'senatorial': return senatorialSearch.trim()
      case 'federal': return federalSearch.trim()
      case 'lgas': return lgaSearch.trim()
      case 'wards': return wardSearch.trim()
      case 'state-house': return stateHouseSearch.trim()
      default: return ''
    }
  }

  function getDistrictSearchEndpoint() {
    switch (type) {
      case 'states': return 'get-states'
      case 'senatorial': return 'get-senatorial-districts'
      case 'federal': return 'get-federal-house-districts'
      case 'lgas': return 'get-lga-districts'
      case 'wards': return 'get-wards'
      case 'state-house': return 'get-state-house-districts'
      default: return ''
    }
  }

  const loadData = async (page = 1, perPage = 20) => {
    const requestId = ++districtRequestId.current
    try {
      setLoading(true)
      let data: District[] = []
      let endpoint = ''
      switch (type) {
        case 'states': endpoint = 'get-states'; break
        case 'senatorial': endpoint = 'get-senatorial-districts'; break
        case 'federal': endpoint = 'get-federal-house-districts'; break
        case 'state-house': {
          const result = await districtsService.getStateHouseDistrictsPage(page, perPage)
          data = result.data
          if (requestId === districtRequestId.current) {
            setStateHouseTotal(result.total)
            setStateHouseLastPage(result.last_page)
          }
          break
        }
        case 'lgas': endpoint = 'get-lga-districts'; break
        case 'wards': {
          const wardPage = await districtsService.getDistrictsPage('get-wards', page, perPage)
          data = wardPage.data
          if (requestId === districtRequestId.current) {
            setDistrictTotal(wardPage.total)
            setDistrictLastPage(wardPage.last_page)
            if (Object.keys(stateNames).length === 0) {
              void districtsService.getStates()
                .then((states) => {
                  if (requestId === districtRequestId.current) {
                    setStateNames(Object.fromEntries(states.map((state) => [state.id, state.name])))
                  }
                })
                .catch((stateError: unknown) => {
                  console.error('Failed to load state names for wards:', stateError)
                })
            }
          }
          break
        }
      }
      if (endpoint) {
        const result = await districtsService.getDistrictsPage(endpoint, page, perPage)
        data = result.data
        if (requestId === districtRequestId.current) {
          setDistrictTotal(result.total)
          setDistrictLastPage(result.last_page)
        }
      }
      if (requestId === districtRequestId.current) setDistricts(data)
    } catch (err) {
      if (requestId === districtRequestId.current) console.error('Failed to load districts:', err)
    } finally {
      if (requestId === districtRequestId.current) setLoading(false)
    }
  }

  const handleStateHouseSearchChange = (value: string) => {
    setStateHouseSearch(value)
    setStateHousePage(1)
  }

  const searchEndpoint = getDistrictSearchEndpoint()
  const searchDistricts = allSearchResults?.endpoint === searchEndpoint
    ? allSearchResults.districts
    : districts
  const filteredDistricts = type === 'states'
    ? (searchParams.get('stateSearch') && allSearchResults?.endpoint === searchEndpoint ? searchDistricts : districts)
      .filter((district) => district.name.toLowerCase().includes((searchParams.get('stateSearch') || '').toLowerCase()))
    : type === 'senatorial'
      ? (senatorialSearch.trim() && allSearchResults?.endpoint === searchEndpoint ? searchDistricts : districts)
        .filter((district) => district.name.toLowerCase().includes(senatorialSearch.trim().toLowerCase()))
      : type === 'federal'
        ? (federalSearch.trim() && allSearchResults?.endpoint === searchEndpoint ? searchDistricts : districts)
          .filter((district) => district.name.toLowerCase().includes(federalSearch.trim().toLowerCase()))
        : type === 'lgas'
          ? (lgaSearch.trim() && allSearchResults?.endpoint === searchEndpoint ? searchDistricts : districts)
            .filter((district) => district.name.toLowerCase().includes(lgaSearch.trim().toLowerCase()))
          : type === 'wards'
            ? (wardSearch.trim() && allSearchResults?.endpoint === searchEndpoint ? searchDistricts : districts)
              .filter((district) => district.name.toLowerCase().includes(wardSearch.trim().toLowerCase()))
          : type === 'state-house'
            ? searchDistricts.filter((district) =>
              district.name.toLowerCase().includes(stateHouseSearch.trim().toLowerCase())
            )
            : districts
  const isSearchingStateHouse = type === 'state-house' && Boolean(stateHouseSearch.trim())
  const isSearchingAllDistricts = Boolean(getDistrictSearchQuery()) && allSearchResults?.endpoint === searchEndpoint
  const stateHouseSearchTotalPages = Math.ceil(filteredDistricts.length / stateHousePerPage)
  const visibleDistricts = type === 'state-house'
    ? isSearchingStateHouse
      ? filteredDistricts.slice((stateHousePage - 1) * stateHousePerPage, stateHousePage * stateHousePerPage)
      : districts
    : isSearchingAllDistricts
      ? filteredDistricts.slice((districtPage - 1) * districtPerPage, districtPage * districtPerPage)
      : filteredDistricts
  const paginationPage = type === 'state-house' ? stateHousePage : districtPage
  const paginationTotalPages = type === 'state-house'
    ? isSearchingStateHouse ? stateHouseSearchTotalPages : stateHouseLastPage
    : isSearchingAllDistricts ? Math.ceil(filteredDistricts.length / districtPerPage) : districtLastPage
  const paginationTotalItems = type === 'state-house'
    ? isSearchingStateHouse ? filteredDistricts.length : stateHouseTotal
    : isSearchingAllDistricts ? filteredDistricts.length : districtTotal
  const paginationItemsPerPage = type === 'state-house' ? stateHousePerPage : districtPerPage

  const handlePaginationPageChange = (page: number) => {
    if (type === 'state-house') {
      setStateHousePage(page)
      return
    }
    setDistrictPage(page)
  }

  const handlePaginationItemsPerPageChange = (items: number) => {
    if (type === 'state-house') {
      setStateHousePerPage(items)
      setStateHousePage(1)
      return
    }
    setDistrictPerPage(items)
    setDistrictPage(1)
  }

  const renderDistrictActions = (district: District) => {
    const buttonClassName = 'w-full bg-[#146c4f] hover:bg-[#10563f] sm:w-auto'
    if (type === 'states') {
      return (
        <>
          <Button asChild size="sm" className={buttonClassName}>
            <Link to={`/k8s9d7f3-districts/states/${district.id}`}>Manage Candidates</Link>
          </Button>
          <Button asChild size="sm" className={buttonClassName}>
            <Link to={`/k8s9d7f3-districts/states/${district.id}/elected`}>Manage Elected</Link>
          </Button>
        </>
      )
    }
    if (type === 'lgas') {
      return (
        <>
          <Button asChild size="sm" className={buttonClassName}>
            <Link to={`/k8s9d7f3-districts/lgas/${district.id}/candidates`}>Manage Candidate</Link>
          </Button>
          <Button asChild size="sm" className={buttonClassName}>
            <Link to={`/k8s9d7f3-districts/lgas/${district.id}/elected`}>Manage Elected</Link>
          </Button>
        </>
      )
    }
    if (type === 'wards') {
      return (
        <>
          <Button asChild size="sm" className={buttonClassName}>
            <Link to={`/k8s9d7f3-districts/wards/${district.id}/candidates?name=${encodeURIComponent(district.name)}`}>Manage Candidate</Link>
          </Button>
          <Button asChild size="sm" className={buttonClassName}>
            <Link to={`/k8s9d7f3-districts/wards/${district.id}/elected?name=${encodeURIComponent(district.name)}`}>Manage Elected</Link>
          </Button>
        </>
      )
    }
    const routePrefix = type === 'senatorial'
      ? 'senatorial'
      : type === 'federal'
        ? 'federal'
        : 'state-house'
    return (
      <>
        <Button asChild size="sm" className={buttonClassName}>
          <Link to={`/k8s9d7f3-districts/${routePrefix}/${district.id}/candidates`}>Manage Candidates</Link>
        </Button>
        <Button asChild size="sm" className={buttonClassName}>
          <Link to={`/k8s9d7f3-districts/${routePrefix}/${district.id}/elected`}>Manage Elected</Link>
        </Button>
      </>
    )
  }

  const getParentRegion = (district: District) => type === 'wards'
    ? district.lga_district?.name
      ? `${district.lga_district.name} LGA, ${district.lga_district.state?.name || stateNames[district.lga_district.state_id ?? district.state_id ?? 0] || 'N/A'}`
      : 'N/A'
    : district.state?.name || 'N/A'

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
          <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center md:px-6">
            <p className="text-sm font-semibold text-gray-900">Total {title}</p>
            <span className="rounded-full bg-teal-50 px-3 py-1 text-sm font-bold text-[#146c4f]">{isSearchingAllDistricts ? filteredDistricts.length : type === 'state-house' ? stateHouseTotal : districtTotal}</span>
            {type === 'senatorial' && (
              <div className="relative w-full sm:ml-auto sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  aria-label="Search senatorial districts by name"
                  placeholder="Search all senatorial districts..."
                  className="bg-gray-50/50 pl-9"
                  value={senatorialSearch}
                  onChange={(event) => {
                    setSenatorialSearch(event.target.value)
                    setDistrictPage(1)
                  }}
                />
              </div>
            )}
            {type === 'federal' && (
              <div className="relative w-full sm:ml-auto sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  aria-label="Search federal constituencies by name"
                  placeholder="Search all constituencies..."
                  className="bg-gray-50/50 pl-9"
                  value={federalSearch}
                  onChange={(event) => {
                    setFederalSearch(event.target.value)
                    setDistrictPage(1)
                  }}
                />
              </div>
            )}
            {type === 'lgas' && (
              <div className="relative w-full sm:ml-auto sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  aria-label="Search LGAs by name"
                  placeholder="Search all LGAs..."
                  className="bg-gray-50/50 pl-9"
                  value={lgaSearch}
                  onChange={(event) => {
                    setLgaSearch(event.target.value)
                    setDistrictPage(1)
                  }}
                />
              </div>
            )}
            {type === 'wards' && (
              <div className="relative w-full sm:ml-auto sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  aria-label="Search wards by name"
                  placeholder="Search all wards..."
                  className="bg-gray-50/50 pl-9"
                  value={wardSearch}
                  onChange={(event) => {
                    setWardSearch(event.target.value)
                    setDistrictPage(1)
                  }}
                />
              </div>
            )}
            {type === 'state-house' && (
              <div className="relative w-full sm:ml-auto sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  aria-label="Search State House of Assembly districts by name"
                  placeholder="Search all State House districts..."
                  className="bg-gray-50/50 pl-9"
                  value={stateHouseSearch}
                  onChange={(event) => handleStateHouseSearchChange(event.target.value)}
                />
              </div>
            )}
          </div>
          {searchDataLoading && getDistrictSearchQuery() && (
            <p role="status" className="px-6 py-2 text-xs text-gray-500">
              Searching all {title.toLowerCase()} across pages...
            </p>
          )}
          {searchDataError && getDistrictSearchQuery() && (
            <p role="alert" className="px-6 py-2 text-sm text-red-600">{searchDataError}</p>
          )}
          <div className="grid gap-3 p-4 md:hidden">
            {visibleDistricts.length === 0 && !loading ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
                No {title.toLowerCase()} found.
              </div>
            ) : visibleDistricts.map((district) => (
              <article key={district.id} className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-100 bg-blue-100">
                    <MapPin className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <h3 className="break-words font-semibold text-gray-900">{district.name}</h3>
                      <span className="shrink-0 text-xs text-gray-400">S/N {district.id}</span>
                    </div>
                    {type !== 'states' && (
                      <p className="mt-1 break-words text-sm text-gray-500">{getParentRegion(district)}</p>
                    )}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {renderDistrictActions(district)}
                </div>
              </article>
            ))}
          </div>
          <div className="hidden md:block">
          <Table>
            <TableHeader className="bg-white border-b border-gray-100">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider w-[140px]">S/N</TableHead>
                <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider">NAME</TableHead>
                {type !== 'states' && <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider">PARENT REGION</TableHead>}
                <TableHead className={`text-[0.65rem] font-bold text-gray-500 tracking-wider ${type === 'senatorial' || type === 'federal' || type === 'states' || type === 'state-house' || type === 'lgas' || type === 'wards' ? 'text-center' : 'text-right pr-2'}`}>{type === 'states' || type === 'wards' || type === 'senatorial' || type === 'federal' || type === 'state-house' || type === 'lgas' ? 'ACTION' : 'TYPE'}</TableHead>
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
                visibleDistricts.map((district) => (
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
                    <TableCell className={type === 'senatorial' || type === 'federal' || type === 'states' || type === 'state-house' || type === 'lgas' || type === 'wards' ? 'text-center' : 'text-right pr-6'}>
                      <div className="flex justify-center gap-2">
                        {renderDistrictActions(district)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </div>

        {/* Pagination Footer */}
        {!loading && (
          <PaginationControls
            currentPage={paginationPage}
            totalPages={paginationTotalPages}
            totalItems={paginationTotalItems}
            itemsPerPage={type === 'state-house' ? stateHousePerPage : paginationItemsPerPage}
            onPageChange={handlePaginationPageChange}
            onItemsPerPageChange={handlePaginationItemsPerPageChange}
          />
        )}
      </div>
    </div>
  )
}
