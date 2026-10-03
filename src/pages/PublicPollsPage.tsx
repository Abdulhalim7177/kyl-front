import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { pollService, Poll } from '@/services/polls'

export default function PublicPollsPage() {
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const data = await pollService.getPolls()
        setPolls(data)
      } catch (err: any) {
        setError(err.message || 'Failed to load polls')
      } finally {
        setLoading(false)
      }
    }
    fetchPolls()
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-4xl font-bold mb-4">Public Polls</h1>
      <p className="text-lg text-muted-foreground mb-12">View and participate in ongoing public opinion polls.</p>
      
      {polls.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground bg-muted/30 rounded-xl border border-dashed border-gray-200">
          No active polls found at the moment.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {polls.map((poll) => (
            <div key={poll.id} className="border border-gray-100 bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col h-full relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/50 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
              
              <div className="flex justify-between items-start mb-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  poll.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {poll.status === 'active' ? (
                    <span className="w-2 h-2 mr-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  ) : null}
                  {poll.status.toUpperCase()}
                </span>
              </div>
              
              <h2 className="text-xl font-bold text-gray-900 mb-2 leading-tight">
                {poll.title || poll.question}
              </h2>
              
              <p className="text-sm text-gray-500 mb-4 flex-grow line-clamp-3">
                {poll.description || 'No additional details provided for this poll.'}
              </p>

              {poll.candidates && poll.candidates.length > 0 && (
                <div className="mb-6 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Candidates preview:</span>
                  <div className="flex flex-wrap gap-2">
                    {poll.candidates.slice(0, 3).map(c => (
                      <span key={c.id} className="inline-flex items-center px-2 py-1 bg-white border border-gray-200 text-xs font-medium text-gray-700 rounded shadow-sm">
                        {c.candidateOffice?.candidate?.fullName || `Candidate #${c.id}`}
                      </span>
                    ))}
                    {poll.candidates.length > 3 && (
                      <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-xs font-medium text-gray-500 rounded">
                        +{poll.candidates.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              <div className="mt-auto pt-2">
                <Link 
                  to={`/poll/${poll.id}`}
                  className={`inline-flex items-center justify-center w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    poll.status === 'active' 
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
                    : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {poll.status === 'active' ? 'Participate / View Options' : 'View Results'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
