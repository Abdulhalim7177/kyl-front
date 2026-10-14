import { type FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
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
}: {
  leader: DirectoryLeader;
  selectedState: District;
  isCandidate: boolean;
  candidatePage: number;
  preserveGovernorReturn?: boolean;
  officeFallback?: string;
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

  return (
    <Card className="h-full overflow-hidden border border-gray-100 shadow-md">
      <div className="h-2 bg-gradient-to-r from-[#146c4f] to-emerald-300" />
      <CardContent className="p-6 sm:p-8">
        <div className="mb-4 flex items-start justify-between">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold capitalize text-emerald-700">
            {leader.status || 'Active'}
          </span>
        </div>
        <div className="flex flex-col items-center text-center">
          <Avatar className="h-28 w-28 border-4 border-white shadow-lg ring-2 ring-[#146c4f]/20">
            {imageUrl && <AvatarImage src={imageUrl} alt={candidateName} className="object-cover" />}
            <AvatarFallback className="bg-[#146c4f]/10 text-2xl font-bold text-[#146c4f]">
              {candidateName.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-[#146c4f]">
            {leader.office?.title ?? leader.position ?? officeFallback ?? (isCandidate ? 'Gubernatorial Candidate' : 'Governor')}
          </p>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">{candidateName}</h2>
          <p className="mt-1 text-sm text-gray-500">{leader.state?.name ?? selectedState.state?.name ?? selectedState.name}</p>
        </div>

        <div className="mt-7 grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Political Party</p>
            <div className="mt-2 flex items-center gap-2">
              <Avatar className="h-12 w-12 border border-gray-200 bg-white">
                {partyLogo && <AvatarImage src={partyLogo} alt={`${party?.name ?? 'Party'} logo`} className="object-contain p-1" />}
                <AvatarFallback className="text-sm font-bold text-gray-500">{party?.name?.slice(0, 1) ?? 'P'}</AvatarFallback>
              </Avatar>
              <p className="truncate font-semibold text-gray-800">{party?.name ?? leader.partyName ?? 'Not specified'}</p>
            </div>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Election</p>
            <p className="mt-2 font-semibold text-gray-800">
              {leader.election?.year ?? leader.election?.details ?? 'Not specified'}
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Phone</p>
            <p className="mt-2 truncate font-semibold text-gray-800">
              {candidate.phoneNo ?? candidate.phone_no ?? 'Not specified'}
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Email</p>
            <p className="mt-2 truncate font-semibold text-gray-800">{candidate.email ?? 'Not specified'}</p>
          </div>
          {!isCandidate && (
            <>
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Term</p>
                <p className="mt-2 font-semibold text-gray-800">{leader.tenure || 'Not specified'}</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Term Dates</p>
                <p className="mt-2 font-semibold text-gray-800">
                  {formatDate(leader.start_date)} – {formatDate(leader.end_date)}
                </p>
              </div>
            </>
          )}
          {(leader.remark || leader.manifesto) && (
            <div className="rounded-xl bg-gray-50 p-4 sm:col-span-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {isCandidate ? 'Manifesto' : 'Remark'}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-gray-800">{leader.manifesto ?? leader.remark}</p>
            </div>
          )}
        </div>

        {profileId && (
          <Link
            to={`/profile/${profileId}`}
            state={preserveGovernorReturn ? {
              profileReturnContext: {
                governorStateId: selectedState.id,
                governorView: isCandidate ? 'candidates' : 'elected',
                candidatePage,
              },
            } : undefined}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#146c4f] px-4 py-3 font-semibold text-white transition-colors hover:bg-[#10563f]"
          >
            View Profile <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </CardContent>
    </Card>
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

  return (
    <div className="min-h-screen bg-gray-50/50 relative overflow-hidden flex-1">
      <div className="absolute top-10 left-10 w-[30%] h-[30%] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">Elected Leaders</h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto font-light">Discover the current officials serving in public office.</p>
        </div>

        <div className="flex flex-wrap gap-3 justify-center mb-12 max-w-4xl mx-auto p-2 bg-white/60 backdrop-blur-md rounded-2xl border border-gray-200/50 shadow-sm">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => selectCategory(category)}
              className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                activeCategory.id === category.id
                  ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {activeCategory.id === 'governor' ? (
          <section aria-live="polite">
            {selectedState ? (
              <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-[#146c4f]">Governors in</p>
                  <h2 className="mt-1 text-3xl font-bold text-gray-900">{selectedState.name}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedState(null);
                    setGovernorView(null);
                    setCandidateSearch(null);
                    setElectedSearchElectionId(null);
                  }}
                  className="inline-flex items-center gap-2 self-start rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-semibold text-gray-700 transition-colors hover:border-[#146c4f] hover:text-[#146c4f] sm:self-auto"
                >
                  <ArrowLeft className="h-4 w-4" /> All states
                </button>
              </div>
            ) : (
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900">Select a state</h2>
                <p className="mt-2 text-gray-500">Choose a state to view its gubernatorial candidates and elected governor.</p>
              </div>
            )}

            {selectedState && governorView && (
              <form
                onSubmit={governorView === 'candidates' ? searchGovernorCandidates : searchElectedGovernor}
                className="mb-8 grid grid-cols-1 gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
              >
                <label className="space-y-2 text-sm font-semibold text-gray-700">
                  Election <span className="text-red-600">*</span>
                  <input
                    required
                    value={governorView === 'candidates' ? candidateElectionYear : electedElectionYear}
                    onChange={(event) => governorView === 'candidates'
                      ? setCandidateElectionYear(event.target.value)
                      : setElectedElectionYear(event.target.value)}
                    type="text"
                    inputMode="numeric"
                    placeholder={electionsLoading ? 'Loading election years...' : 'Enter election year'}
                    className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm font-normal text-gray-800 outline-none focus:border-[#146c4f] focus:ring-2 focus:ring-[#146c4f]/15"
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
                      className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm font-normal text-gray-800 outline-none focus:border-[#146c4f] focus:ring-2 focus:ring-[#146c4f]/15"
                    />
                  </label>
                ) : (
                  <div className="flex items-end text-sm text-gray-500">
                    Search elected governors for {selectedState.name}.
                  </div>
                )}

                <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-1">
                  <button
                    type="submit"
                    disabled={electionsLoading || loading}
                    className="h-11 rounded-lg bg-[#146c4f] px-5 font-semibold text-white transition-colors hover:bg-[#10563f] disabled:cursor-not-allowed disabled:opacity-50"
                  >
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
                      className="h-11 rounded-lg border border-gray-200 px-4 font-semibold text-gray-700 transition-colors hover:border-[#146c4f] hover:text-[#146c4f]"
                    >
                      Show active
                    </button>
                  )}
                </div>
                {electionsError && (
                  <p role="alert" className="text-sm text-red-600 sm:col-span-2 lg:col-span-3">{electionsError}</p>
                )}
              </form>
            )}

            {loading ? (
              <div role="status" className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : loadError ? (
              <div role="alert" className="mx-auto max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 px-6 py-8 text-center text-amber-900">
                <p className="font-semibold">{loadError}</p>
              </div>
            ) : selectedState ? (
              !governorView ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => selectGovernorView('candidates')}
                    className="group rounded-2xl border border-gray-100 bg-white p-8 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-[#146c4f]/30 hover:shadow-lg"
                  >
                    <span className="text-xs font-bold uppercase tracking-wider text-[#146c4f]">{selectedState.name}</span>
                    <span className="mt-3 block text-2xl font-bold text-gray-900">Gubernatorial Candidates</span>
                    <span className="mt-2 block text-sm text-gray-500">View active candidates for governor.</span>
                    <span className="mt-6 inline-flex items-center gap-2 font-semibold text-[#146c4f]">
                      View Candidates <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => selectGovernorView('elected')}
                    className="group rounded-2xl border border-gray-100 bg-white p-8 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-[#146c4f]/30 hover:shadow-lg"
                  >
                    <span className="text-xs font-bold uppercase tracking-wider text-[#146c4f]">{selectedState.name}</span>
                    <span className="mt-3 block text-2xl font-bold text-gray-900">Elected Governor</span>
                    <span className="mt-2 block text-sm text-gray-500">View the elected governor and term details.</span>
                    <span className="mt-6 inline-flex items-center gap-2 font-semibold text-[#146c4f]">
                      View Elected Governor <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </button>
                </div>
              ) : (
                <section>
                  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-2xl font-bold text-gray-900">
                      {governorView === 'candidates' ? 'Active Gubernatorial Candidates' : 'Elected Governor'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setGovernorView(null)}
                      className="inline-flex items-center gap-2 self-start rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-semibold text-gray-700 transition-colors hover:border-[#146c4f] hover:text-[#146c4f] sm:self-auto"
                    >
                      <ArrowLeft className="h-4 w-4" /> Governor options
                    </button>
                  </div>
                  {(() => {
                    const entries = governorView === 'candidates' ? governorCandidates : electedGovernors;
                    return entries.length > 0 ? (
                      <div>
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
                        {governorView === 'candidates' && candidatePagination.lastPage > 1 && (
                          <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-xl border border-gray-100 bg-white p-4 sm:flex-row">
                            <p className="text-sm text-gray-500">
                              Showing {candidatePagination.from ?? ((candidatePagination.currentPage - 1) * candidatePagination.perPage + 1)}
                              {' '}to {candidatePagination.to ?? Math.min(candidatePagination.currentPage * candidatePagination.perPage, candidatePagination.total)}
                              {' '}of {candidatePagination.total} candidates
                            </p>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => setCandidatePage((page) => Math.max(1, page - 1))}
                                disabled={candidatePagination.currentPage <= 1 || loading}
                                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-[#146c4f] hover:text-[#146c4f] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Previous
                              </button>
                              <span className="text-sm font-medium text-gray-600">
                                Page {candidatePagination.currentPage} of {candidatePagination.lastPage}
                              </span>
                              <button
                                type="button"
                                onClick={() => setCandidatePage((page) => Math.min(candidatePagination.lastPage, page + 1))}
                                disabled={candidatePagination.currentPage >= candidatePagination.lastPage || loading}
                                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-[#146c4f] hover:text-[#146c4f] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Next
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-gray-200 bg-white/70 py-10 text-center text-gray-500">
                        No {governorView === 'candidates' ? 'active gubernatorial candidates' : 'elected governor records'} found for {selectedState.name}.
                      </div>
                    );
                  })()}
                </section>
              )
            ) : states.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {states.map((state) => (
                  <button
                    key={state.id}
                    type="button"
                    onClick={() => setSelectedState(state)}
                    className="rounded-xl border border-gray-100 bg-white px-4 py-4 text-left font-semibold text-gray-800 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#146c4f]/30 hover:text-[#146c4f] hover:shadow-md"
                  >
                    {state.name}
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white/70 py-10 text-center text-gray-500">
                No states are available.
              </div>
            )}
          </section>
        ) : activeCategory.id === 'senator' ? (
          <section aria-live="polite">
            {selectedSenatorialDistrict ? (
              <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-[#146c4f]">
                    Senatorial district · {selectedSenatorialState?.name ?? 'Nigeria'}
                  </p>
                  <h2 className="mt-1 text-3xl font-bold text-gray-900">{selectedSenatorialDistrict.name}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSenatorialDistrict(null);
                    setSenatorialView(null);
                    setSenatorialCandidates([]);
                    setElectedSenators([]);
                  }}
                  className="inline-flex items-center gap-2 self-start rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-semibold text-gray-700 transition-colors hover:border-[#146c4f] hover:text-[#146c4f] sm:self-auto"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to districts
                </button>
              </div>
            ) : selectedSenatorialState ? (
              <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-[#146c4f]">Senators</p>
                  <h2 className="mt-1 text-3xl font-bold text-gray-900">{selectedSenatorialState.name} Senatorial Districts</h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSenatorialState(null);
                    setSenatorialDistricts([]);
                    setSenatorialDistrictPage(1);
                  }}
                  className="inline-flex items-center gap-2 self-start rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-semibold text-gray-700 transition-colors hover:border-[#146c4f] hover:text-[#146c4f] sm:self-auto"
                >
                  <ArrowLeft className="h-4 w-4" /> All states
                </button>
              </div>
            ) : (
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900">Select a State</h2>
                <p className="mt-2 text-gray-500">Choose a state to see its senatorial districts.</p>
              </div>
            )}

            {loading ? (
              <div role="status" className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : loadError ? (
              <div role="alert" className="mx-auto max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 px-6 py-8 text-center text-amber-900">
                <p className="font-semibold">{loadError}</p>
              </div>
            ) : !selectedSenatorialState ? (
              states.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {states.map((state) => (
                    <button
                      key={state.id}
                      type="button"
                      onClick={() => selectSenatorialState(state)}
                      className="rounded-xl border border-gray-100 bg-white px-4 py-4 text-left font-semibold text-gray-800 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#146c4f]/30 hover:text-[#146c4f] hover:shadow-md"
                    >
                      {state.name}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white/70 py-10 text-center text-gray-500">
                  No states are available.
                </div>
              )
            ) : !selectedSenatorialDistrict ? (
              senatorialDistricts.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {paginatedSenatorialDistricts.map((district) => (
                      <button
                        key={district.id}
                        type="button"
                        onClick={() => selectSenatorialDistrict(district)}
                        className="group rounded-2xl border border-gray-100 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-[#146c4f]/30 hover:shadow-lg"
                      >
                        <span className="text-xs font-bold uppercase tracking-wider text-[#146c4f]">{selectedSenatorialState.name}</span>
                        <span className="mt-2 block text-xl font-bold text-gray-900">{district.name}</span>
                        {district.code && <span className="mt-1 block text-sm text-gray-500">{district.code}</span>}
                        <span className="mt-5 inline-flex items-center gap-2 font-semibold text-[#146c4f]">
                          View district <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </span>
                      </button>
                    ))}
                  </div>
                  {totalSenatorialDistrictPages > 1 && (
                    <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-xl border border-gray-100 bg-white p-4 sm:flex-row">
                      <p className="text-sm text-gray-500">
                        Showing {(senatorialDistrictPage - 1) * SENATORIAL_DISTRICTS_PER_PAGE + 1}
                        {' '}to {Math.min(senatorialDistrictPage * SENATORIAL_DISTRICTS_PER_PAGE, senatorialDistricts.length)}
                        {' '}of {senatorialDistricts.length} senatorial districts
                      </p>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setSenatorialDistrictPage((page) => Math.max(1, page - 1))}
                          disabled={senatorialDistrictPage <= 1}
                          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-[#146c4f] hover:text-[#146c4f] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <span className="text-sm font-medium text-gray-600">
                          Page {senatorialDistrictPage} of {totalSenatorialDistrictPages}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSenatorialDistrictPage((page) => Math.min(totalSenatorialDistrictPages, page + 1))}
                          disabled={senatorialDistrictPage >= totalSenatorialDistrictPages}
                          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-[#146c4f] hover:text-[#146c4f] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white/70 py-10 text-center text-gray-500">
                  No senatorial districts are available for {selectedSenatorialState.name}.
                </div>
              )
            ) : !senatorialView ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => selectSenatorialView('candidates')}
                  className="group rounded-2xl border border-gray-100 bg-white p-8 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-[#146c4f]/30 hover:shadow-lg"
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-[#146c4f]">{selectedSenatorialDistrict.state?.name}</span>
                  <span className="mt-3 block text-2xl font-bold text-gray-900">Senatorial Candidates</span>
                  <span className="mt-2 block text-sm text-gray-500">View active candidates for {selectedSenatorialDistrict.name}.</span>
                  <span className="mt-6 inline-flex items-center gap-2 font-semibold text-[#146c4f]">
                    View Candidates <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => selectSenatorialView('elected')}
                  className="group rounded-2xl border border-gray-100 bg-white p-8 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-[#146c4f]/30 hover:shadow-lg"
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-[#146c4f]">{selectedSenatorialDistrict.state?.name}</span>
                  <span className="mt-3 block text-2xl font-bold text-gray-900">Elected Senator</span>
                  <span className="mt-2 block text-sm text-gray-500">View elected senator details for {selectedSenatorialDistrict.name}.</span>
                  <span className="mt-6 inline-flex items-center gap-2 font-semibold text-[#146c4f]">
                    View Elected Senator <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </button>
              </div>
            ) : (
              <section>
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {senatorialView === 'candidates' ? 'Active Senatorial Candidates' : 'Elected Senator'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setSenatorialView(null)}
                    className="inline-flex items-center gap-2 self-start rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-semibold text-gray-700 transition-colors hover:border-[#146c4f] hover:text-[#146c4f] sm:self-auto"
                  >
                    <ArrowLeft className="h-4 w-4" /> Senator options
                  </button>
                </div>
                {(() => {
                  const entries = senatorialView === 'candidates' ? senatorialCandidates : electedSenators;
                  return entries.length > 0 ? (
                    <div>
                      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {entries.map((leader) => (
                          <GovernorLeaderCard
                            key={leader.id}
                            leader={leader}
                            selectedState={selectedSenatorialDistrict}
                            isCandidate={senatorialView === 'candidates'}
                            candidatePage={senatorialCandidatePage}
                            preserveGovernorReturn={false}
                            officeFallback={senatorialView === 'candidates' ? 'Senatorial Candidate' : 'Senator'}
                          />
                        ))}
                      </div>
                      {senatorialView === 'candidates' && senatorialCandidatePagination.lastPage > 1 && (
                        <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-xl border border-gray-100 bg-white p-4 sm:flex-row">
                          <p className="text-sm text-gray-500">
                            Showing {senatorialCandidatePagination.from ?? ((senatorialCandidatePagination.currentPage - 1) * senatorialCandidatePagination.perPage + 1)}
                            {' '}to {senatorialCandidatePagination.to ?? Math.min(senatorialCandidatePagination.currentPage * senatorialCandidatePagination.perPage, senatorialCandidatePagination.total)}
                            {' '}of {senatorialCandidatePagination.total} candidates
                          </p>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setSenatorialCandidatePage((page) => Math.max(1, page - 1))}
                              disabled={senatorialCandidatePagination.currentPage <= 1 || loading}
                              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-[#146c4f] hover:text-[#146c4f] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Previous
                            </button>
                            <span className="text-sm font-medium text-gray-600">
                              Page {senatorialCandidatePagination.currentPage} of {senatorialCandidatePagination.lastPage}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSenatorialCandidatePage((page) => Math.min(senatorialCandidatePagination.lastPage, page + 1))}
                              disabled={senatorialCandidatePagination.currentPage >= senatorialCandidatePagination.lastPage || loading}
                              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-[#146c4f] hover:text-[#146c4f] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-white/70 py-10 text-center text-gray-500">
                      No {senatorialView === 'candidates' ? 'active senatorial candidates' : 'elected senator records'} found for {selectedSenatorialDistrict.name}.
                    </div>
                  );
                })()}
              </section>
            )}
          </section>
        ) : activeCategory.id === 'federal' ? (
          <section aria-live="polite">
            {selectedFederalHouseDistrict ? (
              <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-[#146c4f]">
                    Federal House district · {selectedFederalHouseState?.name ?? 'Nigeria'}
                  </p>
                  <h2 className="mt-1 text-3xl font-bold text-gray-900">{selectedFederalHouseDistrict.name}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFederalHouseDistrict(null);
                    setFederalHouseView(null);
                    setFederalHouseCandidates([]);
                    setElectedFederalHouseMembers([]);
                  }}
                  className="inline-flex items-center gap-2 self-start rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-semibold text-gray-700 transition-colors hover:border-[#146c4f] hover:text-[#146c4f] sm:self-auto"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to districts
                </button>
              </div>
            ) : selectedFederalHouseState ? (
              <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-[#146c4f]">House of Representatives</p>
                  <h2 className="mt-1 text-3xl font-bold text-gray-900">{selectedFederalHouseState.name} Federal House Districts</h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFederalHouseState(null);
                    setFederalHouseDistricts([]);
                    setFederalHouseDistrictPage(1);
                  }}
                  className="inline-flex items-center gap-2 self-start rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-semibold text-gray-700 transition-colors hover:border-[#146c4f] hover:text-[#146c4f] sm:self-auto"
                >
                  <ArrowLeft className="h-4 w-4" /> All states
                </button>
              </div>
            ) : (
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900">Select a State</h2>
                <p className="mt-2 text-gray-500">Choose a state to see its federal house districts.</p>
              </div>
            )}

            {loading ? (
              <div role="status" className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : loadError ? (
              <div role="alert" className="mx-auto max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 px-6 py-8 text-center text-amber-900">
                <p className="font-semibold">{loadError}</p>
              </div>
            ) : !selectedFederalHouseState ? (
              states.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {states.map((state) => (
                    <button
                      key={state.id}
                      type="button"
                      onClick={() => selectFederalHouseState(state)}
                      className="rounded-xl border border-gray-100 bg-white px-4 py-4 text-left font-semibold text-gray-800 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#146c4f]/30 hover:text-[#146c4f] hover:shadow-md"
                    >
                      {state.name}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white/70 py-10 text-center text-gray-500">
                  No states are available.
                </div>
              )
            ) : !selectedFederalHouseDistrict ? (
              federalHouseDistricts.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {paginatedFederalHouseDistricts.map((district) => (
                      <button
                        key={district.id}
                        type="button"
                        onClick={() => selectFederalHouseDistrict(district)}
                        className="group rounded-2xl border border-gray-100 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-[#146c4f]/30 hover:shadow-lg"
                      >
                        <span className="text-xs font-bold uppercase tracking-wider text-[#146c4f]">{selectedFederalHouseState.name}</span>
                        <span className="mt-2 block text-xl font-bold text-gray-900">{district.name}</span>
                        {district.code && <span className="mt-1 block text-sm text-gray-500">{district.code}</span>}
                        <span className="mt-5 inline-flex items-center gap-2 font-semibold text-[#146c4f]">
                          View district <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </span>
                      </button>
                    ))}
                  </div>
                  {totalFederalHouseDistrictPages > 1 && (
                    <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-xl border border-gray-100 bg-white p-4 sm:flex-row">
                      <p className="text-sm text-gray-500">
                        Showing {(federalHouseDistrictPage - 1) * FEDERAL_HOUSE_DISTRICTS_PER_PAGE + 1}
                        {' '}to {Math.min(federalHouseDistrictPage * FEDERAL_HOUSE_DISTRICTS_PER_PAGE, federalHouseDistricts.length)}
                        {' '}of {federalHouseDistricts.length} federal house districts
                      </p>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setFederalHouseDistrictPage((page) => Math.max(1, page - 1))}
                          disabled={federalHouseDistrictPage <= 1}
                          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-[#146c4f] hover:text-[#146c4f] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <span className="text-sm font-medium text-gray-600">
                          Page {federalHouseDistrictPage} of {totalFederalHouseDistrictPages}
                        </span>
                        <button
                          type="button"
                          onClick={() => setFederalHouseDistrictPage((page) => Math.min(totalFederalHouseDistrictPages, page + 1))}
                          disabled={federalHouseDistrictPage >= totalFederalHouseDistrictPages}
                          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-[#146c4f] hover:text-[#146c4f] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white/70 py-10 text-center text-gray-500">
                  No federal house districts are available for {selectedFederalHouseState.name}.
                </div>
              )
            ) : !federalHouseView ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => selectFederalHouseView('candidates')}
                  className="group rounded-2xl border border-gray-100 bg-white p-8 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-[#146c4f]/30 hover:shadow-lg"
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-[#146c4f]">{selectedFederalHouseState.name}</span>
                  <span className="mt-3 block text-2xl font-bold text-gray-900">House of Reps Candidates</span>
                  <span className="mt-2 block text-sm text-gray-500">View active candidates for {selectedFederalHouseDistrict.name}.</span>
                  <span className="mt-6 inline-flex items-center gap-2 font-semibold text-[#146c4f]">
                    View Candidates <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => selectFederalHouseView('elected')}
                  className="group rounded-2xl border border-gray-100 bg-white p-8 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-[#146c4f]/30 hover:shadow-lg"
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-[#146c4f]">{selectedFederalHouseState.name}</span>
                  <span className="mt-3 block text-2xl font-bold text-gray-900">Elected House of Reps Member</span>
                  <span className="mt-2 block text-sm text-gray-500">View elected representative for {selectedFederalHouseDistrict.name}.</span>
                  <span className="mt-6 inline-flex items-center gap-2 font-semibold text-[#146c4f]">
                    View Elected Member <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </button>
              </div>
            ) : (
              <section>
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {federalHouseView === 'candidates' ? 'Active House of Reps Candidates' : 'Elected House of Reps Member'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setFederalHouseView(null)}
                    className="inline-flex items-center gap-2 self-start rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-semibold text-gray-700 transition-colors hover:border-[#146c4f] hover:text-[#146c4f] sm:self-auto"
                  >
                    <ArrowLeft className="h-4 w-4" /> House of Reps options
                  </button>
                </div>
                {(() => {
                  const entries = federalHouseView === 'candidates' ? federalHouseCandidates : electedFederalHouseMembers;
                  return entries.length > 0 ? (
                    <div>
                      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {entries.map((leader) => (
                          <GovernorLeaderCard
                            key={leader.id}
                            leader={leader}
                            selectedState={selectedFederalHouseDistrict}
                            isCandidate={federalHouseView === 'candidates'}
                            candidatePage={federalHouseCandidatePage}
                            preserveGovernorReturn={false}
                            officeFallback={federalHouseView === 'candidates' ? 'House of Representatives Candidate' : 'House of Representatives Member'}
                          />
                        ))}
                      </div>
                      {federalHouseView === 'candidates' && federalHouseCandidatePagination.lastPage > 1 && (
                        <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-xl border border-gray-100 bg-white p-4 sm:flex-row">
                          <p className="text-sm text-gray-500">
                            Showing {federalHouseCandidatePagination.from ?? ((federalHouseCandidatePagination.currentPage - 1) * federalHouseCandidatePagination.perPage + 1)}
                            {' '}to {federalHouseCandidatePagination.to ?? Math.min(federalHouseCandidatePagination.currentPage * federalHouseCandidatePagination.perPage, federalHouseCandidatePagination.total)}
                            {' '}of {federalHouseCandidatePagination.total} candidates
                          </p>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setFederalHouseCandidatePage((page) => Math.max(1, page - 1))}
                              disabled={federalHouseCandidatePagination.currentPage <= 1 || loading}
                              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-[#146c4f] hover:text-[#146c4f] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Previous
                            </button>
                            <span className="text-sm font-medium text-gray-600">
                              Page {federalHouseCandidatePagination.currentPage} of {federalHouseCandidatePagination.lastPage}
                            </span>
                            <button
                              type="button"
                              onClick={() => setFederalHouseCandidatePage((page) => Math.min(federalHouseCandidatePagination.lastPage, page + 1))}
                              disabled={federalHouseCandidatePagination.currentPage >= federalHouseCandidatePagination.lastPage || loading}
                              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-[#146c4f] hover:text-[#146c4f] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-white/70 py-10 text-center text-gray-500">
                      No {federalHouseView === 'candidates' ? 'active House of Reps candidates' : 'elected House of Reps members'} found for {selectedFederalHouseDistrict.name}.
                    </div>
                  );
                })()}
              </section>
            )}
          </section>
        ) : loading ? (
          <div role="status" className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : loadError ? (
          <div role="alert" className="mx-auto max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 px-6 py-8 text-center text-amber-900">
            <p className="font-semibold">{loadError}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {leaders.length > 0 ? (
              leaders.map((leader) => (
                <div key={leader.id} className="group bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex flex-col hover:-translate-y-2 hover:shadow-[0_15px_30px_rgb(0,0,0,0.08)] transition-all duration-500 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="p-8 pb-0 text-center relative z-10">
                    <div className="w-28 h-28 mx-auto rounded-full p-1 bg-gradient-to-tr from-gray-200 to-gray-300 group-hover:from-primary group-hover:to-emerald-400 mb-5 transition-all duration-500 shadow-sm">
                      <div className="w-full h-full rounded-full overflow-hidden border-2 border-white bg-gray-50 flex items-center justify-center">
                        {getLogoUrl(leader.candidate?.image) ? (
                          <img src={getLogoUrl(leader.candidate?.image) ?? undefined} alt={leader.candidate?.fullName ?? 'Leader'} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-3xl text-gray-400 uppercase font-light">
                            {leader.candidate?.fullName?.charAt(0) ?? 'L'}
                          </span>
                        )}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                      {leader.candidate?.fullName ?? leader.candidate?.full_name ?? leader.name ?? 'Name not available'}
                    </h3>
                    <p className="text-xs font-bold text-primary uppercase tracking-widest mt-2 bg-primary/10 inline-block px-3 py-1 rounded-full">
                      {leader.office?.title ?? leader.position ?? activeCategory.label}
                    </p>
                  </div>
                  <div className="mt-8 relative z-10 border-t border-gray-50 bg-gray-50/50">
                    {(leader.candidate_id ?? leader.candidate?.id) && (
                      <Link to={`/profile/${leader.candidate_id ?? leader.candidate?.id}`} className="block text-center text-gray-600 font-semibold hover:text-primary hover:bg-gray-100 text-sm py-4 w-full transition-colors">
                        View Profile <span aria-hidden="true">→</span>
                      </Link>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-20 text-gray-400 bg-white/50 backdrop-blur-sm rounded-2xl border border-dashed border-gray-200">
                No active elected leaders found for {activeCategory.label}.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
