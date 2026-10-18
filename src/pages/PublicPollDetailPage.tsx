import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  ArrowLeft,
  ArrowRight,
  BarChart2,
  CheckCircle2,
  Clock,
  ListChecks,
  ShieldCheck,
  Trophy,
  Users,
  Vote,
} from 'lucide-react'
import fpPromise from '@fingerprintjs/fingerprintjs'
import { pollService, type Poll, type PollCandidate, type PollResult } from '@/services/polls'

const formatDate = (value?: string | null) => {
  if (!value) return null
  const parsed = new Date(value.length <= 10 ? `${value}T00:00:00` : value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatPercent = (value: number) => {
  const numeric = Number.isFinite(value) ? value : 0
  return `${numeric.toFixed(Number.isInteger(numeric) ? 0 : 1)}%`
}

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.replace(/[^a-zA-Z]/g, '').charAt(0).toUpperCase())
    .join('') || 'KY'

const getPartyLabel = (party?: { acronym?: string | null; name?: string | null } | null) =>
  party?.acronym || party?.name || 'Independent'

const sortResults = (items: PollResult[]) =>
  [...items].sort(
    (a, b) => Number(b.percentage) - Number(a.percentage) || Number(b.votes) - Number(a.votes),
  )

const getVisitorId = async () => {
  const fp = await fpPromise.load()
  const result = await fp.get()
  return result.visitorId
}

export default function PublicPollDetailPage() {
  const { id } = useParams<{ id: string }>()
  const pollId = Number.parseInt(id || '0', 10)

  const [poll, setPoll] = useState<Poll | null>(null)
  const [candidates, setCandidates] = useState<PollCandidate[]>([])
  const [results, setResults] = useState<PollResult[]>([])
  const [totalVotes, setTotalVotes] = useState(0)
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [isVoting, setIsVoting] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!pollId) {
      setLoading(false)
      setError('This poll could not be found.')
      return
    }

    let cancelled = false

    const fetchPollData = async () => {
      const votedBefore = Boolean(localStorage.getItem(`voted_poll_${pollId}`))
      if (votedBefore) setHasVoted(true)

      try {
        const pollData = await pollService.getPoll(pollId)
        if (cancelled) return
        setPoll(pollData)

        if (String(pollData.status).toLowerCase() === 'active') {
          const pollCandidates = await pollService.getPollCandidates(pollId)
          if (cancelled) return
          setCandidates(pollCandidates)

          if (votedBefore) {
            const resultData = await pollService.getPollResults(pollId)
            if (cancelled) return
            setResults(resultData.results)
            setTotalVotes(resultData.total_votes)
            setShowResults(true)
          }
        } else {
          const resultData = await pollService.getPollResults(pollId)
          if (cancelled) return
          setResults(resultData.results)
          setTotalVotes(resultData.total_votes)
          setShowResults(true)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load poll details')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void fetchPollData()

    return () => {
      cancelled = true
    }
  }, [pollId])

  const isActive = String(poll?.status).toLowerCase() === 'active'
  const optionCount = candidates.length || results.length || poll?.candidates?.length || 0
  const closesOn = formatDate(poll?.ends_at)
  const sortedResults = useMemo(() => sortResults(results), [results])
  const leaderId = totalVotes > 0 ? sortedResults[0]?.poll_candidate_id : undefined
  const selected = candidates.find((candidate) => candidate.id === selectedCandidate)

  const refreshResults = async () => {
    const resultData = await pollService.getPollResults(pollId)
    setResults(resultData.results)
    setTotalVotes(resultData.total_votes)
  }

  const handleVote = async () => {
    if (!selectedCandidate || isVoting) return

    setIsVoting(true)
    setError('')

    try {
      const visitorId = await getVisitorId()
      await pollService.vote(pollId, {
        poll_candidate_id: selectedCandidate,
        voter_key: visitorId,
        device_id: visitorId,
      })

      localStorage.setItem(`voted_poll_${pollId}`, 'true')
      setHasVoted(true)
      await refreshResults()
      setShowResults(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit vote.'
      const alreadyRecorded =
        message.toLowerCase().includes('already been recorded') ||
        message.toLowerCase().includes('24 hours')

      if (alreadyRecorded) {
        localStorage.setItem(`voted_poll_${pollId}`, 'true')
        setHasVoted(true)
        try {
          await refreshResults()
          setShowResults(true)
        } catch {
          setError(message)
        }
      } else {
        setError(message)
      }
    } finally {
      setIsVoting(false)
    }
  }

  const handleViewResults = async () => {
    setError('')
    try {
      await refreshResults()
      setShowResults(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load poll results')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#f7f8f5]">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-gray-200 border-t-[#146c4f]" />
      </div>
    )
  }

  if (!poll) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-[#f7f8f5] px-4 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          <Vote className="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900">Poll not found</h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-500">
          {error || 'This poll may have been removed or the link is incomplete.'}
        </p>
        <Link
          to="/polls"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#146c4f] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#10563f]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to all polls
        </Link>
      </div>
    )
  }

  const title = poll.title || poll.question

  return (
    <div className="bg-[#f7f8f5]">
      <Helmet>
        <title>{title} | Know Your Leaders</title>
        <meta name="description" content={`Participate in the poll: ${title}`} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={`Participate in the poll: ${title}`} />
      </Helmet>

      <section className="relative overflow-hidden bg-[#072b20] text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)',
            backgroundSize: '52px 52px',
          }}
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute -left-24 top-0 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-teal-300/10 blur-3xl" aria-hidden="true" />

        <div className="container relative mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <Link
            to="/polls"
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-100/70 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All public polls
          </Link>

          <div className="mt-8 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${
                isActive
                  ? 'border-emerald-300/30 bg-emerald-400/15 text-emerald-100'
                  : 'border-white/15 bg-white/10 text-white'
              }`}
            >
              {isActive ? (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
                </span>
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {isActive ? 'Voting open' : 'Poll closed'}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold text-emerald-50">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" /> Non-partisan
              public poll
            </span>
          </div>

          <h1 className="mt-5 max-w-4xl text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          {poll.description ? (
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-emerald-50/75 sm:text-lg">
              {poll.description}
            </p>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3 text-sm font-semibold text-emerald-50/80">
            <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.07] px-4 py-2.5">
              <ListChecks className="h-4 w-4 text-emerald-300" aria-hidden="true" />
              {optionCount} option{optionCount === 1 ? '' : 's'}
            </span>
            {closesOn ? (
              <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.07] px-4 py-2.5">
                <Clock className="h-4 w-4 text-emerald-300" aria-hidden="true" />
                {isActive ? 'Closes' : 'Closed'} {closesOn}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.07] px-4 py-2.5">
              <Users className="h-4 w-4 text-emerald-300" aria-hidden="true" />
              {totalVotes.toLocaleString()} vote{totalVotes === 1 ? '' : 's'} counted
            </span>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-6xl px-4 py-10 sm:py-14">
        {error ? (
          <div
            role="alert"
            className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-medium text-red-700"
          >
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <div className="space-y-6">
            {!showResults ? (
              <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_4px_24px_rgb(0,0,0,0.04)] sm:p-8">
                <div className="flex flex-col gap-2 border-b border-gray-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#146c4f]">
                      Cast your ballot
                    </p>
                    <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-gray-900">
                      Select one option
                    </h2>
                  </div>
                  <p className="text-sm text-gray-500">One response per visitor.</p>
                </div>

                {candidates.length === 0 ? (
                  <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
                    No candidates have been configured for this poll.
                  </div>
                ) : (
                  <div className="mt-6 space-y-3" role="radiogroup" aria-label="Poll options">
                    {candidates.map((candidate) => {
                      const name = candidate.candidate?.name || `Candidate #${candidate.id}`
                      const active = selectedCandidate === candidate.id

                      return (
                        <label
                          key={candidate.id}
                          className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition-all focus-within:ring-2 focus-within:ring-[#146c4f] focus-within:ring-offset-2 ${
                            active
                              ? 'border-[#146c4f] bg-emerald-50/60 shadow-sm'
                              : 'border-gray-100 bg-white hover:border-[#146c4f]/30 hover:bg-gray-50/70'
                          }`}
                        >
                          <input
                            type="radio"
                            name="poll_candidate"
                            value={candidate.id}
                            checked={active}
                            onChange={() => setSelectedCandidate(candidate.id)}
                            className="sr-only"
                          />
                          <span
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${
                              active ? 'bg-[#146c4f] text-white' : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {getInitials(name)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-bold text-gray-900">{name}</span>
                            <span className="mt-0.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">
                              {getPartyLabel(candidate.party)}
                            </span>
                          </span>
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
                              active ? 'border-[#146c4f] bg-[#146c4f]' : 'border-gray-200 bg-white'
                            }`}
                            aria-hidden="true"
                          >
                            {active ? <CheckCircle2 className="h-4 w-4 text-white" /> : null}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                )}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleVote}
                    disabled={!selectedCandidate || isVoting}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#146c4f] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#10563f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146c4f] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isVoting ? 'Submitting vote…' : 'Submit my vote'}
                    {!isVoting ? <ArrowRight className="h-4 w-4" aria-hidden="true" /> : null}
                  </button>
                  <button
                    type="button"
                    onClick={handleViewResults}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-5 py-3.5 text-sm font-semibold text-gray-600 transition hover:border-[#146c4f]/30 hover:text-[#146c4f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146c4f] focus-visible:ring-offset-2"
                  >
                    <BarChart2 className="h-4 w-4" aria-hidden="true" /> View results
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_4px_24px_rgb(0,0,0,0.04)] sm:p-8">
                <div className="flex flex-col gap-3 border-b border-gray-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#146c4f]">
                      {isActive ? 'Live results' : 'Final results'}
                    </p>
                    <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-gray-900">
                      How the country responded
                    </h2>
                  </div>
                  <p className="text-sm text-gray-500">
                    <span className="font-bold text-gray-900">{totalVotes.toLocaleString()}</span>{' '}
                    vote{totalVotes === 1 ? '' : 's'} counted
                  </p>
                </div>

                {sortedResults.length === 0 ? (
                  <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
                    No results are available for this poll yet.
                  </div>
                ) : (
                  <div className="mt-6 space-y-6">
                    {sortedResults.map((result, index) => {
                      const percentage = Math.min(100, Math.max(0, Number(result.percentage) || 0))
                      const name = result.candidate?.name || `Candidate #${result.poll_candidate_id}`
                      const leading = result.poll_candidate_id === leaderId

                      return (
                        <div key={result.poll_candidate_id}>
                          <div className="flex items-end justify-between gap-4">
                            <div className="flex min-w-0 items-center gap-3">
                              <span
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${
                                  leading ? 'bg-[#146c4f] text-white' : 'bg-gray-100 text-gray-500'
                                }`}
                              >
                                {leading ? <Trophy className="h-4 w-4" aria-hidden="true" /> : index + 1}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate font-bold text-gray-900">{name}</p>
                                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                                  {getPartyLabel(result.party)}
                                </p>
                              </div>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-lg font-extrabold text-gray-900">
                                {formatPercent(percentage)}
                              </p>
                              <p className="text-[11px] text-gray-400">
                                {Number(result.votes).toLocaleString()} vote
                                {Number(result.votes) === 1 ? '' : 's'}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${
                                leading
                                  ? 'bg-gradient-to-r from-[#146c4f] to-emerald-400'
                                  : 'bg-[#146c4f]/45'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {totalVotes === 0 ? (
                  <p className="mt-6 rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-500">
                    No votes have been cast yet. Be the first to weigh in.
                  </p>
                ) : null}
              </div>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24">
            {showResults ? (
              <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#072b20] via-[#0b3d2c] to-[#146c4f] p-6 text-white shadow-xl">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-100/60">
                  Total votes
                </p>
                <p className="mt-2 text-4xl font-extrabold tracking-tight">
                  {totalVotes.toLocaleString()}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-emerald-50/70">
                  {isActive
                    ? 'Voting is still open. Results update as new responses arrive.'
                    : 'Voting has closed. These are the final recorded results.'}
                </p>

                {!isActive ? (
                  <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2.5 text-sm font-semibold text-emerald-50/80">
                    This poll is closed to new responses.
                  </div>
                ) : hasVoted ? (
                  <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-3 py-2.5 text-sm font-semibold text-emerald-100">
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" aria-hidden="true" />
                    Your vote has been recorded
                  </div>
                ) : (
                  <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2.5 text-sm font-semibold text-emerald-50/80">
                    You have not voted in this poll yet.
                  </div>
                )}
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#072b20] via-[#0b3d2c] to-[#146c4f] p-6 text-white shadow-xl">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-100/60">
                  Your ballot
                </p>
                {selected ? (
                  <div className="mt-4">
                    <p className="text-lg font-bold leading-snug">
                      {selected.candidate?.name || `Candidate #${selected.id}`}
                    </p>
                    <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-100/60">
                      {getPartyLabel(selected.party)}
                    </p>
                  </div>
                ) : (
                  <p className="mt-3 text-sm leading-relaxed text-emerald-50/70">
                    Select an option to preview your choice before submitting.
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleVote}
                  disabled={!selectedCandidate || isVoting}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-300 px-4 py-3 text-sm font-bold text-emerald-950 transition hover:bg-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#072b20] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isVoting ? 'Submitting…' : 'Submit my vote'}
                  {!isVoting ? <ArrowRight className="h-4 w-4" aria-hidden="true" /> : null}
                </button>
              </div>
            )}

            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
              <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-gray-400">
                Poll details
              </h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-gray-500">Status</dt>
                  <dd className="font-semibold text-gray-900">{isActive ? 'Open' : 'Closed'}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-gray-500">Options</dt>
                  <dd className="font-semibold text-gray-900">{optionCount}</dd>
                </div>
                {closesOn ? (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-gray-500">{isActive ? 'Closes' : 'Closed'}</dt>
                    <dd className="font-semibold text-gray-900">{closesOn}</dd>
                  </div>
                ) : null}
              </dl>

              {showResults && isActive ? (
                <button
                  type="button"
                  onClick={() => setShowResults(false)}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-[#146c4f]/30 hover:text-[#146c4f]"
                >
                  {hasVoted ? 'Change my vote' : 'Return to voting'}
                </button>
              ) : null}

              <Link
                to="/polls"
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-[#146c4f]/30 hover:text-[#146c4f]"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All polls
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </div>
  )
}
