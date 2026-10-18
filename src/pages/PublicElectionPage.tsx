import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  Filter,
  Landmark,
  MapPin,
  Users,
} from 'lucide-react'
import { getLogoUrl } from '@/lib/utils'
import { electionService, type Election, type ElectionTimetable } from '@/services/elections'
import { visitorService } from '@/services/visitors'

interface ElectionCandidate {
  id: number
  candidate_id?: number
  fullName: string
  party_id?: number
  party?: {
    id?: number
    name?: string
    description?: string | null
    acronym?: string | null
    logopath?: string | null
  } | null
  offices?: Array<{
    office_id?: number
    election_id?: number | string
    office?: { id?: number; title?: string; remark?: string | null } | null
  }>
  image?: Record<string, unknown> | null
  state_id?: number | null
  state?: { id?: number; name?: string } | null
}

interface PartyGroup {
  party: ElectionCandidate['party']
  candidates: ElectionCandidate[]
}

interface TimetableWithGroups extends ElectionTimetable {
  partyGroups: PartyGroup[]
}

interface StateRecord {
  id: number
  name: string
}

const getInitials = (name?: string) =>
  (name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.replace(/[^a-zA-Z]/g, '').charAt(0).toUpperCase())
    .join('') || 'NA'

const getOfficeTitle = (timetable: ElectionTimetable) => {
  if (timetable.office_id === 1 || timetable.office_id === 2) {
    return 'Presidency (President & Vice President)'
  }
  if (timetable.office_id === 3 || timetable.office_id === 4) {
    return 'Governorship (Governor & Deputy Governor)'
  }
  if (timetable.office_id === 8 || timetable.office_id === 9) {
    return 'Local Government (Chairman & Vice Chairman)'
  }
  return timetable.office_name || `Office #${timetable.office_id ?? '—'}`
}

const getDateParts = (value?: string) => {
  if (!value) return null
  const parsed = new Date(value.length <= 10 ? `${value}T00:00:00` : value)
  if (Number.isNaN(parsed.getTime())) return null
  return {
    month: parsed.toLocaleDateString('en-NG', { month: 'short' }),
    day: parsed.toLocaleDateString('en-NG', { day: '2-digit' }),
    full: parsed.toLocaleDateString('en-NG', { month: 'long', day: 'numeric', year: 'numeric' }),
  }
}

const formatTime = (value?: string) => {
  if (!value) return null
  const parsed = new Date(`1970-01-01T${value}`)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' })
}

const getStatusClasses = (status?: string) => {
  const normalized = String(status ?? '').toLowerCase()
  if (normalized === 'ongoing') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (normalized === 'completed') return 'border-gray-200 bg-gray-100 text-gray-600'
  return 'border-sky-200 bg-sky-50 text-sky-700'
}

const getElectionStatusClasses = (status?: string) => {
  const normalized = String(status ?? '').toLowerCase()
  if (normalized === 'ongoing') return 'border-emerald-300/30 bg-emerald-400/15 text-emerald-100'
  if (normalized === 'upcoming') return 'border-sky-300/30 bg-sky-400/15 text-sky-100'
  return 'border-white/15 bg-white/10 text-white'
}

const getCandidateOfficeTitle = (candidate: ElectionCandidate, timetable: ElectionTimetable) => {
  const entry = candidate.offices?.find(
    (office) => Number(office.election_id) === Number(timetable.election_id),
  )
  return entry?.office?.title || entry?.office?.remark || getOfficeTitle(timetable)
}

const getCandidateStateId = (candidate: ElectionCandidate) =>
  candidate.state_id ?? candidate.state?.id ?? null

function TimetableCard({ timetable }: { timetable: TimetableWithGroups }) {
  const date = getDateParts(timetable.date)
  const startTime = formatTime(timetable.starttime)
  const endTime = formatTime(timetable.endtime)
  const ticketCount = timetable.partyGroups.length
  const candidateCount = timetable.partyGroups.reduce(
    (sum, group) => sum + group.candidates.length,
    0,
  )

  return (
    <article className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_4px_24px_rgb(0,0,0,0.04)]">
      <div className="flex flex-col gap-5 border-b border-gray-100 p-6 sm:flex-row sm:items-start sm:justify-between sm:p-8">
        <div className="flex items-start gap-5">
          <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-[#146c4f]/5 text-[#146c4f] ring-1 ring-[#146c4f]/10">
            {date ? (
              <>
                <span className="text-[10px] font-bold uppercase tracking-[0.14em]">{date.month}</span>
                <span className="text-2xl font-extrabold leading-none">{date.day}</span>
              </>
            ) : (
              <CalendarDays className="h-6 w-6" aria-hidden="true" />
            )}
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#146c4f]">
              {timetable.election_type_name || 'Election office'}
            </p>
            <h2 className="mt-1 text-xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-2xl">
              {getOfficeTitle(timetable)}
            </h2>
            {timetable.description ? (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">
                {timetable.description}
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-gray-500">
              {date ? (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
                  {date.full}
                </span>
              ) : null}
              {startTime ? (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
                  {startTime}
                  {endTime ? ` – ${endTime}` : ''}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
                {candidateCount} candidate{candidateCount === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        </div>

        <span
          className={`inline-flex w-fit shrink-0 items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${getStatusClasses(
            timetable.status,
          )}`}
        >
          {String(timetable.status).toLowerCase() === 'completed' ? (
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {timetable.status || 'Upcoming'}
        </span>
      </div>

      <div className="p-6 sm:p-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-gray-400">
            Contested tickets
          </h3>
          <span className="text-xs font-semibold text-gray-400">
            {ticketCount} part{ticketCount === 1 ? 'y' : 'ies'}
          </span>
        </div>

        {timetable.partyGroups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
            <Users className="mx-auto h-6 w-6 text-gray-300" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold text-gray-600">
              No candidates have registered for this office yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {timetable.partyGroups.map((group, groupIndex) => {
              const partyName = group.party?.description || group.party?.name || 'Independent'
              const partyCode = group.party?.name || 'IND'
              const logoUrl = getLogoUrl(group.party?.logopath)

              return (
                <div
                  key={`${group.party?.id ?? 'party'}-${groupIndex}`}
                  className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-gray-50/50"
                >
                  <Link
                    to={group.party?.id ? `/party/${group.party.id}` : '/parties'}
                    className="group/party flex items-center justify-between gap-3 border-b border-gray-100 bg-white px-4 py-3.5 transition hover:bg-emerald-50/50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-white p-1 shadow-sm">
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt=""
                            className="h-full w-full object-contain"
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-[10px] font-bold text-gray-400">
                            {getInitials(partyCode)}
                          </span>
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-gray-900 transition-colors group-hover/party:text-[#146c4f]">
                          {partyName}
                        </p>
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                          {partyCode}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" aria-hidden="true" />
                  </Link>

                  <div className="flex flex-col gap-1 p-2">
                    {group.candidates.map((candidate) => {
                      const candidateName = candidate.fullName || 'Unnamed candidate'
                      const candidateImage = getLogoUrl(candidate.image)
                      const officeTitle = getCandidateOfficeTitle(candidate, timetable)
                      const profileId = candidate.candidate_id || candidate.id

                      return (
                        <Link
                          key={candidate.id}
                          to={`/profile/${profileId}`}
                          className="group/candidate flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-white"
                        >
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-gray-100 text-xs font-extrabold text-gray-500 shadow-sm">
                            {candidateImage ? (
                              <img
                                src={candidateImage}
                                alt=""
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              getInitials(candidateName)
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-bold text-gray-900 transition-colors group-hover/candidate:text-[#146c4f]">
                              {candidateName}
                            </span>
                            <span className="block truncate text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">
                              {officeTitle}
                            </span>
                          </span>
                          <ChevronRight
                            className="h-4 w-4 shrink-0 text-gray-300 transition group-hover/candidate:translate-x-0.5 group-hover/candidate:text-[#146c4f]"
                            aria-hidden="true"
                          />
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </article>
  )
}

export default function PublicElectionPage() {
  const { id } = useParams<{ id: string }>()
  const [election, setElection] = useState<Election | null>(null)
  const [timetables, setTimetables] = useState<ElectionTimetable[]>([])
  const [candidatesMap, setCandidatesMap] = useState<Record<number, ElectionCandidate[]>>({})
  const [states, setStates] = useState<StateRecord[]>([])
  const [selectedState, setSelectedState] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) {
      setLoading(false)
      setError('This election could not be found.')
      return
    }

    let cancelled = false

    const fetchData = async () => {
      const parsedId = Number.parseInt(id, 10)

      try {
        const [electionData, statesData, timetablesData] = await Promise.all([
          electionService.getElectionById(parsedId),
          visitorService.getStates().catch(() => []),
          electionService.getElectionTimetables(parsedId),
        ])

        if (cancelled) return

        setElection(electionData)
        setStates(Array.isArray(statesData) ? statesData : [])
        setTimetables(timetablesData)

        const candidateEntries = await Promise.all(
          timetablesData.map(async (timetable): Promise<[number, ElectionCandidate[]]> => {
            if (!timetable.id) return [0, []]
            try {
              const candidates = await electionService.getTimetableCandidates(timetable.id)
              return [timetable.id, candidates as ElectionCandidate[]]
            } catch {
              return [timetable.id, []]
            }
          }),
        )

        if (cancelled) return

        const nextMap: Record<number, ElectionCandidate[]> = {}
        candidateEntries.forEach(([timetableId, candidates]) => {
          if (timetableId) nextMap[timetableId] = candidates
        })
        setCandidatesMap(nextMap)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load election details')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void fetchData()

    return () => {
      cancelled = true
    }
  }, [id])

  const groupedTimetables = useMemo<TimetableWithGroups[]>(() => {
    const stateFilterId = selectedState ? Number(selectedState) : null

    return timetables
      .map((timetable) => {
        let timetableCandidates = [...(timetable.id ? candidatesMap[timetable.id] || [] : [])]

        if (stateFilterId) {
          timetableCandidates = timetableCandidates.filter((candidate) => {
            const isNationwideOffice = timetable.office_id === 1 || timetable.office_id === 2
            if (isNationwideOffice) return true
            const candidateStateId = getCandidateStateId(candidate)
            if (candidateStateId === null) return true
            return candidateStateId === stateFilterId
          })
        }

        const groups = new Map<number, PartyGroup>()

        timetableCandidates.forEach((candidate) => {
          const partyId = candidate.party_id ?? candidate.party?.id
          if (!partyId) return

          if (!groups.has(partyId)) {
            groups.set(partyId, {
              party: candidate.party,
              candidates: [],
            })
          }
          groups.get(partyId)?.candidates.push(candidate)
        })

        groups.forEach((group) => {
          group.candidates.sort((a, b) => {
            const getOfficeId = (candidate: ElectionCandidate) => {
              const entry = candidate.offices?.find(
                (office) => Number(office.election_id) === Number(timetable.election_id),
              )
              return entry?.office_id ?? 999
            }
            return getOfficeId(a) - getOfficeId(b)
          })
        })

        return {
          ...timetable,
          partyGroups: Array.from(groups.values()),
        }
      })
      .filter((timetable) => {
        if (!stateFilterId) return true
        if (timetable.office_id === 1 || timetable.office_id === 2) return true
        return timetable.partyGroups.length > 0
      })
  }, [timetables, candidatesMap, selectedState])

  const candidateCount = useMemo(
    () =>
      Object.values(candidatesMap).reduce((sum, candidates) => sum + candidates.length, 0),
    [candidatesMap],
  )

  const selectedStateName = states.find((state) => state.id.toString() === selectedState)?.name

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#f7f8f5]">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-gray-200 border-t-[#146c4f]" />
      </div>
    )
  }

  if (!election) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-[#f7f8f5] px-4 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          <Landmark className="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900">Election not found</h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-500">
          {error || 'This election may have been removed or the link is incomplete.'}
        </p>
        <Link
          to="/elections"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#146c4f] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#10563f]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to elections
        </Link>
      </div>
    )
  }

  const title = election.details || `${election.year} General Election`

  return (
    <div className="bg-[#f7f8f5]">
      <Helmet>
        <title>{title} | Know Your Leaders</title>
        <meta
          name="description"
          content={`Explore the offices, candidates, and timetable for ${title}.`}
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
        <div className="pointer-events-none absolute -bottom-24 right-8 text-[13rem] font-black leading-none text-white/[0.04]" aria-hidden="true">
          {election.year}
        </div>

        <div className="container relative mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <Link
            to="/elections"
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-100/70 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All elections
          </Link>

          <div className="mt-8 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-50">
              <Landmark className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
              {election.year} election
            </span>
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${getElectionStatusClasses(
                election.status,
              )}`}
            >
              {String(election.status).toLowerCase() === 'ongoing' ? (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
                </span>
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {election.status}
            </span>
          </div>

          <h1 className="mt-5 max-w-4xl text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-emerald-50/75 sm:text-lg">
            Follow the offices on the ballot, the tickets contesting them, and every date on the
            election timetable.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:max-w-3xl">
            {[
              { label: 'Election year', value: election.year, icon: CalendarDays },
              { label: 'Status', value: election.status, icon: CheckCircle2 },
              { label: 'Offices', value: timetables.length, icon: Landmark },
              { label: 'Candidates', value: candidateCount, icon: Users },
            ].map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-emerald-100/60">
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em]">{stat.label}</span>
                  </div>
                  <p className="mt-1.5 text-2xl font-extrabold leading-none text-white">{stat.value}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-6xl px-4 py-12 sm:py-16">
        {error ? (
          <div
            role="alert"
            className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-medium text-red-700"
          >
            {error}
          </div>
        ) : null}

        <div className="mb-8 flex flex-col gap-5 border-b border-gray-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#146c4f]">
              Election timetable
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">
              Offices and contested tickets.
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              {selectedStateName
                ? `Showing offices with candidates connected to ${selectedStateName}.`
                : 'Browse every office in this election and the parties contesting it.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
            <label htmlFor="election-state-filter" className="sr-only">
              Filter election timetable by state
            </label>
            <select
              id="election-state-filter"
              value={selectedState}
              onChange={(event) => setSelectedState(event.target.value)}
              className="h-11 min-w-[14rem] rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm outline-none transition focus:border-[#146c4f] focus:ring-2 focus:ring-[#146c4f]/20"
            >
              <option value="">All states (nationwide)</option>
              {states.map((state) => (
                <option key={state.id} value={state.id}>
                  {state.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {groupedTimetables.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white/70 p-12 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
              <MapPin className="h-7 w-7" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-xl font-bold text-gray-900">
              No offices matched this filter
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-500">
              {selectedStateName
                ? `There are no registered candidates connected to ${selectedStateName} for the offices in this election.`
                : 'No timetable has been published for this election yet.'}
            </p>
            {selectedState ? (
              <button
                type="button"
                onClick={() => setSelectedState('')}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#146c4f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#10563f]"
              >
                View all states <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>
        ) : (
          <div className="space-y-5">
            {groupedTimetables.map((timetable, index) => (
              <div key={timetable.id ?? index} className="relative">
                {index < groupedTimetables.length - 1 ? (
                  <span
                    className="pointer-events-none absolute -bottom-5 left-8 hidden h-5 w-px bg-gray-200 sm:block"
                    aria-hidden="true"
                  />
                ) : null}
                <TimetableCard timetable={timetable} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
