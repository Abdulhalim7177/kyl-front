import { useEffect, useState } from 'react';
import { visitorService } from '@/services/visitors';
import { ChevronRight, MapPin } from 'lucide-react';

export default function DistrictsExplorerPage() {
  const [states, setStates] = useState<any[]>([]);
  const [loadingStates, setLoadingStates] = useState(true);
  
  const [selectedState, setSelectedState] = useState<any>(null);
  const [stateDetails, setStateDetails] = useState<any>({
    lgas: [], senatorial: [], federal: [], stateHouse: []
  });
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    const fetchStates = async () => {
      try {
        const res = await visitorService.getStates();
        setStates(Array.isArray(res) ? res : (res?.data || []));
      } catch (err) {
        console.error('Error fetching states:', err);
      } finally {
        setLoadingStates(false);
      }
    };
    fetchStates();
  }, []);

  const handleStateClick = async (state: any) => {
    setSelectedState(state);
    setLoadingDetails(true);
    try {
      const [lgas, senatorial, federal, stateHouse] = await Promise.all([
        visitorService.getStateLgas(state.id).catch(() => []),
        visitorService.getStateSenatorialDistricts(state.id).catch(() => []),
        visitorService.getStateFederalHouseDistricts(state.id).catch(() => []),
        visitorService.getStateStateHouseDistricts(state.id).catch(() => []),
      ]);
      setStateDetails({
        lgas: Array.isArray(lgas) ? lgas : (lgas?.data || []),
        senatorial: Array.isArray(senatorial) ? senatorial : (senatorial?.data || []),
        federal: Array.isArray(federal) ? federal : (federal?.data || []),
        stateHouse: Array.isArray(stateHouse) ? stateHouse : (stateHouse?.data || [])
      });
    } catch (err) {
      console.error('Error fetching state details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const DistrictBlock = ({ title, count, items, color }: { title: string, count: number, items: any[], color: string }) => (
    <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-gray-100 p-6 flex flex-col h-[350px]">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
        <h3 className="font-bold text-gray-900 tracking-tight">{title}</h3>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${color} bg-opacity-10 uppercase tracking-widest`}>
          {count} Total
        </span>
      </div>
      <ul className="space-y-2 overflow-y-auto flex-1 pr-2 custom-scrollbar">
        {items.map((item: any) => (
          <li key={item.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-default">
            <MapPin size={14} className="text-gray-400" />
            <span className="font-medium text-gray-700 text-sm">{item.name}</span>
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
      <div className="bg-gradient-to-r from-primary to-emerald-900 text-white py-12 px-4 shadow-md z-10">
        <div className="container mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">Districts Explorer</h1>
          <p className="text-emerald-100/80 font-light max-w-xl mx-auto">Select a state to explore its Senatorial, Federal, State Constituencies, and Local Government Areas.</p>
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
              <div className="mb-8">
                <h2 className="text-sm font-bold text-primary tracking-widest uppercase mb-1">Electoral Geography</h2>
                <h3 className="text-4xl font-extrabold text-gray-900 tracking-tight">{selectedState.name} State</h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DistrictBlock 
                  title="Senatorial Districts" 
                  count={stateDetails.senatorial.length} 
                  items={stateDetails.senatorial} 
                  color="text-emerald-600 bg-emerald-500" 
                />
                <DistrictBlock 
                  title="Federal Constituencies" 
                  count={stateDetails.federal.length} 
                  items={stateDetails.federal} 
                  color="text-blue-600 bg-blue-500" 
                />
                <DistrictBlock 
                  title="State Constituencies" 
                  count={stateDetails.stateHouse.length} 
                  items={stateDetails.stateHouse} 
                  color="text-purple-600 bg-purple-500" 
                />
                <DistrictBlock 
                  title="Local Government Areas" 
                  count={stateDetails.lgas.length} 
                  items={stateDetails.lgas} 
                  color="text-orange-600 bg-orange-500" 
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
