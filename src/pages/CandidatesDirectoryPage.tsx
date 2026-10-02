import { useEffect, useState } from 'react';
import { visitorService } from '@/services/visitors';
import { Link } from 'react-router-dom';

const CATEGORIES = [
  { id: 'presidency', label: 'Presidency', fetch: visitorService.getActivePresidencyCandidates.bind(visitorService) },
  { id: 'governor', label: 'Governors', fetch: visitorService.getActiveGovernatorialCandidates.bind(visitorService) },
  { id: 'senator', label: 'Senators', fetch: visitorService.getActiveSenatorialCandidates.bind(visitorService) },
  { id: 'federal', label: 'Federal House', fetch: visitorService.getActiveFederalHouseCandidates.bind(visitorService) },
  { id: 'state', label: 'State House', fetch: visitorService.getActiveStateHouseCandidates.bind(visitorService) },
  { id: 'lga', label: 'LGA Chairmen', fetch: visitorService.getActiveLgaCandidates.bind(visitorService) },
  { id: 'ward', label: 'Ward Councillors', fetch: visitorService.getActiveWardCandidates.bind(visitorService) },
];

export default function CandidatesDirectoryPage() {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCandidates = async () => {
      setLoading(true);
      try {
        const res = await activeCategory.fetch();
        setCandidates(Array.isArray(res) ? res : (res?.data || []));
      } catch (err) {
        console.error('Error fetching candidates:', err);
        setCandidates([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCandidates();
  }, [activeCategory]);

  return (
    <div className="min-h-screen bg-gray-50/50 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">Candidates Directory</h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto font-light">Explore active political candidates running for offices across the nation.</p>
        </div>
        
        {/* Category Tabs - Sleek Pill Design */}
        <div className="flex flex-wrap gap-3 justify-center mb-16 max-w-4xl mx-auto p-2 bg-white/60 backdrop-blur-md rounded-2xl border border-gray-200/50 shadow-sm">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                activeCategory.id === cat.id 
                  ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Candidate List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {candidates && candidates.length > 0 ? (
              candidates.map((candidate: any) => (
                <div key={candidate.id} className="group bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 p-8 flex flex-col hover:-translate-y-2 hover:shadow-[0_15px_30px_rgb(0,0,0,0.06)] transition-all duration-500 relative overflow-hidden">
                  {/* Subtle top accent */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gray-200 to-gray-300 group-hover:from-primary group-hover:to-emerald-400 transition-colors duration-500"></div>
                  
                  <div className="mb-6 text-center">
                     <div className="w-24 h-24 mx-auto bg-gray-50 rounded-full mb-4 flex items-center justify-center overflow-hidden border border-gray-200 group-hover:border-primary/30 transition-colors shadow-sm">
                       {(candidate.candidate?.image?.url || candidate.image?.url) ? (
                         <img src={(candidate.candidate?.image?.url || candidate.image?.url)} alt="Avatar" className="w-full h-full object-cover" />
                       ) : (
                         <span className="text-3xl text-gray-400 uppercase font-light">{candidate.candidate?.fullName?.charAt(0) || candidate.fullName?.charAt(0) || "C"}</span>
                       )}
                     </div>
                     <h3 className="text-xl font-bold text-gray-900 tracking-tight">{candidate.candidate?.fullName || candidate.fullName}</h3>
                     <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">{candidate.party?.name || 'Independent'}</p>
                  </div>
                  
                  <div className="mt-auto text-center">
                    <Link to={`/profile/${candidate.id}`} className="text-primary font-semibold hover:text-emerald-700 text-sm inline-flex items-center justify-center py-2 w-full bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors">
                      View Full Profile
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-20 text-gray-400 bg-white/50 backdrop-blur-sm rounded-2xl border border-dashed border-gray-200">
                <span className="block text-4xl mb-3">??</span>
                No active candidates found for {activeCategory.label}.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

