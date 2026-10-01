import { useEffect, useState } from 'react'
import { Party } from '@/services/parties'

export default function PublicPartiesPage() {
  const [parties, setParties] = useState<Party[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchParties = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'
        const response = await fetch(`${API_BASE_URL}/parties`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        })
        
        if (!response.ok) {
          throw new Error('Failed to fetch parties')
        }
        const responseData = await response.json()
        
        if (responseData.success && responseData.data) {
          setParties(responseData.data)
        } else {
          throw new Error('Invalid data format')
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load parties')
      } finally {
        setLoading(false)
      }
    }
    
    fetchParties()
  }, [])

  const filteredParties = parties.filter(party => {
    const term = searchTerm.toLowerCase()
    return (
      (party.name && party.name.toLowerCase().includes(term)) ||
      (party.description && party.description.toLowerCase().includes(term)) ||
      (party.slogan && party.slogan.toLowerCase().includes(term))
    )
  })

  // Helper to get full image URL
  const getImageUrl = (path: string | null) => {
    if (!path) return null
    if (path.startsWith('http')) return path
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api\/v1\/?$/, '')
    return `${baseUrl}/${path}`
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Political Parties</h1>
          <p className="text-lg text-muted-foreground">Explore registered political parties, their manifestos, and leaders.</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
            placeholder="Search parties..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {filteredParties.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground bg-muted/30 rounded-xl border border-dashed border-gray-200">
          No political parties found.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredParties.map((party) => (
            <div key={party.id} className="border border-gray-100 bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all flex flex-col h-full group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/50 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
              
              <div className="flex flex-col items-center text-center mb-4">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3 text-xl font-bold text-primary shadow-inner border border-gray-100 overflow-hidden">
                  {party.logopath ? (
                     <img src={getImageUrl(party.logopath)!} alt={`${party.name} logo`} className="w-full h-full object-cover" />
                  ) : (
                     party.name
                  )}
                </div>
                <h2 className="text-sm font-bold text-gray-900 leading-tight line-clamp-2" title={party.description || party.name}>{party.description || party.name}</h2>
                <p className="text-xs font-semibold text-primary mt-1">{party.name}</p>
              </div>

              <div className="flex-grow flex flex-col gap-2">
                {party.slogan && (
                  <div className="bg-gray-50 p-2 rounded-md text-xs text-gray-600 italic border border-gray-100 line-clamp-2" title={party.slogan}>
                    "{party.slogan}"
                  </div>
                )}
                
                {party.philosophy && (
                  <div className="text-xs text-gray-600 line-clamp-3" title={party.philosophy}>
                    <strong className="text-gray-900 block mb-0.5">Philosophy:</strong>
                    {party.philosophy.replace('\n', ', ')}
                  </div>
                )}
                
                {party.registrationYear && (
                  <div className="text-xs text-gray-600 mt-auto pt-2">
                    <strong className="text-gray-900">Est:</strong> {party.registrationYear}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
