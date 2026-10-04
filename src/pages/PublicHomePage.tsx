import { useEffect, useState, useRef } from 'react';
import { visitorService } from '@/services/visitors';
import { electionService, Election } from '@/services/elections';
import { pollService, Poll } from '@/services/polls';
import { blogService, Post } from '@/services/blogs';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Calendar, BarChart2 } from 'lucide-react';

export default function PublicHomePage() {
  const [presidency, setPresidency] = useState<any[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  const [activePolls, setActivePolls] = useState<Poll[]>([]);
  const [blogs, setBlogs] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const pres = await visitorService.getActiveElectedPresidency();
        setPresidency(Array.isArray(pres) ? pres : (pres?.data || []));
        
        const elecs = await electionService.getAllElections();
        setElections(elecs);

        const polls = await pollService.getPolls();
        const blogsRes = await blogService.getPosts();
        setBlogs(blogsRes.data?.slice(0, 3) || []);
        setActivePolls(polls.filter(p => p.status === 'active').slice(0, 3));
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  const scrollPrev = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -400, behavior: 'smooth' });
    }
  };

  const scrollNext = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 400, behavior: 'smooth' });
    }
  };

  // Modern placeholder images for elections based on index
  const electionColors = ['from-blue-500 to-cyan-400', 'from-emerald-500 to-teal-400', 'from-orange-500 to-amber-400', 'from-purple-500 to-pink-400'];

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

      {/* Elections Carousel Section */}
      <section className="py-20 px-4 container mx-auto relative z-10 -mt-12">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/60 p-8 md:p-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Featured Elections</h2>
              <p className="text-gray-500 mt-2">Explore candidates and positions for upcoming and past elections.</p>
            </div>
            <div className="flex gap-2 hidden md:flex">
              <button onClick={scrollPrev} className="p-3 rounded-full bg-gray-100 hover:bg-primary hover:text-white transition-colors text-gray-700">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={scrollNext} className="p-3 rounded-full bg-gray-100 hover:bg-primary hover:text-white transition-colors text-gray-700">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {loading ? (
             <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div></div>
          ) : elections.length === 0 ? (
             <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                No elections are currently scheduled.
             </div>
          ) : (
            <div className="relative group">
              <div 
                ref={carouselRef} 
                className="flex overflow-x-auto gap-6 snap-x snap-mandatory hide-scrollbar pb-6"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {elections.map((election, index) => (
                  <div 
                    key={election.id} 
                    className="min-w-[320px] md:min-w-[400px] flex-shrink-0 snap-start bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 group/card relative"
                  >
                    <div className="h-48 overflow-hidden relative">
                       <div className="absolute inset-0 bg-black/20 z-10 group-hover/card:bg-black/10 transition-colors"></div>
                       <div className={`w-full h-full bg-gradient-to-br ${electionColors[index % electionColors.length]} group-hover/card:scale-105 transition-transform duration-700`} />
                       <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-gray-900 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-primary" /> {election.year}
                       </div>
                       <div className="absolute top-4 right-4 z-20 bg-emerald-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-md">
                          {election.status}
                       </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                        {election.details || `${election.year} General Election`}
                      </h3>
                      <Link 
                        to={`/election/${election.id}`} 
                        className="inline-flex items-center text-primary font-semibold hover:text-emerald-700 transition-colors group-hover/card:translate-x-1"
                      >
                        View Positions & Candidates <ChevronRight className="w-4 h-4 ml-1" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Active Polls Section */}
      {activePolls.length > 0 && (
        <section className="py-24 px-4 container mx-auto flex-1 relative z-10">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-sm font-bold text-primary tracking-[0.2em] uppercase mb-3">Public Opinion</h2>
              <h3 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">Active Polls</h3>
            </div>
            <Link to="/polls" className="hidden md:flex items-center text-primary font-bold hover:text-emerald-700 transition-colors">
              View All Polls <ChevronRight className="w-5 h-5 ml-1" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activePolls.map(poll => (
              <div key={poll.id} className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col h-full hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300">
                <div className="flex items-center gap-2 mb-6">
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-sm font-bold text-green-600 uppercase tracking-wider">Active</span>
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-4">{poll.title || poll.question}</h4>
                {poll.description ? (
                  <p className="text-gray-500 mb-8 line-clamp-3 flex-grow">{poll.description}</p>
                ) : (
                  <div className="mb-8 flex-grow"></div>
                )}
                
                <Link to={`/poll/${poll.id}`} className="mt-auto w-full inline-flex items-center justify-center gap-2 bg-primary text-white font-bold py-3.5 px-6 rounded-xl hover:bg-emerald-600 transition-colors">
                  <BarChart2 className="w-5 h-5" /> Participate
                </Link>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center md:hidden">
            <Link to="/polls" className="inline-flex items-center text-primary font-bold hover:text-emerald-700 transition-colors">
              View All Polls <ChevronRight className="w-5 h-5 ml-1" />
            </Link>
          </div>
        </section>
      )}

            {/* Latest Blogs Section */}
      {blogs.length > 0 && (
        <section className="py-24 px-4 container mx-auto flex-1 relative z-10 bg-gray-50/50">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-sm font-bold text-primary tracking-[0.2em] uppercase mb-3">News & Updates</h2>
              <h3 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">Latest Blogs</h3>
            </div>
            <Link to="/blogs" className="hidden md:flex items-center text-primary font-bold hover:text-emerald-700 transition-colors">
              View All Blogs <ChevronRight className="w-5 h-5 ml-1" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map(post => (
              <div key={post.id} className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col h-full hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 group">
                <div className="w-full h-48 rounded-2xl overflow-hidden mb-6 bg-gray-100 relative">
                  {post.images && post.images.length > 0 ? (
                    <img src={post.images[0].url || `http://kyl.test/${post.images[0].image_path}`} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400 font-medium">No Image</div>
                  )}
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-primary">
                    {post.type?.name || 'News'}
                  </div>
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-primary transition-colors">{post.title}</h4>
                <p className="text-gray-500 mb-6 line-clamp-2 flex-grow text-sm">
                  {(post.content || '').replace(/<[^>]*>?/gm, '')}
                </p>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                  <span className="text-xs text-gray-400 font-medium">{new Date(post.created_at).toLocaleDateString()}</span>
                  <Link to={/blog/} className="inline-flex items-center text-sm font-bold text-primary hover:text-emerald-700 transition-colors">
                    Read Article <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center md:hidden">
            <Link to="/blogs" className="inline-flex items-center text-primary font-bold hover:text-emerald-700 transition-colors">
              View All Blogs <ChevronRight className="w-5 h-5 ml-1" />
            </Link>
          </div>
        </section>
      )}

      {/* Featured Section */}
      <section className="py-24 px-4 container mx-auto flex-1 relative z-10 border-t border-gray-100">
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
                        <img 
                          src={leader.candidate?.image?.url || `https://i.pravatar.cc/150?u=${leader.candidate_id || leader.id}`} 
                          alt="Avatar" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1 tracking-tight">{leader.candidate?.fullName}</h3>
                    <p className="text-emerald-600 font-medium tracking-wide uppercase text-xs mb-6">{leader.office?.title || leader.position || 'President'}</p>
                    
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
      
      {/* Global Style for hiding scrollbar in carousel */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}






