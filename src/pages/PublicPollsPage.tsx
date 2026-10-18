import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  ArrowRight,
  BarChart2,
  CalendarDays,
  CheckCircle2,
  Clock,
  ListChecks,
  Vote,
} from 'lucide-react'
import { pollService, type Poll, type PollResult } from '@/services/polls'

type PollFilter = 'all' | 'active' | 'closed'

interface PollPreview {
  results: PollResult[]
  totalVotes: number
}

type PollWithPreview = Poll & { preview?: PollPreview }

const formatDate = (value?: string | null) => {
  if (!value) return null
  const parsed = new Date(value.length <= 10 ? `${value}T00:00:00` : value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })
}

const getPollStatus = (poll: Poll) => String(poll.status).toLowerCase() === 'active' ? 'active' : 'closed'

const getSortedResults = (results: PollResult[]) =>
  [...results].sort(
    (a, b) => Number(b.percentage) - Number(a.percentage) || Number(b.votes) - Number(a.votes),
  )

const getPollTitle = (poll: Poll) => poll.title || poll.question

const getOptionName = (result: PollResult) => result.candidate?.name || 'Candidate'
const getPartyName = (result: PollResult) => result.party?.acronym || result.party?.name || 'Independent'

function PollCard({ poll }: { poll: PollWithPreview }) {
  const status = getPollStatus(poll)
  const isActive = status === 'active'
  const results = getSortedResults(poll.preview?.results ?? []).slice(0, 3)
  const totalVotes = poll.preview?.totalVotes ?? poll.total_votes ?? 0
  const optionCount = poll.preview?.results.length || poll.candidates?.length || 0
  const closesOn = formatDate(poll.ends_at)

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_4px_24px_rgb(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-[#146c4f]/25 hover:shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-50 px-6 py-4">
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${
            isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {isActive ? (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {isActive ? 'Open poll' : 'Closed poll'}
        </span>

        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-500">
          <span className="inline-flex items-center gap-1.5">
            <ListChecks className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
            {optionCount} option{optionCount === 1 ? '' : 's'}
          </span>
          {closesOn ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
                {isActive ? 'Closes' : 'Closed'} {closesOn}
              </span>
            </>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h2 className="text-xl font-extrabold leading-snug tracking-tight text-gray-900 transition-colors group-hover:text-[#146c4f]">
          {getPollTitle(poll)}
        </h2>
        {poll.description ? (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-500">{poll.description}</p>
        ) : null}

        <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">
                {isActive ? 'Live results preview' : 'Final results'}
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-700">
                {totalVotes.toLocaleString()} vote{totalVotes === 1 ? '' : 's'} counted
              </p>
            </div>
            <BarChart2 className="h-5 w-5 text-gray-300" aria-hidden="true" />
          </div>

          {results.length ? (
            <div className="mt-4 space-y-3.5">
              {results.map((result) => {
                const percentage = Math.min(100, Math.max(0, Number(result.percentage) || 0))
                return (
                  <div key={result.poll_candidate_id}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">{getOptionName(result)}</p>
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                          {getPartyName(result)}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-extrabold text-gray-900">{percentage}%</p>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-200/80">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#146c4f] to-emerald-400"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="mt-4 text-sm leading-relaxed text-gray-500">
              Results have not been published for this poll yet.
            </p>
          )}

          {results.length > 0 && totalVotes === 0 ? (
            <p className="mt-4 text-xs text-gray-400">No votes yet — be the first to weigh in.</p>
          ) : null}
        </div>

        <div className="mt-auto flex flex-col gap-2 pt-6 sm:flex-row">
          <Link
            to={`/poll/${poll.id}`}
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146c4f] focus-visible:ring-offset-2 ${
              isActive
                ? 'bg-[#146c4f] text-white hover:bg-[#10563f]'
                : 'border border-gray-200 bg-white text-gray-700 hover:border-[#146c4f]/30 hover:text-[#146c4f]'
            }`}
          >
            {isActive ? 'Cast your vote' : 'View final results'}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            to="/elections"
            className="inline-flex items-center justify-center gap-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 transition hover:border-[#146c4f]/30 hover:text-[#146c4f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146c4f] focus-visible:ring-offset-2"
          >
            Elections
          </Link>
        </div>
      </div>
    </article>
  )
}

function PollsSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-3xl border border-gray-100 bg-white">
          <div className="h-14 animate-pulse border-b border-gray-50 bg-gray-50" />
          <div className="space-y-5 p-6">
            <div className="h-6 w-3/4 animate-pulse rounded bg-gray-100" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100" />
            <div className="h-40 animate-pulse rounded-2xl bg-gray-100" />
            <div className="h-11 w-full animate-pulse rounded-xl bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function PublicPollsPage() {
  const [polls, setPolls] = useState<PollWithPreview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<PollFilter>('all')

  useEffect(() => {
    let cancelled = false

    const fetchPolls = async () => {
      try {
        const data = await pollService.getPolls()
        const enriched = await Promise.all(
          data.map(async (poll) => {
            try {
              const preview = await pollService.getPollResults(poll.id)
              return {
                ...poll,
                preview: {
                  results: preview.results,
                  totalVotes: preview.total_votes,
                },
              }
            } catch {
              return poll
            }
          }),
        )

        if (cancelled) return

        enriched.sort((a, b) => {
          const statusDelta =
            Number(getPollStatus(b) === 'active') - Number(getPollStatus(a) === 'active')
          if (statusDelta !== 0) return statusDelta
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })

        setPolls(enriched)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load polls')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void fetchPolls()

    return () => {
      cancelled = true
    }
  }, [])

  const counts = useMemo(() => {
    const open = polls.filter((poll) => getPollStatus(poll) === 'active').length
    return {
      all: polls.length,
      open,
      closed: polls.length - open,
    }
  }, [polls])

  const totalVotes = useMemo(
    () => polls.reduce((sum, poll) => sum + (poll.preview?.totalVotes ?? poll.total_votes ?? 0), 0),
    [polls],
  )

  const filteredPolls = useMemo(() => {
    if (filter === 'all') return polls
    return polls.filter((poll) => getPollStatus(poll) === filter)
  }, [filter, polls])

  const filters: { key: PollFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All polls', count: counts.all },
    { key: 'active', label: 'Open now', count: counts.open },
    { key: 'closed', label: 'Closed', count: counts.closed },
  ]

  return (
    <div className="bg-[#f7f8f5]">
      <Helmet>
        <title>Public Polls | Know Your Leaders</title>
        <meta
          name="description"
          content="Follow public opinion on Nigerian leadership and elections. View live poll results or cast your vote."
        />
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

        <div className="container relative mx-auto px-4 py-16 sm:py-20">
          <div className="mx-auto grid max-w-6xl items-end gap-10 lg:grid-cols-[1fr_auto]">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-50 backdrop-blur">
                <Vote className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
                Public opinion
              </span>
              <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
                The public square, <span className="text-emerald-300">measured.</span>
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-emerald-50/75 sm:text-lg">
                Explore open questions, see how the country is responding, and add your voice to the
                conversations shaping Nigeria.
              </p>
            </div>

            <div className="grid w-full grid-cols-3 gap-3 lg:w-[24rem]">
              <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-100/60">Open</p>
                <p className="mt-2 text-3xl font-extrabold leading-none text-white">{counts.open}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-100/60">Closed</p>
                <p className="mt-2 text-3xl font-extrabold leading-none text-white">{counts.closed}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-100/60">Votes</p>
                <p className="mt-2 text-3xl font-extrabold leading-none text-white">
                  {totalVotes.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#146c4f]">All questions</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">
                What the country is thinking.
              </h2>
            </div>

            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter polls by status">
              {filters.map((item) => {
                const selected = filter === item.key
                return (
                  <button
                    key={item.key}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setFilter(item.key)}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146c4f] focus-visible:ring-offset-2 ${
                      selected
                        ? 'bg-[#146c4f] text-white'
                        : 'border border-gray-200 bg-white text-gray-600 hover:border-[#146c4f]/30 hover:text-[#146c4f]'
                    }`}
                  >
                    {item.label}
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                        selected ? 'bg-white/15 text-white' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {item.count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {loading ? (
            <PollsSkeleton />
          ) : error ? (
            <div role="alert" className="rounded-3xl border border-red-100 bg-red-50 p-8 text-center">
              <p className="font-semibold text-red-700">We could not load the polls.</p>
              <p className="mt-1 text-sm text-red-600">{error}</p>
            </div>
          ) : filteredPolls.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-white/70 p-12 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                <BarChart2 className="h-7 w-7" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-xl font-bold text-gray-900">No polls in this view</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-500">
                Try another filter, or check back when a new public question opens.
              </p>
              {filter !== 'all' ? (
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#146c4f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#10563f]"
                >
                  View all polls <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : null}
            </div>
          ) : (
            <div className={filteredPolls.length === 1 ? 'mx-auto max-w-2xl' : 'grid gap-6 lg:grid-cols-2'}>
              {filteredPolls.map((poll) => (
                <PollCard key={poll.id} poll={poll} />
              ))}
            </div>
          )}

          <div className="mt-10 flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-5 text-sm leading-relaxed text-gray-500">
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[#146c4f]" aria-hidden="true" />
            <p>
              Polls are non-scientific snapshots of public opinion. Results reflect the responses
              submitted through this platform and are not election forecasts.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
