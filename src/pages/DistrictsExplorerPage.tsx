import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Crown,
  Home,
  Landmark,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Search,
  Users,
  Vote,
  type LucideIcon,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { electionService, type Election } from '@/services/elections';
import { visitorService } from '@/services/visitors';
import { getLogoUrl } from '@/lib/utils';

interface District {
  id: number | string;
  name?: string;
  state?: { name?: string } | null;
  [key: string]: unknown;
}

interface PartyInfo {
  name?: string;
  acronym?: string | null;
  logopath?: string | null;
}

interface CandidateInfo {
  id?: number | string;
  fullName?: string;
  full_name?: string;
  name?: string;
  image?: string | Record<string, unknown> | null;
  phoneNo?: string;
  phone_no?: string;
  email?: string;
  party?: PartyInfo;
  state?: { name?: string };
}

interface PersonRecord {
  id: number | string;
  candidate_id?: number | string;
  candidateId?: number | string;
  candidate?: CandidateInfo;
  name?: string;
  image?: string | Record<string, unknown> | null;
  party?: PartyInfo;
  partyName?: string;
  partyLogo?: string | null;
  office?: { title?: string };
  position?: string;
  election?: { year?: string | number; details?: string };
  state?: { name?: string };
  status?: string;
  start_date?: string;
  end_date?: string;
  tenure?: string;
  remark?: string;
  manifesto?: string;
  [key: string]: unknown;
}

type DistrictTypeId = 'senatorial' | 'federal' | 'state-house' | 'lga' | 'ward';
type DirectoryView = 'candidates' | 'elected';
type CategoryId =
  | 'presidency'
  | 'governors'
  | 'senators'
  | 'house-of-reps'
  | 'state-assembly'
  | 'lga-chairmen'
  | 'ward-councillors';
type CategoryScope = 'national' | 'state' | 'district';

interface CategoryConfig {
  id: CategoryId;
  label: string;
  description: string;
  icon: LucideIcon;
  scope: CategoryScope;
  districtType?: DistrictTypeId;
  districtHeading?: string;
  candidateParam?: string;
  fetchDistricts?: (stateId: number) => Promise<unknown>;
  fetchCandidates: (params: Record<string, string | number>) => Promise<unknown>;
  fetchElected: (params: Record<string, string | number>) => Promise<unknown>;
}

interface PeopleContext {
  state?: District | null;
  district?: District | null;
}

interface Pagination {
  currentPage: number;
  lastPage: number;
  total: number;
  perPage: number;
  from: number | null;
  to: number | null;
}

const EMPTY_PAGINATION: Pagination = {
  currentPage: 1,
  lastPage: 1,
  total: 0,
  perPage: 15,
  from: null,
  to: null,
};

const CATEGORIES: CategoryConfig[] = [
  {
    id: 'presidency',
    label: 'Presidency',
    description: 'President & Vice President',
    icon: Crown,
    scope: 'national',
    fetchCandidates: (params) => visitorService.getPresidencyCandidates(params),
    fetchElected: (params) => visitorService.getElectedPresidency(params),
  },
  {
    id: 'governors',
    label: 'Governors',
    description: 'Governor & Deputy Governor',
    icon: Landmark,
    scope: 'state',
    fetchCandidates: (params) => visitorService.getGovernatorialCandidates(params),
    fetchElected: (params) => visitorService.getElectedGovernor(params),
  },
  {
    id: 'senators',
    label: 'Senators',
    description: 'Senatorial districts',
    icon: Vote,
    scope: 'district',
    districtType: 'senatorial',
    districtHeading: 'Senatorial districts',
    candidateParam: 'senetorial_district_id',
    fetchDistricts: (stateId) => visitorService.getStateSenatorialDistricts(stateId),
    fetchCandidates: (params) => visitorService.getSenatorialCandidates(params),
    fetchElected: (params) => visitorService.getElectedSenator(params),
  },
  {
    id: 'house-of-reps',
    label: 'House of Reps',
    description: 'Federal constituencies',
    icon: Building2,
    scope: 'district',
    districtType: 'federal',
    districtHeading: 'Federal constituencies',
    candidateParam: 'federal_house_district_id',
    fetchDistricts: (stateId) => visitorService.getStateFederalHouseDistricts(stateId),
    fetchCandidates: (params) => visitorService.getFederalHouseCandidates(params),
    fetchElected: (params) => visitorService.getElectedHouseOfRepMember(params),
  },
  {
    id: 'state-assembly',
    label: 'State Assembly',
    description: 'State constituencies',
    icon: Home,
    scope: 'district',
    districtType: 'state-house',
    districtHeading: 'State constituencies',
    candidateParam: 'state_house_district_id',
    fetchDistricts: (stateId) => visitorService.getStateStateHouseDistricts(stateId),
    fetchCandidates: (params) => visitorService.getStateHouseCandidates(params),
    fetchElected: (params) => visitorService.getElectedStateAssemblyMember(params),
  },
  {
    id: 'lga-chairmen',
    label: 'LGA Chairmen',
    description: 'Local government areas',
    icon: MapPin,
    scope: 'district',
    districtType: 'lga',
    districtHeading: 'Local government areas',
    candidateParam: 'lga_district_id',
    fetchDistricts: (stateId) => visitorService.getStateLgas(stateId),
    fetchCandidates: (params) => visitorService.getLgaCandidates(params),
    fetchElected: (params) => visitorService.getElectedLgaChairman(params),
  },
  {
    id: 'ward-councillors',
    label: 'Ward Councillors',
    description: 'Wards by local government',
    icon: Users,
    scope: 'district',
    districtType: 'ward',
    districtHeading: 'Wards',
    candidateParam: 'ward_id',
    fetchDistricts: (stateId) => visitorService.getStateLgas(stateId),
    fetchCandidates: (params) => visitorService.getWardCandidates(params),
    fetchElected: (params) => visitorService.getElectedWardCouncillor(params),
  },
];

const extractList = (response: unknown): unknown[] => {
  if (Array.isArray(response)) return response;
  if (!response || typeof response !== 'object') return [];

  const payload = response as { data?: unknown };
  if (Array.isArray(payload.data)) return payload.data;

  if (payload.data && typeof payload.data === 'object') {
    const nested = payload.data as { data?: unknown };
    if (Array.isArray(nested.data)) return nested.data;
    return [payload.data];
  }

  if ('id' in response || 'candidate' in response) return [response];
  return [];
};

const extractCandidateResult = (response: unknown): { records: PersonRecord[]; pagination: Pagination } => {
  if (Array.isArray(response)) {
    return {
      records: response as PersonRecord[],
      pagination: {
        ...EMPTY_PAGINATION,
        total: response.length,
        perPage: response.length || EMPTY_PAGINATION.perPage,
        to: response.length,
      },
    };
  }

  if (!response || typeof response !== 'object') {
    return { records: [], pagination: EMPTY_PAGINATION };
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

  if (Array.isArray(payload.data)) {
    return {
      records: payload.data as PersonRecord[],
      pagination: {
        currentPage: payload.current_page ?? 1,
        lastPage: payload.last_page ?? 1,
        total: payload.total ?? payload.data.length,
        perPage: payload.per_page ?? EMPTY_PAGINATION.perPage,
        from: payload.from ?? null,
        to: payload.to ?? null,
      },
    };
  }

  const records = extractList(response) as PersonRecord[];
  return {
    records,
    pagination: {
      ...EMPTY_PAGINATION,
      total: records.length,
      perPage: records.length || EMPTY_PAGINATION.perPage,
      to: records.length,
    },
  };
};

const normalizePerson = (record: PersonRecord) => {
  const candidate: CandidateInfo = record.candidate ?? {};
  const party = record.party ?? candidate.party;
  const name = candidate.fullName ?? candidate.full_name ?? candidate.name ?? record.name ?? 'Name not available';

  return {
    name,
    initial: name.trim().charAt(0).toUpperCase() || '?',
    imageUrl: getLogoUrl(candidate.image ?? record.image ?? null),
    partyName: party?.name ?? party?.acronym ?? record.partyName ?? 'Not specified',
    partyLogo: getLogoUrl(party?.logopath ?? record.partyLogo ?? null),
    office: record.office?.title ?? record.position ?? '',
    electionYear: record.election?.year ?? record.election?.details ?? '',
    stateName: record.state?.name ?? candidate.state?.name ?? '',
    phone: candidate.phoneNo ?? candidate.phone_no ?? '',
    email: candidate.email ?? '',
    profileId: record.candidate_id ?? record.candidateId ?? candidate.id,
    tenure: record.tenure ?? '',
    startDate: record.start_date ?? '',
    endDate: record.end_date ?? '',
    remark: record.remark ?? record.manifesto ?? '',
    status: record.status ?? '',
  };
};

const formatDate = (value?: string) => {
  if (!value) return '';
  const parsed = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const isNoRecordError = (message: string) => /no .*(found|available)|not found|\b404\b/i.test(message);

function PersonCard({
  person,
  view,
  districtName,
}: {
  person: PersonRecord;
  view: DirectoryView;
  districtName: string;
}) {
  const info = normalizePerson(person);
  const badgeLabel = view === 'elected'
    ? (info.status ? info.status.charAt(0).toUpperCase() + info.status.slice(1) : 'Elected')
    : 'Candidate';
  const termDates = [formatDate(info.startDate), formatDate(info.endDate)].filter(Boolean).join(' – ');

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1 hover:border-[#146c4f]/30 hover:shadow-xl">
      <div className="h-1.5 w-full bg-gradient-to-r from-[#146c4f] via-emerald-500 to-emerald-300" />

      <div className="flex items-start gap-4 p-5">
        <Avatar className="h-16 w-16 shrink-0 border-2 border-white shadow-sm ring-2 ring-[#146c4f]/10">
          {info.imageUrl && <AvatarImage src={info.imageUrl} alt={info.name} className="object-cover" />}
          <AvatarFallback className="bg-[#146c4f]/10 text-xl font-bold text-[#146c4f]">
            {info.initial}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-bold tracking-tight text-gray-900 transition-colors group-hover:text-[#146c4f]">
                {info.name}
              </h3>
              <p className="mt-0.5 truncate text-[11px] font-bold uppercase tracking-[0.14em] text-[#146c4f]">
                {info.office || (view === 'elected' ? 'Elected official' : 'Candidate')}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                view === 'elected' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
              }`}
            >
              {badgeLabel}
            </span>
          </div>
          <p className="mt-1 truncate text-sm text-gray-500">
            {districtName}
            {info.stateName ? ` · ${info.stateName}` : ''}
          </p>
        </div>
      </div>

      <div className="mx-5 grid grid-cols-2 gap-2 border-t border-gray-50 pt-4">
        <div className="flex min-w-0 items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
          <Avatar className="h-6 w-6 shrink-0 border border-gray-200 bg-white">
            {info.partyLogo && (
              <AvatarImage src={info.partyLogo} alt={`${info.partyName} logo`} className="object-contain p-0.5" />
            )}
            <AvatarFallback className="text-[10px] font-bold text-gray-500">
              {info.partyName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="truncate text-xs font-semibold text-gray-700">{info.partyName}</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
          <Vote aria-hidden="true" className="h-4 w-4 shrink-0 text-gray-400" />
          <span className="truncate text-xs font-semibold text-gray-700">
            {info.electionYear || 'Election n/a'}
          </span>
        </div>
      </div>

      {view === 'elected' && (info.phone || info.email) && (
        <div className="mx-5 mt-2 space-y-1 text-xs text-gray-500">
          {info.phone && (
            <p className="flex items-center gap-2">
              <Phone aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              <span className="truncate">{info.phone}</span>
            </p>
          )}
          {info.email && (
            <p className="flex items-center gap-2">
              <Mail aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              <span className="truncate">{info.email}</span>
            </p>
          )}
        </div>
      )}

      {view === 'elected' && (info.tenure || termDates) && (
        <p className="mx-5 mt-2 text-xs text-gray-500">
          {info.tenure && <span className="font-semibold text-gray-700">{info.tenure}</span>}
          {info.tenure && termDates ? ' · ' : ''}
          {termDates}
        </p>
      )}

      <div className="mt-auto p-5 pt-4">
        {info.profileId ? (
          <Link
            to={`/profile/${info.profileId}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#146c4f] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#10563f]"
          >
            View Profile <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        ) : (
          <span className="block rounded-xl border border-dashed border-gray-200 py-2.5 text-center text-sm text-gray-400">
            Profile unavailable
          </span>
        )}
      </div>
    </article>
  );
}

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-100 bg-white p-5">
      <div className="flex gap-4">
        <div className="h-16 w-16 shrink-0 rounded-full bg-gray-100" />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-4 w-3/4 rounded bg-gray-100" />
          <div className="h-3 w-1/2 rounded bg-gray-100" />
          <div className="h-3 w-2/3 rounded bg-gray-100" />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="h-9 rounded-lg bg-gray-50" />
        <div className="h-9 rounded-lg bg-gray-50" />
      </div>
      <div className="mt-4 h-10 rounded-xl bg-gray-100" />
    </div>
  );
}

export default function DistrictsExplorerPage() {
  const [states, setStates] = useState<District[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElectionId, setSelectedElectionId] = useState<number | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [initialError, setInitialError] = useState('');

  const [activeCategoryId, setActiveCategoryId] = useState<CategoryId>('presidency');
  const [selectedState, setSelectedState] = useState<District | null>(null);
  const [selectedLga, setSelectedLga] = useState<District | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [districts, setDistricts] = useState<District[]>([]);
  const [districtLoading, setDistrictLoading] = useState(false);
  const [districtError, setDistrictError] = useState('');
  const [search, setSearch] = useState('');

  const [view, setView] = useState<DirectoryView>('candidates');
  const [people, setPeople] = useState<PersonRecord[]>([]);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [peopleError, setPeopleError] = useState('');
  const [pagination, setPagination] = useState<Pagination>(EMPTY_PAGINATION);
  const [page, setPage] = useState(1);
  const peopleRequestRef = useRef(0);

  const activeCategory = CATEGORIES.find((category) => category.id === activeCategoryId) ?? CATEGORIES[0];
  const selectedElection = elections.find((election) => Number(election.id) === selectedElectionId) ?? null;
  const isWardCategory = activeCategory.districtType === 'ward';

  useEffect(() => {
    let cancelled = false;

    const loadInitialData = async () => {
      setInitialLoading(true);
      setInitialError('');

      const [statesResult, electionsResult] = await Promise.all([
        visitorService.getStates().catch(() => null),
        electionService.getAllElections().catch(() => null),
      ]);

      if (cancelled) return;

      const stateList = extractList(statesResult) as District[];
      const electionList = (Array.isArray(electionsResult) ? electionsResult : extractList(electionsResult)) as Election[];

      setStates(stateList);
      setElections(electionList);

      const activeElection = electionList.find((election) =>
        ['active', 'ongoing', '1'].includes(String(election.status).toLowerCase()),
      );
      const latestElection = [...electionList].sort((a, b) => Number(b.year ?? 0) - Number(a.year ?? 0))[0];
      const defaultElection = activeElection ?? latestElection;

      if (defaultElection && Number.isFinite(Number(defaultElection.id))) {
        setSelectedElectionId(Number(defaultElection.id));
      }

      if (stateList.length === 0) {
        setInitialError('We could not load the list of Nigerian states. Please refresh and try again.');
      }

      setInitialLoading(false);
    };

    void loadInitialData();

    return () => {
      cancelled = true;
    };
  }, []);

  const fetchPeople = async (
    category: CategoryConfig,
    context: PeopleContext,
    nextView: DirectoryView,
    nextPage: number,
  ) => {
    if (!selectedElectionId) {
      peopleRequestRef.current += 1;
      setPeople([]);
      setPagination(EMPTY_PAGINATION);
      setPeopleError('');
      setPeopleLoading(false);
      return;
    }

    const params: Record<string, string | number> = {
      election_id: selectedElectionId,
      page: nextPage,
    };

    if (category.scope === 'state') {
      if (!context.state) return;
      params.state_id = Number(context.state.id);
    } else if (category.scope === 'district') {
      if (!context.district || !category.candidateParam) return;
      params[category.candidateParam] = Number(context.district.id);
    }

    const requestId = peopleRequestRef.current + 1;
    peopleRequestRef.current = requestId;

    setPeopleLoading(true);
    setPeopleError('');
    setPeople([]);
    setPage(nextPage);

    try {
      if (nextView === 'candidates') {
        const response = await category.fetchCandidates(params);
        if (requestId !== peopleRequestRef.current) return;
        const result = extractCandidateResult(response);
        setPeople(result.records);
        setPagination(result.pagination);
      } else {
        const response = await category.fetchElected(params);
        if (requestId !== peopleRequestRef.current) return;
        const records = extractList(response) as PersonRecord[];
        setPeople(records);
        setPagination({
          ...EMPTY_PAGINATION,
          total: records.length,
          perPage: records.length || EMPTY_PAGINATION.perPage,
          to: records.length,
        });
      }
    } catch (error) {
      if (requestId !== peopleRequestRef.current) return;
      const message = error instanceof Error ? error.message : 'Unable to load records. Please try again.';
      if (isNoRecordError(message)) {
        setPeople([]);
        setPagination(EMPTY_PAGINATION);
      } else {
        setPeopleError(message);
      }
    } finally {
      if (requestId === peopleRequestRef.current) {
        setPeopleLoading(false);
      }
    }
  };

  const loadDistricts = async (category: CategoryConfig, state: District, lga: District | null = null) => {
    if (!category.fetchDistricts) return;

    setDistrictLoading(true);
    setDistrictError('');
    setDistricts([]);

    try {
      const response = category.districtType === 'ward' && lga
        ? await visitorService.getLgaWards(Number(lga.id))
        : await category.fetchDistricts(Number(state.id));

      const list = (extractList(response) as District[]).slice().sort((a, b) =>
        String(a.name ?? '').localeCompare(String(b.name ?? '')),
      );
      setDistricts(list);
    } catch (error) {
      setDistrictError(error instanceof Error ? error.message : 'Unable to load districts. Please try again.');
    } finally {
      setDistrictLoading(false);
    }
  };

  useEffect(() => {
    const category = CATEGORIES.find((item) => item.id === activeCategoryId);
    if (!category) return;

    if (category.scope === 'national') {
      void fetchPeople(category, {}, view, 1);
    } else if (category.scope === 'state' && selectedState) {
      void fetchPeople(category, { state: selectedState }, view, 1);
    } else if (category.scope === 'district' && selectedDistrict) {
      void fetchPeople(category, { state: selectedState, district: selectedDistrict }, view, 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedElectionId]);

  const selectCategory = (category: CategoryConfig) => {
    setActiveCategoryId(category.id);
    setSelectedLga(null);
    setSelectedDistrict(null);
    setDistricts([]);
    setDistrictError('');
    setSearch('');
    setPeople([]);
    setPeopleError('');
    setPagination(EMPTY_PAGINATION);
    setPage(1);
    setView('candidates');

    if (category.scope === 'national') {
      setSelectedState(null);
      void fetchPeople(category, {}, 'candidates', 1);
    } else if (category.scope === 'state') {
      if (selectedState) void fetchPeople(category, { state: selectedState }, 'candidates', 1);
    } else if (selectedState) {
      void loadDistricts(category, selectedState);
    }
  };

  const selectState = (state: District) => {
    setSelectedState(state);
    setSelectedLga(null);
    setSelectedDistrict(null);
    setDistricts([]);
    setSearch('');
    setPeople([]);
    setPeopleError('');
    setPagination(EMPTY_PAGINATION);
    setPage(1);

    if (activeCategory.scope === 'state') {
      void fetchPeople(activeCategory, { state }, view, 1);
    } else if (activeCategory.scope === 'district') {
      void loadDistricts(activeCategory, state);
    }
  };

  const selectLga = (lga: District) => {
    if (!selectedState) return;

    setSelectedLga(lga);
    setSelectedDistrict(null);
    setSearch('');
    setPeople([]);
    setPeopleError('');
    setPagination(EMPTY_PAGINATION);
    void loadDistricts(activeCategory, selectedState, lga);
  };

  const selectDistrict = (district: District) => {
    if (isWardCategory && !selectedLga) {
      selectLga(district);
      return;
    }

    setSelectedDistrict(district);
    setPeople([]);
    setPeopleError('');
    setPagination(EMPTY_PAGINATION);
    void fetchPeople(activeCategory, { state: selectedState, district }, view, 1);
  };

  const changeView = (nextView: DirectoryView) => {
    setView(nextView);

    if (activeCategory.scope === 'national') {
      void fetchPeople(activeCategory, {}, nextView, 1);
    } else if (activeCategory.scope === 'state' && selectedState) {
      void fetchPeople(activeCategory, { state: selectedState }, nextView, 1);
    } else if (activeCategory.scope === 'district' && selectedDistrict) {
      void fetchPeople(activeCategory, { state: selectedState, district: selectedDistrict }, nextView, 1);
    }
  };

  const backToStates = () => {
    setSelectedState(null);
    setSelectedLga(null);
    setSelectedDistrict(null);
    setDistricts([]);
    setDistrictError('');
    setSearch('');
    setPeople([]);
    setPeopleError('');
    setPagination(EMPTY_PAGINATION);
    setPage(1);
  };

  const backToDistricts = () => {
    setSelectedDistrict(null);
    setPeople([]);
    setPeopleError('');
    setPagination(EMPTY_PAGINATION);
    setPage(1);
  };

  const backToLgas = () => {
    if (!selectedState) return;
    setSelectedLga(null);
    setSelectedDistrict(null);
    setSearch('');
    setPeople([]);
    setPeopleError('');
    setPagination(EMPTY_PAGINATION);
    void loadDistricts(activeCategory, selectedState);
  };

  const filteredStates = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return states;
    return states.filter((state) => String(state.name ?? '').toLowerCase().includes(term));
  }, [search, states]);

  const filteredDistricts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return districts;
    return districts.filter((district) => String(district.name ?? '').toLowerCase().includes(term));
  }, [districts, search]);

  const statesSearchPlaceholder = 'Search states…';
  const districtSearchPlaceholder = isWardCategory
    ? (selectedLga ? 'Search wards…' : 'Search local government areas…')
    : 'Search districts…';

  const districtHeading = isWardCategory
    ? (selectedLga ? `${selectedLga.name} wards` : 'Select a local government area')
    : (activeCategory.districtHeading ?? 'Districts');

  const renderViewToggle = () => (
    <div className="inline-flex self-start rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
      {(['candidates', 'elected'] as const).map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={view === option}
          onClick={() => changeView(option)}
          className={`h-9 rounded-lg px-4 text-sm font-semibold transition-all ${
            view === option ? 'bg-[#146c4f] text-white shadow' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          {option === 'candidates' ? 'Candidates' : 'Elected'}
        </button>
      ))}
    </div>
  );

  const renderPeople = (context: PeopleContext, subject: string) => {
    if (!selectedElectionId) {
      return (
        <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          Choose an election above to view {view === 'elected' ? 'elected officials' : 'candidates'} for {subject}.
        </div>
      );
    }

    if (peopleLoading) {
      return (
        <div role="status" aria-label="Loading records" className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      );
    }

    if (peopleError) {
      return (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
          <div className="flex items-start gap-2">
            <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">Unable to load records</p>
              <p className="mt-1 text-red-700">{peopleError}</p>
              <button
                type="button"
                onClick={() => void fetchPeople(activeCategory, context, view, page)}
                className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-red-600 px-3 text-sm font-semibold text-white hover:bg-red-700"
              >
                <Loader2 aria-hidden="true" className="h-4 w-4" /> Try again
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (people.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white/70 px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
            <Users aria-hidden="true" className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-gray-900">
            No {view === 'elected' ? 'elected officials' : 'candidates'} found
          </h3>
          <p className="mt-1 max-w-md text-sm text-gray-500">
            There are no {view === 'elected' ? 'elected officials' : 'candidates'} recorded for {subject} in the
            selected election. Try another election, view, or selection.
          </p>
        </div>
      );
    }

    return (
      <>
        <p className="mb-4 text-sm text-gray-500">
          {view === 'candidates'
            ? `${pagination.total} candidate${pagination.total === 1 ? '' : 's'} in ${subject}`
            : `${people.length} elected official${people.length === 1 ? '' : 's'} in ${subject}`}
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {people.map((person, index) => (
            <PersonCard
              key={`${view}-${person.id ?? person.candidate?.id ?? index}`}
              person={person}
              view={view}
              districtName={subject}
            />
          ))}
        </div>

        {view === 'candidates' && pagination.lastPage > 1 && (
          <div className="mt-8 flex flex-col items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm sm:flex-row">
            <p className="text-sm text-gray-500">
              Showing {pagination.from ?? 0}–{pagination.to ?? people.length} of {pagination.total} candidates
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void fetchPeople(activeCategory, context, view, page - 1)}
                disabled={page <= 1 || peopleLoading}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-sm font-semibold text-gray-700 transition-colors hover:border-[#146c4f] hover:text-[#146c4f] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft aria-hidden="true" className="h-4 w-4" /> Previous
              </button>
              <span className="px-2 text-sm font-semibold text-gray-700">
                Page {pagination.currentPage} of {pagination.lastPage}
              </span>
              <button
                type="button"
                onClick={() => void fetchPeople(activeCategory, context, view, page + 1)}
                disabled={page >= pagination.lastPage || peopleLoading}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-sm font-semibold text-gray-700 transition-colors hover:border-[#146c4f] hover:text-[#146c4f] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next <ChevronRight aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </>
    );
  };

  const renderStates = () => (
    <section aria-labelledby="states-heading">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#146c4f]">
            {activeCategory.scope === 'state' ? activeCategory.label : 'Nigeria'}
          </p>
          <h2 id="states-heading" className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
            {activeCategory.scope === 'state' ? 'Choose a state' : 'Browse by state'}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {activeCategory.scope === 'state'
              ? `View the governor and gubernatorial candidates for a state.`
              : 'Pick a state to explore its districts, LGAs, and wards.'}
          </p>
        </div>

        <div className="relative w-full sm:max-w-xs">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={statesSearchPlaceholder}
            aria-label="Search states"
            className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:border-[#146c4f] focus:ring-2 focus:ring-[#146c4f]/15"
          />
        </div>
      </div>

      {filteredStates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white/70 px-6 py-14 text-center text-gray-500">
          {search ? `No states match “${search}”.` : 'No states are available right now.'}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredStates.map((state) => (
            <button
              key={state.id}
              type="button"
              onClick={() => selectState(state)}
              className="group flex h-full items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#146c4f]/30 hover:shadow-md"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#146c4f]/10 text-sm font-bold text-[#146c4f]">
                  {String(state.name ?? '?').slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-gray-900 transition-colors group-hover:text-[#146c4f]">
                    {state.name}
                  </span>
                  <span className="block text-xs text-gray-400">
                    {activeCategory.scope === 'state' ? 'View governors' : 'Explore districts'}
                  </span>
                </span>
              </span>
              <ChevronRight
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-gray-300 transition-colors group-hover:text-[#146c4f]"
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );

  const renderNational = () => (
    <section aria-live="polite">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#146c4f]">National</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Presidency</h2>
          <p className="mt-1 text-sm text-gray-500">
            President & Vice President
            {selectedElection ? ` · ${selectedElection.year} election` : ' · No election selected'}
          </p>
        </div>
        {renderViewToggle()}
      </div>
      {renderPeople({}, 'the Presidency')}
    </section>
  );

  const renderStateDetail = () => {
    if (!selectedState) return null;

    return (
      <section aria-live="polite">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <button
              type="button"
              onClick={backToStates}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 transition-colors hover:text-[#146c4f]"
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" /> All states
            </button>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              {selectedState.name}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Governor & Deputy Governor
              {selectedElection ? ` · ${selectedElection.year} election` : ' · No election selected'}
            </p>
          </div>
          {renderViewToggle()}
        </div>
        {renderPeople({ state: selectedState }, `${selectedState.name} State`)}
      </section>
    );
  };

  const renderDistrictList = () => {
    if (!selectedState) return null;

    return (
      <section aria-live="polite">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#146c4f]">
              {selectedState.name} · {activeCategory.label}
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              {districtHeading}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {isWardCategory && !selectedLga
                ? 'Choose a local government area to view its wards.'
                : 'Choose a district to view its candidates and elected officials.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isWardCategory && selectedLga && (
              <button
                type="button"
                onClick={backToLgas}
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 transition-colors hover:border-[#146c4f] hover:text-[#146c4f]"
              >
                <ArrowLeft aria-hidden="true" className="h-4 w-4" /> LGAs
              </button>
            )}

            <button
              type="button"
              onClick={backToStates}
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 transition-colors hover:border-[#146c4f] hover:text-[#146c4f]"
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" /> All states
            </button>

            <div className="relative w-full sm:w-64">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={districtSearchPlaceholder}
                aria-label={districtSearchPlaceholder}
                className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:border-[#146c4f] focus:ring-2 focus:ring-[#146c4f]/15"
              />
            </div>
          </div>
        </div>

        {districtLoading ? (
          <div
            role="status"
            aria-label="Loading districts"
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-32 animate-pulse rounded-2xl border border-gray-100 bg-white" />
            ))}
          </div>
        ) : districtError ? (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
            <div className="flex items-start gap-2">
              <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">Unable to load districts</p>
                <p className="mt-1 text-red-700">{districtError}</p>
                <button
                  type="button"
                  onClick={() => void loadDistricts(activeCategory, selectedState, selectedLga)}
                  className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-red-600 px-3 text-sm font-semibold text-white hover:bg-red-700"
                >
                  <Loader2 aria-hidden="true" className="h-4 w-4" /> Try again
                </button>
              </div>
            </div>
          </div>
        ) : filteredDistricts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white/70 px-6 py-14 text-center text-gray-500">
            {search
              ? `No districts match “${search}”.`
              : 'No districts are available for this selection yet.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredDistricts.map((district) => {
              const Icon = activeCategory.icon;
              return (
                <button
                  key={district.id}
                  type="button"
                  onClick={() => selectDistrict(district)}
                  className="group flex h-full flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#146c4f]/30 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#146c4f]/10 text-[#146c4f]">
                      <Icon aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <ChevronRight
                      aria-hidden="true"
                      className="h-4 w-4 text-gray-300 transition-colors group-hover:text-[#146c4f]"
                    />
                  </div>
                  <div className="mt-4">
                    <p className="line-clamp-2 font-semibold text-gray-900 transition-colors group-hover:text-[#146c4f]">
                      {district.name}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {isWardCategory && !selectedLga ? 'Browse wards' : 'Candidates & elected officials'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    );
  };

  const renderDistrictDetail = () => {
    if (!selectedState || !selectedDistrict) return null;

    const backLabel = isWardCategory
      ? (selectedLga ? `${selectedLga.name} wards` : 'Wards')
      : (activeCategory.districtHeading ?? 'Districts');

    return (
      <section aria-live="polite">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <button
              type="button"
              onClick={backToDistricts}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 transition-colors hover:text-[#146c4f]"
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" /> {backLabel}
            </button>
            <h2 className="mt-2 break-words text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              {selectedDistrict.name}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {selectedState.name} · {activeCategory.label}
              {selectedElection ? ` · ${selectedElection.year} election` : ' · No election selected'}
            </p>
          </div>
          {renderViewToggle()}
        </div>
        {renderPeople(
          { state: selectedState, district: selectedDistrict },
          String(selectedDistrict.name ?? activeCategory.label),
        )}
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50/60">
      <Helmet>
        <title>Districts Explorer - KYL</title>
        <meta
          name="description"
          content="Explore Nigerian national, state, and district offices, with candidates and elected officials for each."
        />
      </Helmet>

      <section className="relative overflow-hidden bg-gradient-to-br from-[#0b3d2c] via-[#0f5a43] to-emerald-700 text-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-emerald-300/10 blur-3xl" />

        <div className="container relative mx-auto px-4 py-10 sm:py-14">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-50">
              <MapPin aria-hidden="true" className="h-3.5 w-3.5" /> Electoral geography
            </span>
            <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
              Districts Explorer
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-emerald-50/80 sm:text-base">
              Browse national, state, and district offices — then switch between the candidates and the elected
              officials serving there.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-gray-100 bg-white/95 backdrop-blur lg:sticky lg:top-16 lg:z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="w-full lg:max-w-xs lg:shrink-0">
              <label
                htmlFor="election-context"
                className="block text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400"
              >
                Election filter
              </label>
              <div className="relative mt-2">
                <select
                  id="election-context"
                  value={selectedElectionId ?? ''}
                  onChange={(event) => setSelectedElectionId(event.target.value ? Number(event.target.value) : null)}
                  disabled={initialLoading || elections.length === 0}
                  className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white pl-3 pr-9 text-sm font-semibold text-gray-900 outline-none transition focus:border-[#146c4f] focus:ring-2 focus:ring-[#146c4f]/15 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="">Select an election</option>
                  {elections.map((election) => (
                    <option key={election.id} value={election.id}>
                      {election.year}
                      {election.details ? ` — ${election.details}` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  aria-hidden="true"
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                />
              </div>
              <p className="mt-1.5 text-xs text-gray-500" aria-live="polite">
                {initialLoading
                  ? 'Loading elections…'
                  : !initialLoading && elections.length === 0
                    ? 'No elections available yet.'
                    : selectedElection
                      ? `Showing ${selectedElection.year}${selectedElection.details ? ` — ${selectedElection.details}` : ''}`
                      : 'Select an election to load records.'}
              </p>
            </div>

            <div className="min-w-0 lg:flex-1 lg:pl-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">Office level</p>
              <div role="tablist" aria-label="Office level" className="mt-2 flex flex-wrap gap-2">
                {CATEGORIES.map((category) => {
                  const Icon = category.icon;
                  const active = activeCategory.id === category.id;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => selectCategory(category)}
                      className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition-all sm:h-11 sm:px-5 ${
                        active
                          ? 'bg-[#146c4f] text-white shadow-md shadow-[#146c4f]/20'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Icon aria-hidden="true" className="h-4 w-4" /> {category.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-6 sm:py-10">
        {initialLoading ? (
          <div
            role="status"
            aria-label="Loading"
            className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
          >
            {Array.from({ length: 6 }).map((_, index) => (
              <CardSkeleton key={index} />
            ))}
          </div>
        ) : initialError && activeCategory.scope !== 'national' ? (
          <div role="alert" className="mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 px-6 py-8 text-center text-amber-900">
            <AlertCircle aria-hidden="true" className="mx-auto h-6 w-6" />
            <p className="mt-3 font-semibold">{initialError}</p>
          </div>
        ) : activeCategory.scope === 'national' ? (
          renderNational()
        ) : !selectedState ? (
          renderStates()
        ) : activeCategory.scope === 'state' ? (
          renderStateDetail()
        ) : selectedDistrict ? (
          renderDistrictDetail()
        ) : (
          renderDistrictList()
        )}
      </main>
    </div>
  );
}
