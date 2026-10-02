import { useEffect, useState } from 'react';
import { visitorService } from '@/services/visitors';
import { Link } from 'react-router-dom';

const CATEGORIES = [
  { id: 'presidency', label: 'Presidency', fetch: visitorService.getActiveElectedPresidency.bind(visitorService) },
  { id: 'governor', label: 'Governors', fetch: visitorService.getActiveElectedGovernor.bind(visitorService) },
  { id: 'senator', label: 'Senators', fetch: visitorService.getActiveElectedSenator.bind(visitorService) },
  { id: 'federal', label: 'House of Reps', fetch: visitorService.getActiveElectedHouseOfRepMember.bind(visitorService) },
  { id: 'state', label: 'State Assembly', fetch: visitorService.getActiveElectedStateAssemblyMember.bind(visitorService) },
  { id: 'lga', label: 'LGA Chairmen', fetch: visitorService.getActiveElectedLgaChairman.bind(visitorService) },
  { id: 'ward', label: 'Ward Councillors', fetch: visitorService.getActiveElectedWardCouncillor.bind(visitorService) },
];

export default function LeadersDirectoryPage() {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaders = async () => {
      setLoading(true);
      try {
        const res = await activeCategory.fetch();
        setLeaders(Array.isArray(res) ? res : (res?.data || []));
      } catch (err) {
        console.error('Error fetching leaders:', err);
        setLeaders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaders();
  }, [activeCategory]);

  return (
    <div className="min-h-screen bg-gray-50/50 relative overflow-hidden flex-1">
      {/* Decorative Orbs */}
      <div className="absolute top-10 left-10 w-[30%] h-[30%] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">Elected Leaders</h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto font-light">Discover the current officials serving in public office.</p>
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

        {/* Leaders List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {leaders && leaders.length > 0 ? (
              leaders.map((leader: any) => (
                <div key={leader.id} className="group bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex flex-col hover:-translate-y-2 hover:shadow-[0_15px_30px_rgb(0,0,0,0.08)] transition-all duration-500 overflow-hidden relative">
                  
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  <div className="p-8 pb-0 text-center relative z-10">
                     <div className="w-28 h-28 mx-auto rounded-full p-1 bg-gradient-to-tr from-gray-200 to-gray-300 group-hover:from-primary group-hover:to-emerald-400 mb-5 transition-all duration-500 shadow-sm">
                       <div className="w-full h-full rounded-full overflow-hidden border-2 border-white bg-gray-50 flex items-center justify-center">
                         {leader.candidate?.image?.url ? (
                           <img src={leader.candidate?.image?.url} alt="Avatar" className="w-full h-full object-cover" />
                         ) : (
                           <span className="text-3xl text-gray-400 uppercase font-light">{leader.candidate?.fullName?.charAt(0) || "U"}</span>
                         )}
                       </div>
                     </div>
                     <h3 className="text-xl font-bold text-gray-900 tracking-tight">{leader.candidate?.fullName}</h3>
                     <p className="text-xs font-bold text-primary uppercase tracking-widest mt-2 bg-primary/10 inline-block px-3 py-1 rounded-full">{leader.office?.title || leader.position || activeCategory.label}</p>
                  </div>
                  
                  <div className="mt-8 relative z-10 border-t border-gray-50 bg-gray-50/50">
                    <Link to={`/profile/${leader.candidate_id || leader.candidate?.id}`} className="block text-center text-gray-600 font-semibold hover:text-primary hover:bg-gray-100 text-sm py-4 w-full transition-colors">
                      View Profile &rarr;
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-20 text-gray-400 bg-white/50 backdrop-blur-sm rounded-2xl border border-dashed border-gray-200">
                <span className="block text-4xl mb-3">??</span>
                No active elected leaders found for {activeCategory.label}.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

