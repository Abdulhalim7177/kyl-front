import { useEffect, useState } from 'react';
import { visitorService } from '@/services/visitors';
import { electionService } from '@/services/elections';
import { ChevronRight, MapPin, User, ArrowRight, X, Search, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

export default function DistrictsExplorerPage() {
  const [states, setStates] = useState<any[]>([]);
  const [loadingStates, setLoadingStates] = useState(true);
  
  const [selectedState, setSelectedState] = useState<any>(null);
  const [stateDetails, setStateDetails] = useState<any>({
    lgas: [], senatorial: [], federal: [], stateHouse: []
  });
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Elections
  const [elections, setElections] = useState<any[]>([]);
  const [selectedElection, setSelectedElection] = useState<any>('');
  const [loadingElections, setLoadingElections] = useState(true);

  // Modal for candidates
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  // Wards Drill down
  const [selectedLga, setSelectedLga] = useState<any>(null);
  const [lgaWards, setLgaWards] = useState<any[]>([]);
  const [loadingWards, setLoadingWards] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [statesRes, electionsRes] = await Promise.all([
          visitorService.getStates().catch(() => [] as any[]),
          electionService.getAllElections().catch(() => [] as any[])
        ]);
        
        setStates(Array.isArray(statesRes) ? statesRes : ((statesRes as any)?.data || []));
        
        const elecArray = Array.isArray(electionsRes) ? electionsRes : ((electionsRes as any)?.data || []);
        setElections(elecArray);
        if (elecArray.length > 0) {
          setSelectedElection(elecArray[0].id);
        }
      } catch (err) {
        console.error('Error fetching initial data:', err);
      } finally {
        setLoadingStates(false);
        setLoadingElections(false);
      }
    };
    fetchInitialData();
  }, []);

  const handleStateClick = async (state: any) => {
    setSelectedState(state);
    setSelectedLga(null);
    setLoadingDetails(true);
    try {
      const [lgas, senatorial, federal, stateHouse] = await Promise.all([
        visitorService.getStateLgas(state.id).catch(() => [] as any[]),
        visitorService.getStateSenatorialDistricts(state.id).catch(() => [] as any[]),
        visitorService.getStateFederalHouseDistricts(state.id).catch(() => [] as any[]),
        visitorService.getStateStateHouseDistricts(state.id).catch(() => [] as any[]),
      ]);
      setStateDetails({
        lgas: Array.isArray(lgas) ? lgas : ((lgas as any)?.data || []),
        senatorial: Array.isArray(senatorial) ? senatorial : ((senatorial as any)?.data || []),
        federal: Array.isArray(federal) ? federal : ((federal as any)?.data || []),
        stateHouse: Array.isArray(stateHouse) ? stateHouse : ((stateHouse as any)?.data || [])
      });
    } catch (err) {
      console.error('Error fetching state details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleDistrictClick = async (type: string, item: any) => {
    if (type === 'LGA') {
      // First, fetch wards for this LGA to show them
      setSelectedLga(item);
      setLoadingWards(true);
      try {
        const wardsRes = await visitorService.getLgaWards(item.id);
        setLgaWards(Array.isArray(wardsRes) ? wardsRes : ((wardsRes as any)?.data || []));
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingWards(false);
      }
    }

    if (!selectedElection) return;

    // Fetch candidates
    setIsModalOpen(true);
    setModalTitle(`${item.name} (${type}) Candidates`);
    setLoadingCandidates(true);
    setCandidates([]);
    
    try {
      let data: any = [];
      const params = { election_id: selectedElection };
      
      switch (type) {
        case 'Senatorial':
          data = await visitorService.getSenatorialCandidates({ ...params, senetorial_district_id: item.id });
          break;
        case 'Federal':
          data = await visitorService.getFederalHouseCandidates({ ...params, federal_constituency_id: item.id });
          break;
        case 'StateHouse':
          data = await visitorService.getStateHouseCandidates({ ...params, state_constituency_id: item.id });
          break;
        case 'LGA':
          data = await visitorService.getLgaCandidates({ ...params, lga_district_id: item.id });
          break;
        case 'Ward':
          data = await visitorService.getWardCandidates({ ...params, ward_id: item.id });
          break;
      }
      
      setCandidates(Array.isArray(data) ? data : ((data as any)?.data || []));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCandidates(false);
    }
  };

  const DistrictBlock = ({ title, count, items, color, type }: { title: string, count: number, items: any[], color: string, type: string }) => (
    <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-gray-100 p-6 flex flex-col h-[350px]">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
        <h3 className="font-bold text-gray-900 tracking-tight">{title}</h3>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${color} bg-opacity-10 uppercase tracking-widest`}>
          {count} Total
        </span>
      </div>
      <ul className="space-y-2 overflow-y-auto flex-1 pr-2 custom-scrollbar">
        {items.map((item: any) => (
          <li key={item.id}>
            <button 
              onClick={() => handleDistrictClick(type, item)}
              className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer text-left group"
            >
              <MapPin size={14} className="text-gray-400 group-hover:text-primary transition-colors" />
              <span className="font-medium text-gray-700 text-sm flex-1">{item.name}</span>
              <ChevronRight size={14} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </li>
        ))}
        {items.length === 0 && (
          <li className="text-gray-400 italic text-sm text-center py-8">No records available.</li>
        )}
      </ul>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Helmet>
        <title>Districts Explorer - KYL</title>
      </Helmet>

      <div className="bg-gradient-to-r from-primary to-emerald-900 text-white py-12 px-4 shadow-md z-10">
        <div className="container mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">Districts Explorer</h1>
          <p className="text-emerald-100/80 font-light max-w-xl mx-auto mb-6">Select a state to explore its Senatorial, Federal, State Constituencies, and Local Government Areas.</p>
          
          <div className="max-w-sm mx-auto flex flex-col items-center gap-2">
            <label className="text-sm font-medium text-emerald-100">Active Election Context</label>
            {loadingElections ? (
              <Loader2 className="w-5 h-5 animate-spin text-emerald-100" />
            ) : (
              <select 
                value={selectedElection}
                onChange={e => setSelectedElection(e.target.value)}
                className="w-full bg-white/10 border border-white/20 text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 [&>option]:text-gray-900"
              >
                <option value="">Select an Election</option>
                {elections.map((el: any) => (
                  <option key={el.id} value={el.id}>{el.year} {el.details || 'Election'}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row gap-8 flex-1">
        {/* Sidebar: States */}
        <div className="w-full md:w-1/3 lg:w-1/4 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden flex flex-col h-[calc(100vh-280px)] min-h-[500px]">
          <div className="p-5 bg-gray-50/80 border-b border-gray-100 backdrop-blur-sm">
            <h2 className="font-bold text-gray-900 text-sm tracking-widest uppercase">Nigerian States</h2>
          </div>
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            {loadingStates ? (
              <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div></div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {states.map(state => (
                  <li key={state.id}>
                    <button 
                      onClick={() => handleStateClick(state)}
                      className={`w-full text-left px-5 py-4 flex items-center justify-between transition-all duration-300 ${
                        selectedState?.id === state.id 
                          ? 'bg-primary/5 text-primary font-bold border-l-4 border-primary' 
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'
                      }`}
                    >
                      <span>{state.name}</span>
                      <ChevronRight size={16} className={`transition-transform duration-300 ${selectedState?.id === state.id ? 'text-primary translate-x-1' : 'text-gray-300'}`} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Main Content: State Details */}
        <div className="w-full md:w-2/3 lg:w-3/4 flex flex-col min-h-[500px]">
          {!selectedState ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-white/50 border border-dashed border-gray-200 rounded-2xl">
              <span className="text-6xl mb-4">???</span>
              <h3 className="text-2xl font-bold text-gray-600 mb-2 tracking-tight">Select a State</h3>
              <p className="font-light">Choose a state from the sidebar to view its electoral districts.</p>
            </div>
          ) : loadingDetails ? (
            <div className="flex justify-center items-center h-full bg-white/50 rounded-2xl"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div></div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-primary tracking-widest uppercase mb-1">Electoral Geography</h2>
                  <h3 className="text-4xl font-extrabold text-gray-900 tracking-tight">{selectedState.name} State</h3>
                </div>
                {selectedLga && (
                   <button onClick={() => setSelectedLga(null)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium transition-colors">
                     Back to Districts
                   </button>
                )}
              </div>
              
              {!selectedLga ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <DistrictBlock 
                    type="Senatorial"
                    title="Senatorial Districts" 
                    count={stateDetails.senatorial.length} 
                    items={stateDetails.senatorial} 
                    color="text-emerald-600 bg-emerald-500" 
                  />
                  <DistrictBlock 
                    type="Federal"
                    title="Federal Constituencies" 
                    count={stateDetails.federal.length} 
                    items={stateDetails.federal} 
                    color="text-blue-600 bg-blue-500" 
                  />
                  <DistrictBlock 
                    type="StateHouse"
                    title="State Constituencies" 
                    count={stateDetails.stateHouse.length} 
                    items={stateDetails.stateHouse} 
                    color="text-purple-600 bg-purple-500" 
                  />
                  <DistrictBlock 
                    type="LGA"
                    title="Local Government Areas" 
                    count={stateDetails.lgas.length} 
                    items={stateDetails.lgas} 
                    color="text-orange-600 bg-orange-500" 
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {loadingWards ? (
                     <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                  ) : (
                     <DistrictBlock 
                        type="Ward"
                        title={`${selectedLga.name} Wards`} 
                        count={lgaWards.length} 
                        items={lgaWards} 
                        color="text-indigo-600 bg-indigo-500" 
                      />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Candidates Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/80">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{modalTitle}</h3>
                <p className="text-sm text-gray-500">Candidates competing in this area</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              {!selectedElection ? (
                <div className="text-center py-10">
                  <p className="text-red-500 font-medium">Please select an election from the top dropdown first.</p>
                </div>
              ) : loadingCandidates ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : candidates.length === 0 ? (
                <div className="text-center py-10 text-gray-500 flex flex-col items-center">
                  <Search className="w-12 h-12 text-gray-300 mb-3" />
                  <p>No candidates found for this district in the selected election.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {candidates.map((c: any) => {
                    // Depending on the backend response structure for CandidateOffice
                    const cand = c.candidate || c;
                    const candId = cand.id || c.id;
                    const name = cand.fullName || (cand.first_name ? `${cand.first_name} ${cand.last_name || ''}`.trim() : cand.name) || 'Unknown Candidate';
                    const subtitle = c.party?.acronym || cand.party?.acronym || 'Independent';
                    const imageUrl = cand.image?.url || cand.image_url || c.image?.url || c.image_url;

                    return (
                      <Link 
                        to={`/profile/${candId}`} 
                        key={`cand-${c.id}`} 
                        className="block p-4 border border-gray-100 rounded-xl hover:shadow-md hover:border-primary/20 transition-all bg-white flex items-center gap-4 group"
                        onClick={() => setIsModalOpen(false)}
                      >
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shrink-0 border border-gray-200">
                           {imageUrl ? <img src={imageUrl} alt={name} className="w-full h-full object-cover" /> : <User className="w-6 h-6 text-gray-400 group-hover:text-primary transition-colors" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 truncate group-hover:text-primary transition-colors">{name}</h3>
                          <p className="text-sm text-gray-500 truncate font-medium">{subtitle}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                           <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
