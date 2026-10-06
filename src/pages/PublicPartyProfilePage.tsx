import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async';
import { Flag, Info, Building2, MapPin } from 'lucide-react';

export default function PublicPartyProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [party, setParty] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    
    const fetchPartyData = async () => {
      setLoading(true);
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'
        const response = await fetch(`${API_BASE_URL}/parties/get-party/${id}`, {
          headers: { 'Accept': 'application/json' }
        })
        
        if (response.ok) {
          const res = await response.json();
          if (res.success && res.data) {
            setParty(res.data);
          }
        }
      } catch (err) {
        console.error('Error fetching party data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPartyData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50/50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!party) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Party Not Found</h1>
        <p className="text-gray-500 mb-8 max-w-md">The political party you are looking for does not exist.</p>
        <Link to="/directory" className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors">
          Return to Directory
        </Link>
      </div>
    );
  }

  // Helper to get full image URL
  const getImageUrl = (path: string | null) => {
    if (!path) return null
    if (path.startsWith('http')) return path
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api\/v1\/?$/, '')
    return `${baseUrl}/${path}`
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <Helmet>
        <title>{party.description || party.name} - KYL</title>
      </Helmet>

      {/* Profile Header Background Cover */}
      <div className="h-64 md:h-80 w-full bg-gradient-to-br from-green-600 to-green-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
      </div>

      <div className="container mx-auto px-4 -mt-24 md:-mt-32 relative z-10">
        {/* Profile Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white p-8 mb-12 flex flex-col md:flex-row items-center md:items-end gap-8 relative overflow-hidden">
          <div className="w-40 h-40 md:w-48 md:h-48 rounded-2xl bg-white border-8 border-white shadow-xl overflow-hidden flex-shrink-0 flex items-center justify-center -mt-20 md:mt-0 relative z-10 p-4">
            {party.logopath ? (
              <img src={getImageUrl(party.logopath) || undefined} alt="Party Logo" className="w-full h-full object-contain" />
            ) : (
              <Flag className="w-20 h-20 text-gray-300" />
            )}
          </div>
          
          <div className="flex-1 text-center md:text-left mb-2">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-2">{party.description || party.name}</h1>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-6">
              <span className="text-sm md:text-base text-green-700 font-bold tracking-wide uppercase bg-green-50 border border-green-200 inline-block px-4 py-1.5 rounded-full shadow-sm">
                Acronym: {party.name}
              </span>
              {party.registrationYear && (
                <span className="text-sm md:text-base text-gray-700 font-bold tracking-widest uppercase bg-gray-100 border border-gray-200 inline-block px-4 py-1.5 rounded-full">
                  Est. {party.registrationYear}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Philosophy / Manifesto */}
            <section className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 p-8">
              <h2 className="text-sm font-bold text-gray-400 tracking-widest uppercase mb-6 flex items-center gap-2"><Info className="w-4 h-4" /> Philosophy & Manifesto</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line text-lg font-light">
                {party.philosophy || 'No official philosophy or manifesto provided.'}
              </p>
            </section>
            
            {/* Slogan */}
            {party.slogan && (
              <section className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-green-100 p-8 text-center">
                <h2 className="text-sm font-bold text-green-600/70 tracking-widest uppercase mb-4">Official Slogan</h2>
                <p className="text-2xl font-bold text-green-800 italic">"{party.slogan}"</p>
              </section>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Headquarters / Contact */}
            <section className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 p-8">
              <h2 className="text-sm font-bold text-gray-400 tracking-widest uppercase mb-6 flex items-center gap-2"><Building2 className="w-4 h-4" /> Headquarters</h2>
              
              <div className="flex items-start gap-3 mb-4">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <p className="text-gray-700">{party.address || 'National Secretariat Address not available.'}</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
