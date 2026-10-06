import { Helmet } from 'react-helmet-async';
import { Target, Eye, Shield, Users, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PublicAboutPage() {
  return (
    <>
      <Helmet>
        <title>About Us | Know Your Leaders</title>
        <meta name="description" content="Learn about our mission to provide transparency and empower citizens with accurate political information." />
      </Helmet>

      <div className="bg-white min-h-screen pt-24 pb-24">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-primary text-primary-foreground py-24 mt-[-6rem]">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="container mx-auto px-4 text-center relative z-10 mt-8">
            <h1 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight text-white">
              Empowering the Electorate
            </h1>
            <p className="text-xl md:text-2xl text-primary-foreground/90 max-w-3xl mx-auto leading-relaxed">
              Know Your Leaders (KYL) is dedicated to fostering political transparency and creating a more engaged, informed citizenry.
            </p>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-20 container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-sm font-bold uppercase tracking-wider">
                <Target className="w-4 h-4" /> Our Mission
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                To build the most comprehensive database of political leadership.
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                We believe that democracy thrives when citizens have easy access to accurate, unbiased information about their leaders. Our platform aims to bridge the gap between voters and the electoral process by centralizing data on candidates, political parties, and ongoing elections.
              </p>
            </div>
            <div className="bg-gray-50 rounded-3xl p-10 border border-gray-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 transform group-hover:scale-110 transition-transform duration-700">
                <Eye className="w-48 h-48" />
              </div>
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-bold uppercase tracking-wider mb-6">
                  <Eye className="w-4 h-4" /> Our Vision
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">A Transparent Future</h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  We envision a society where every voter can make data-driven decisions at the polls, guided by a transparent historical record of campaign promises, political transitions, and public opinion.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Core Values */}
        <section className="bg-gray-50 py-24 border-t border-b border-gray-100">
          <div className="container mx-auto px-4 max-w-6xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-16">What We Offer</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 transform -rotate-6">
                  <Shield className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Unbiased Data</h3>
                <p className="text-gray-600">
                  We source our information directly from official channels to ensure the profiles of elected leaders and candidates are accurate and untampered.
                </p>
              </div>
              
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
                  <Users className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Public Opinion</h3>
                <p className="text-gray-600">
                  Our robust polling system allows the electorate to gauge public sentiment leading up to major elections, providing a voice to the masses.
                </p>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 transform -rotate-3">
                  <Target className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Election Timelines</h3>
                <p className="text-gray-600">
                  Stay ahead of the curve with detailed tracking of election timetables, party primaries, and definitive voting dates.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Ready to get involved?</h2>
          <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
            Explore the upcoming elections in your district or review the profiles of your current leaders today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/elections" className="bg-[#146c4f] hover:bg-[#115a42] text-white px-8 py-4 rounded-xl font-bold text-lg transition-colors flex items-center">
              View Elections <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link to="/contact" className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-8 py-4 rounded-xl font-bold text-lg transition-colors">
              Contact Us
            </Link>
          </div>
        </section>

      </div>
    </>
  );
}
