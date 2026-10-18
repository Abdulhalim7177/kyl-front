import { type FormEvent, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Landmark,
  Mail,
  MapPin,
  Phone,
  Search,
  UserRound,
  UsersRound,
  Vote,
  type LucideIcon,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { districtsService, District } from '@/services/districts';
import { Election, electionService } from '@/services/elections';
import { visitorService } from '@/services/visitors';
import { getLogoUrl } from '@/lib/utils';

interface LeaderCandidate {
  id?: number | string;
  fullName?: string;
  full_name?: string;
  name?: string;
  image?: string | Record<string, string | null | undefined> | null;
  phoneNo?: string;
  phone_no?: string;
  email?: string;
  party?: LeaderParty;
}

interface LeaderParty {
  name?: string;
  description?: string;
  logopath?: string | null;
}

interface DirectoryLeader {
  id: number | string;
  candidate_id?: number | string;
  party_id?: number;
  candidateId?: number | string;
  candidate?: LeaderCandidate;
  name?: string;
  position?: string;
  office?: { title?: string };
  party?: LeaderParty;
  partyName?: string;
  partyLogo?: string | null;
  election?: { year?: string | number; details?: string };
  state?: { name?: string };
  status?: string;
  start_date?: string;
  end_date?: string;
  tenure?: string;
  remark?: string;
  manifesto?: string;
}

type SenatorialView = 'candidates' | 'elected';
type FederalHouseView = 'candidates' | 'elected';

const SENATORIAL_DISTRICTS_PER_PAGE = 12;
const FEDERAL_HOUSE_DISTRICTS_PER_PAGE = 12;

interface CandidatePagination {
  currentPage: number;
  lastPage: number;
  total: number;
  perPage: number;
  from: number | null;
  to: number | null;
}

const INITIAL_CANDIDATE_PAGINATION: CandidatePagination = {
  currentPage: 1,
  lastPage: 1,
  total: 0,
  perPage: 15,
  from: null,
  to: null,
};

const CATEGORIES = [
  { id: 'presidency', label: 'Presidency', fetch: visitorService.getActiveElectedPresidency.bind(visitorService) },
  { id: 'governor', label: 'Governors', fetch: visitorService.getActiveElectedGovernor.bind(visitorService) },
  { id: 'senator', label: 'Senators', fetch: visitorService.getActiveElectedSenator.bind(visitorService) },
  { id: 'federal', label: 'House of Reps', fetch: visitorService.getActiveElectedHouseOfRepMember.bind(visitorService) },
  { id: 'state', label: 'State Assembly', fetch: visitorService.getActiveElectedStateAssemblyMember.bind(visitorService) },
  { id: 'lga', label: 'LGA Chairmen', fetch: visitorService.getActiveElectedLgaChairman.bind(visitorService) },
  { id: 'ward', label: 'Ward Councillors', fetch: visitorService.getActiveElectedWardCouncillor.bind(visitorService) },
];

const extractRecords = (response: unknown): DirectoryLeader[] => {
  if (Array.isArray(response)) return response as DirectoryLeader[];
  if (!response || typeof response !== 'object') return [];

  const payload = response as {
    id?: number | string;
    candidate?: unknown;
    data?: unknown;
    leaders?: unknown;
    candidates?: unknown;
  };

  if (Array.isArray(payload.data)) return payload.data as DirectoryLeader[];
  if (payload.data && typeof payload.data === 'object') {
    const nested = payload.data as { data?: unknown; id?: number | string; candidate?: unknown };
    if (Array.isArray(nested.data)) return nested.data as DirectoryLeader[];
    if (nested.id !== undefined || nested.candidate) return [nested as DirectoryLeader];
  }
  if (Array.isArray(payload.leaders)) return payload.leaders as DirectoryLeader[];
  if (Array.isArray(payload.candidates)) return payload.candidates as DirectoryLeader[];
  if (payload.id !== undefined || payload.candidate) return [payload as DirectoryLeader];
  return [];
};

const extractPaginatedRecords = (response: unknown) => {
  if (!response || typeof response !== 'object') {
    return { records: [] as DirectoryLeader[], pagination: INITIAL_CANDIDATE_PAGINATION };
  }

  const payload = response as {
    current_page?: number;
    last_page?: number;
    total?: number;
    per_page?: number;
    from?: number | null;
    to?: number | null;
    data?: unknown;
  };

  return {
    records: Array.isArray(payload.data) ? payload.data as DirectoryLeader[] : [],
    pagination: {
      currentPage: payload.current_page ?? 1,
      lastPage: payload.last_page ?? 1,
      total: payload.total ?? 0,
      perPage: payload.per_page ?? 15,
      from: payload.from ?? null,
      to: payload.to ?? null,
    },
  };
};

const extractStates = (response: unknown): District[] => {
  if (Array.isArray(response)) return response as District[];
  if (!response || typeof response !== 'object') return [];

  const payload = response as { data?: unknown };
  if (Array.isArray(payload.data)) return payload.data as District[];
  return [];
};

const fetchStates = async () => {
  try {
    return await districtsService.getStates();
  } catch (districtError) {
    try {
      const publicStates = await visitorService.getStates();
      const states = extractStates(publicStates);
      if (states.length > 0) return states;
      throw new Error('The public states endpoint returned no states.');
    } catch (visitorError) {
      const districtMessage = districtError instanceof Error ? districtError.message : 'Districts endpoint failed.';
      const visitorMessage = visitorError instanceof Error ? visitorError.message : 'Public states endpoint failed.';
      throw new Error(`${districtMessage} ${visitorMessage}`);
    }
  }
};

const formatDate = (date?: string) => {
  if (!date) return 'Not specified';
  const parsedDate = new Date(`${date.slice(0, 10)}T00:00:00`);
  return Number.isNaN(parsedDate.getTime())
    ? date
    : parsedDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

function GovernorLeaderCard({
  leader,
  selectedState,
  isCandidate,
  candidatePage,
  preserveGovernorReturn = true,
  officeFallback,
  locationOverride,
}: {
  leader: DirectoryLeader;
  selectedState: District;
  isCandidate: boolean;
  candidatePage: number;
  preserveGovernorReturn?: boolean;
  officeFallback?: string;
  locationOverride?: string;
}) {
  const candidate: LeaderCandidate = leader.candidate ?? {
    id: leader.candidate_id ?? leader.candidateId,
    fullName: leader.name,
  };
  const candidateName = candidate.fullName ?? candidate.full_name ?? candidate.name ?? leader.name ?? 'Name not available';
  const imageUrl = getLogoUrl(candidate.image);
  const party = leader.party ?? candidate.party;
  const partyLogo = getLogoUrl(party?.logopath ?? leader.partyLogo);
  const profileId = leader.candidate_id ?? leader.candidateId ?? candidate.id;
  const officeTitle = leader.office?.title ?? leader.position ?? officeFallback ?? (isCandidate ? 'Candidate' : 'Elected leader');
  const locationName = locationOverride ?? leader.state?.name ?? selectedState.state?.name ?? selectedState.name;
  const phone = candidate.phoneNo ?? candidate.phone_no;
  const status = leader.status || (isCandidate ? 'Candidate' : 'In office');

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_4px_24px_rgb(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#072b20] via-[#0b3d2c] to-[#146c4f] px-6 py-7 text-white sm:px-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '38px 38px',
          }}
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute -right-12 -top-14 h-44 w-44 rounded-full bg-emerald-300/20 blur-3xl" aria-hidden="true" />

        <div className="relative flex items-start justify-between gap-4">
          <Avatar className="h-20 w-20 border-4 border-white/15 shadow-xl ring-1 ring-white/20 sm:h-24 sm:w-24">
            {imageUrl && <AvatarImage src={imageUrl} alt={candidateName} className="object-cover" />}
            <AvatarFallback className="bg-white/10 text-2xl font-bold text-emerald-100">
              {candidateName.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/25 bg-emerald-300/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-100">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" aria-hidden="true" />
            {status}
          </span>
        </div>

        <div className="relative mt-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-200/80">{officeTitle}</p>
          <h2 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight text-white">{candidateName}</h2>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-emerald-50/70">
            <MapPin className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
            {locationName}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6 sm:p-8">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-[#f7f8f5] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">Political party</p>
            <div className="mt-2 flex items-center gap-2.5">
              <Avatar className="h-9 w-9 border border-gray-200 bg-white">
                {partyLogo && <AvatarImage src={partyLogo} alt={`${party?.name ?? 'Party'} logo`} className="object-contain p-1" />}
                <AvatarFallback className="text-xs font-bold text-[#146c4f]">{party?.name?.slice(0, 1) ?? 'P'}</AvatarFallback>
              </Avatar>
              <p className="truncate text-sm font-bold text-gray-800">{party?.name ?? leader.partyName ?? 'Not specified'}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-[#f7f8f5] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">Election</p>
            <p className="mt-2 text-sm font-bold text-gray-800">
              {leader.election?.year ?? leader.election?.details ?? 'Not specified'}
            </p>
          </div>

          {phone && (
            <div className="rounded-2xl border border-gray-100 bg-[#f7f8f5] p-4">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                <Phone className="h-3 w-3" aria-hidden="true" /> Phone
              </p>
              <p className="mt-2 truncate text-sm font-bold text-gray-800">{phone}</p>
            </div>
          )}

          {candidate.email && (
            <div className="rounded-2xl border border-gray-100 bg-[#f7f8f5] p-4">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                <Mail className="h-3 w-3" aria-hidden="true" /> Email
              </p>
              <p className="mt-2 truncate text-sm font-bold text-gray-800">{candidate.email}</p>
            </div>
          )}

          {!isCandidate && (
            <div className="rounded-2xl border border-gray-100 bg-[#f7f8f5] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">Term</p>
              <p className="mt-2 text-sm font-bold text-gray-800">{leader.tenure || 'Not specified'}</p>
            </div>
          )}

          {!isCandidate && (
            <div className="rounded-2xl border border-gray-100 bg-[#f7f8f5] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">Term dates</p>
              <p className="mt-2 text-sm font-bold text-gray-800">
                {formatDate(leader.start_date)} – {formatDate(leader.end_date)}
              </p>
            </div>
          )}
        </div>

        {(leader.remark || leader.manifesto) && (
          <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#146c4f]">
              {isCandidate ? 'Manifesto' : 'Remark'}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{leader.manifesto ?? leader.remark}</p>
          </div>
        )}

        {profileId && (
          <div className="mt-auto pt-6">
            <Link
              to={`/profile/${profileId}`}
              state={preserveGovernorReturn ? {
                profileReturnContext: {
                  governorStateId: selectedState.id,
                  governorView: isCandidate ? 'candidates' : 'elected',
                  candidatePage,
                },
              } : undefined}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#146c4f] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#10563f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146c4f] focus-visible:ring-offset-2"
            >
              View full profile <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}

function SectionIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto mb-8 max-w-2xl text-center">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#146c4f]">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">{title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-gray-500 sm:text-base">{description}</p>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  onBack,
  backLabel,
}: {
  eyebrow: string;
  title: string;
  description: string;
  onBack?: () => void;
  backLabel?: string;
}) {
  return (
    <div className="mb-7 flex flex-col gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#146c4f]">{eyebrow}</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">{title}</h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-500">{description}</p>
      </div>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-[#146c4f]/40 hover:text-[#146c4f] sm:self-auto"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {backLabel ?? 'Back'}
        </button>
      )}
    </div>
  );
}

function StateGrid({ states, onSelect }: { states: District[]; onSelect: (state: District) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {states.map((state) => (
        <button
          key={state.id}
          type="button"
          onClick={() => onSelect(state)}
          className="group flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-4 text-left shadow-[0_2px_12px_rgb(0,0,0,0.03)] transition-all hover:-translate-y-0.5 hover:border-[#146c4f]/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146c4f] focus-visible:ring-offset-2"
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[#146c4f]">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <span className="truncate text-sm font-bold text-gray-800 group-hover:text-[#146c4f]">{state.name}</span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[#146c4f]" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

function DistrictGrid({
  districts,
  stateName,
  onSelect,
}: {
  districts: District[];
  stateName: string;
  onSelect: (district: District) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {districts.map((district) => (
        <button
          key={district.id}
          type="button"
          onClick={() => onSelect(district)}
          className="group flex flex-col rounded-3xl border border-gray-100 bg-white p-6 text-left shadow-[0_4px_24px_rgb(0,0,0,0.04)] transition-all hover:-translate-y-1 hover:border-[#146c4f]/30 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146c4f] focus-visible:ring-offset-2"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#146c4f]">
            <Landmark className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-[#146c4f]">{stateName}</span>
          <span className="mt-1 text-xl font-extrabold leading-tight text-gray-900">{district.name}</span>
          {district.code && <span className="mt-1 text-sm text-gray-400">{district.code}</span>}
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#146c4f]">
            View district
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </span>
        </button>
      ))}
    </div>
  );
}

function ChoiceCard({
  eyebrow,
  title,
  description,
  cta,
  icon,
  onClick,
  tone = 'light',
}: {
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  icon: LucideIcon;
  onClick: () => void;
  tone?: 'light' | 'dark';
}) {
  const dark = tone === 'dark';
  const Icon = icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden rounded-3xl border p-7 text-left shadow-[0_4px_24px_rgb(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146c4f] focus-visible:ring-offset-2 sm:p-8 ${
        dark
          ? 'border-white/10 bg-[#072b20] text-white hover:border-emerald-300/30'
          : 'border-gray-100 bg-white hover:border-[#146c4f]/30'
      }`}
    >
      {dark && (
        <>
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
              backgroundSize: '38px 38px',
            }}
            aria-hidden="true"
          />
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-emerald-300/20 blur-3xl" aria-hidden="true" />
        </>
      )}

      <div
        className={`relative flex h-12 w-12 items-center justify-center rounded-2xl ${
          dark ? 'bg-white/10 text-emerald-300' : 'bg-emerald-50 text-[#146c4f]'
        }`}
      >
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <p className={`relative mt-5 text-[10px] font-bold uppercase tracking-[0.16em] ${dark ? 'text-emerald-200/70' : 'text-[#146c4f]'}`}>
        {eyebrow}
      </p>
      <h3 className={`relative mt-2 text-2xl font-extrabold leading-tight tracking-tight ${dark ? 'text-white' : 'text-gray-900'}`}>
        {title}
      </h3>
      <p className={`relative mt-2 text-sm leading-relaxed ${dark ? 'text-emerald-50/65' : 'text-gray-500'}`}>{description}</p>
      <span className={`relative mt-6 inline-flex items-center gap-2 text-sm font-bold ${dark ? 'text-emerald-300' : 'text-[#146c4f]'}`}>
        {cta}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
      </span>
    </button>
  );
}

function GenericLeaderCard({ leader, categoryLabel }: { leader: DirectoryLeader; categoryLabel: string }) {
  const candidate = leader.candidate;
  const candidateName = candidate?.fullName ?? candidate?.full_name ?? candidate?.name ?? leader.name ?? 'Name not available';
  const imageUrl = getLogoUrl(candidate?.image);
  const partyName = leader.party?.name ?? candidate?.party?.name ?? leader.partyName;
  const profileId = leader.candidate_id ?? leader.candidateId ?? candidate?.id;
  const officeTitle = leader.office?.title ?? leader.position ?? categoryLabel;

  return (
    <article className="group flex h-full flex-col rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_4px_24px_rgb(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="flex min-w-0 items-center gap-4">
        <Avatar className="h-16 w-16 shrink-0 border-4 border-white shadow-lg ring-2 ring-[#146c4f]/10">
          {imageUrl && <AvatarImage src={imageUrl} alt={candidateName} className="object-cover" />}
          <AvatarFallback className="bg-[#146c4f]/10 text-xl font-bold text-[#146c4f]">
            {candidateName.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-[10px] font-bold uppercase tracking-[0.16em] text-[#146c4f]">{officeTitle}</p>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#146c4f]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              {leader.status || 'Active'}
            </span>
          </div>
          <h3 className="mt-1 break-words text-lg font-extrabold leading-tight tracking-tight text-gray-900">{candidateName}</h3>
          {partyName && <p className="mt-1 truncate text-sm text-gray-500">{partyName}</p>}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2.5 text-sm">
        <div className="rounded-xl border border-gray-100 bg-[#f7f8f5] px-3 py-2.5">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-gray-400">Election</p>
          <p className="mt-1 truncate font-bold text-gray-800">{leader.election?.year ?? 'Current'}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-[#f7f8f5] px-3 py-2.5">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-gray-400">State</p>
          <p className="mt-1 truncate font-bold text-gray-800">{leader.state?.name ?? 'Federal'}</p>
        </div>
      </div>

      {profileId && (
        <div className="mt-auto pt-5">
          <Link
            to={`/profile/${profileId}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:border-[#146c4f]/40 hover:text-[#146c4f]"
          >
            View profile <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      )}
    </article>
  );
}

function PaginationBar({
  current,
  last,
  total,
  perPage,
  from,
  to,
  onPrevious,
  onNext,
  loading,
  label,
}: {
  current: number;
  last: number;
  total: number;
  perPage: number;
  from?: number | null;
  to?: number | null;
  onPrevious: () => void;
  onNext: () => void;
  loading?: boolean;
  label: string;
}) {
  if (last <= 1) return null;

  const start = from ?? (total === 0 ? 0 : (current - 1) * perPage + 1);
  const end = to ?? Math.min(current * perPage, total);

  return (
    <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-4 sm:flex-row">
      <p className="text-sm text-gray-500">
        Showing <span className="font-semibold text-gray-800">{start}–{end}</span> of{' '}
        <span className="font-semibold text-gray-800">{total}</span> {label}
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onPrevious}
          disabled={current <= 1 || loading}
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-[#146c4f]/40 hover:text-[#146c4f] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        <span className="text-sm font-medium text-gray-500">
          Page {current} of {last}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={current >= last || loading}
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-[#146c4f]/40 hover:text-[#146c4f] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function StateSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 12 }).map((_, index) => (
        <div key={index} className="h-[62px] animate-pulse rounded-2xl border border-gray-100 bg-white" />
      ))}
    </div>
  );
}

function LeaderSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-3xl border border-gray-100 bg-white">
          <div className="h-48 animate-pulse bg-gradient-to-br from-gray-100 to-gray-50" />
          <div className="space-y-4 p-7">
            <div className="h-16 animate-pulse rounded-2xl bg-gray-50" />
            <div className="h-16 animate-pulse rounded-2xl bg-gray-50" />
            <div className="h-11 animate-pulse rounded-xl bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function DirectorySkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="h-48 animate-pulse rounded-3xl border border-gray-100 bg-white" />
      ))}
    </div>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-3xl border border-red-100 bg-red-50 p-8 text-center">
      <p className="font-semibold text-red-700">We could not load the directory.</p>
      <p className="mt-1 text-sm text-red-600">{message}</p>
    </div>
  );
}

function EmptyPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-gray-300 bg-white/70 p-12 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        <UsersRound className="h-7 w-7" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-xl font-bold text-gray-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-500">{description}</p>
    </div>
  );
}

export default function LeadersDirectoryPage() {
  type GovernorView = 'candidates' | 'elected';
  const location = useLocation();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState(() =>
    location.state?.profileReturnContext ? CATEGORIES.find((category) => category.id === 'governor')! : CATEGORIES[0]
  );
  const [leaders, setLeaders] = useState<DirectoryLeader[]>([]);
  const [states, setStates] = useState<District[]>([]);
  const [selectedState, setSelectedState] = useState<District | null>(null);
  const [governorView, setGovernorView] = useState<GovernorView | null>(null);
  const [governorCandidates, setGovernorCandidates] = useState<DirectoryLeader[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  const [electionsLoading, setElectionsLoading] = useState(false);
  const [electionsError, setElectionsError] = useState('');
  const [candidateElectionYear, setCandidateElectionYear] = useState('');
  const [candidatePartyName, setCandidatePartyName] = useState('');
  const [candidateSearch, setCandidateSearch] = useState<{ electionId: number; partyId?: number } | null>(null);
  const [candidatePage, setCandidatePage] = useState(1);
  const [candidatePagination, setCandidatePagination] = useState(INITIAL_CANDIDATE_PAGINATION);
  const [electedGovernors, setElectedGovernors] = useState<DirectoryLeader[]>([]);
  const [electedElectionYear, setElectedElectionYear] = useState('');
  const [electedSearchElectionId, setElectedSearchElectionId] = useState<number | null>(null);
  const [senatorialDistricts, setSenatorialDistricts] = useState<District[]>([]);
  const [selectedSenatorialState, setSelectedSenatorialState] = useState<District | null>(null);
  const [selectedSenatorialDistrict, setSelectedSenatorialDistrict] = useState<District | null>(null);
  const [senatorialDistrictPage, setSenatorialDistrictPage] = useState(1);
  const [senatorialView, setSenatorialView] = useState<SenatorialView | null>(null);
  const [senatorialCandidates, setSenatorialCandidates] = useState<DirectoryLeader[]>([]);
  const [senatorialCandidatePage, setSenatorialCandidatePage] = useState(1);
  const [senatorialCandidatePagination, setSenatorialCandidatePagination] = useState(INITIAL_CANDIDATE_PAGINATION);
  const [electedSenators, setElectedSenators] = useState<DirectoryLeader[]>([]);
  const [federalHouseDistricts, setFederalHouseDistricts] = useState<District[]>([]);
  const [selectedFederalHouseState, setSelectedFederalHouseState] = useState<District | null>(null);
  const [selectedFederalHouseDistrict, setSelectedFederalHouseDistrict] = useState<District | null>(null);
  const [federalHouseDistrictPage, setFederalHouseDistrictPage] = useState(1);
  const [federalHouseView, setFederalHouseView] = useState<FederalHouseView | null>(null);
  const [federalHouseCandidates, setFederalHouseCandidates] = useState<DirectoryLeader[]>([]);
  const [federalHouseCandidatePage, setFederalHouseCandidatePage] = useState(1);
  const [federalHouseCandidatePagination, setFederalHouseCandidatePagination] = useState(INITIAL_CANDIDATE_PAGINATION);
  const [electedFederalHouseMembers, setElectedFederalHouseMembers] = useState<DirectoryLeader[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [profileReturnContext, setProfileReturnContext] = useState<{
    governorStateId: number;
    governorView: GovernorView;
    candidatePage?: number;
  } | null>(() => {
    const state = location.state as {
      profileReturnContext?: {
        governorStateId: number;
        governorView: GovernorView;
        candidatePage?: number;
      };
    } | null;
    return state?.profileReturnContext ?? null;
  });

  useEffect(() => {
    if (activeCategory.id !== 'governor' || !selectedState || !governorView) return;

    let cancelled = false;
    const loadElections = async () => {
      setElectionsLoading(true);
      setElectionsError('');
      try {
        const availableElections = await electionService.getAllElections();
        if (!cancelled) setElections(availableElections);
      } catch (error) {
        if (!cancelled) {
          setElections([]);
          setElectionsError(error instanceof Error ? error.message : 'Unable to load elections.');
        }
      } finally {
        if (!cancelled) setElectionsLoading(false);
      }
    };

    void loadElections();
    return () => {
      cancelled = true;
    };
  }, [activeCategory, governorView, selectedState]);

  useEffect(() => {
    let cancelled = false;

    const fetchDirectoryData = async () => {
      setLoading(true);
      setLoadError('');
      try {
        if (activeCategory.id === 'governor') {
          if (!selectedState) {
            const availableStates = await fetchStates();
            if (!cancelled) {
              setStates(availableStates);
              if (profileReturnContext) {
                const returnState = availableStates.find((state) => Number(state.id) === profileReturnContext.governorStateId);
                if (returnState) {
                  setSelectedState(returnState);
                  setGovernorView(profileReturnContext.governorView);
                  setCandidatePage(profileReturnContext.candidatePage ?? 1);
                }
                setProfileReturnContext(null);
                navigate(location.pathname, { replace: true, state: null });
              }
            }
            return;
          }

          if (!governorView) return;

          if (governorView === 'candidates') {
            const candidateParams: Record<string, string | number> = candidateSearch
              ? {
                  state_id: selectedState.id,
                  election_id: candidateSearch.electionId,
                  page: candidatePage,
                  ...(candidateSearch.partyId ? { party_id: candidateSearch.partyId } : {}),
                }
              : { state_id: selectedState.id, page: candidatePage };
            const candidateResponse = candidateSearch
              ? await visitorService.getGovernatorialCandidates(candidateParams)
              : await visitorService.getActiveGovernatorialCandidates(candidateParams);
            const result = extractPaginatedRecords(candidateResponse);
            if (!cancelled) {
              setGovernorCandidates(result.records);
              setCandidatePagination(result.pagination);
            }
          } else {
            const electedResponse = electedSearchElectionId
              ? await visitorService.getElectedGovernor({
                  state_id: selectedState.id,
                  election_id: electedSearchElectionId,
                })
              : await visitorService.getActiveElectedGovernor({ state_id: selectedState.id });
            if (!cancelled) setElectedGovernors(extractRecords(electedResponse));
          }
          return;
        }

        if (activeCategory.id === 'senator') {
          if (!selectedSenatorialState) {
            const availableStates = await fetchStates();
            if (!cancelled) setStates(availableStates);
            return;
          }

          if (!selectedSenatorialDistrict) {
            const response = await visitorService.getStateSenatorialDistricts(selectedSenatorialState.id);
            const stateDistricts = extractStates(response).map((district) => ({
              ...district,
              state_id: selectedSenatorialState.id,
              state: { id: selectedSenatorialState.id, name: selectedSenatorialState.name },
            }));
            if (!cancelled) setSenatorialDistricts(stateDistricts);
            return;
          }

          if (!senatorialView) return;

          if (senatorialView === 'candidates') {
            const response = await visitorService.getActiveSenatorialCandidates({
              senetorial_district_id: selectedSenatorialDistrict.id,
              page: senatorialCandidatePage,
            });
            const result = extractPaginatedRecords(response);
            if (!cancelled) {
              setSenatorialCandidates(result.records);
              setSenatorialCandidatePagination(result.pagination);
            }
          } else {
            const response = await visitorService.getActiveElectedSenator({
              senetorial_district_id: selectedSenatorialDistrict.id,
            });
            if (!cancelled) setElectedSenators(extractRecords(response));
          }
          return;
        }

        if (activeCategory.id === 'federal') {
          if (!selectedFederalHouseState) {
            const availableStates = await fetchStates();
            if (!cancelled) setStates(availableStates);
            return;
          }

          if (!selectedFederalHouseDistrict) {
            const response = await visitorService.getStateFederalHouseDistricts(selectedFederalHouseState.id);
            const stateDistricts = extractStates(response).map((district) => ({
              ...district,
              state_id: selectedFederalHouseState.id,
              state: { id: selectedFederalHouseState.id, name: selectedFederalHouseState.name },
            }));
            if (!cancelled) setFederalHouseDistricts(stateDistricts);
            return;
          }

          if (!federalHouseView) return;

          if (federalHouseView === 'candidates') {
            const response = await visitorService.getActiveFederalHouseCandidates({
              federal_house_district_id: selectedFederalHouseDistrict.id,
              page: federalHouseCandidatePage,
            });
            const result = extractPaginatedRecords(response);
            if (!cancelled) {
              setFederalHouseCandidates(result.records);
              setFederalHouseCandidatePagination(result.pagination);
            }
          } else {
            const response = await visitorService.getActiveElectedHouseOfRepMember({
              federal_house_district_id: selectedFederalHouseDistrict.id,
            });
            if (!cancelled) setElectedFederalHouseMembers(extractRecords(response));
          }
          return;
        }

        const response = await activeCategory.fetch();
        if (!cancelled) setLeaders(extractRecords(response));
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : `Unable to load ${activeCategory.label}.`);
          setLeaders([]);
          setGovernorCandidates([]);
          setElectedGovernors([]);
          setSenatorialCandidates([]);
          setElectedSenators([]);
          setFederalHouseCandidates([]);
          setElectedFederalHouseMembers([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchDirectoryData();
    return () => {
      cancelled = true;
    };
  }, [activeCategory, candidatePage, candidateSearch, electedSearchElectionId, federalHouseCandidatePage, federalHouseView, governorView, location.pathname, navigate, profileReturnContext, selectedFederalHouseDistrict, selectedFederalHouseState, selectedSenatorialDistrict, selectedSenatorialState, senatorialCandidatePage, senatorialView, selectedState]);

  const selectCategory = (category: (typeof CATEGORIES)[number]) => {
    setProfileReturnContext(null);
    setSelectedState(null);
    setGovernorView(null);
    setGovernorCandidates([]);
    setCandidateSearch(null);
    setCandidateElectionYear('');
    setCandidatePartyName('');
    setCandidatePage(1);
    setCandidatePagination(INITIAL_CANDIDATE_PAGINATION);
    setElectedGovernors([]);
    setElectedSearchElectionId(null);
    setElectedElectionYear('');
    setElections([]);
    setSenatorialDistricts([]);
    setSelectedSenatorialState(null);
    setSelectedSenatorialDistrict(null);
    setSenatorialDistrictPage(1);
    setSenatorialView(null);
    setSenatorialCandidates([]);
    setSenatorialCandidatePage(1);
    setSenatorialCandidatePagination(INITIAL_CANDIDATE_PAGINATION);
    setElectedSenators([]);
    setFederalHouseDistricts([]);
    setSelectedFederalHouseState(null);
    setSelectedFederalHouseDistrict(null);
    setFederalHouseDistrictPage(1);
    setFederalHouseView(null);
    setFederalHouseCandidates([]);
    setFederalHouseCandidatePage(1);
    setFederalHouseCandidatePagination(INITIAL_CANDIDATE_PAGINATION);
    setElectedFederalHouseMembers([]);
    setActiveCategory(category);
  };

  const selectGovernorView = (view: GovernorView) => {
    setGovernorView(view);
    setGovernorCandidates([]);
    setElectedGovernors([]);
    setCandidateSearch(null);
    setCandidateElectionYear('');
    setCandidatePartyName('');
    setElectedSearchElectionId(null);
    setElectedElectionYear('');
    setCandidatePage(1);
    setCandidatePagination(INITIAL_CANDIDATE_PAGINATION);
  };

  const selectSenatorialDistrict = (district: District) => {
    setSelectedSenatorialDistrict(district);
    setSenatorialView(null);
    setSenatorialCandidates([]);
    setElectedSenators([]);
    setSenatorialCandidatePage(1);
    setSenatorialCandidatePagination(INITIAL_CANDIDATE_PAGINATION);
  };

  const selectSenatorialState = (state: District) => {
    setSelectedSenatorialState(state);
    setSelectedSenatorialDistrict(null);
    setSenatorialDistricts([]);
    setSenatorialDistrictPage(1);
    setSenatorialView(null);
    setSenatorialCandidates([]);
    setElectedSenators([]);
  };

  const selectSenatorialView = (view: SenatorialView) => {
    setSenatorialView(view);
    setSenatorialCandidates([]);
    setElectedSenators([]);
    setSenatorialCandidatePage(1);
    setSenatorialCandidatePagination(INITIAL_CANDIDATE_PAGINATION);
  };

  const selectFederalHouseState = (state: District) => {
    setSelectedFederalHouseState(state);
    setSelectedFederalHouseDistrict(null);
    setFederalHouseDistricts([]);
    setFederalHouseDistrictPage(1);
    setFederalHouseView(null);
    setFederalHouseCandidates([]);
    setElectedFederalHouseMembers([]);
  };

  const selectFederalHouseDistrict = (district: District) => {
    setSelectedFederalHouseDistrict(district);
    setFederalHouseView(null);
    setFederalHouseCandidates([]);
    setElectedFederalHouseMembers([]);
    setFederalHouseCandidatePage(1);
    setFederalHouseCandidatePagination(INITIAL_CANDIDATE_PAGINATION);
  };

  const selectFederalHouseView = (view: FederalHouseView) => {
    setFederalHouseView(view);
    setFederalHouseCandidates([]);
    setElectedFederalHouseMembers([]);
    setFederalHouseCandidatePage(1);
    setFederalHouseCandidatePagination(INITIAL_CANDIDATE_PAGINATION);
  };

  const searchGovernorCandidates = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const election = elections.find((item) => String(item.year).trim() === candidateElectionYear.trim());
    if (!election) {
      setLoadError(`No election was found for the year ${candidateElectionYear.trim() || 'entered'}.`);
      return;
    }

    const partyName = candidatePartyName.trim();
    let partyId: number | undefined;
    if (partyName) {
      if (!selectedState) {
        setLoadError('Select a state before searching gubernatorial candidates.');
        return;
      }
      setLoading(true);
      setLoadError('');
      try {
        let currentPage = 1;
        let lastPage = 1;
        do {
          const response = await visitorService.getGovernatorialCandidates({
            state_id: selectedState.id,
            election_id: election.id,
            page: currentPage,
          });
          const result = extractPaginatedRecords(response);
          const matchingCandidate = result.records.find(
            (record) => {
              const normalizedPartyName = partyName.toLowerCase();
              return record.party?.name?.trim().toLowerCase() === normalizedPartyName
                || record.party?.description?.trim().toLowerCase() === normalizedPartyName;
            }
          );
          if (matchingCandidate?.party_id) {
            partyId = Number(matchingCandidate.party_id);
            break;
          }
          lastPage = result.pagination.lastPage;
          currentPage += 1;
        } while (currentPage <= lastPage);

        if (!partyId) {
          setLoadError(`No gubernatorial candidates from "${partyName}" were found for ${candidateElectionYear.trim()}.`);
          setLoading(false);
          return;
        }
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : 'Unable to resolve the party name.');
        setLoading(false);
        return;
      }
    }

    setLoadError('');
    setCandidatePage(1);
    setCandidateSearch({ electionId: election.id, partyId });
  };

  const searchElectedGovernor = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const election = elections.find((item) => String(item.year).trim() === electedElectionYear.trim());
    if (!election) {
      setLoadError(`No election was found for the year ${electedElectionYear.trim() || 'entered'}.`);
      return;
    }
    setLoadError('');
    setElectedSearchElectionId(election.id);
  };

  const totalSenatorialDistrictPages = Math.max(
    1,
    Math.ceil(senatorialDistricts.length / SENATORIAL_DISTRICTS_PER_PAGE)
  );
  const paginatedSenatorialDistricts = senatorialDistricts.slice(
    (senatorialDistrictPage - 1) * SENATORIAL_DISTRICTS_PER_PAGE,
    senatorialDistrictPage * SENATORIAL_DISTRICTS_PER_PAGE
  );
  const totalFederalHouseDistrictPages = Math.max(
    1,
    Math.ceil(federalHouseDistricts.length / FEDERAL_HOUSE_DISTRICTS_PER_PAGE)
  );
  const paginatedFederalHouseDistricts = federalHouseDistricts.slice(
    (federalHouseDistrictPage - 1) * FEDERAL_HOUSE_DISTRICTS_PER_PAGE,
    federalHouseDistrictPage * FEDERAL_HOUSE_DISTRICTS_PER_PAGE
  );

  const renderGovernorSearch = () => {
    if (!governorView || !selectedState) return null;

    return (
      <form
        onSubmit={governorView === 'candidates' ? searchGovernorCandidates : searchElectedGovernor}
        className="mb-8 rounded-3xl border border-gray-100 bg-white p-5 shadow-[0_4px_24px_rgb(0,0,0,0.04)] sm:p-6"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <label className="space-y-2 text-sm font-semibold text-gray-700">
            Election year <span className="text-red-500">*</span>
            <input
              required
              value={governorView === 'candidates' ? candidateElectionYear : electedElectionYear}
              onChange={(event) => governorView === 'candidates'
                ? setCandidateElectionYear(event.target.value)
                : setElectedElectionYear(event.target.value)}
              type="text"
              inputMode="numeric"
              placeholder={electionsLoading ? 'Loading election years...' : 'Enter election year'}
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm font-normal text-gray-800 outline-none transition focus:border-[#146c4f] focus:ring-2 focus:ring-[#146c4f]/15"
            />
          </label>

          {governorView === 'candidates' ? (
            <label className="space-y-2 text-sm font-semibold text-gray-700">
              Party name <span className="font-normal text-gray-400">(optional)</span>
              <input
                type="text"
                value={candidatePartyName}
                onChange={(event) => setCandidatePartyName(event.target.value)}
                placeholder="Enter party name"
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm font-normal text-gray-800 outline-none transition focus:border-[#146c4f] focus:ring-2 focus:ring-[#146c4f]/15"
              />
            </label>
          ) : (
            <div className="flex items-end rounded-xl border border-dashed border-gray-200 bg-[#f7f8f5] px-4 py-3 text-sm text-gray-500">
              Search historical governors for {selectedState.name}.
            </div>
          )}

          <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-1">
            <button
              type="submit"
              disabled={electionsLoading || loading}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#146c4f] px-5 text-sm font-bold text-white transition-colors hover:bg-[#10563f] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              Search
            </button>
            {(candidateSearch || electedSearchElectionId) && (
              <button
                type="button"
                onClick={() => {
                  setLoadError('');
                  if (governorView === 'candidates') {
                    setCandidateSearch(null);
                    setCandidateElectionYear('');
                    setCandidatePartyName('');
                    setCandidatePage(1);
                  } else {
                    setElectedSearchElectionId(null);
                    setElectedElectionYear('');
                  }
                }}
                className="h-11 rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-700 transition-colors hover:border-[#146c4f]/40 hover:text-[#146c4f]"
              >
                Show active
              </button>
            )}
          </div>
        </div>
        {electionsError && (
          <p role="alert" className="mt-3 text-sm text-red-600">{electionsError}</p>
        )}
      </form>
    );
  };

  const renderGovernor = () => {
    if (!selectedState) {
      return (
        <>
          <SectionIntro
            eyebrow="Gubernatorial directory"
            title="Choose a state"
            description="Pick a state to explore its governorship candidates and the governor currently in office."
          />
          {loading ? (
            <StateSkeleton />
          ) : loadError ? (
            <ErrorPanel message={loadError} />
          ) : states.length > 0 ? (
            <StateGrid states={states} onSelect={setSelectedState} />
          ) : (
            <EmptyPanel title="No states available" description="The state directory could not be loaded. Please try again shortly." />
          )}
        </>
      );
    }

    const entries = governorView === 'candidates' ? governorCandidates : electedGovernors;
    const title = governorView === 'candidates'
      ? 'Gubernatorial candidates'
      : governorView === 'elected'
        ? 'Elected governor'
        : `${selectedState.name} governorship`;
    const description = governorView === 'candidates'
      ? `Active candidates contesting the governorship of ${selectedState.name}.`
      : governorView === 'elected'
        ? `The sitting governor and term details for ${selectedState.name}.`
        : `Compare the candidates and the current officeholder for ${selectedState.name}.`;

    return (
      <>
        <SectionHeader
          eyebrow={`Governor · ${selectedState.name}`}
          title={title}
          description={description}
          backLabel={governorView ? 'Change view' : 'All states'}
          onBack={() => {
            if (governorView) {
              setGovernorView(null);
              return;
            }
            setSelectedState(null);
            setCandidateSearch(null);
            setElectedSearchElectionId(null);
          }}
        />

        {renderGovernorSearch()}

        {loading ? (
          <LeaderSkeleton />
        ) : loadError ? (
          <ErrorPanel message={loadError} />
        ) : !governorView ? (
          <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
            <ChoiceCard
              eyebrow={selectedState.name}
              title="Gubernatorial candidates"
              description="See the people actively contesting this state's governorship."
              cta="View candidates"
              icon={UserRound}
              onClick={() => selectGovernorView('candidates')}
            />
            <ChoiceCard
              eyebrow={selectedState.name}
              title="Elected governor"
              description="Review the sitting governor, election year, and term details."
              cta="View elected governor"
              icon={CheckCircle2}
              tone="dark"
              onClick={() => selectGovernorView('elected')}
            />
          </div>
        ) : entries.length > 0 ? (
          <div>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {entries.map((leader) => (
                <GovernorLeaderCard
                  key={leader.id}
                  leader={leader}
                  selectedState={selectedState}
                  isCandidate={governorView === 'candidates'}
                  candidatePage={candidatePage}
                />
              ))}
            </div>
            {governorView === 'candidates' && (
              <PaginationBar
                current={candidatePagination.currentPage}
                last={candidatePagination.lastPage}
                total={candidatePagination.total}
                perPage={candidatePagination.perPage}
                from={candidatePagination.from}
                to={candidatePagination.to}
                onPrevious={() => setCandidatePage((page) => Math.max(1, page - 1))}
                onNext={() => setCandidatePage((page) => Math.min(candidatePagination.lastPage, page + 1))}
                loading={loading}
                label="candidates"
              />
            )}
          </div>
        ) : (
          <EmptyPanel
            title={`No ${governorView === 'candidates' ? 'candidates' : 'elected governor records'} found`}
            description={`There are no ${governorView === 'candidates' ? 'active gubernatorial candidates' : 'elected governor records'} for ${selectedState.name} in this view.`}
          />
        )}
      </>
    );
  };

  const renderSenator = () => {
    if (!selectedSenatorialState) {
      return (
        <>
          <SectionIntro
            eyebrow="Senatorial directory"
            title="Choose a state"
            description="Select a state to browse its senatorial districts, candidates, and sitting senators."
          />
          {loading ? (
            <StateSkeleton />
          ) : loadError ? (
            <ErrorPanel message={loadError} />
          ) : states.length > 0 ? (
            <StateGrid states={states} onSelect={selectSenatorialState} />
          ) : (
            <EmptyPanel title="No states available" description="The state directory could not be loaded. Please try again shortly." />
          )}
        </>
      );
    }

    if (!selectedSenatorialDistrict) {
      return (
        <>
          <SectionHeader
            eyebrow="Senators"
            title={`${selectedSenatorialState.name} senatorial districts`}
            description="Choose a senatorial district to view its candidates and elected senator."
            backLabel="All states"
            onBack={() => {
              setSelectedSenatorialState(null);
              setSenatorialDistricts([]);
              setSenatorialDistrictPage(1);
            }}
          />
          {loading ? (
            <DirectorySkeleton />
          ) : loadError ? (
            <ErrorPanel message={loadError} />
          ) : senatorialDistricts.length > 0 ? (
            <>
              <DistrictGrid
                districts={paginatedSenatorialDistricts}
                stateName={selectedSenatorialState.name}
                onSelect={selectSenatorialDistrict}
              />
              <PaginationBar
                current={senatorialDistrictPage}
                last={totalSenatorialDistrictPages}
                total={senatorialDistricts.length}
                perPage={SENATORIAL_DISTRICTS_PER_PAGE}
                onPrevious={() => setSenatorialDistrictPage((page) => Math.max(1, page - 1))}
                onNext={() => setSenatorialDistrictPage((page) => Math.min(totalSenatorialDistrictPages, page + 1))}
                label="senatorial districts"
              />
            </>
          ) : (
            <EmptyPanel
              title="No senatorial districts available"
              description={`No senatorial districts are listed for ${selectedSenatorialState.name} yet.`}
            />
          )}
        </>
      );
    }

    const entries = senatorialView === 'candidates' ? senatorialCandidates : electedSenators;
    const title = senatorialView === 'candidates'
      ? 'Senatorial candidates'
      : senatorialView === 'elected'
        ? 'Elected senator'
        : selectedSenatorialDistrict.name;
    const description = senatorialView === 'candidates'
      ? `Active candidates contesting ${selectedSenatorialDistrict.name}.`
      : senatorialView === 'elected'
        ? `The sitting senator for ${selectedSenatorialDistrict.name}.`
        : `Explore candidates and the elected senator for ${selectedSenatorialDistrict.name}.`;

    return (
      <>
        <SectionHeader
          eyebrow={`Senatorial district · ${selectedSenatorialState.name}`}
          title={title}
          description={description}
          backLabel={senatorialView ? 'Change view' : 'Senatorial districts'}
          onBack={() => {
            if (senatorialView) {
              setSenatorialView(null);
              return;
            }
            setSelectedSenatorialDistrict(null);
            setSenatorialCandidates([]);
            setElectedSenators([]);
          }}
        />

        {loading ? (
          <LeaderSkeleton />
        ) : loadError ? (
          <ErrorPanel message={loadError} />
        ) : !senatorialView ? (
          <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
            <ChoiceCard
              eyebrow={selectedSenatorialDistrict.name}
              title="Senatorial candidates"
              description="View the people actively contesting this senatorial seat."
              cta="View candidates"
              icon={UserRound}
              onClick={() => selectSenatorialView('candidates')}
            />
            <ChoiceCard
              eyebrow={selectedSenatorialDistrict.name}
              title="Elected senator"
              description="Review the sitting senator and their current term."
              cta="View elected senator"
              icon={CheckCircle2}
              tone="dark"
              onClick={() => selectSenatorialView('elected')}
            />
          </div>
        ) : entries.length > 0 ? (
          <div>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {entries.map((leader) => (
                <GovernorLeaderCard
                  key={leader.id}
                  leader={leader}
                  selectedState={selectedSenatorialDistrict}
                  isCandidate={senatorialView === 'candidates'}
                  candidatePage={senatorialCandidatePage}
                  preserveGovernorReturn={false}
                  officeFallback={senatorialView === 'candidates' ? 'Senatorial Candidate' : 'Senator'}
                  locationOverride={`${selectedSenatorialDistrict.name}, ${selectedSenatorialState.name}`}
                />
              ))}
            </div>
            {senatorialView === 'candidates' && (
              <PaginationBar
                current={senatorialCandidatePagination.currentPage}
                last={senatorialCandidatePagination.lastPage}
                total={senatorialCandidatePagination.total}
                perPage={senatorialCandidatePagination.perPage}
                from={senatorialCandidatePagination.from}
                to={senatorialCandidatePagination.to}
                onPrevious={() => setSenatorialCandidatePage((page) => Math.max(1, page - 1))}
                onNext={() => setSenatorialCandidatePage((page) => Math.min(senatorialCandidatePagination.lastPage, page + 1))}
                loading={loading}
                label="candidates"
              />
            )}
          </div>
        ) : (
          <EmptyPanel
            title={`No ${senatorialView === 'candidates' ? 'candidates' : 'elected senator records'} found`}
            description={`There are no ${senatorialView === 'candidates' ? 'active senatorial candidates' : 'elected senator records'} for ${selectedSenatorialDistrict.name} in this view.`}
          />
        )}
      </>
    );
  };

  const renderFederal = () => {
    if (!selectedFederalHouseState) {
      return (
        <>
          <SectionIntro
            eyebrow="House of Representatives"
            title="Choose a state"
            description="Select a state to browse federal constituencies, candidates, and sitting representatives."
          />
          {loading ? (
            <StateSkeleton />
          ) : loadError ? (
            <ErrorPanel message={loadError} />
          ) : states.length > 0 ? (
            <StateGrid states={states} onSelect={selectFederalHouseState} />
          ) : (
            <EmptyPanel title="No states available" description="The state directory could not be loaded. Please try again shortly." />
          )}
        </>
      );
    }

    if (!selectedFederalHouseDistrict) {
      return (
        <>
          <SectionHeader
            eyebrow="House of Representatives"
            title={`${selectedFederalHouseState.name} federal constituencies`}
            description="Choose a federal constituency to view its candidates and elected representative."
            backLabel="All states"
            onBack={() => {
              setSelectedFederalHouseState(null);
              setFederalHouseDistricts([]);
              setFederalHouseDistrictPage(1);
            }}
          />
          {loading ? (
            <DirectorySkeleton />
          ) : loadError ? (
            <ErrorPanel message={loadError} />
          ) : federalHouseDistricts.length > 0 ? (
            <>
              <DistrictGrid
                districts={paginatedFederalHouseDistricts}
                stateName={selectedFederalHouseState.name}
                onSelect={selectFederalHouseDistrict}
              />
              <PaginationBar
                current={federalHouseDistrictPage}
                last={totalFederalHouseDistrictPages}
                total={federalHouseDistricts.length}
                perPage={FEDERAL_HOUSE_DISTRICTS_PER_PAGE}
                onPrevious={() => setFederalHouseDistrictPage((page) => Math.max(1, page - 1))}
                onNext={() => setFederalHouseDistrictPage((page) => Math.min(totalFederalHouseDistrictPages, page + 1))}
                label="federal constituencies"
              />
            </>
          ) : (
            <EmptyPanel
              title="No federal constituencies available"
              description={`No federal house districts are listed for ${selectedFederalHouseState.name} yet.`}
            />
          )}
        </>
      );
    }

    const entries = federalHouseView === 'candidates' ? federalHouseCandidates : electedFederalHouseMembers;
    const title = federalHouseView === 'candidates'
      ? 'House of Reps candidates'
      : federalHouseView === 'elected'
        ? 'Elected House of Reps member'
        : selectedFederalHouseDistrict.name;
    const description = federalHouseView === 'candidates'
      ? `Active candidates contesting ${selectedFederalHouseDistrict.name}.`
      : federalHouseView === 'elected'
        ? `The sitting House of Representatives member for ${selectedFederalHouseDistrict.name}.`
        : `Explore candidates and the elected representative for ${selectedFederalHouseDistrict.name}.`;

    return (
      <>
        <SectionHeader
          eyebrow={`Federal constituency · ${selectedFederalHouseState.name}`}
          title={title}
          description={description}
          backLabel={federalHouseView ? 'Change view' : 'Federal constituencies'}
          onBack={() => {
            if (federalHouseView) {
              setFederalHouseView(null);
              return;
            }
            setSelectedFederalHouseDistrict(null);
            setFederalHouseCandidates([]);
            setElectedFederalHouseMembers([]);
          }}
        />

        {loading ? (
          <LeaderSkeleton />
        ) : loadError ? (
          <ErrorPanel message={loadError} />
        ) : !federalHouseView ? (
          <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
            <ChoiceCard
              eyebrow={selectedFederalHouseDistrict.name}
              title="House of Reps candidates"
              description="View the people actively contesting this federal constituency."
              cta="View candidates"
              icon={UserRound}
              onClick={() => selectFederalHouseView('candidates')}
            />
            <ChoiceCard
              eyebrow={selectedFederalHouseDistrict.name}
              title="Elected representative"
              description="Review the sitting House of Representatives member and their term."
              cta="View elected member"
              icon={CheckCircle2}
              tone="dark"
              onClick={() => selectFederalHouseView('elected')}
            />
          </div>
        ) : entries.length > 0 ? (
          <div>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {entries.map((leader) => (
                <GovernorLeaderCard
                  key={leader.id}
                  leader={leader}
                  selectedState={selectedFederalHouseDistrict}
                  isCandidate={federalHouseView === 'candidates'}
                  candidatePage={federalHouseCandidatePage}
                  preserveGovernorReturn={false}
                  officeFallback={federalHouseView === 'candidates' ? 'House of Representatives Candidate' : 'House of Representatives Member'}
                  locationOverride={`${selectedFederalHouseDistrict.name}, ${selectedFederalHouseState.name}`}
                />
              ))}
            </div>
            {federalHouseView === 'candidates' && (
              <PaginationBar
                current={federalHouseCandidatePagination.currentPage}
                last={federalHouseCandidatePagination.lastPage}
                total={federalHouseCandidatePagination.total}
                perPage={federalHouseCandidatePagination.perPage}
                from={federalHouseCandidatePagination.from}
                to={federalHouseCandidatePagination.to}
                onPrevious={() => setFederalHouseCandidatePage((page) => Math.max(1, page - 1))}
                onNext={() => setFederalHouseCandidatePage((page) => Math.min(federalHouseCandidatePagination.lastPage, page + 1))}
                loading={loading}
                label="candidates"
              />
            )}
          </div>
        ) : (
          <EmptyPanel
            title={`No ${federalHouseView === 'candidates' ? 'candidates' : 'elected representative records'} found`}
            description={`There are no ${federalHouseView === 'candidates' ? 'active House of Reps candidates' : 'elected House of Reps members'} for ${selectedFederalHouseDistrict.name} in this view.`}
          />
        )}
      </>
    );
  };

  const renderOtherCategory = () => {
    if (loading) return <LeaderSkeleton count={4} />;
    if (loadError) return <ErrorPanel message={loadError} />;
    if (leaders.length === 0) {
      return (
        <EmptyPanel
          title="No active leaders found"
          description={`There are no active elected leaders listed for ${activeCategory.label} at the moment.`}
        />
      );
    }

    return (
      <div>
        <SectionIntro
          eyebrow="Currently serving"
          title={`${activeCategory.label} in office`}
          description={`Browse the current officeholders listed under ${activeCategory.label.toLowerCase()}.`}
        />
        <div className={leaders.length === 1 ? 'mx-auto max-w-2xl' : 'grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3'}>
          {leaders.map((leader) => (
            <GenericLeaderCard key={leader.id} leader={leader} categoryLabel={activeCategory.label} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#f7f8f5]">
      <Helmet>
        <title>Leaders | Know Your Leaders</title>
        <meta
          name="description"
          content="Browse Nigerian elected leaders and candidates by office, state, and constituency."
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
        <div className="pointer-events-none absolute -bottom-16 right-4 text-[11rem] font-black leading-none text-white/[0.03] sm:text-[15rem]" aria-hidden="true">
          PUBLIC
        </div>

        <div className="container relative mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-50 backdrop-blur">
              <UsersRound className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
              Representation, on the record
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
              The people who <span className="text-emerald-300">represent you.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-emerald-50/75 sm:text-lg">
              Explore current officeholders and the candidates contesting for their seats — from the
              Presidency to ward councils.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-3">
            {[
              { label: 'Office levels', value: CATEGORIES.length, icon: Landmark },
              { label: 'States + FCT', value: 37, icon: MapPin },
              { label: 'Directory', value: 'Live', icon: Vote },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-emerald-100/70">
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em]">{stat.label}</span>
                  </div>
                  <p className="mt-2 text-2xl font-extrabold leading-none text-white sm:text-3xl">{stat.value}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="mb-8 flex flex-col gap-5 border-b border-gray-200 pb-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#146c4f]">Public directory</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">
              Browse by office.
            </h2>
          </div>

          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Browse leaders by office">
            {CATEGORIES.map((category) => {
              const selected = activeCategory.id === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => selectCategory(category)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146c4f] focus-visible:ring-offset-2 ${
                    selected
                      ? 'bg-[#146c4f] text-white'
                      : 'border border-gray-200 bg-white text-gray-600 hover:border-[#146c4f]/30 hover:text-[#146c4f]'
                  }`}
                >
                  {category.label}
                </button>
              );
            })}
          </div>
        </div>

        {activeCategory.id === 'governor'
          ? renderGovernor()
          : activeCategory.id === 'senator'
            ? renderSenator()
            : activeCategory.id === 'federal'
              ? renderFederal()
              : renderOtherCategory()}
      </section>
    </div>
  );
}
