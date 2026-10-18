import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  ArrowRight,
  ArrowUpRight,
  BarChart2,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  Crown,
  Flag,
  Gavel,
  Landmark,
  MapPin,
  Newspaper,
  Search,
  ShieldCheck,
  Users,
  Vote,
  type LucideIcon,
} from 'lucide-react'
import { getLogoUrl } from '@/lib/utils'
import { blogService, getPostImageUrl, type Post } from '@/services/blogs'
import { electionService, type Election } from '@/services/elections'
import { pollService, type Poll, type PollResult } from '@/services/polls'
import { visitorService } from '@/services/visitors'

interface RoleCardDefinition {
  title: string
  level: string
  description: string
  query: string
  icon: LucideIcon
}

interface PollResultPreview {
  results: PollResult[]
  totalVotes: number
}

const POPULAR_SEARCHES = ['President', 'Lagos', 'Senator', 'Labour Party', '2023 Election']

const ROLE_CARDS: RoleCardDefinition[] = [
  {
    title: 'Presidency',
    level: 'Federal',
    description: 'The President and Vice President of the Federal Republic.',
    query: 'President',
    icon: Crown,
  },
  {
    title: 'Governors',
    level: 'State',
    description: 'The chief executives leading each of Nigeria’s states.',
    query: 'Governor',
    icon: Landmark,
  },
  {
    title: 'Senate',
    level: 'Federal',
    description: 'Senators representing the 109 senatorial districts.',
    query: 'Senator',
    icon: Users,
  },
  {
    title: 'House of Representatives',
    level: 'Federal',
    description: 'Members representing federal constituencies nationwide.',
    query: 'House of Representatives',
    icon: Building2,
  },
  {
    title: 'State Assembly',
    level: 'State',
    description: 'Lawmakers shaping policy in each state legislature.',
    query: 'State House of Assembly',
    icon: Gavel,
  },
  {
    title: 'Local Government',
    level: 'Local',
    description: 'Chairmen and councillors closest to your community.',
    query: 'LGA Chairman',
    icon: MapPin,
  },
]

const extractList = <T,>(value: unknown): T[] => {
  if (Array.isArray(value)) {
    return value as T[]
  }

  if (value && typeof value === 'object') {
    const payload = value as { data?: unknown }
    if (Array.isArray(payload.data)) {
      return payload.data as T[]
    }
    if (payload.data && typeof payload.data === 'object') {
      const nested = (payload.data as { data?: unknown }).data
      if (Array.isArray(nested)) {
        return nested as T[]
      }
    }
  }

  return []
}

const fetchPublicPartiesCount = async () => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1'
  const response = await fetch(`${apiBaseUrl}/parties`, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    return 0
  }

  const payload = (await response.json()) as { data?: unknown }
  return extractList<unknown>(payload.data).length
}

const formatDate = (value?: string | null) => {
  if (!value) return null

  const parsed = new Date(value.length <= 10 ? `${value}T00:00:00` : value)
  if (Number.isNaN(parsed.getTime())) return null

  return parsed.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })
}

const stripHtml = (html?: string) =>
  (html ?? '')
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const getElectionStatusClassName = (status?: string) => {
  const normalized = status?.toLowerCase()

  if (normalized === 'ongoing' || normalized === 'active') {
    return 'border-emerald-300/40 bg-emerald-400/15 text-emerald-100'
  }
  if (normalized === 'upcoming') {
    return 'border-sky-300/40 bg-sky-400/15 text-sky-100'
  }
  return 'border-white/15 bg-white/10 text-white'
}

function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  to,
  linkLabel,
}: {
  id?: string
  eyebrow: string
  title: string
  description: string
  to?: string
  linkLabel?: string
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#146c4f]">{eyebrow}</p>
        <h2 id={id} className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-500 sm:text-base">{description}</p>
      </div>

      {to && linkLabel ? (
        <Link
          to={to}
          className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-[#146c4f] transition hover:gap-3 hover:text-[#0f5a43] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146c4f] focus-visible:ring-offset-2"
        >
          {linkLabel}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  )
}

function RoleCard({ role }: { role: RoleCardDefinition }) {
  const Icon = role.icon

  return (
    <Link
      to={`/directory?q=${encodeURIComponent(role.query)}`}
      className="group flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1 hover:border-[#146c4f]/30 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146c4f] focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50 text-gray-500 ring-1 ring-gray-100 transition-colors group-hover:bg-[#146c4f]/5 group-hover:text-[#146c4f] group-hover:ring-[#146c4f]/10">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <ArrowUpRight
          className="h-4 w-4 text-gray-300 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#146c4f]"
          aria-hidden="true"
        />
      </div>

      <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">{role.level}</p>
      <h3 className="mt-1 text-lg font-bold tracking-tight text-gray-900 transition-colors group-hover:text-[#146c4f]">
        {role.title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-500">{role.description}</p>

      <span className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-[#146c4f]">
        Explore office
        <ChevronRight
          className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </span>
    </Link>
  )
}

function StatTile({
  label,
  value,
  icon,
  loading,
}: {
  label: string
  value: number | string
  icon: ReactNode
  loading: boolean
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-3.5 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-emerald-100/70">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-[0.14em]">{label}</span>
      </div>
      {loading ? (
        <div className="mt-2 h-6 w-12 animate-pulse rounded bg-white/20" />
      ) : (
        <p className="mt-1.5 text-2xl font-extrabold leading-none text-white">{value}</p>
      )}
    </div>
  )
}

function ElectionsSkeleton() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="h-[360px] animate-pulse rounded-3xl bg-emerald-900/10" />
    </div>
  )
}

function ElectionFeature({ election }: { election: Election | null }) {
  if (!election) {
    return (
      <div className="flex h-full min-h-[340px] flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-white p-8 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          <Landmark className="h-7 w-7" aria-hidden="true" />
        </span>
        <h3 className="mt-4 text-xl font-bold text-gray-900">Election data is being updated</h3>
        <p className="mt-2 max-w-md text-sm text-gray-500">
          New elections and timetables will appear here as soon as they are published.
        </p>
        <Link
          to="/elections"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#146c4f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#10563f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146c4f] focus-visible:ring-offset-2"
        >
          Browse elections <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    )
  }

  const title = election.details || `${election.year} General Election`

  return (
    <div className="relative h-full overflow-hidden rounded-3xl bg-gradient-to-br from-[#0b3d2c] via-[#0f5a43] to-emerald-700 p-7 text-white shadow-xl sm:p-9">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-300/20 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-24 right-10 text-[12rem] font-black leading-none text-white/[0.04] sm:text-[15rem]" aria-hidden="true">
        {election.year}
      </div>

      <div className="relative flex h-full flex-col">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-50">
            <Vote className="h-3.5 w-3.5" aria-hidden="true" /> Election centre
          </span>
          <span className={`rounded-full border px-3 py-1 text-[11px] font-bold ${getElectionStatusClassName(election.status)}`}>
            {election.status}
          </span>
        </div>

        <div className="mt-10 max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-200/80">
            {election.status === 'Completed' ? 'Most recent election' : 'Featured election'}
          </p>
          <h3 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{title}</h3>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-emerald-50/75 sm:text-base">
            Explore the offices, candidates, and timetable connected to this election.
          </p>
        </div>

        <div className="mt-8 grid max-w-md grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-100/60">Election year</p>
            <p className="mt-1.5 text-2xl font-extrabold">{election.year}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-100/60">Current status</p>
            <p className="mt-1.5 text-2xl font-extrabold">{election.status}</p>
          </div>
        </div>

        <div className="mt-auto pt-8">
          <Link
            to={`/election/${election.id}`}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-5 py-3 text-sm font-bold text-emerald-950 transition hover:bg-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-900"
          >
            View election details <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  )
}

function PollPreviewCard({
  poll,
  preview,
}: {
  poll: Poll
  preview?: PollResultPreview
}) {
  const endsOn = formatDate(poll.ends_at)
  const results = [...(preview?.results ?? [])]
    .sort((a, b) => Number(b.percentage) - Number(a.percentage) || Number(b.votes) - Number(a.votes))
    .slice(0, 5)
  const totalVotes = preview?.totalVotes ?? 0
  const optionCount = results.length || poll.candidates?.length || 0

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_4px_24px_rgb(0,0,0,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-50 px-6 py-4">
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Active poll
        </span>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-500">
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
            {optionCount} option{optionCount === 1 ? '' : 's'}
          </span>
          {endsOn ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" /> Closes {endsOn}
              </span>
            </>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-xl font-bold leading-snug text-gray-900">{poll.title || poll.question}</h3>

        {poll.description ? (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-500">{poll.description}</p>
        ) : null}

        <div className="mt-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">Results preview</p>
              <p className="mt-1 text-sm font-semibold text-gray-700">
                {totalVotes.toLocaleString()} vote{totalVotes === 1 ? '' : 's'} so far
              </p>
            </div>
            <BarChart2 className="h-5 w-5 text-gray-300" aria-hidden="true" />
          </div>

          {results.length ? (
            <div className="mt-4 space-y-4">
              {results.map((result) => {
                const percentage = Math.min(100, Math.max(0, Number(result.percentage) || 0))
                const candidateName = result.candidate?.name ?? 'Candidate'
                const partyName = result.party?.acronym || result.party?.name || 'Independent'

                return (
                  <div key={result.poll_candidate_id}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">{candidateName}</p>
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                          {partyName}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-extrabold text-gray-900">{percentage}%</p>
                        <p className="text-[10px] text-gray-400">
                          {Number(result.votes).toLocaleString()} vote{Number(result.votes) === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#146c4f] to-emerald-400 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="mt-4 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-500">
              Results preview is unavailable right now. Open the poll to see the full candidate list.
            </p>
          )}

          {results.length > 0 && totalVotes === 0 ? (
            <p className="mt-4 text-xs text-gray-400">No votes yet — be the first to weigh in.</p>
          ) : null}
        </div>

        <div className="mt-auto flex flex-col gap-2 pt-6 sm:flex-row">
          <Link
            to={`/poll/${poll.id}`}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#146c4f] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#10563f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146c4f] focus-visible:ring-offset-2"
          >
            Cast your vote <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            to="/polls"
            className="inline-flex items-center justify-center gap-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 transition hover:border-[#146c4f]/30 hover:text-[#146c4f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146c4f] focus-visible:ring-offset-2"
          >
            All polls
          </Link>
        </div>
      </div>
    </div>
  )
}

function PollsSkeleton() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white">
        <div className="h-14 animate-pulse border-b border-gray-50 bg-gray-50" />
        <div className="space-y-5 p-6">
          <div className="h-6 w-2/3 animate-pulse rounded bg-gray-100" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-gray-100" />
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between">
                <div className="h-4 w-40 animate-pulse rounded bg-gray-100" />
                <div className="h-4 w-10 animate-pulse rounded bg-gray-100" />
              </div>
              <div className="h-2 animate-pulse rounded-full bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function BlogCard({ post }: { post: Post }) {
  const imageUrl = getPostImageUrl(post.images?.[0]) ?? getLogoUrl(post.image)
  const publishedOn = formatDate(post.created_at)

  return (
    <Link
      to={`/blog/${post.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1 hover:border-[#146c4f]/30 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146c4f] focus-visible:ring-offset-2"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-900 via-[#146c4f] to-emerald-500 text-white/80">
            <Newspaper className="h-10 w-10" aria-hidden="true" />
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#146c4f] backdrop-blur">
          {post.type?.name || post.post_type?.name || 'News'}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium text-gray-400">
          {publishedOn ? (
            <time dateTime={post.created_at} className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" /> {publishedOn}
            </time>
          ) : null}
          {post.author?.name ? (
            <>
              <span aria-hidden="true">·</span>
              <span>{post.author.name}</span>
            </>
          ) : null}
        </div>

        <h3 className="mt-2 line-clamp-2 text-lg font-bold leading-snug text-gray-900 transition-colors group-hover:text-[#146c4f]">
          {post.title}
        </h3>
        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-gray-500">
          {stripHtml(post.content) || 'Read the full update from Know Your Leaders.'}
        </p>

        <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#146c4f]">
          Read story
          <ArrowRight
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </span>
      </div>
    </Link>
  )
}

function BlogSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
          <div className="aspect-[16/10] animate-pulse bg-gray-100" />
          <div className="space-y-3 p-5">
            <div className="h-3 w-1/3 animate-pulse rounded bg-gray-100" />
            <div className="h-5 w-5/6 animate-pulse rounded bg-gray-100" />
            <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function PublicHomePage() {
  const navigate = useNavigate()

  const [elections, setElections] = useState<Election[]>([])
  const [activePolls, setActivePolls] = useState<Poll[]>([])
  const [pollPreviews, setPollPreviews] = useState<Record<number, PollResultPreview>>({})
  const [blogs, setBlogs] = useState<Post[]>([])
  const [statesCount, setStatesCount] = useState(0)
  const [partiesCount, setPartiesCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    let cancelled = false

    const loadHomeData = async () => {
      const results = await Promise.allSettled([
        electionService.getAllElections(),
        pollService.getPolls(),
        blogService.getPosts(),
        visitorService.getStates(),
        fetchPublicPartiesCount(),
      ])

      if (cancelled) return

      const [electionsResult, pollsResult, blogsResult, statesResult, partiesResult] = results

      if (electionsResult.status === 'fulfilled') {
        setElections(
          [...electionsResult.value].sort((a, b) => Number(b.year ?? 0) - Number(a.year ?? 0)),
        )
      }

      if (pollsResult.status === 'fulfilled') {
        const active = pollsResult.value
          .filter((poll) => String(poll.status).toLowerCase() === 'active')
          .slice(0, 3)

        setActivePolls(active)

        if (active.length) {
          const previewResults = await Promise.allSettled(
            active.map((poll) => pollService.getPollResults(poll.id)),
          )

          if (cancelled) return

          const previews: Record<number, PollResultPreview> = {}

          previewResults.forEach((preview, index) => {
            const poll = active[index]
            if (poll && preview.status === 'fulfilled') {
              previews[poll.id] = {
                results: preview.value.results,
                totalVotes: preview.value.total_votes,
              }
            }
          })

          setPollPreviews(previews)
        }
      }

      if (blogsResult.status === 'fulfilled') {
        setBlogs(blogsResult.value.data.slice(0, 3))
      }

      if (statesResult.status === 'fulfilled') {
        setStatesCount(extractList<unknown>(statesResult.value).length)
      }

      if (partiesResult.status === 'fulfilled') {
        setPartiesCount(partiesResult.value)
      }

      setLoading(false)
    }

    void loadHomeData()

    return () => {
      cancelled = true
    }
  }, [])

  const featuredElection = elections[0] ?? null

  const stats = useMemo(
    () => [
      { label: 'States', value: statesCount || '—', icon: <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> },
      { label: 'Parties', value: partiesCount || '—', icon: <Flag className="h-3.5 w-3.5" aria-hidden="true" /> },
      { label: 'Elections', value: elections.length, icon: <Vote className="h-3.5 w-3.5" aria-hidden="true" /> },
      { label: 'Open polls', value: activePolls.length, icon: <BarChart2 className="h-3.5 w-3.5" aria-hidden="true" /> },
    ],
    [statesCount, partiesCount, elections.length, activePolls.length],
  )

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const query = searchQuery.trim()
    navigate(query ? `/directory?q=${encodeURIComponent(query)}` : '/directory')
  }

  return (
    <div className="bg-[#f7f8f5]">
      <Helmet>
        <title>Know Your Leaders | Nigeria’s Civic Directory</title>
        <meta
          name="description"
          content="Explore Nigerian leaders, candidates, political parties, elections, districts, and public polls in one trusted civic directory."
        />
        <meta property="og:title" content="Know Your Leaders | Nigeria’s Civic Directory" />
        <meta
          property="og:description"
          content="Know the people, parties, and elections shaping Nigeria. Search every level of government."
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
        <div className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-[28rem] w-[28rem] rounded-full bg-teal-300/10 blur-3xl" aria-hidden="true" />

        <div className="container relative mx-auto px-4 py-16 text-center sm:py-20 lg:py-24">
          <div className="mx-auto max-w-4xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-50 backdrop-blur">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
              Non-partisan civic intelligence
            </span>

            <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Leadership,
              <br />
              made <span className="text-emerald-300">clear.</span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-emerald-50/75 sm:text-lg">
              From the Presidency to your ward council, explore the people, parties, and elections shaping Nigeria —
              all in one place.
            </p>

            <form onSubmit={handleSearch} className="mx-auto mt-8 flex max-w-2xl flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <label htmlFor="home-directory-search" className="sr-only">
                  Search leaders, parties, districts, or elections
                </label>
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                  aria-hidden="true"
                />
                <input
                  id="home-directory-search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search a leader, party, district…"
                  autoComplete="off"
                  className="h-14 w-full rounded-2xl border-0 bg-white pl-12 pr-4 text-base text-gray-900 shadow-lg outline-none ring-1 ring-white/20 transition placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-300"
                />
              </div>
              <button
                type="submit"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-6 font-bold text-emerald-950 shadow-lg transition hover:bg-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#072b20]"
              >
                <Search className="h-5 w-5" aria-hidden="true" />
                Search
              </button>
            </form>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs font-medium text-emerald-100/60">Popular:</span>
              {POPULAR_SEARCHES.map((term) => (
                <Link
                  key={term}
                  to={`/directory?q=${encodeURIComponent(term)}`}
                  className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-medium text-emerald-50/80 transition hover:border-white/25 hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                >
                  {term}
                </Link>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
              <Link
                to="/districts"
                className="inline-flex items-center gap-2 text-sm font-bold text-white transition hover:text-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
              >
                <MapPin className="h-4 w-4" aria-hidden="true" />
                Browse districts
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                to="/leaders"
                className="inline-flex items-center gap-2 text-sm font-bold text-white transition hover:text-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
              >
                <Users className="h-4 w-4" aria-hidden="true" />
                Meet elected leaders
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((stat) => (
              <StatTile
                key={stat.label}
                label={stat.label}
                value={stat.value}
                icon={stat.icon}
                loading={loading}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 sm:py-20" aria-labelledby="explore-roles-heading">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            id="explore-roles-heading"
            eyebrow="Explore by office"
            title="From Aso Rock to your ward."
            description="Follow the chain of representation at every level of government — federal, state, and local."
            to="/directory"
            linkLabel="Open full directory"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ROLE_CARDS.map((role) => (
              <RoleCard key={role.title} role={role} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-gray-200/70 bg-white py-16 sm:py-20" aria-labelledby="elections-heading">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              id="elections-heading"
              eyebrow="The ballot box"
              title="Elections that decide who governs."
              description="Track the contests on the calendar and explore the offices, candidates, and timetables behind each one."
              to="/elections"
              linkLabel="All elections"
            />

            {loading ? (
              <ElectionsSkeleton />
            ) : (
              <div className="mx-auto max-w-5xl">
                <ElectionFeature election={featuredElection} />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="border-b border-gray-200/70 bg-[#f1f6f2] py-16 sm:py-20" aria-labelledby="public-polls-heading">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              id="public-polls-heading"
              eyebrow="Public opinion"
              title="What Nigeria is saying."
              description="See live result previews from open public polls, then add your voice to the conversation."
              to="/polls"
              linkLabel="All public polls"
            />

            {loading ? (
              <PollsSkeleton />
            ) : activePolls.length ? (
              <div className={activePolls.length > 1 ? 'grid gap-6 lg:grid-cols-2' : 'mx-auto max-w-4xl'}>
                {activePolls.map((poll) => (
                  <PollPreviewCard
                    key={poll.id}
                    poll={poll}
                    preview={pollPreviews[poll.id]}
                  />
                ))}
              </div>
            ) : (
              <div className="mx-auto max-w-4xl rounded-3xl border border-dashed border-gray-300 bg-white/70 p-10 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                  <BarChart2 className="h-7 w-7" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-xl font-bold text-gray-900">No open polls right now</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-500">
                  Browse previous polls or check back when a new public question opens.
                </p>
                <Link
                  to="/polls"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#146c4f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#10563f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146c4f] focus-visible:ring-offset-2"
                >
                  Browse polls <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {(loading || blogs.length > 0) && (
        <section className="container mx-auto px-4 py-16 sm:py-20" aria-labelledby="latest-insights-heading">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              id="latest-insights-heading"
              eyebrow="News and analysis"
              title="Latest from the blog."
              description="Context, explainers, and updates to help you make sense of Nigerian politics."
              to="/blogs"
              linkLabel="Visit the blog"
            />

            {loading ? (
              <BlogSkeleton />
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                {blogs.map((post) => (
                  <BlogCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <section className="container mx-auto px-4 pb-16 sm:pb-20" aria-labelledby="home-cta-heading">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#072b20] via-[#0b3d2c] to-[#146c4f] px-6 py-10 text-white shadow-2xl sm:px-10 sm:py-14">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)',
                backgroundSize: '22px 22px',
              }}
              aria-hidden="true"
            />
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" aria-hidden="true" />

            <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto]">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-100">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
                  Informed citizenship starts here
                </span>
                <h2 id="home-cta-heading" className="mt-4 max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Your vote. Your voice. Your representatives.
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-emerald-50/75 sm:text-base">
                  Find the people who represent you, compare their records, and follow the elections that shape your
                  community.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Link
                  to="/directory"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-300 px-5 py-3.5 text-sm font-bold text-emerald-950 transition hover:bg-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#072b20]"
                >
                  Search the directory <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  to="/about"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#072b20]"
                >
                  About KYL <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
