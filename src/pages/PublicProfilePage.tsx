import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async';
import { visitorService } from '@/services/visitors';

import { Mail, Phone, User } from 'lucide-react';

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [education, setEducation] = useState<any[]>([]);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [offices, setOffices] = useState<any[]>([]);
  const [leadership, setLeadership] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    
    const fetchProfileData = async () => {
      setLoading(true);
      try {
        const [
          profileData,
          educationData,
          experiencesData,
          achievementsData,
          officesData,
          leadershipData
        ] = await Promise.all([
          visitorService.getCandidateProfile(Number(id)).catch(() => null),
          visitorService.getCandidateEducation(Number(id)).catch(() => []),
          visitorService.getCandidateExperiences(Number(id)).catch(() => []),
          visitorService.getCandidateAchievements(Number(id)).catch(() => []),
          visitorService.getCandidateOffices(Number(id)).catch(() => []),
          visitorService.getCandidateLeadershipHistory(Number(id)).catch(() => [])
        ]);

        setProfile(profileData);
        setEducation(Array.isArray(educationData) ? educationData : (educationData?.data || []));
        setExperiences(Array.isArray(experiencesData) ? experiencesData : (experiencesData?.data || []));
        setAchievements(Array.isArray(achievementsData) ? achievementsData : (achievementsData?.data || []));
        setOffices(Array.isArray(officesData) ? officesData : (officesData?.data || []));
        setLeadership(Array.isArray(leadershipData) ? leadershipData : (leadershipData?.data || []));
      } catch (err) {
        console.error('Error fetching profile data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfileData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50/50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Profile Not Found</h1>
        <p className="text-gray-500 mb-8 max-w-md">The candidate or leader profile you are looking for does not exist or is inactive.</p>
        <Link to="/candidates" className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors">
          Return to Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Profile Header Background Cover */}
      <div className="h-64 md:h-80 w-full bg-gradient-to-br from-primary to-emerald-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
      </div>

      <div className="container mx-auto px-4 -mt-24 md:-mt-32 relative z-10">
        {/* Profile Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white p-8 mb-12 flex flex-col md:flex-row items-center md:items-end gap-8 relative overflow-hidden">
          <div className="w-40 h-40 md:w-56 md:h-56 rounded-full bg-gray-100 border-8 border-white shadow-xl overflow-hidden flex-shrink-0 flex items-center justify-center -mt-20 md:mt-0 relative z-10">
            {profile.image?.url ? (
              <img src={profile.image.url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-5xl text-gray-400 uppercase font-light">{profile.fullName?.charAt(0) || '?'}</span>
            )}
          </div>
          
          <div className="flex-1 text-center md:text-left mb-2">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-2">{profile.fullName}</h1>
            {(() => {
              const activeOffice = profile?.offices?.[0];
              let officeTitle = '';
              if (activeOffice) {
                const oName = activeOffice.office?.title || '';
                let oArea = '';
                if (activeOffice.state) oArea = activeOffice.state.name + ' State';
                else if (activeOffice.senetorialDistrict) oArea = activeOffice.senetorialDistrict.name;
                else if (activeOffice.federalHouseDistrict) oArea = activeOffice.federalHouseDistrict.name;
                else if (activeOffice.stateHouseDistrict) oArea = activeOffice.stateHouseDistrict.name;
                else if (activeOffice.lgaDistrict) oArea = activeOffice.lgaDistrict.name;
                else if (activeOffice.ward) oArea = activeOffice.ward.name;
                else if (profile?.lgaDistrict?.state && !oName.toLowerCase().includes('president')) oArea = profile.lgaDistrict.state.name + ' State';
                
                officeTitle = oArea && !oName.toLowerCase().includes('president') ? `${oName} (${oArea})` : oName;
              }
              
              return (
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-6">
                  {officeTitle && (
                    <span className="text-sm md:text-base text-gray-800 font-bold tracking-wide uppercase bg-gray-100 border border-gray-200 inline-block px-4 py-1.5 rounded-full shadow-sm">
                      {officeTitle}
                    </span>
                  )}
                  <span className="text-sm md:text-base text-primary font-bold tracking-widest uppercase bg-primary/10 inline-block px-4 py-1.5 rounded-full">
                    {profile.party?.name || 'Independent Candidate'}
                  </span>
                </div>
              );
            })()}
            
            <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm text-gray-600">
              {profile.gender && <div className="flex items-center gap-2"><span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"><User className="w-4 h-4" /></span> {profile.gender}</div>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Biography */}
            <section className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 p-8">
              <h2 className="text-sm font-bold text-gray-400 tracking-widest uppercase mb-6">Biography</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line text-lg font-light">
                {profile.bio || 'No biography available.'}
              </p>
            </section>

            {/* Experience */}
            <section className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 p-8">
              <h2 className="text-sm font-bold text-gray-400 tracking-widest uppercase mb-8">Professional Experience</h2>
              {experiences.length > 0 ? (
                <div className="space-y-8">
                  {experiences.map((exp, idx) => (
                    <div key={idx} className="relative pl-8 border-l border-gray-200 before:content-[''] before:absolute before:w-4 before:h-4 before:bg-primary before:border-4 before:border-white before:rounded-full before:-left-[8.5px] before:top-1.5 shadow-sm p-4 rounded-r-xl bg-gray-50/50">
                      <h3 className="font-bold text-xl text-gray-900">{exp.title}</h3>
                      <p className="text-primary font-semibold mb-2">{exp.organization}</p>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-3">
                        {exp.start_date} &mdash; {exp.current ? 'Present' : exp.end_date}
                      </p>
                      <p className="text-gray-600 leading-relaxed text-sm">{exp.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 italic">No experience records found.</p>
              )}
            </section>

            {/* Education */}
            <section className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 p-8">
              <h2 className="text-sm font-bold text-gray-400 tracking-widest uppercase mb-8">Education</h2>
              {education.length > 0 ? (
                <div className="space-y-6">
                  {education.map((edu, idx) => (
                    <div key={idx} className="relative pl-8 border-l border-gray-200 before:content-[''] before:absolute before:w-4 before:h-4 before:bg-emerald-500 before:border-4 before:border-white before:rounded-full before:-left-[8.5px] before:top-1.5">
                      <h3 className="font-bold text-lg text-gray-900">{edu.degree}</h3>
                      <p className="text-gray-600 font-medium">{edu.institution}</p>
                      <p className="text-xs text-gray-500 mt-1">Graduated: {edu.year_of_graduation}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 italic">No education records found.</p>
              )}
            </section>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Political Offices */}
            <section className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 p-8">
              <h2 className="text-sm font-bold text-gray-400 tracking-widest uppercase mb-6">Political Offices</h2>
              {offices.length > 0 ? (
                <ul className="space-y-4">
                  {offices.map((office, idx) => (
                    <li key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-100 hover:border-primary/30 transition-colors">
                      <h4 className="font-bold text-gray-900 mb-1">{office.title || office.name}</h4>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{office.start_date} &mdash; {office.end_date || 'Present'}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 italic text-sm">No offices recorded.</p>
              )}
            </section>

            {/* Leadership History */}
            <section className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 p-8">
              <h2 className="text-sm font-bold text-gray-400 tracking-widest uppercase mb-6">Leadership History</h2>
              {leadership.length > 0 ? (
                <ul className="space-y-4">
                  {leadership.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">L</div>
                      <div>
                        <h4 className="font-bold text-gray-900">{item.role}</h4>
                        <p className="text-sm text-gray-600">{item.organization}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 italic text-sm">No leadership history recorded.</p>
              )}
            </section>

            {/* Achievements */}
            <section className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 p-8">
              <h2 className="text-sm font-bold text-gray-400 tracking-widest uppercase mb-6">Achievements</h2>
              {achievements.length > 0 ? (
                <ul className="space-y-5">
                  {achievements.map((achievement, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="text-emerald-500 text-xl leading-none">&check;</span>
                      <div>
                        <span className="font-bold text-gray-900 block mb-1">{achievement.title}</span>
                        <span className="text-sm text-gray-600 leading-relaxed">{achievement.description}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 italic text-sm">No achievements recorded.</p>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}


