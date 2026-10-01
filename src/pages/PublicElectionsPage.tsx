import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { electionService, Election } from '@/services/elections'

export default function PublicElectionsPage() {
  const [elections, setElections] = useState<Election[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchElections = async () => {
      try {
        const data = await electionService.getAllElections()
        setElections(data)
      } catch (err: any) {
        setError(err.message || 'Failed to load elections')
      } finally {
        setLoading(false)
      }
    }
    fetchElections()
  }, [])

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

  const activeElections = elections.filter(e => e.status === 'Ongoing')
  const otherElections = elections.filter(e => e.status !== 'Ongoing')

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">Elections</h1>
      <p className="text-lg text-muted-foreground mb-12">Discover ongoing elections, candidates, and timetables.</p>
      
      {elections.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground bg-muted/30 rounded-xl border border-dashed border-gray-200">
          No elections found.
        </div>
      ) : (
        <div className="space-y-12">
          {/* Active Elections */}
          {activeElections.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
                Active Elections
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeElections.map((election) => (
                  <div key={election.id} className="border border-green-200 bg-green-50/30 rounded-xl p-6 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
                    <div className="mb-4">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        Ongoing
                      </span>
                    </div>
                    
                    <h3 className="text-2xl font-bold mb-3 text-gray-900">
                      {election.year} General Elections
                    </h3>
                    <p className="text-gray-600 mb-6 flex-grow leading-relaxed">
                      {election.details || 'No details provided.'}
                    </p>
                    
                    <div className="mt-auto">
                      <Link 
                        to={`/election/${election.id}`}
                        className="inline-flex items-center justify-center w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-sm"
                      >
                        View Timetable & Candidates
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Other Elections */}
          {otherElections.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Past & Upcoming Elections</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {otherElections.map((election) => (
                  <div key={election.id} className="border border-gray-100 bg-white rounded-xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col h-full hover:shadow-md transition-shadow">
                    <div className="mb-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        election.status === 'Upcoming' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                        'bg-gray-100 text-gray-700 border border-gray-200'
                      }`}>
                        {election.status || 'Unknown'}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold mb-2 text-gray-800">
                      {election.year} General Elections
                    </h3>
                    <p className="text-sm text-gray-500 mb-6 flex-grow">
                      {election.details || 'No details provided.'}
                    </p>
                    
                    <div className="mt-auto">
                      <Link 
                        to={`/election/${election.id}`}
                        className="inline-flex items-center justify-center w-full px-4 py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
