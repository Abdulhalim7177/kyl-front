import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  GraduationCap,
  Landmark,
  Mail,
  MapPin,
  Phone,
  Trophy,
  UserRound,
  UsersRound,
} from 'lucide-react'
import { visitorService } from '@/services/visitors'
import { getLogoUrl } from '@/lib/utils'

type ImageValue = string | Record<string, unknown> | null

interface PartyRef {
  name?: string
  description?: string
  logopath?: ImageValue
}

interface OfficeRef {
  title?: string
  name?: string
  remark?: string
}

interface DistrictRef {
  name?: string
}

interface StateRef {
  name?: string
}

interface CandidateOffice {
  id?: number | string
  title?: string
  name?: string
  role?: string
  start_date?: string | null
  end_date?: string | null
  status?: string | number
  tenure?: string
  office?: OfficeRef
  party?: PartyRef
  state?: StateRef
  senetorialDistrict?: DistrictRef
  federalHouseDistrict?: DistrictRef
  stateHouseDistrict?: DistrictRef
  lgaDistrict?: DistrictRef & { state?: StateRef }
  ward?: DistrictRef
  election?: { year?: string | number }
}

interface CandidateProfile {
  id?: number
  fullName?: string
  full_name?: string
  bio?: string | null
  gender?: string | null
  dob?: string | null
  email?: string | null
  phoneNo?: string | null
  phone_no?: string | null
  address?: string | null
  image?: ImageValue
  photo?: ImageValue
  profile_photo?: ImageValue
  party?: PartyRef
  state?: StateRef
  lgaDistrict?: DistrictRef & { state?: StateRef }
  offices?: CandidateOffice[]
}

interface EducationRecord {
  degree?: string
  education_level?: string
  field_of_study?: string
  institution?: string
  country?: string
  start_year?: string | number | null
  graduation_year?: string | number | null
  year_of_graduation?: string | number | null
  description?: string
}

interface ExperienceRecord {
  title?: string
  job_title?: string
  organization?: string
  start_date?: string | null
  end_date?: string | null
  current?: boolean
  is_current?: number | boolean
  description?: string
}

interface AchievementRecord {
  title?: string
  description?: string
}

interface LeadershipRecord extends CandidateOffice {
  role?: string
  organization?: string
}

interface ProfileReturnState {
  profileReturnContext?: {
    governorStateId: number
    governorView: 'candidates' | 'elected'
    candidatePage?: number
  }
}

const asArray = <T,>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[]
  if (value && typeof value === 'object') {
    const data = (value as { data?: unknown }).data
    if (Array.isArray(data)) return data as T[]
  }
  return []
}

const formatDate = (value?: string | null) => {
  if (!value) return ''
  const parsed = new Date(value.length <= 10 ? `${value}T00:00:00` : value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatPeriod = (start?: string | null, end?: string | null, current?: boolean) => {
  const from = formatDate(start)
  const to = current ? 'Present' : formatDate(end)
  if (from && to) return `${from} – ${to}`
  if (from) return `From ${from}`
  if (to) return `Until ${to}`
  return 'Dates not listed'
}

const getOfficeArea = (office?: CandidateOffice) => {
  if (!office) return ''
  if (office.state?.name) return `${office.state.name} State`
  return office.senetorialDistrict?.name
    ?? office.federalHouseDistrict?.name
    ?? office.stateHouseDistrict?.name
    ?? office.lgaDistrict?.name
    ?? office.ward?.name
    ?? office.lgaDistrict?.state?.name
    ?? ''
}

const getOfficeTitle = (office?: CandidateOffice) =>
  office?.office?.title ?? office?.title ?? office?.name ?? office?.role ?? ''

function SectionHeading({
  eyebrow,
  title,
  icon: Icon,
}: {
  eyebrow: string
  title: string
  icon: typeof UserRound
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#146c4f]">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#146c4f]">{eyebrow}</p>
        <h2 className="text-xl font-extrabold tracking-tight text-gray-900">{title}</h2>
      </div>
    </div>
  )
}

function EmptyNote({ children }: { children: string }) {
  return (
    <p className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-[#f7f8f5] px-4 py-5 text-sm text-gray-500">
      {children}
    </p>
  )
}

function ProfileSkeleton() {
  return (
    <div className="bg-[#f7f8f5]">
      <div className="h-80 animate-pulse bg-[#072b20]" />
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <div className="h-56 animate-pulse rounded-3xl border border-gray-100 bg-white" />
            <div className="h-72 animate-pulse rounded-3xl border border-gray-100 bg-white" />
          </div>
          <div className="space-y-6">
            <div className="h-64 animate-pulse rounded-3xl border border-gray-100 bg-white" />
            <div className="h-52 animate-pulse rounded-3xl border border-gray-100 bg-white" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<CandidateProfile | null>(null)
  const [education, setEducation] = useState<EducationRecord[]>([])
  const [experiences, setExperiences] = useState<ExperienceRecord[]>([])
  const [achievements, setAchievements] = useState<AchievementRecord[]>([])
  const [offices, setOffices] = useState<CandidateOffice[]>([])
  const [leadership, setLeadership] = useState<LeadershipRecord[]>([])
  const [loading, setLoading] = useState(true)

  const navigateBack = () => {
    const state = location.state as ProfileReturnState | null

    if (state?.profileReturnContext) {
      navigate('/leaders', { state: { profileReturnContext: state.profileReturnContext } })
    } else if (location.key === 'default') {
      navigate('/leaders')
    } else {
      navigate(-1)
    }
  }

  useEffect(() => {
    if (!id) return

    let cancelled = false

    const fetchProfileData = async () => {
      setLoading(true)
      try {
        const [
          profileData,
          educationData,
          experiencesData,
          achievementsData,
          officesData,
          leadershipData,
        ] = await Promise.all([
          visitorService.getCandidateProfile(Number(id)).catch(() => null),
          visitorService.getCandidateEducation(Number(id)).catch(() => null),
          visitorService.getCandidateExperiences(Number(id)).catch(() => null),
          visitorService.getCandidateAchievements(Number(id)).catch(() => null),
          visitorService.getCandidateOffices(Number(id)).catch(() => null),
          visitorService.getCandidateLeadershipHistory(Number(id)).catch(() => null),
        ])

        if (cancelled) return

        setProfile(profileData as CandidateProfile | null)
        setEducation(asArray<EducationRecord>(educationData))
        setExperiences(asArray<ExperienceRecord>(experiencesData))
        setAchievements(asArray<AchievementRecord>(achievementsData))
        setOffices(asArray<CandidateOffice>(officesData))
        setLeadership(asArray<LeadershipRecord>(leadershipData))
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void fetchProfileData()

    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return <ProfileSkeleton />
  }

  if (!profile) {
    return (
      <div className="flex min-h-[65vh] flex-col items-center justify-center bg-[#f7f8f5] px-4 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          <UserRound className="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900">Profile not found</h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-500">
          The candidate or leader profile you are looking for does not exist or is inactive.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={navigateBack}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-700 transition hover:border-[#146c4f]/40 hover:text-[#146c4f]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
          </button>
          <Link
            to="/leaders"
            className="inline-flex items-center gap-2 rounded-xl bg-[#146c4f] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#10563f]"
          >
            Return to directory
          </Link>
        </div>
      </div>
    )
  }

  const candidateName = profile.fullName ?? profile.full_name ?? 'Profile'
  const profileImageUrl = getLogoUrl(profile.image ?? profile.photo ?? profile.profile_photo)
  const partyLogoUrl = getLogoUrl(profile.party?.logopath)
  const officeRecords = offices.length > 0 ? offices : (profile.offices ?? [])
  const primaryOffice = officeRecords[0] ?? leadership[0]
  const rawOfficeTitle = getOfficeTitle(primaryOffice)
  const officeArea = getOfficeArea(primaryOffice)
  const officeLabel = officeArea && !rawOfficeTitle.toLowerCase().includes('president')
    ? `${rawOfficeTitle} (${officeArea})`
    : rawOfficeTitle
  const partyName = profile.party?.name ?? 'Independent Candidate'
  const phone = profile.phoneNo ?? profile.phone_no
  const locationName = profile.state?.name ?? profile.lgaDistrict?.state?.name ?? profile.lgaDistrict?.name

  const contactItems = [
    profile.gender ? { label: profile.gender, icon: UserRound } : null,
    phone ? { label: phone, icon: Phone } : null,
    profile.email ? { label: profile.email, icon: Mail } : null,
  ].filter((item): item is { label: string; icon: typeof UserRound } => item !== null)

  const timelineExperiences = experiences
  const officeHistory = officeRecords
  const leadershipHistory = leadership

  return (
    <div className="bg-[#f7f8f5]">
      <Helmet>
        <title>{candidateName} | Know Your Leaders</title>
        <meta
          name="description"
          content={`Public profile for ${candidateName}${officeLabel ? `, ${officeLabel}` : ''}${partyName ? ` (${partyName})` : ''}.`}
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
        <div className="pointer-events-none absolute -bottom-14 right-4 text-[12rem] font-black leading-none text-white/[0.03] sm:text-[15rem]" aria-hidden="true">
          PROFILE
        </div>

        <div className="container relative mx-auto max-w-6xl px-4 py-8 sm:py-10">
          <button
            type="button"
            onClick={navigateBack}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-emerald-50/80 backdrop-blur transition hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
          </button>

          <div className="mt-8 flex flex-col gap-6 pb-4 sm:mt-10 sm:flex-row sm:items-end">
            <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white/15 bg-white/10 shadow-2xl ring-1 ring-white/20 sm:h-40 sm:w-40">
              {profileImageUrl ? (
                <img src={profileImageUrl} alt={candidateName} className="h-full w-full object-cover" />
              ) : (
                <span className="text-4xl font-extrabold text-emerald-100 sm:text-5xl">
                  {candidateName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {officeLabel && (
                  <span className="rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-100">
                    {officeLabel}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-50/80">
                  {partyLogoUrl ? (
                    <img src={partyLogoUrl} alt="" className="h-3.5 w-3.5 rounded-full object-contain" />
                  ) : (
                    <UsersRound className="h-3 w-3 text-emerald-300" aria-hidden="true" />
                  )}
                  {partyName}
                </span>
              </div>

              <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
                {candidateName}
              </h1>

              {locationName && (
                <p className="mt-3 flex items-center gap-2 text-sm text-emerald-50/70">
                  <MapPin className="h-4 w-4 text-emerald-300" aria-hidden="true" />
                  {locationName}
                </p>
              )}

              {contactItems.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {contactItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <span
                        key={`${item.label}-${item.icon.name}`}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-xs font-medium text-emerald-50/75"
                      >
                        <Icon className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
                        {item.label}
                      </span>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <article className="rounded-3xl border border-gray-100 bg-white p-7 shadow-[0_4px_24px_rgb(0,0,0,0.04)] sm:p-9">
              <SectionHeading eyebrow="Who they are" title="Biography" icon={UserRound} />
              <p className="mt-6 whitespace-pre-line text-base leading-relaxed text-gray-600 sm:text-lg">
                {profile.bio || 'No biography has been provided for this profile.'}
              </p>
            </article>

            <article className="rounded-3xl border border-gray-100 bg-white p-7 shadow-[0_4px_24px_rgb(0,0,0,0.04)] sm:p-9">
              <SectionHeading eyebrow="Career" title="Professional experience" icon={BriefcaseBusiness} />
              {timelineExperiences.length > 0 ? (
                <div className="mt-7 space-y-6">
                  {timelineExperiences.map((experience, index) => (
                    <div key={`${experience.job_title ?? experience.title ?? 'experience'}-${index}`} className="relative border-l border-gray-200 pl-6">
                      <span className="absolute -left-[7px] top-1.5 h-3.5 w-3.5 rounded-full border-4 border-white bg-[#146c4f] shadow-sm" aria-hidden="true" />
                      <h3 className="text-lg font-extrabold tracking-tight text-gray-900">
                        {experience.job_title || experience.title || 'Untitled role'}
                      </h3>
                      {experience.organization && (
                        <p className="mt-1 text-sm font-bold text-[#146c4f]">{experience.organization}</p>
                      )}
                      <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                        {formatPeriod(
                          experience.start_date,
                          experience.end_date,
                          experience.current ?? Boolean(experience.is_current),
                        )}
                      </p>
                      {experience.description && (
                        <p className="mt-3 text-sm leading-relaxed text-gray-600">{experience.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyNote>No professional experience records are available.</EmptyNote>
              )}
            </article>

            <article className="rounded-3xl border border-gray-100 bg-white p-7 shadow-[0_4px_24px_rgb(0,0,0,0.04)] sm:p-9">
              <SectionHeading eyebrow="Academic record" title="Education" icon={GraduationCap} />
              {education.length > 0 ? (
                <div className="mt-7 space-y-5">
                  {education.map((record, index) => {
                    const educationTitle = [record.education_level, record.field_of_study]
                      .filter(Boolean)
                      .join(' · ') || record.degree || 'Qualification'
                    const graduationYear = record.graduation_year ?? record.year_of_graduation
                    return (
                      <div key={`${educationTitle}-${index}`} className="rounded-2xl border border-gray-100 bg-[#f7f8f5] p-4">
                        <h3 className="font-extrabold text-gray-900">{educationTitle}</h3>
                        <p className="mt-1 text-sm font-medium text-gray-600">{record.institution || 'Institution not listed'}</p>
                        {(graduationYear || record.country) && (
                          <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                            {graduationYear ? `Graduated ${graduationYear}` : ''}
                            {graduationYear && record.country ? ' · ' : ''}
                            {record.country ?? ''}
                          </p>
                        )}
                        {record.description && (
                          <p className="mt-2 text-sm leading-relaxed text-gray-600">{record.description}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <EmptyNote>No education records are available.</EmptyNote>
              )}
            </article>
          </div>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-gray-100 bg-white p-7 shadow-[0_4px_24px_rgb(0,0,0,0.04)]">
              <SectionHeading eyebrow="Public office" title="Political offices" icon={Landmark} />
              {officeHistory.length > 0 ? (
                <div className="mt-6 space-y-3">
                  {officeHistory.map((office, index) => {
                    const title = getOfficeTitle(office) || 'Public office'
                    const area = getOfficeArea(office)
                    return (
                      <div key={`${title}-${index}`} className="rounded-2xl border border-gray-100 bg-[#f7f8f5] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-extrabold leading-snug text-gray-900">{title}</h3>
                          {office.status === 'active' || office.status === 1 ? (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-[#146c4f]">
                              <CheckCircle2 className="h-2.5 w-2.5" aria-hidden="true" /> Active
                            </span>
                          ) : null}
                        </div>
                        {area && <p className="mt-1 text-sm text-gray-500">{area}</p>}
                        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                          {formatPeriod(office.start_date, office.end_date)}
                        </p>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <EmptyNote>No political offices are recorded for this profile.</EmptyNote>
              )}
            </section>

            <section className="rounded-3xl border border-gray-100 bg-white p-7 shadow-[0_4px_24px_rgb(0,0,0,0.04)]">
              <SectionHeading eyebrow="Track record" title="Leadership history" icon={UsersRound} />
              {leadershipHistory.length > 0 ? (
                <div className="mt-6 space-y-4">
                  {leadershipHistory.map((record, index) => {
                    const title = getOfficeTitle(record) || record.role || 'Leadership role'
                    return (
                      <div key={`${title}-${index}`} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                        <h3 className="font-extrabold leading-snug text-gray-900">{title}</h3>
                        <p className="mt-1 text-sm text-gray-600">
                          {record.party?.name || record.organization || 'Public service'}
                          {record.election?.year ? ` · ${record.election.year}` : ''}
                        </p>
                        <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                          {record.tenure ? `${record.tenure} tenure · ` : ''}
                          {formatPeriod(record.start_date, record.end_date)}
                        </p>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <EmptyNote>No leadership history is recorded for this profile.</EmptyNote>
              )}
            </section>

            <section className="rounded-3xl border border-gray-100 bg-white p-7 shadow-[0_4px_24px_rgb(0,0,0,0.04)]">
              <SectionHeading eyebrow="Recognition" title="Achievements" icon={Trophy} />
              {achievements.length > 0 ? (
                <div className="mt-6 space-y-4">
                  {achievements.map((achievement, index) => (
                    <div key={`${achievement.title ?? 'achievement'}-${index}`} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[#146c4f]">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="text-sm font-extrabold leading-snug text-gray-900">
                          {achievement.title || 'Achievement'}
                        </h3>
                        {achievement.description && (
                          <p className="mt-1 text-sm leading-relaxed text-gray-600">{achievement.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyNote>No achievements are recorded for this profile.</EmptyNote>
              )}
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
                  to="/parties"
                  className="group flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-[#f7f8f5] px-4 py-3 text-sm font-bold text-gray-800 transition hover:border-[#146c4f]/25 hover:text-[#146c4f]"
                >
                  <span className="inline-flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-[#146c4f]" aria-hidden="true" /> Political parties
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
