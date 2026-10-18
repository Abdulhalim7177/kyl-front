import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  AlertCircle,
  ArrowRight,
  Building2,
  ChevronRight,
  Flag,
  Landmark,
  Layers,
  Loader2,
  MapPin,
  Search,
  User,
  Users,
  Vote,
  X,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getLogoUrl } from '@/lib/utils'
import {
  directoryService,
  type DirectoryResultItem,
  type DirectorySearchData,
  type DirectorySearchMeta,
  type DirectorySuggestion,
} from '@/services/directory'

const EMPTY_RESULTS: DirectorySearchData = {
  states: [],
  districts: [],
  candidates: [],
  parties: [],
  elections: [],
  offices: [],
}

const DISTRICT_TYPE_LABELS: Record<string, string> = {
  senatorial: 'Senatorial',
  federal: 'Federal',
  state_house: 'State',
  lga: 'LGA',
}

const POPULAR_SEARCHES = ['President', 'Lagos', 'LP', 'State House', '2023', 'Aba North']

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'KY'

function SuggestionIcon({ suggestion }: { suggestion: DirectorySuggestion }) {
  const className = 'h-4 w-4 shrink-0 text-emerald-200'

  if (['senatorial', 'federal', 'state_house', 'lga'].includes(suggestion.type ?? '')) {
    return <MapPin className={className} aria-hidden="true" />
  }

  if (
    suggestion.action === 'state_candidates' ||
    suggestion.action === 'district_candidates' ||
    suggestion.action === 'browse_state'
  ) {
    return <MapPin className={className} aria-hidden="true" />
  }

  if (suggestion.action === 'party' || suggestion.action === 'party_candidates' || suggestion.type === 'party') {
    return <Flag className={className} aria-hidden="true" />
  }

  if (suggestion.action === 'filter_election') {
    return <Landmark className={className} aria-hidden="true" />
  }

  if (suggestion.action === 'candidate_profile' || suggestion.type === 'candidate') {
    return <User className={className} aria-hidden="true" />
  }

  if (suggestion.type === 'office') {
    return <Building2 className={className} aria-hidden="true" />
  }

  return <Search className={className} aria-hidden="true" />
}

function SuggestionPills({
  suggestions,
  loading,
  error,
  onSelect,
}: {
  suggestions: DirectorySuggestion[]
  loading: boolean
  error: boolean
  onSelect: (suggestion: DirectorySuggestion) => void
}) {
  if (!suggestions.length && !loading && !error) {
    return null
  }

  const scrollable = suggestions.length > 16

  return (
    <div className="mt-5">
      {loading && !suggestions.length ? (
        <div className="flex flex-wrap justify-center gap-2" aria-hidden="true">
          {[0, 1, 2, 3].map((item) => (
            <span key={item} className="h-9 w-28 animate-pulse rounded-full bg-white/15" />
          ))}
        </div>
      ) : suggestions.length ? (
        <div
          role="group"
          aria-label="Search suggestions"
          className={`flex flex-wrap justify-center gap-2 ${
            scrollable ? 'max-h-56 overflow-y-auto overscroll-contain pr-1' : ''
          }`}
        >
          {suggestions.map((suggestion, index) => {
            if (suggestion.type === 'label') {
              return (
                <span
                  key={`label-${index}`}
                  className="inline-flex items-center px-2 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-100/80"
                >
                  {suggestion.title}
                </span>
              )
            }

            return (
              <button
                key={`${suggestion.title}-${suggestion.action}-${index}`}
                type="button"
                onClick={() => onSelect(suggestion)}
                className="inline-flex min-h-9 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-sm font-medium text-emerald-50 transition hover:border-white/30 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
              >
                <SuggestionIcon suggestion={suggestion} />
                <span>{suggestion.title}</span>
              </button>
            )
          })}

          {loading ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs text-emerald-100/70">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> Updating…
            </span>
          ) : null}
        </div>
      ) : (
        <p className="text-center text-xs text-emerald-100/70">
          Suggestions are unavailable right now — you can still search.
        </p>
      )}
    </div>
  )
}

function QuickLinkCard({
  to,
  title,
  description,
  icon,
  iconClassName,
}: {
  to: string
  title: string
  description: string
  icon: ReactNode
  iconClassName: string
}) {
  return (
    <Link
      to={to}
      className="group flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1 hover:border-[#146c4f]/30 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146c4f] focus-visible:ring-offset-2"
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1 text-sm font-bold text-gray-900 transition-colors group-hover:text-[#146c4f]">
          {title}
          <ArrowRight
            className="h-3.5 w-3.5 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
            aria-hidden="true"
          />
        </span>
        <span className="mt-1 block text-xs leading-relaxed text-gray-500">{description}</span>
      </span>
    </Link>
  )
}

function CandidateCard({ candidate }: { candidate: DirectoryResultItem }) {
  const imageUrl = getLogoUrl(candidate.image)
  const partyLogo = getLogoUrl(candidate.party_logo)

  return (
    <Link
      to={`/profile/${candidate.id}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1 hover:border-[#146c4f]/30 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146c4f] focus-visible:ring-offset-2"
    >
      <div className="h-1 w-full bg-gradient-to-r from-[#146c4f] via-emerald-500 to-emerald-300" />
      <div className="flex flex-1 items-start gap-3 p-4">
        <Avatar className="h-14 w-14 shrink-0 border-2 border-white shadow-sm ring-2 ring-[#146c4f]/10">
          {imageUrl ? (
            <AvatarImage src={imageUrl} alt={candidate.title} className="object-cover" loading="lazy" />
          ) : null}
          <AvatarFallback className="bg-[#146c4f]/10 text-base font-bold text-[#146c4f]">
            {getInitials(candidate.title)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-bold text-gray-900 transition-colors group-hover:text-[#146c4f]">
            {candidate.title}
          </h4>
          <p className="mt-0.5 truncate text-[11px] font-bold uppercase tracking-[0.14em] text-[#146c4f]">
            {candidate.party || 'Independent'}
          </p>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {candidate.office ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-600">
                <Vote className="h-3 w-3 text-gray-400" aria-hidden="true" /> {candidate.office}
              </span>
            ) : null}
            {candidate.location ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-600">
                <MapPin className="h-3 w-3 text-gray-400" aria-hidden="true" /> {candidate.location}
              </span>
            ) : null}
          </div>
        </div>

        {partyLogo ? (
          <Avatar className="h-8 w-8 shrink-0 rounded-lg border border-gray-100 bg-white">
            <AvatarImage
              src={partyLogo}
              alt={`${candidate.party ?? 'Party'} logo`}
              className="object-contain p-1"
              loading="lazy"
            />
            <AvatarFallback className="rounded-lg bg-gray-50 text-[10px] font-bold text-gray-500">
              {candidate.party?.slice(0, 2) ?? 'KY'}
            </AvatarFallback>
          </Avatar>
        ) : (
          <ArrowRight
            className="h-4 w-4 shrink-0 text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:text-[#146c4f]"
            aria-hidden="true"
          />
        )}
      </div>
    </Link>
  )
}

function InfoCard({
  title,
  icon,
  iconClassName,
  count,
  children,
}: {
  title: string
  icon: ReactNode
  iconClassName: string
  count: number
  children: ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
      <div className="flex items-center justify-between gap-3 border-b border-gray-50 px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconClassName}`}>{icon}</span>
          {title}
        </h3>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-500">{count}</span>
      </div>
      <div className="divide-y divide-gray-50">{children}</div>
    </section>
  )
}

function EntityButtonRow({
  title,
  subtitle,
  badge,
  icon,
  iconClassName,
  onClick,
}: {
  title: string
  subtitle?: string
  badge?: string
  icon: ReactNode
  iconClassName: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-none"
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconClassName}`}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-gray-900">{title}</span>
          {badge ? (
            <span className="shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-500">
              {badge}
            </span>
          ) : null}
        </span>
        {subtitle ? <span className="mt-0.5 block truncate text-xs text-gray-500">{subtitle}</span> : null}
      </span>
      <ChevronRight
        className="h-4 w-4 shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[#146c4f]"
        aria-hidden="true"
      />
    </button>
  )
}

function PartyRow({ party }: { party: DirectoryResultItem }) {
  const logo = getLogoUrl(party.image)

  return (
    <Link
      to={`/party/${party.id}`}
      className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-none"
    >
      <Avatar className="h-9 w-9 shrink-0 rounded-lg border border-gray-100 bg-white">
        {logo ? (
          <AvatarImage src={logo} alt={`${party.title} logo`} className="object-contain p-1" loading="lazy" />
        ) : null}
        <AvatarFallback className="rounded-lg bg-gray-50 text-[10px] font-bold text-gray-500">
          {party.title.slice(0, 3)}
        </AvatarFallback>
      </Avatar>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-gray-900">{party.title}</span>
        {party.subtitle ? <span className="mt-0.5 block truncate text-xs text-gray-500">{party.subtitle}</span> : null}
      </span>
      <ChevronRight
        className="h-4 w-4 shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[#146c4f]"
        aria-hidden="true"
      />
    </Link>
  )
}

function ElectionRow({ election }: { election: DirectoryResultItem }) {
  const year = election.details?.year ?? election.title.replace(/^Election\s+/i, '')

  return (
    <Link
      to={`/election/${election.id}`}
      className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-none"
    >
      <span className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-100">
        <span className="text-[8px] font-bold uppercase tracking-wider opacity-70">Year</span>
        <span className="text-xs font-black leading-none">{year}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-gray-900">{election.title}</span>
        {election.subtitle ? (
          <span className="mt-0.5 block truncate text-xs capitalize text-gray-500">{election.subtitle}</span>
        ) : null}
      </span>
      <ChevronRight
        className="h-4 w-4 shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[#146c4f]"
        aria-hidden="true"
      />
    </Link>
  )
}

function ResultsSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading search results">
      <div className="space-y-3">
        <div className="h-5 w-48 animate-pulse rounded bg-gray-200" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-gray-100 bg-white p-4">
              <div className="flex gap-3">
                <div className="h-14 w-14 animate-pulse rounded-full bg-gray-100" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-gray-100" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-40 animate-pulse rounded-2xl border border-gray-100 bg-white" />
        ))}
      </div>
    </div>
  )
}

function SearchErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-6 py-14 text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
        <AlertCircle className="h-7 w-7" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-lg font-bold text-red-900">Search failed</h2>
      <p className="mt-1 max-w-md text-sm text-red-700">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
      >
        <Search className="h-4 w-4" aria-hidden="true" /> Try again
      </button>
    </div>
  )
}

function SearchEmptyState({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white/70 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        <Search className="h-7 w-7" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-lg font-bold text-gray-900">No results for “{query}”</h2>
      <p className="mt-1 max-w-md text-sm text-gray-500">
        Try a state, district, party, office, or a candidate’s name. You can also pick one of the suggestions above.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={onClear}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#146c4f] px-4 text-sm font-semibold text-white transition hover:bg-[#10563f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146c4f] focus-visible:ring-offset-2"
        >
          <X className="h-4 w-4" aria-hidden="true" /> Clear search
        </button>
        <Link
          to="/districts"
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:border-[#146c4f]/30 hover:text-[#146c4f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146c4f]"
        >
          <MapPin className="h-4 w-4" aria-hidden="true" /> Browse districts
        </Link>
      </div>
    </div>
  )
}

function RequiresStateNotice({ query }: { query: string }) {
  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 px-6 py-12 text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
        <MapPin className="h-7 w-7" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-lg font-bold text-amber-950">Choose a state for “{query}”</h2>
      <p className="mt-1 max-w-md text-sm text-amber-800">
        This office is state-based. Pick a state from the suggestions above to see its candidates, or search something
        like “Lagos Governor”.
      </p>
    </div>
  )
}

export default function DirectoryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const inputRef = useRef<HTMLInputElement>(null)
  const lastUrlQueryRef = useRef<string | null>(null)
  const searchRequestRef = useRef(0)
  const searchAbortRef = useRef<AbortController | null>(null)
  const suggestionsRequestRef = useRef(0)

  const [query, setQuery] = useState('')
  const [searchedQuery, setSearchedQuery] = useState('')
  const [results, setResults] = useState<DirectorySearchData | null>(null)
  const [meta, setMeta] = useState<DirectorySearchMeta>({})
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [suggestions, setSuggestions] = useState<DirectorySuggestion[]>([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [suggestionsError, setSuggestionsError] = useState(false)

  const clearSearch = useCallback(() => {
    searchAbortRef.current?.abort()
    searchRequestRef.current += 1
    lastUrlQueryRef.current = ''

    setQuery('')
    setSearchedQuery('')
    setResults(null)
    setMeta({})
    setSearchError('')
    setIsSearching(false)
    setSearchParams({}, { replace: true })

    inputRef.current?.focus()
  }, [setSearchParams])

  const runSearch = useCallback(
    async (rawQuery: string, options: { syncUrl?: boolean } = {}) => {
      const nextQuery = rawQuery.trim()

      if (!nextQuery) {
        clearSearch()
        return
      }

      if (options.syncUrl !== false) {
        lastUrlQueryRef.current = nextQuery
        setSearchParams({ q: nextQuery }, { replace: true })
      }

      const requestId = searchRequestRef.current + 1
      searchRequestRef.current = requestId

      searchAbortRef.current?.abort()
      const controller = new AbortController()
      searchAbortRef.current = controller

      setQuery(nextQuery)
      setSearchedQuery(nextQuery)
      setIsSearching(true)
      setSearchError('')
      setResults(null)
      setMeta({})

      try {
        const response = await directoryService.search(nextQuery, 'all', controller.signal)

        if (requestId !== searchRequestRef.current) {
          return
        }

        setResults(response.data)
        setMeta(response.meta)
      } catch (error) {
        if (controller.signal.aborted || requestId !== searchRequestRef.current) {
          return
        }

        setSearchError(
          error instanceof Error ? error.message : 'Something went wrong while searching. Please try again.',
        )
      } finally {
        if (requestId === searchRequestRef.current) {
          setIsSearching(false)
        }
      }
    },
    [clearSearch, setSearchParams],
  )

  useEffect(() => {
    return () => {
      searchAbortRef.current?.abort()
      searchRequestRef.current += 1
      lastUrlQueryRef.current = null
    }
  }, [])

  useEffect(() => {
    const urlQuery = searchParams.get('q')?.trim() ?? ''

    if (lastUrlQueryRef.current === urlQuery) {
      return
    }

    lastUrlQueryRef.current = urlQuery

    if (urlQuery) {
      void runSearch(urlQuery, { syncUrl: false })
      return
    }

    setQuery('')
    setSearchedQuery('')
    setResults(null)
    setMeta({})
    setSearchError('')
    setIsSearching(false)
  }, [searchParams, runSearch])

  useEffect(() => {
    const controller = new AbortController()

    const timer = window.setTimeout(async () => {
      const requestId = suggestionsRequestRef.current + 1
      suggestionsRequestRef.current = requestId

      setSuggestionsLoading(true)
      setSuggestionsError(false)

      try {
        const nextSuggestions = await directoryService.getSuggestions(query, controller.signal)

        if (requestId !== suggestionsRequestRef.current) {
          return
        }

        setSuggestions(nextSuggestions)
      } catch {
        if (controller.signal.aborted || requestId !== suggestionsRequestRef.current) {
          return
        }

        setSuggestions([])
        setSuggestionsError(true)
      } finally {
        if (requestId === suggestionsRequestRef.current) {
          setSuggestionsLoading(false)
        }
      }
    }, 300)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void runSearch(query)
  }

  const handleSuggestionClick = (suggestion: DirectorySuggestion) => {
    if (suggestion.type === 'label') {
      return
    }

    if (suggestion.action === 'browse_state') {
      navigate('/districts')
      return
    }

    if (suggestion.action === 'candidate_profile' && suggestion.id !== undefined) {
      navigate(`/profile/${suggestion.id}`)
      return
    }

    if (suggestion.action === 'party' && suggestion.id !== undefined) {
      navigate(`/party/${suggestion.id}`)
      return
    }

    if (typeof suggestion.query === 'string' && suggestion.query.trim()) {
      void runSearch(suggestion.query)
    }
  }

  const data = results ?? EMPTY_RESULTS
  const hasSearched = Boolean(searchedQuery)

  const counts = useMemo(() => {
    const total =
      data.states.length +
      data.districts.length +
      data.candidates.length +
      data.parties.length +
      data.elections.length +
      data.offices.length

    return {
      states: data.states.length,
      districts: data.districts.length,
      candidates: data.candidates.length,
      parties: data.parties.length,
      elections: data.elections.length,
      offices: data.offices.length,
      total,
    }
  }, [data])

  const candidateGroups = useMemo(() => {
    if (!data.candidates.length) {
      return []
    }

    const groups = new Map<
      string,
      { office: string; location: string; rank: number; items: DirectoryResultItem[] }
    >()

    for (const candidate of data.candidates) {
      const office = candidate.office?.trim() || 'Candidates'
      const location = candidate.location?.trim() || ''
      const key = `${office}::${location}`
      const existing = groups.get(key)

      if (existing) {
        existing.items.push(candidate)
      } else {
        groups.set(key, {
          office,
          location,
          rank: candidate.office_rank ?? 99,
          items: [candidate],
        })
      }
    }

    return Array.from(groups.values()).sort(
      (a, b) => a.rank - b.rank || a.office.localeCompare(b.office) || a.location.localeCompare(b.location),
    )
  }, [data])

  const entityCardCount =
    data.states.length +
    data.districts.length +
    data.parties.length +
    data.elections.length +
    data.offices.length

  const quickLinks = [
    {
      to: '/districts',
      title: 'Districts explorer',
      description: 'Browse national, state, and local districts.',
      icon: <MapPin className="h-5 w-5" aria-hidden="true" />,
      iconClassName: 'bg-emerald-50 text-emerald-600',
    },
    {
      to: '/leaders',
      title: 'Elected officials',
      description: 'See who currently holds each office.',
      icon: <Users className="h-5 w-5" aria-hidden="true" />,
      iconClassName: 'bg-amber-50 text-amber-600',
    },
    {
      to: '/elections',
      title: 'Elections',
      description: 'Explore elections and their timetables.',
      icon: <Landmark className="h-5 w-5" aria-hidden="true" />,
      iconClassName: 'bg-blue-50 text-blue-600',
    },
    {
      to: '/parties',
      title: 'Political parties',
      description: 'Compare parties, slogans, and philosophies.',
      icon: <Flag className="h-5 w-5" aria-hidden="true" />,
      iconClassName: 'bg-rose-50 text-rose-600',
    },
  ]

  const countSummary = [
    counts.candidates ? `${counts.candidates} candidate${counts.candidates === 1 ? '' : 's'}` : null,
    counts.districts ? `${counts.districts} district${counts.districts === 1 ? '' : 's'}` : null,
    counts.states ? `${counts.states} state${counts.states === 1 ? '' : 's'}` : null,
    counts.parties ? `${counts.parties} part${counts.parties === 1 ? 'y' : 'ies'}` : null,
    counts.elections ? `${counts.elections} election${counts.elections === 1 ? '' : 's'}` : null,
    counts.offices ? `${counts.offices} office${counts.offices === 1 ? '' : 's'}` : null,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <div className="min-h-screen bg-gray-50/60">
      <Helmet>
        <title>Directory - KYL</title>
        <meta
          name="description"
          content="Search Nigerian candidates, political parties, elections, districts, and offices in the KYL public directory."
        />
        <meta property="og:title" content="KYL Directory" />
        <meta
          property="og:description"
          content="Search candidates, parties, elections, districts, and offices across Nigeria."
        />
      </Helmet>

      <section
        className={`relative overflow-hidden bg-gradient-to-br from-[#0b3d2c] via-[#0f5a43] to-emerald-700 text-white transition-all duration-500 ${
          hasSearched ? 'pb-8 pt-10 sm:pb-10' : 'pb-14 pt-12 sm:pb-20 sm:pt-16'
        }`}
      >
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-emerald-300/10 blur-3xl" />

        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-50">
              <Search className="h-3.5 w-3.5" aria-hidden="true" /> Public directory
            </span>

            <h1
              className={`mt-5 font-extrabold tracking-tight ${
                hasSearched ? 'text-3xl sm:text-4xl' : 'text-4xl sm:text-5xl'
              }`}
            >
              KYL Directory
            </h1>
            <p
              className={`mx-auto mt-3 max-w-2xl leading-relaxed text-emerald-50/80 ${
                hasSearched ? 'text-sm' : 'text-sm sm:text-base'
              }`}
            >
              Search candidates, parties, elections, districts, and offices across Nigeria.
            </p>

            <form onSubmit={handleSubmit} className="mx-auto mt-6 flex w-full max-w-2xl flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <label htmlFor="directory-search" className="sr-only">
                  Search the directory
                </label>
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                  aria-hidden="true"
                />
                <input
                  ref={inputRef}
                  id="directory-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search candidates, parties, offices…"
                  autoComplete="off"
                  className="h-14 w-full rounded-2xl border-0 bg-white pl-12 pr-12 text-base text-gray-900 shadow-lg outline-none ring-1 ring-white/20 transition placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-300 [&::-webkit-search-cancel-button]:hidden"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={clearSearch}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146c4f]"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={isSearching}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-6 font-semibold text-emerald-950 shadow-lg transition hover:bg-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSearching ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                ) : (
                  <Search className="h-5 w-5" aria-hidden="true" />
                )}
                <span>Search</span>
              </button>
            </form>

            <p className="mt-3 text-xs text-emerald-100/70">
              Tip: combine a place and an office, like “Lagos Governor”.
            </p>

            <SuggestionPills
              suggestions={suggestions}
              loading={suggestionsLoading}
              error={suggestionsError}
              onSelect={handleSuggestionClick}
            />
          </div>
        </div>
      </section>

      {!hasSearched ? (
        <section className="container mx-auto px-4 pb-16 pt-10">
          <div className="mx-auto max-w-5xl">
            <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Not sure where to start?</h2>
                <p className="text-sm text-gray-500">Jump into the areas people look for most.</p>
              </div>
              <Link
                to="/districts"
                className="text-sm font-semibold text-[#146c4f] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146c4f]"
              >
                Browse everything →
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {quickLinks.map((link) => (
                <QuickLinkCard key={link.to} {...link} />
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900">Popular searches</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {POPULAR_SEARCHES.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => void runSearch(term)}
                    className="rounded-full border border-gray-200 bg-gray-50 px-3.5 py-1.5 text-sm font-medium text-gray-700 transition hover:border-[#146c4f]/30 hover:bg-emerald-50 hover:text-[#146c4f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146c4f]"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <div className="container mx-auto px-4 pb-16 pt-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#146c4f]">Search results</p>
                <h2 className="mt-1 truncate text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
                  {isSearching ? `Searching for “${searchedQuery}”…` : `Results for “${searchedQuery}”`}
                </h2>
                {!isSearching && !searchError ? (
                  <p className="mt-1 text-sm text-gray-500">
                    {counts.total > 0
                      ? `${counts.total} match${counts.total === 1 ? '' : 'es'} — ${countSummary}`
                      : meta.requires_state
                        ? 'Pick a state to continue.'
                        : 'No matches found.'}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={clearSearch}
                className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:border-[#146c4f]/30 hover:text-[#146c4f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146c4f]"
              >
                <X className="h-4 w-4" aria-hidden="true" /> Clear search
              </button>
            </div>

            <div aria-live="polite" className="sr-only">
              {isSearching
                ? 'Loading results'
                : searchError
                  ? 'The search failed'
                  : `${counts.total} results found`}
            </div>

            {isSearching ? (
              <ResultsSkeleton />
            ) : searchError ? (
              <SearchErrorState message={searchError} onRetry={() => void runSearch(searchedQuery)} />
            ) : (
              <div className="space-y-8">
                {meta.requires_state ? <RequiresStateNotice query={searchedQuery} /> : null}

                {counts.total === 0 && !meta.requires_state ? (
                  <SearchEmptyState query={searchedQuery} onClear={clearSearch} />
                ) : null}

                {candidateGroups.length > 0 ? (
                  <section aria-labelledby="candidates-heading" className="space-y-5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#146c4f]/10 text-[#146c4f]">
                        <User className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <h2 id="candidates-heading" className="text-xl font-bold text-gray-900">
                        Candidates
                      </h2>
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-500">
                        {counts.candidates}
                      </span>
                    </div>

                    <div className="space-y-6">
                      {candidateGroups.map((group) => (
                        <div key={`${group.office}-${group.location}`}>
                          <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="h-4 w-1 rounded-full bg-[#146c4f]" aria-hidden="true" />
                            <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[#146c4f]">
                              {group.office}
                            </h3>
                            {group.location ? (
                              <span className="text-sm font-medium text-gray-500">· {group.location}</span>
                            ) : null}
                            <span className="ml-auto text-xs font-semibold text-gray-400">{group.items.length}</span>
                          </div>

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {group.items.map((candidate) => (
                              <CandidateCard key={candidate.id} candidate={candidate} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {counts.candidates >= (meta.candidate_limit ?? 20) ? (
                      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        Showing the first {meta.candidate_limit ?? 20} candidate matches. Add a state, district, or
                        party to narrow the results.
                      </p>
                    ) : null}
                  </section>
                ) : null}

                {entityCardCount > 0 ? (
                  <section aria-labelledby="related-heading" className="space-y-5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                        <Layers className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <h2 id="related-heading" className="text-xl font-bold text-gray-900">
                        Related places, parties &amp; elections
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {data.states.length ? (
                        <InfoCard
                          title="States"
                          icon={<MapPin className="h-4 w-4" aria-hidden="true" />}
                          iconClassName="bg-red-50 text-red-600"
                          count={counts.states}
                        >
                          {data.states.map((state) => (
                            <EntityButtonRow
                              key={`state-${state.id}`}
                              title={state.title}
                              subtitle="Explore candidates in this state"
                              icon={<MapPin className="h-4 w-4" aria-hidden="true" />}
                              iconClassName="bg-red-50 text-red-500"
                              onClick={() => void runSearch(state.search_query ?? state.title.replace(/ State$/, ''))}
                            />
                          ))}
                        </InfoCard>
                      ) : null}

                      {data.districts.length ? (
                        <InfoCard
                          title="Districts"
                          icon={<MapPin className="h-4 w-4" aria-hidden="true" />}
                          iconClassName="bg-orange-50 text-orange-600"
                          count={counts.districts}
                        >
                          {data.districts.map((district) => (
                            <EntityButtonRow
                              key={`district-${district.type}-${district.id}`}
                              title={district.title}
                              subtitle={district.subtitle}
                              badge={DISTRICT_TYPE_LABELS[district.type]}
                              icon={<MapPin className="h-4 w-4" aria-hidden="true" />}
                              iconClassName="bg-orange-50 text-orange-500"
                              onClick={() => void runSearch(district.search_query ?? district.title)}
                            />
                          ))}
                        </InfoCard>
                      ) : null}

                      {data.parties.length ? (
                        <InfoCard
                          title="Parties"
                          icon={<Flag className="h-4 w-4" aria-hidden="true" />}
                          iconClassName="bg-emerald-50 text-emerald-600"
                          count={counts.parties}
                        >
                          {data.parties.map((party) => (
                            <PartyRow key={`party-${party.id}`} party={party} />
                          ))}
                        </InfoCard>
                      ) : null}

                      {data.elections.length ? (
                        <InfoCard
                          title="Elections"
                          icon={<Landmark className="h-4 w-4" aria-hidden="true" />}
                          iconClassName="bg-blue-50 text-blue-600"
                          count={counts.elections}
                        >
                          {data.elections.map((election) => (
                            <ElectionRow key={`election-${election.id}`} election={election} />
                          ))}
                        </InfoCard>
                      ) : null}

                      {data.offices.length ? (
                        <InfoCard
                          title="Offices"
                          icon={<Building2 className="h-4 w-4" aria-hidden="true" />}
                          iconClassName="bg-violet-50 text-violet-600"
                          count={counts.offices}
                        >
                          {data.offices.map((office) => (
                            <EntityButtonRow
                              key={`office-${office.id}`}
                              title={office.title}
                              subtitle={office.subtitle}
                              icon={<Building2 className="h-4 w-4" aria-hidden="true" />}
                              iconClassName="bg-violet-50 text-violet-500"
                              onClick={() => void runSearch(office.search_query ?? office.title)}
                            />
                          ))}
                        </InfoCard>
                      ) : null}
                    </div>
                  </section>
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
