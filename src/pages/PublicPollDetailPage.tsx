import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { pollService, Poll, PollCandidate, PollResult } from '@/services/polls'
import { ChevronLeft, BarChart2, CheckCircle2 } from 'lucide-react'
import fpPromise from '@fingerprintjs/fingerprintjs'

export default function PublicPollDetailPage() {
  const { id } = useParams<{ id: string }>()
  const pollId = parseInt(id || '0', 10)
  
  const [poll, setPoll] = useState<Poll | null>(null)
  const [candidates, setCandidates] = useState<PollCandidate[]>([])
  const [results, setResults] = useState<PollResult[]>([])
  const [totalVotes, setTotalVotes] = useState(0)
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null)
  const [isVoting, setIsVoting] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)
  
  // Fingerprint logic
  const getVisitorId = async () => {
    const fp = await fpPromise.load()
    const result = await fp.get()
    return result.visitorId
  }

  useEffect(() => {
    if (!pollId) return

    const fetchPollData = async () => {
      try {
        // We can check if they voted via local storage as a fast fallback, 
        // but backend device_id/voter_key check is the ultimate source of truth.
        if (localStorage.getItem(`voted_poll_${pollId}`)) {
          setHasVoted(true)
        }

        const pollData = await pollService.getPoll(pollId)
        setPoll(pollData)
        
        if (pollData.status === 'active') {
          const cands = await pollService.getPollCandidates(pollId)
          setCandidates(cands)
          
          if (localStorage.getItem(`voted_poll_${pollId}`)) {
            try {
              const res = await pollService.getPollResults(pollId)
              setResults(res.results || [])
              setTotalVotes(res.total_votes || 0)
            } catch (e) {}
          }
        } else {
          // If closed, fetch results
          const res = await pollService.getPollResults(pollId)
          setResults(res.results || [])
          setTotalVotes(res.total_votes || 0)
          setHasVoted(true) // force result view
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load poll details')
      } finally {
        setLoading(false)
      }
    }
    fetchPollData()
  }, [pollId])

  const handleVote = async () => {
    if (!selectedCandidate) return
    setIsVoting(true)
    setError('')
    
    try {
      const visitorId = await getVisitorId()
      
      await pollService.vote(pollId, {
        poll_candidate_id: selectedCandidate,
        voter_key: visitorId,
        // Assuming backend might accept device_id too as per validation rules
        device_id: visitorId
      })
      
      localStorage.setItem(`voted_poll_${pollId}`, 'true')
      setHasVoted(true)
      
      // Fetch results immediately
      const res = await pollService.getPollResults(pollId)
      setResults(res.results || [])
      setTotalVotes(res.total_votes || 0)
      
    } catch (err: any) { if (err.message && (err.message.toLowerCase().includes('already been recorded') || err.message.toLowerCase().includes('24 hours'))) { setHasVoted(true); fetchResultsManual(); } setError(err.message || 'Failed to submit vote.'); } finally {
      setIsVoting(false)
    }
  }

  const fetchResultsManual = async () => {
    setLoading(true)
    try {
      const res = await pollService.getPollResults(pollId)
      setResults(res.results || [])
      setTotalVotes(res.total_votes || 0)
      setHasVoted(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!poll) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Poll Not Found</h2>
        <Link to="/polls" className="text-primary hover:underline">Return to Polls</Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link to="/polls" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ChevronLeft className="w-5 h-5 mr-1" /> Back to Polls
      </Link>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-10">
        <div className="flex items-center justify-between mb-4">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            poll.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {poll.status === 'active' ? (
              <span className="w-2 h-2 mr-2 bg-green-500 rounded-full animate-pulse"></span>
            ) : null}
            {poll.status.toUpperCase()}
          </span>
          {poll.ends_at && (
            <span className="text-sm text-gray-500">Ends: {new Date(poll.ends_at).toLocaleDateString()}</span>
          )}
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">{poll.title || poll.question}</h1>
        {poll.description && (
          <p className="text-lg text-gray-600 mb-8">{poll.description}</p>
        )}
        
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-8 font-medium">
            {error}
          </div>
        )}

        {!hasVoted && poll.status === 'active' ? (
          <div>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 border-b pb-4">
              Select your choice:
            </h3>
            
            {candidates.length === 0 ? (
              <div className="text-gray-500 italic py-4">No candidates configured for this poll.</div>
            ) : (
              <div className="space-y-4 mb-8">
                {candidates.map((c) => {
                  const name = c.candidate?.name || `Candidate #${c.id}`
                  const party = c.party?.acronym || c.party?.name
                  return (
                    <label 
                      key={c.id} 
                      className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        selectedCandidate === c.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="poll_candidate" 
                        value={c.id}
                        checked={selectedCandidate === c.id}
                        onChange={() => setSelectedCandidate(c.id)}
                        className="w-5 h-5 text-primary focus:ring-primary border-gray-300"
                      />
                      <span className="ml-4 text-lg font-medium text-gray-900">{name}</span>
                      {party && (
                        <span className="ml-3 text-xs font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-md uppercase tracking-wider">
                          {party}
                        </span>
                      )}
                    </label>
                  )
                })}
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button 
                onClick={handleVote}
                disabled={!selectedCandidate || isVoting}
                className="w-full sm:w-auto px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                {isVoting ? 'Submitting...' : 'Submit Vote'}
              </button>
              
              <button 
                onClick={fetchResultsManual}
                className="w-full sm:w-auto px-6 py-3 text-gray-500 hover:bg-gray-100 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <BarChart2 className="w-5 h-5" /> View Results
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 p-6 md:p-8 rounded-2xl border border-gray-100">
            <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <BarChart2 className="w-6 h-6 text-primary" />
              Poll Results
            </h3>
            <p className="text-gray-500 mb-8">Total Votes: <span className="font-bold text-gray-900">{totalVotes}</span></p>
            
            {results.length === 0 ? (
              <div className="text-gray-500 italic">No results available yet.</div>
            ) : (
              <div className="space-y-6">
                {results.map((r, idx) => (
                  <div key={idx} className="relative">
                    <div className="flex justify-between items-end mb-2 relative z-10">
                      <div>
                        <span className="font-bold text-gray-900">{r.candidate?.name || `Candidate #${r.poll_candidate_id}`}</span>
                        {r.party && (
                          <span className="ml-2 text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded uppercase tracking-wider">
                            {r.party.acronym || r.party.name}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-600">
                        {r.votes} votes ({r.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-primary h-3 rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${r.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {poll.status === 'active' && hasVoted && (
              <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2 text-green-700 font-medium">
                  <CheckCircle2 className="w-5 h-5" />
                  Your vote has been recorded.
                </div>
                <button
                  onClick={() => setHasVoted(false)}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-semibold transition-colors"
                >
                  Change my vote
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

