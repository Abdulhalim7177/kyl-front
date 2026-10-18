import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Landmark,
  ListChecks,
  Vote,
} from 'lucide-react'
import { electionService, type Election } from '@/services/elections'

type ElectionFilter = 'all' | 'ongoing' | 'upcoming' | 'completed'

const getStatusKey = (status?: string): Exclude<ElectionFilter, 'all'> => {
  const normalized = String(status ?? '').trim().toLowerCase()
  if (normalized === 'ongoing' || normalized === 'active') return 'ongoing'
  if (normalized === 'upcoming') return 'upcoming'
  if (normalized === 'completed') return 'completed'
  return 'upcoming'
}

const getStatusLabel = (status?: string) => {
  const key = getStatusKey(status)
  return key.charAt(0).toUpperCase() + key.slice(1)
}

const getStatusClasses = (status?: string) => {
  const key = getStatusKey(status)
  if (key === 'ongoing') return 'border-emerald-300/30 bg-emerald-400/15 text-emerald-100'
  if (key === 'upcoming') return 'border-sky-200 bg-sky-50 text-sky-700'
  return 'border-gray-200 bg-gray-100 text-gray-600'
}

const formatDate = (value?: string | null) => {
  if (!value) return null
  const parsed = new Date(value.length <= 10 ? `${value}T00:00:00` : value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })
}

const getElectionTitle = (election: Election) =>
  election.details || `${election.year} General Election`

function ElectionCard({ election }: { election: Election }) {
  const status = getStatusKey(election.status)
  const isOngoing = status === 'ongoing'
  const title = getElectionTitle(election)
  const updatedOn = formatDate(election.updated_at || election.created_at)

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border shadow-[0_4px_24px_rgb(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
        isOngoing
          ? 'border-[#0b3d2c] bg-gradient-to-br from-[#072b20] via-[#0b3d2c] to-[#146c4f] text-white'
          : 'border-gray-100 bg-white'
      }`}
    >
      {isOngoing ? (
        <>
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
              backgroundSize: '42px 42px',
            }}
            aria-hidden="true"
          />
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-300/20 blur-3xl" aria-hidden="true" />
        </>
      ) : null}

      <div className={`relative flex items-center justify-between gap-3 border-b px-6 py-4 ${isOngoing ? 'border-white/10' : 'border-gray-50'}`}>
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${
            isOngoing
              ? 'border-emerald-300/30 bg-emerald-400/15 text-emerald-100'
              : getStatusClasses(election.status)
          }`}
        >
          {isOngoing ? (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
            </span>
          ) : status === 'completed' ? (
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {getStatusLabel(election.status)}
        </span>

        <span
          className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
            isOngoing ? 'text-emerald-100/70' : 'text-gray-400'
          }`}
        >
          <ListChecks className="h-3.5 w-3.5" aria-hidden="true" /> Election cycle
        </span>
      </div>

      <div className="relative flex flex-1 flex-col p-6 sm:p-8">
        <p
          className={`text-sm font-bold uppercase tracking-[0.16em] ${
            isOngoing ? 'text-emerald-200/80' : 'text-[#146c4f]'
          }`}
        >
          {election.year} election
        </p>
        <h2
          className={`mt-3 text-2xl font-extrabold leading-tight tracking-tight ${
            isOngoing ? 'text-white' : 'text-gray-900 group-hover:text-[#146c4f]'
          }`}
        >
          {title}
        </h2>
        <p
          className={`mt-3 text-sm leading-relaxed ${
            isOngoing ? 'text-emerald-50/75' : 'text-gray-500'
          }`}
        >
          Follow the offices on the ballot, the candidates contesting them, and the timetable that
          runs through this election.
        </p>

        <div
          className={`mt-6 grid grid-cols-2 gap-3 rounded-2xl border p-4 ${
            isOngoing
              ? 'border-white/10 bg-white/[0.07]'
              : 'border-gray-100 bg-gray-50/70'
          }`}
        >
          <div>
            <p
              className={`text-[10px] font-bold uppercase tracking-[0.14em] ${
                isOngoing ? 'text-emerald-100/60' : 'text-gray-400'
              }`}
            >
              Year
            </p>
            <p className={`mt-1 text-xl font-extrabold ${isOngoing ? 'text-white' : 'text-gray-900'}`}>
              {election.year}
            </p>
          </div>
          <div>
            <p
              className={`text-[10px] font-bold uppercase tracking-[0.14em] ${
                isOngoing ? 'text-emerald-100/60' : 'text-gray-400'
              }`}
            >
              Updated
            </p>
            <p className={`mt-1 text-sm font-bold ${isOngoing ? 'text-white' : 'text-gray-900'}`}>
              {updatedOn || 'Recently'}
            </p>
          </div>
        </div>

        <div className="mt-auto pt-7">
          <Link
            to={`/election/${election.id}`}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
              isOngoing
                ? 'bg-emerald-300 text-emerald-950 hover:bg-emerald-200 focus-visible:ring-white focus-visible:ring-offset-[#072b20]'
                : 'bg-[#146c4f] text-white hover:bg-[#10563f] focus-visible:ring-[#146c4f]'
            }`}
          >
            View timetable & candidates
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  )
}

function ElectionsSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-3xl border border-gray-100 bg-white">
          <div className="h-14 animate-pulse border-b border-gray-50 bg-gray-50" />
          <div className="space-y-4 p-8">
            <div className="h-3 w-28 animate-pulse rounded bg-gray-100" />
            <div className="h-8 w-3/4 animate-pulse rounded bg-gray-100" />
            <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
            <div className="h-24 animate-pulse rounded-2xl bg-gray-100" />
            <div className="h-11 w-full animate-pulse rounded-xl bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function PublicElectionsPage() {
  const [elections, setElections] = useState<Election[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<ElectionFilter>('all')

  useEffect(() => {
    let cancelled = false

    const fetchElections = async () => {
      try {
        const data = await electionService.getAllElections()
        if (cancelled) return
        setElections(
          [...data].sort((a, b) => {
            const yearDelta = Number(b.year ?? 0) - Number(a.year ?? 0)
            if (yearDelta !== 0) return yearDelta
            return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
          }),
        )
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load elections')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void fetchElections()

    return () => {
      cancelled = true
    }
  }, [])

  const counts = useMemo(() => {
    const tally = { all: elections.length, ongoing: 0, upcoming: 0, completed: 0 }
    elections.forEach((election) => {
      tally[getStatusKey(election.status)] += 1
    })
    return tally
  }, [elections])

  const filteredElections = useMemo(() => {
    if (filter === 'all') return elections
    return elections.filter((election) => getStatusKey(election.status) === filter)
  }, [elections, filter])

  const filters: { key: ElectionFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All elections', count: counts.all },
    { key: 'ongoing', label: 'Ongoing', count: counts.ongoing },
    { key: 'upcoming', label: 'Upcoming', count: counts.upcoming },
    { key: 'completed', label: 'Completed', count: counts.completed },
  ]

  return (
    <div className="bg-[#f7f8f5]">
      <Helmet>
        <title>Elections | Know Your Leaders</title>
        <meta
          name="description"
          content="Explore Nigerian elections, the offices on the ballot, candidates, and election timetables."
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
        <div className="pointer-events-none absolute -bottom-16 left-1/3 text-[14rem] font-black leading-none text-white/[0.03]" aria-hidden="true">
          VOTE
        </div>

        <div className="container relative mx-auto px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-50 backdrop-blur">
                <Landmark className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
                The ballot box
              </span>
              <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
                Every election, <span className="text-emerald-300">on the record.</span>
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-emerald-50/75 sm:text-lg">
                Track the contests that decide who governs, explore the offices on the ballot, and
                follow the timetable from campaign to result.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Total', value: counts.all, icon: Vote },
                { label: 'Ongoing', value: counts.ongoing, icon: Clock },
                { label: 'Upcoming', value: counts.upcoming, icon: CalendarDays },
                { label: 'Completed', value: counts.completed, icon: CheckCircle2 },
              ].map((stat) => {
                const Icon = stat.icon
                return (
                  <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-emerald-100/70">
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.14em]">{stat.label}</span>
                    </div>
                    <p className="mt-2 text-3xl font-extrabold leading-none text-white">{stat.value}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col gap-5 border-b border-gray-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#146c4f]">Election centre</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">
                The contests that shape the country.
              </h2>
            </div>

            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter elections by status">
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
            <ElectionsSkeleton />
          ) : error ? (
            <div role="alert" className="rounded-3xl border border-red-100 bg-red-50 p-8 text-center">
              <p className="font-semibold text-red-700">We could not load the elections.</p>
              <p className="mt-1 text-sm text-red-600">{error}</p>
            </div>
          ) : filteredElections.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-white/70 p-12 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                <Landmark className="h-7 w-7" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-xl font-bold text-gray-900">No elections in this view</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-500">
                Try another status filter, or check back when the next election cycle is published.
              </p>
              {filter !== 'all' ? (
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#146c4f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#10563f]"
                >
                  View all elections <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : null}
            </div>
          ) : (
            <div className={filteredElections.length === 1 ? 'mx-auto max-w-2xl' : 'grid gap-6 lg:grid-cols-2'}>
              {filteredElections.map((election) => (
                <ElectionCard key={election.id} election={election} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
