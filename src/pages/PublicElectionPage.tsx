import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { electionService, Election } from '@/services/elections';
import { visitorService } from '@/services/visitors';
import { ChevronLeft, Users, Calendar, MapPin, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PublicElectionPage() {
  const { id } = useParams<{ id: string }>();
  const [election, setElection] = useState<Election | null>(null);
  const [timetables, setTimetables] = useState<any[]>([]);
  const [candidatesMap, setCandidatesMap] = useState<Record<number, any[]>>({});
  const [states, setStates] = useState<any[]>([]);
  const [selectedState, setSelectedState] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const parsedId = parseInt(id, 10);
        const electionData = await electionService.getElectionById(parsedId);
        setElection(electionData);

        // Fetch states for the filter
        const statesData = await visitorService.getStates();
        setStates(statesData || []);

        const timetablesData = await electionService.getElectionTimetables(parsedId);
        setTimetables(timetablesData);

        // Fetch candidates for each timetable position
        const cMap: Record<number, any[]> = {};
        for (const tb of timetablesData) {
          try {
            const candidates = tb.id ? await electionService.getTimetableCandidates(tb.id) : [];
            if (tb.id) cMap[tb.id] = candidates;
          } catch (e) {
             if (tb.id) cMap[tb.id] = [];
          }
        }
        setCandidatesMap(cMap);

      } catch (err) {
        console.error('Error fetching election data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Group candidates by party for each timetable, handling joint tickets (President + VP, Governor + Deputy)
  const groupedTimetables = useMemo(() => {
    const stateFilterId = selectedState ? parseInt(selectedState, 10) : null;
    
    return timetables.map(tb => {
      let tbCandidates = candidatesMap[tb.id] || [];
      
      // Apply state filter if one is selected
      if (stateFilterId) {
        tbCandidates = tbCandidates.filter(c => {
          // If it's a nationwide office (President/VP), we usually don't filter them out unless requested.
          // But if they want state filtering, we strictly match candidate's state or allow them if they have no state (nationwide).
          if (c.state_id === null || tb.office_id === 1 || tb.office_id === 2) return true;
          return c.state_id === stateFilterId;
        });
      }

      // Group by Party
      const partyGroups: Record<number, { party: any, candidates: any[] }> = {};
      
      tbCandidates.forEach(candidate => {
        const pId = candidate.party_id;
        if (!pId) return;
        if (!partyGroups[pId]) {
          partyGroups[pId] = { party: candidate.party, candidates: [] };
        }
        partyGroups[pId].candidates.push(candidate);
      });

      // Sort candidates within party (Main candidate first, then running mate)
      Object.values(partyGroups).forEach(group => {
        group.candidates.sort((a, b) => {
          // Office IDs: President(1) < VP(2), Governor(3) < Deputy(4), Chairman(8) < Vice(9)
          // We want the smaller office_id to be first. Since 'offices' is an array, we find the relevant office.
          const aOfficeId = a.offices?.[0]?.office_id || 999;
          const bOfficeId = b.offices?.[0]?.office_id || 999;
          return aOfficeId - bOfficeId;
        });
      });

      return {
        ...tb,
        partyGroups: Object.values(partyGroups)
      };
    }).filter(tb => {
        // If state is selected, and this is a state-specific timetable (e.g. Governatorial), and no candidates match, hide it.
        if (stateFilterId && tb.partyGroups.length === 0 && tb.office_id !== 1 && tb.office_id !== 2) {
            return false;
        }
        return true;
    });
  }, [timetables, candidatesMap, selectedState]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!election) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <h2 className="text-2xl font-bold mb-4">Election Not Found</h2>
        <Link to="/" className="text-primary hover:underline flex items-center">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Hero Header */}
      <div className="bg-primary text-white py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="container mx-auto relative z-10 max-w-5xl">
          <Link to="/" className="inline-flex items-center text-primary-foreground/80 hover:text-white mb-6 transition-colors">
            <ChevronLeft className="w-5 h-5 mr-1" /> Back to Home
          </Link>
          <span className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-sm font-medium tracking-wide mb-4">
            {election.year} Election
          </span>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight drop-shadow-md">
            {election.details || `${election.year} General Election`}
          </h1>
          <div className="flex flex-wrap items-center gap-6 mt-6">
            <span className="flex items-center gap-1 text-emerald-100 font-medium bg-black/20 px-4 py-2 rounded-xl backdrop-blur-sm">
              <Calendar className="w-5 h-5"/> Status: {election.status}
            </span>
            
            <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
              <Filter className="w-5 h-5 text-emerald-100" />
              <select 
                className="bg-transparent border-none text-white outline-none font-semibold focus:ring-0 cursor-pointer [&>option]:text-gray-900"
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
              >
                <option value="">All States (Nationwide)</option>
                {states.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Timetables & Positions */}
      <div className="container mx-auto max-w-5xl px-4 -mt-8 relative z-20">
        {groupedTimetables.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center text-gray-500">
            No positions or timetables matched your criteria for this election.
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {groupedTimetables.map((tb, index) => {
              let displayTitle = tb.office?.title || tb.office?.name || `Office #${tb.office_id}`;
              if (tb.office_id === 1 || tb.office_id === 2) displayTitle = "Presidency (President & Vice)";
              if (tb.office_id === 3 || tb.office_id === 4) displayTitle = "Gubernatorial (Governor & Deputy)";
              if (tb.office_id === 8 || tb.office_id === 9) displayTitle = "Local Government (Chairman & Vice)";

              return (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                key={tb.id} 
                className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 overflow-hidden"
              >
                {/* Position Header */}
                <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Position: {displayTitle}</h2>
                    <p className="text-gray-500 text-sm flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {tb.description || 'Nationwide'}
                    </p>
                  </div>
                  <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl font-semibold flex items-center gap-2 self-start md:self-auto">
                    <Calendar className="w-5 h-5"/>
                    {new Date(tb.date).toLocaleDateString()}
                  </div>
                </div>

                {/* Candidates List - Grouped by Party (Joint Tickets) */}
                <div className="p-6 md:p-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Participating Tickets
                  </h3>
                  
                  {tb.partyGroups.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      No candidates have registered for this position yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {tb.partyGroups.map((group: any, gIdx: number) => (
                        <div key={gIdx} className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300 flex flex-col">
                          
                          <Link to={`/party/${group.party?.id}`} className="bg-gray-50/80 p-4 border-b border-gray-100 flex items-center justify-between gap-3 hover:bg-gray-100/80 transition-colors group/party">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-white rounded-lg p-1 border border-gray-100 shadow-sm flex items-center justify-center shrink-0 group-hover/party:border-primary/30 transition-colors">
                                {group.party?.logopath ? (
                                  <img 
                                    src={group.party.logopath.startsWith('http') ? group.party.logopath : `${(import.meta.env.VITE_API_BASE_URL || '').replace(/\/api\/v1\/?$/, '')}/${group.party.logopath}`} 
                                    className="w-full h-full object-contain" 
                                    alt={group.party.name} 
                                  />
                                ) : <span className="font-bold text-gray-400 text-xs text-center">{group.party?.name || 'N/A'}</span>}
                              </div>
                              <span className="font-bold text-gray-900 text-sm md:text-base line-clamp-2 group-hover/party:text-primary transition-colors">{group.party?.description || group.party?.name || 'Independent'}</span>
                            </div>
                            <span className="px-2.5 py-1 bg-white text-primary text-xs font-bold rounded-lg shadow-sm border border-gray-100 shrink-0">
                              {group.party?.name || 'IND'}
                            </span>
                          </Link>

                          <div className="p-4 flex flex-col gap-4">
                            {group.candidates.map((candidate: any, cIdx: number) => {
                              // Identify the specific office title for this candidate within the ticket
                              const candidateOffice = candidate.offices?.find((o:any) => o.election_id === tb.election_id)?.office?.title || (cIdx === 0 ? "Main" : "Running Mate");
                              
                              return (
                                <Link 
                                  key={candidate.id} 
                                  to={`/profile/${candidate.candidate_id || candidate.id}`}
                                  className="flex items-center gap-4 group/cand p-2 rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                  <div className="w-14 h-14 rounded-full bg-gray-100 overflow-hidden border-2 border-gray-50 group-hover/cand:border-primary/50 transition-colors shrink-0 relative">
                                    <img 
                                      src={candidate.candidate?.image?.url || candidate.image?.url || `https://i.pravatar.cc/150?u=${candidate.candidate_id || candidate.id}`} 
                                      alt="Avatar" 
                                      className="w-full h-full object-cover" 
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-0.5">
                                      {candidateOffice}
                                    </div>
                                    <h4 className="font-bold text-gray-900 group-hover/cand:text-primary transition-colors line-clamp-1">
                                      {candidate.fullName}
                                    </h4>
                                  </div>
                                  <ChevronLeft className="w-5 h-5 text-gray-300 group-hover/cand:text-primary group-hover/cand:-translate-x-1 transition-all rotate-180" />
                                </Link>
                              );
                            })}
                          </div>

                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

