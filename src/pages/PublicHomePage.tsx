import { useEffect, useState } from 'react';
import { visitorService } from '@/services/visitors';
import { Link } from 'react-router-dom';

export default function PublicHomePage() {
  const [presidency, setPresidency] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const pres = await visitorService.getActiveElectedPresidency();
        setPresidency(Array.isArray(pres) ? pres : (pres?.data || []));
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative overflow-hidden">
      {/* Decorative Background Orbs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]"></div>
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] rounded-full bg-emerald-600/5 blur-[100px]"></div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 bg-gradient-to-br from-primary via-[#006A3F] to-emerald-950 text-white py-28 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="container mx-auto text-center relative z-10">
          <span className="inline-block py-1 px-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-medium tracking-wider uppercase mb-6 shadow-xl">
            Civic Transparency Platform
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight drop-shadow-lg">
            Know Your <span className="text-emerald-300">Leaders</span>
          </h1>
          <p className="text-lg md:text-2xl mb-12 max-w-3xl mx-auto opacity-90 leading-relaxed font-light drop-shadow">
            A comprehensive, premium directory of candidates and elected leaders across all districts and government levels.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <Link to="/districts" className="bg-white/95 text-primary hover:bg-white hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] px-8 py-4 rounded-xl font-bold transition-all duration-300 ease-out shadow-lg">
              Explore Districts
            </Link>
            <Link to="/leaders" className="bg-black/20 backdrop-blur-md border border-white/30 hover:bg-black/40 hover:scale-105 hover:border-white/50 px-8 py-4 rounded-xl font-bold transition-all duration-300 ease-out shadow-lg">
              View Elected Leaders
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Section */}
      <section className="py-24 px-4 container mx-auto flex-1 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-sm font-bold text-primary tracking-[0.2em] uppercase mb-3">Executive Office</h2>
          <h3 className="text-4xl font-bold text-gray-900 tracking-tight">Current Presidency</h3>
          <div className="w-24 h-1 bg-gradient-to-r from-primary to-emerald-300 mx-auto mt-6 rounded-full"></div>
        </div>
        
        {loading ? (
          <div className="flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {presidency && presidency.length > 0 ? (
              presidency.map((leader: any) => (
                <div key={leader.id} className="group bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 overflow-hidden hover:-translate-y-2 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500">
                  <div className="p-8 text-center relative">
                    <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-primary/5 to-transparent"></div>
                    <div className="relative w-28 h-28 mx-auto rounded-full p-1 bg-gradient-to-tr from-primary to-emerald-300 mb-6 shadow-xl group-hover:scale-105 transition-transform duration-500">
                      <div className="w-full h-full rounded-full bg-white overflow-hidden border-2 border-white">
                        {leader.candidate?.user?.avatar ? (
                          <img src={leader.candidate.user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-300 bg-gray-50 uppercase">
                            {leader.candidate?.user?.first_name?.charAt(0)}{leader.candidate?.user?.last_name?.charAt(0)}
                          </span>
                        )}
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1 tracking-tight">{leader.candidate?.user?.first_name} {leader.candidate?.user?.last_name}</h3>
                    <p className="text-emerald-600 font-medium tracking-wide uppercase text-xs mb-6">{leader.position || 'President'}</p>
                    
                    <Link to={`/profile/${leader.candidate_id}`} className="inline-flex items-center justify-center w-full bg-gray-50 group-hover:bg-primary group-hover:text-white text-gray-700 font-semibold py-3 px-4 rounded-xl transition-colors duration-300">
                      View Profile <span className="ml-2 group-hover:translate-x-1 transition-transform">&rarr;</span>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center text-gray-500 py-12 bg-white/50 backdrop-blur-md rounded-2xl border border-dashed border-gray-300">
                No active presidency data available.
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
