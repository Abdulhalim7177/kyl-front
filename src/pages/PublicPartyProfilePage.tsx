import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Flag,
  Info,
  Landmark,
  MapPin,
  UsersRound,
} from 'lucide-react'
import type { Party } from '@/services/parties'
import { getPartyLogoValue } from '@/lib/utils'

interface PartyResponse {
  success?: boolean
  data?: Party
  message?: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

const cleanText = (value?: string | null) => (value ?? '').replace(/\s+/g, ' ').trim()

function PartyProfileSkeleton() {
  return (
    <div className="bg-[#f7f8f5]">
      <div className="h-80 animate-pulse bg-[#072b20]/95" />
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <div className="h-64 animate-pulse rounded-3xl border border-gray-100 bg-white" />
            <div className="h-40 animate-pulse rounded-3xl border border-gray-100 bg-white" />
          </div>
          <div className="space-y-6">
            <div className="h-56 animate-pulse rounded-3xl border border-gray-100 bg-white" />
            <div className="h-40 animate-pulse rounded-3xl border border-gray-100 bg-white" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PublicPartyProfilePage() {
  const { id } = useParams<{ id: string }>()
  const [party, setParty] = useState<Party | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      setError('This party could not be found.')
      return
    }

    let cancelled = false

    const fetchPartyData = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await fetch(`${API_BASE_URL}/parties/get-party/${id}`, {
          headers: { Accept: 'application/json' },
        })

        const responseData = (await response.json()) as PartyResponse

        if (!response.ok || !responseData.success || !responseData.data) {
          throw new Error(responseData.message || 'The political party could not be found.')
        }

        if (!cancelled) {
          setParty(responseData.data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load party details')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void fetchPartyData()

    return () => {
      cancelled = true
    }
  }, [id, reloadKey])

  if (loading) {
    return <PartyProfileSkeleton />
  }

  if (!party) {
    return (
      <div className="flex min-h-[65vh] flex-col items-center justify-center bg-[#f7f8f5] px-4 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          <Flag className="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900">Party not found</h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-500">
          {error || 'The political party you are looking for does not exist.'}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-700 transition hover:border-[#146c4f]/40 hover:text-[#146c4f]"
          >
            Try again
          </button>
          <Link
            to="/parties"
            className="inline-flex items-center gap-2 rounded-xl bg-[#146c4f] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#10563f]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All parties
          </Link>
        </div>
      </div>
    )
  }

  const logoUrl = getPartyLogoValue(party)
  const slogan = cleanText(party.slogan)
  const philosophy = cleanText(party.philosophy)
  const fullName = party.description || party.name
  const foundingYear = party.registrationYear ? String(party.registrationYear).trim() : ''
  const isActive = party.status === 1 || party.status === true
  const statusLabel = isActive ? 'Active' : 'Inactive'

  return (
    <div className="bg-[#f7f8f5]">
      <Helmet>
        <title>{`${fullName} (${party.name}) | Know Your Leaders`}</title>
        <meta
          name="description"
          content={`${fullName} — ${slogan || 'political party profile'}${foundingYear ? `, founded in ${foundingYear}` : ''}.`}
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
        <div className="pointer-events-none absolute -bottom-16 right-2 text-[11rem] font-black leading-none text-white/[0.035] sm:text-[16rem]" aria-hidden="true">
          {party.name}
        </div>

        <div className="container relative mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <Link
            to="/parties"
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-100/70 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All parties
          </Link>

          <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center">
            <div
              className={`flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-white/15 shadow-2xl sm:h-28 sm:w-28 ${
                logoUrl ? 'bg-white p-3' : 'bg-white/10 text-white backdrop-blur'
              }`}
            >
              {logoUrl ? (
                <img src={logoUrl} alt={`${party.name} logo`} className="h-full w-full object-contain" />
              ) : (
                <span className="text-3xl font-black tracking-tight">{party.name}</span>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-100">
                  {party.name}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-50/80">
                  <CheckCircle2 className="h-3 w-3 text-emerald-300" aria-hidden="true" />
                  {statusLabel}
                </span>
              </div>

              <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
                {fullName}
              </h1>

              {slogan && (
                <p className="mt-4 max-w-2xl border-l-2 border-emerald-300/40 pl-4 text-base italic leading-relaxed text-emerald-50/75 sm:text-lg">
                  “{slogan}”
                </p>
              )}
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
              <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-100/60">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" /> Founded
              </p>
              <p className="mt-2 text-xl font-extrabold text-white">{foundingYear || 'Not listed'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
              <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-100/60">
                <UsersRound className="h-3.5 w-3.5" aria-hidden="true" /> Acronym
              </p>
              <p className="mt-2 text-xl font-extrabold text-white">{party.name}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
              <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-100/60">
                <Flag className="h-3.5 w-3.5" aria-hidden="true" /> Party status
              </p>
              <p className="mt-2 text-xl font-extrabold text-white">{statusLabel}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <article className="rounded-3xl border border-gray-100 bg-white p-7 shadow-[0_4px_24px_rgb(0,0,0,0.04)] sm:p-9">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#146c4f]">
                  <Info className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#146c4f]">Ideas & direction</p>
                  <h2 className="text-xl font-extrabold tracking-tight text-gray-900">Philosophy and manifesto</h2>
                </div>
              </div>
              <p className="mt-6 whitespace-pre-line text-base leading-relaxed text-gray-600 sm:text-lg">
                {philosophy || 'No official philosophy or manifesto has been provided for this party.'}
              </p>
            </article>

            <article className="relative overflow-hidden rounded-3xl border border-[#0b3d2c] bg-gradient-to-br from-[#072b20] via-[#0b3d2c] to-[#146c4f] p-7 text-white shadow-[0_4px_24px_rgb(0,0,0,0.06)] sm:p-9">
              <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-emerald-300/20 blur-3xl" aria-hidden="true" />
              <p className="relative text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-200/70">In their words</p>
              <h2 className="relative mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
                {slogan ? `“${slogan}”` : `${fullName} party record`}
              </h2>
              <p className="relative mt-4 max-w-2xl text-sm leading-relaxed text-emerald-50/70 sm:text-base">
                {slogan
                  ? `The official slogan used by ${fullName} (${party.name}).`
                  : 'Explore the party’s identity, candidates, and election record across the public directory.'}
              </p>
            </article>
          </div>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-gray-100 bg-white p-7 shadow-[0_4px_24px_rgb(0,0,0,0.04)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#146c4f]">Party details</p>
              <h2 className="mt-1 text-xl font-extrabold tracking-tight text-gray-900">At a glance</h2>

              <dl className="mt-6 space-y-4">
                <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
                  <dt className="flex items-center gap-2 text-sm text-gray-500">
                    <Flag className="h-4 w-4 text-gray-400" aria-hidden="true" /> Acronym
                  </dt>
                  <dd className="text-sm font-bold text-gray-900">{party.name}</dd>
                </div>
                <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
                  <dt className="flex items-center gap-2 text-sm text-gray-500">
                    <CalendarDays className="h-4 w-4 text-gray-400" aria-hidden="true" /> Founded
                  </dt>
                  <dd className="text-sm font-bold text-gray-900">{foundingYear || 'Not listed'}</dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="flex items-center gap-2 text-sm text-gray-500">
                    <CheckCircle2 className="h-4 w-4 text-gray-400" aria-hidden="true" /> Status
                  </dt>
                  <dd className="text-sm font-bold text-[#146c4f]">{statusLabel}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-3xl border border-gray-100 bg-white p-7 shadow-[0_4px_24px_rgb(0,0,0,0.04)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#146c4f]">Headquarters</p>
              <h2 className="mt-1 text-xl font-extrabold tracking-tight text-gray-900">National secretariat</h2>
              <div className="mt-5 flex items-start gap-3 rounded-2xl bg-[#f7f8f5] p-4">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#146c4f]" aria-hidden="true" />
                <p className="text-sm leading-relaxed text-gray-600">
                  {party.address || 'The national secretariat address is not available in the public record.'}
                </p>
              </div>
              <div className="mt-4 flex items-start gap-3 rounded-2xl bg-[#f7f8f5] p-4">
                <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-[#146c4f]" aria-hidden="true" />
                <p className="text-sm leading-relaxed text-gray-600">
                  Registered political party in the Know Your Leaders public directory.
                </p>
              </div>
            </section>

            <section className="rounded-3xl border border-gray-100 bg-white p-7 shadow-[0_4px_24px_rgb(0,0,0,0.04)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#146c4f]">Keep exploring</p>
              <h2 className="mt-1 text-xl font-extrabold tracking-tight text-gray-900">Follow the record</h2>
              <div className="mt-5 space-y-2">
                <Link
                  to="/leaders"
                  className="group flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-[#f7f8f5] px-4 py-3 text-sm font-bold text-gray-800 transition hover:border-[#146c4f]/25 hover:text-[#146c4f]"
                >
                  <span className="inline-flex items-center gap-2">
                    <UsersRound className="h-4 w-4 text-[#146c4f]" aria-hidden="true" /> Elected leaders
                  </span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
                <Link
                  to="/elections"
                  className="group flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-[#f7f8f5] px-4 py-3 text-sm font-bold text-gray-800 transition hover:border-[#146c4f]/25 hover:text-[#146c4f]"
                >
                  <span className="inline-flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-[#146c4f]" aria-hidden="true" /> Elections
                  </span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </section>
    </div>
  )
}
