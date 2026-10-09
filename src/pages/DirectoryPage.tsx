import React, { useState, useEffect } from 'react'
import { Search, User, Building, Flag, Landmark, ArrowRight, Loader2, MapPin, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { directoryService } from '@/services/directory'
import { Helmet } from 'react-helmet-async'

export default function DirectoryPage() {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [suggestions, setSuggestions] = useState<any[]>([])
  
  const fetchSuggestions = async (q: string) => {
    try {
      const data = await directoryService.getSuggestions(q)
      setSuggestions(data || [])
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchSuggestions(query)
    }, 300)
    return () => clearTimeout(delayDebounceFn)
  }, [query])

  const handleSearch = async (e?: React.FormEvent, directQuery?: string) => {
    if (e) e.preventDefault()
    
    const searchQuery = directQuery ?? query
    if (!searchQuery.trim() && !hasSearched) return
    
    setIsSearching(true)
    setHasSearched(true)
    try {
      const data = await directoryService.search(searchQuery)
      setResults(data)
    } catch (e) {
      console.error(e)
    } finally {
      setIsSearching(false)
    }
  }

  const handleClear = () => {
    setQuery('')
    setHasSearched(false)
    setResults(null)
  }

  const handlePillClick = (suggestion: any) => {
    if (suggestion.query !== undefined) {
      setQuery(suggestion.query)
      handleSearch(undefined, suggestion.query)
    }
  }

  const getIcon = (type: string) => {
    switch(type) {
      case 'candidate': return <User className="w-5 h-5" />
      case 'party': return <Flag className="w-5 h-5" />
      case 'election': return <Landmark className="w-5 h-5" />
      case 'office': return <Building className="w-5 h-5" />
      default: return <Search className="w-5 h-5" />
    }
  }

  const getLink = (item: any) => {
    switch(item.type) {
      case 'candidate': return `/profile/${item.id}`
      case 'party': return `/party/${item.id}`
      case 'election': return `/election/${item.id}`
      default: return '#'
    }
  }

  const groupedCandidates = React.useMemo(() => {
    if (!results?.candidates) return {}
    return results.candidates.reduce((acc: any, c: any) => {
      const office = c.details?.offices?.[0]
      let officeName = office?.office?.title
      
      // Handle the case where office name might not exist but they are a candidate
      if (!officeName) {
        if (c.subtitle && c.subtitle.includes('-')) {
          officeName = c.subtitle.split('-')[1]?.trim() || 'Other Candidates'
        } else {
          officeName = 'Other Candidates'
        }
      }

      let area = ''
      if (office?.state) area = office.state.name + ' State'
      else if (office?.senetorialDistrict) area = office.senetorialDistrict.name
      else if (office?.federalHouseDistrict) area = office.federalHouseDistrict.name
      else if (office?.stateHouseDistrict) area = office.stateHouseDistrict.name
      else if (office?.lgaDistrict) area = office.lgaDistrict.name
      else if (office?.ward) area = office.ward.name
      else if (c.details?.lga_district?.state && !officeName.toLowerCase().includes('president')) {
        area = c.details.lga_district.state.name + ' State'
      }
      
      const groupKey = area && !officeName.toLowerCase().includes('president') ? `${officeName} (${area})` : officeName
      if (!acc[groupKey]) acc[groupKey] = []
      acc[groupKey].push(c)
      return acc
    }, {})
  }, [results])

  return (
    <div className={`min-h-[80vh] flex flex-col items-center transition-all duration-500 ${hasSearched ? 'pt-8' : 'pt-[20vh]'}`}>
      <Helmet>
        <title>Directory - KYL</title>
      </Helmet>

      {/* Header */}
      <div className={`text-center transition-all duration-500 ${hasSearched ? 'mb-4' : 'mb-8'}`}>
        <h1 className={`${hasSearched ? 'text-3xl md:text-4xl' : 'text-4xl md:text-5xl'} font-bold text-gray-900 mb-2 transition-all`}>KYL Directory</h1>
        <p className={`${hasSearched ? 'text-base' : 'text-lg'} text-gray-500 transition-all`}>Search for candidates, parties, elections, and offices.</p>
      </div>

      {/* Search Bar */}
      <div className={`w-full max-w-3xl px-4 ${hasSearched ? 'mb-8' : 'mb-6'}`}>
        <form onSubmit={handleSearch} className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-6 w-6 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-12 pr-40 py-4 md:py-5 border border-gray-300 rounded-full shadow-sm text-lg focus:ring-primary focus:border-primary transition-shadow"
            placeholder="Search candidates, parties, offices..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute inset-y-0 right-32 flex items-center pr-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Clear search"
            >
              <X className="h-6 w-6" />
            </button>
          )}
          <button
            type="submit"
            className="absolute inset-y-2 right-2 px-6 bg-primary text-white font-medium rounded-full hover:bg-primary/90 transition-colors flex items-center gap-2"
            disabled={isSearching}
          >
            {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
          </button>
        </form>
      </div>

      {/* Pills */}
      {/* Pills Always Shown */}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 max-w-4xl px-4 mb-8">
          {suggestions.map((s, i) => (
            s.type === 'label' ? (
              <span key={i} className="px-4 py-2 text-gray-700 font-bold text-sm flex items-center">
                {s.title}
              </span>
            ) : (
              <button
                key={i}
                onClick={() => handlePillClick(s)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Search className="w-4 h-4 text-gray-400" />
                {s.title}
              </button>
            )
          ))}
        </div>
      )}

      {/* Results */}
      {hasSearched && (
        <div className="w-full max-w-6xl px-4 pb-16">
          {isSearching ? (
             <div className="flex justify-center py-20">
               <Loader2 className="w-10 h-10 animate-spin text-primary" />
             </div>
          ) : results && (results.candidates?.length > 0 || results.states?.length > 0 || results.districts?.length > 0 || results.parties?.length > 0 || results.elections?.length > 0) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              
              {/* Candidates Column */}
              {results.candidates?.length > 0 && (
                <div className="col-span-1 md:col-span-2 lg:col-span-2">
                  <div className="space-y-8">
                    {Object.entries(groupedCandidates).map(([groupName, candidates]: any) => (
                      <div key={groupName}>
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
                          <User className="w-6 h-6 text-primary" /> {groupName}
                        </h2>
                        <div className="space-y-4">
                          {candidates.map((c: any) => (
                            <Link to={getLink(c)} key={`c-${c.id}`} className="block p-4 border rounded-xl hover:shadow-md transition-shadow bg-white flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                                 {c.image ? <img src={c.image} alt={c.title} className="w-full h-full object-cover" /> : <User className="w-6 h-6 text-gray-400" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-900 truncate">{c.title}</h3>
                                <p className="text-sm text-gray-500 truncate">{c.subtitle}</p>
                              </div>
                              <ArrowRight className="w-5 h-5 text-gray-300" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Other entities column */}
              <div className="col-span-1 md:col-span-2 lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 items-start content-start">
                  {results.states?.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800 border-b pb-2"><MapPin className="w-5 h-5 text-red-500" /> States</h2>
                      <div className="space-y-3">
                        {results.states.map((s: any) => (
                           <button 
                             key={`s-${s.id}`} 
                             onClick={() => { setQuery(s.details.name); handleSearch(undefined, s.details.name); }} 
                             className="w-full text-left group block p-4 border border-gray-200 rounded-xl hover:border-red-400 hover:shadow-md transition-all bg-white cursor-pointer flex items-center justify-between"
                           >
                             <div className="flex-1 min-w-0 pr-4">
                               <h3 className="font-bold text-gray-900 text-sm truncate">{s.title}</h3>
                               <p className="text-xs text-gray-500 truncate mt-1">Explore candidates in this state</p>
                             </div>
                             <div className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-red-50 flex items-center justify-center transition-colors shrink-0">
                               <Search className="w-4 h-4 text-gray-400 group-hover:text-red-500" />
                             </div>
                           </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {results.districts?.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800 border-b pb-2"><MapPin className="w-5 h-5 text-orange-500" /> Districts</h2>
                      <div className="space-y-3">
                        {results.districts.map((d: any) => (
                           <button 
                             key={`d-${d.type}-${d.id}`} 
                             onClick={() => { setQuery(d.search_query); handleSearch(undefined, d.search_query); }} 
                             className="w-full text-left group block p-4 border border-gray-200 rounded-xl hover:border-orange-400 hover:shadow-md transition-all bg-white cursor-pointer flex items-center justify-between"
                           >
                             <div className="flex-1 min-w-0 pr-4">
                               <h3 className="font-bold text-gray-900 text-sm truncate">{d.title}</h3>
                               <p className="text-xs text-gray-500 truncate mt-1">{d.subtitle}</p>
                             </div>
                             <div className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-orange-50 flex items-center justify-center transition-colors shrink-0">
                               <Search className="w-4 h-4 text-gray-400 group-hover:text-orange-500" />
                             </div>
                           </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {results.parties?.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800 border-b pb-2"><Flag className="w-5 h-5 text-green-600" /> Parties</h2>
                      <div className="space-y-3">
                        {results.parties.map((p: any) => (
                           <Link to={getLink(p)} key={`p-${p.id}`} className="block p-4 border border-gray-200 rounded-xl hover:border-green-500 hover:shadow-md transition-all bg-white flex items-center gap-3">
                             <div className="w-10 h-10 rounded-md bg-gray-50 border flex items-center justify-center overflow-hidden shrink-0">
                                {p.image ? <img src={p.image} alt={p.title} className="w-full h-full object-contain p-1" /> : <Flag className="w-5 h-5 text-gray-400" />}
                             </div>
                             <div className="flex-1 min-w-0">
                               <h3 className="font-bold text-gray-900 text-sm truncate">{p.title}</h3>
                               {p.subtitle && <p className="text-xs text-gray-500 truncate mt-1">{p.subtitle}</p>}
                             </div>
                           </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {results.elections?.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800 border-b pb-2"><Landmark className="w-5 h-5 text-blue-600" /> Elections</h2>
                      <div className="space-y-3">
                        {results.elections.map((e: any) => (
                           <Link to={getLink(e)} key={`e-${e.id}`} className="block p-4 border border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md transition-all bg-white flex items-start gap-3">
                             <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-center shrink-0 border border-blue-100">
                               <span className="block text-[10px] font-bold uppercase tracking-wider opacity-80">Year</span>
                               <span className="block text-lg font-black">{e.details?.year || e.title.replace('Election ', '')}</span>
                             </div>
                             <div className="flex-1 min-w-0 pt-1">
                               <h3 className="font-bold text-gray-900 text-sm leading-tight">{e.title}</h3>
                               <p className="text-xs text-gray-500 mt-1 capitalize line-clamp-2">{e.subtitle}</p>
                             </div>
                           </Link>
                        ))}
                      </div>
                    </div>
                  )}
              </div>

            </div>
          ) : (
            <div className="text-center py-20 flex flex-col items-center justify-center bg-gray-50 rounded-2xl border border-gray-100">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No info yet</h3>
              <p className="text-gray-500 max-w-md">We couldn't find any candidates or districts matching "{query}". Try using the suggestion pills above or search for a different keyword.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
