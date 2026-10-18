import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ArrowRight, CalendarDays, Flag, Search, UsersRound, X } from 'lucide-react'
import type { Party } from '@/services/parties'
import { getPartyLogoValue } from '@/lib/utils'

interface PartiesResponse {
  success?: boolean
  data?: Party[]
  message?: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

const cleanText = (value?: string | null) => (value ?? '').replace(/\s+/g, ' ').trim()

function PartyCard({ party }: { party: Party }) {
  const logoUrl = getPartyLogoValue(party)
  const slogan = cleanText(party.slogan)
  const philosophy = cleanText(party.philosophy)
  const foundingYear = party.registrationYear ? String(party.registrationYear).trim() : ''
  const fullName = party.description || party.name

  return (
    <Link
      to={`/party/${party.id}`}
      className="group flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_4px_24px_rgb(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-[#146c4f]/25 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146c4f] focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between gap-4">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl ${
            logoUrl
              ? 'border border-gray-100 bg-white p-2'
              : 'bg-gradient-to-br from-[#072b20] to-[#146c4f] text-white'
          }`}
        >
          {logoUrl ? (
            <img src={logoUrl} alt={`${party.name} logo`} className="h-full w-full object-contain" loading="lazy" />
          ) : (
            <span className="text-lg font-extrabold tracking-tight">{party.name}</span>
          )}
        </div>

        {foundingYear && (
          <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-[#f7f8f5] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-gray-500">
            <CalendarDays className="h-3 w-3" aria-hidden="true" />
            Est. {foundingYear}
          </span>
        )}
      </div>

      <p className="mt-4 text-[9px] font-bold uppercase tracking-[0.16em] text-[#146c4f]">{party.name}</p>
      <h2 className="mt-1 text-lg font-extrabold leading-tight tracking-tight text-gray-900 transition-colors group-hover:text-[#146c4f]">
        {fullName}
      </h2>

      {slogan && (
        <p className="mt-3 border-l-2 border-emerald-200 pl-2.5 text-xs italic leading-relaxed text-gray-500">
          “{slogan}”
        </p>
      )}

      {philosophy && (
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-gray-500">{philosophy}</p>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-gray-100 pt-4">
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-400">
          <UsersRound className="h-3.5 w-3.5" aria-hidden="true" />
          Political party
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#146c4f]">
          View profile
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </span>
      </div>
    </Link>
  )
}

function PartySkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-gray-100 bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="h-14 w-14 animate-pulse rounded-xl bg-gray-100" />
            <div className="h-6 w-20 animate-pulse rounded-full bg-gray-100" />
          </div>
          <div className="mt-5 h-2.5 w-20 animate-pulse rounded bg-gray-100" />
          <div className="mt-2.5 h-5 w-3/4 animate-pulse rounded bg-gray-100" />
          <div className="mt-3 h-12 animate-pulse rounded-lg bg-gray-50" />
          <div className="mt-4 h-4 w-28 animate-pulse rounded bg-gray-100" />
        </div>
      ))}
    </div>
  )
}

export default function PublicPartiesPage() {
  const [parties, setParties] = useState<Party[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    const fetchParties = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await fetch(`${API_BASE_URL}/parties`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch parties')
        }

        const responseData = (await response.json()) as PartiesResponse
        if (!Array.isArray(responseData.data)) {
          throw new Error(responseData.message || 'Invalid parties data')
        }

        if (!cancelled) {
          setParties(responseData.data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load parties')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void fetchParties()

    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const filteredParties = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return parties

    return parties.filter((party) =>
      [party.name, party.description, party.slogan, party.philosophy].some((value) =>
        cleanText(value).toLowerCase().includes(term),
      ),
    )
  }, [parties, searchTerm])

  const foundingYears = useMemo(
    () => parties
      .map((party) => Number(party.registrationYear))
      .filter((year) => Number.isFinite(year) && year > 0),
    [parties],
  )

  const oldestYear = foundingYears.length > 0 ? Math.min(...foundingYears) : null
  const newestYear = foundingYears.length > 0 ? Math.max(...foundingYears) : null
  const stats = [
    { label: 'Registered parties', value: loading ? '—' : parties.length, icon: Flag },
    { label: 'Oldest founding', value: oldestYear ?? '—', icon: CalendarDays },
    { label: 'Newest founding', value: newestYear ?? '—', icon: UsersRound },
  ]

  return (
    <div className="bg-[#f7f8f5]">
      <Helmet>
        <title>Political Parties | Know Your Leaders</title>
        <meta
          name="description"
          content="Explore registered Nigerian political parties, their slogans, philosophies, and founding years."
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
        <div className="pointer-events-none absolute -bottom-16 right-4 text-[13rem] font-black leading-none text-white/[0.03] sm:text-[17rem]" aria-hidden="true">
          PARTY
        </div>

        <div className="container relative mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-50 backdrop-blur">
              <Flag className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
              The party system
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
              Parties that <span className="text-emerald-300">shape the ballot.</span>
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-emerald-50/75 sm:text-lg">
              Browse registered political parties, the ideas they stand for, and the identities behind
              the names on the ballot.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-3">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-emerald-100/70">
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em]">{stat.label}</span>
                  </div>
                  <p className="mt-2 text-2xl font-extrabold leading-none text-white sm:text-3xl">{stat.value}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="mb-8 flex flex-col gap-5 border-b border-gray-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#146c4f]">Party directory</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">
              {searchTerm ? 'Search results' : 'All political parties'}
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              {loading
                ? 'Loading the party directory...'
                : searchTerm
                  ? `${filteredParties.length} of ${parties.length} parties match “${searchTerm.trim()}”.`
                  : `${parties.length} registered parties in the public directory.`}
            </p>
          </div>

          <div className="relative w-full lg:w-80">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <input
              type="search"
              aria-label="Search parties"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search parties, slogans, ideas..."
              className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-10 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#146c4f] focus:ring-2 focus:ring-[#146c4f]/15"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <PartySkeleton />
        ) : error ? (
          <div role="alert" className="rounded-3xl border border-red-100 bg-red-50 p-8 text-center">
            <p className="font-semibold text-red-700">We could not load the parties.</p>
            <p className="mt-1 text-sm text-red-600">{error}</p>
            <button
              type="button"
              onClick={() => setReloadKey((key) => key + 1)}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#146c4f] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#10563f]"
            >
              Try again
            </button>
          </div>
        ) : filteredParties.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white/70 p-12 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
              <Search className="h-7 w-7" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-xl font-bold text-gray-900">No parties found</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-500">
              No party matches “{searchTerm.trim()}”. Try a different name, acronym, slogan, or idea.
            </p>
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#146c4f] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#10563f]"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filteredParties.map((party) => (
              <PartyCard key={party.id} party={party} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
