import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'

const SIDEBAR_ITEMS = [
  { name: 'Dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z', active: true },
  { name: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { name: 'Political Parties', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 8h2m2-8h2m-4 8h2' },
  { name: 'Elections', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { name: 'Offices', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 8h2' },
  { name: 'Districts', icon: 'M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9' },
  { name: 'Candidates', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { name: 'Elected Officials', icon: 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { name: 'Blogs', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z' },
  { name: 'Activity Logs', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
]

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      navigate('/k8s9d7f3-auth-login')
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans">
      {/* Sidebar */}
      <aside className="w-[260px] bg-white border-r border-[#e2e8f0] flex flex-col items-center py-6 h-full overflow-y-auto shrink-0 z-10 transition-all hidden md:flex">
        {/* Logo */}
        <div className="mb-10 text-[2.5rem] leading-none font-bold text-[#146c4f] tracking-tighter flex items-center justify-center gap-1 font-serif">
            <span style={{ fontFamily: 'Georgia, serif' }}>KYL</span>
            <span className="text-[0.4rem] border border-[#146c4f] rounded-full px-1 py-[0.5px] ml-1 mt-3 items-center justify-center font-sans tracking-normal font-medium opacity-80">NG</span>
        </div>
        
        {/* Navigation */}
        <nav className="w-full flex-1 px-4 space-y-1">
          {SIDEBAR_ITEMS.map((item, index) => (
            <a 
              key={index} 
              href="#" 
              className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors ${item.active ? 'bg-[#dcfce7]/50 text-[#146c4f]' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <svg className={`w-5 h-5 mr-3 ${item.active ? 'text-[#146c4f]' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              {item.name}
            </a>
          ))}
        </nav>

        {/* Bottom Profile and Logout */}
        <div className="w-full px-4 mt-auto border-t border-gray-100 pt-4 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-[#f59e0b] text-white flex items-center justify-center font-semibold shrink-0">
               {user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-semibold truncate text-gray-900">{user?.name || 'Aminu Isa Musa'}</span>
              <span className="text-xs text-gray-500 truncate">{user?.role?.name || 'Super Admin'}</span>
            </div>
          </div>
          <button onClick={handleLogout} disabled={isLoggingOut} className="p-2 text-gray-400 hover:text-red-500 transition-colors shrink-0">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
             </svg>
          </button>
        </div>
      </aside>

      {/* Main Content View */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute top-8 left-4 object-contain opacity-5 pointer-events-none w-64 h-64 -z-10 rotate-12 bg-no-repeat bg-contain" style={{ backgroundImage: "url('/vite.svg')" }} />
        
        {/* Header */}
        <header className="h-[72px] bg-white border-b border-[#e2e8f0] flex items-center justify-between px-8 z-10 shrink-0">
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          
          <div className="hidden md:flex flex-1 max-w-[400px] ml-16 relative">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Search anything" className="w-full bg-[#f8fafc] border-none rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-1 focus:ring-[#146c4f] outline-none" />
          </div>

          <div className="flex items-center gap-3">
             <div className="flex flex-col text-right hidden sm:flex">
                <span className="text-sm font-semibold text-gray-900">{user?.name || 'Aminu Musa'}</span>
                <span className="text-xs text-gray-500">{user?.role?.name || 'Super Admin'}</span>
             </div>
             <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aminu" alt="Avatar" className="w-10 h-10 rounded-full border border-gray-200 bg-gray-100" />
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto w-full p-8 space-y-6">
          {/* Welcome Area */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-2 border-transparent border-dashed">
            <h2 className="text-[1.4rem] text-gray-900 font-medium">Welcome Back, {user?.name?.split(' ')[0] || 'Aminu'}</h2>
            <div className="flex items-center gap-3">
              <Button className="bg-[#146c4f] hover:bg-[#115a42] text-white rounded-lg px-4 py-2 flex items-center gap-2 shadow-sm font-medium text-sm">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                 Add User
              </Button>
              <Button className="bg-[#146c4f] hover:bg-[#115a42] text-white rounded-lg px-4 py-2 flex items-center gap-2 shadow-sm font-medium text-sm">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                 Add Candidate
              </Button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-gray-100 p-5">
                 <p className="text-gray-500 text-sm mb-1">Users</p>
                 <div className="flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-bold text-gray-900">1293</p>
                      <p className="text-emerald-500 text-xs mt-2 flex items-center font-medium"><svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 15l7-7 7 7"/></svg> +12% from last month</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[#dcfce7]/60 flex items-center justify-center text-[#146c4f]">
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                 </div>
             </div>
             
             <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-gray-100 p-5">
                 <p className="text-gray-500 text-sm mb-1">Political Parties</p>
                 <div className="flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-bold text-gray-900">12</p>
                      <p className="text-emerald-500 text-xs mt-2 flex items-center font-medium"><svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 15l7-7 7 7"/></svg> +12% from last month</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[#f1f5f9] flex items-center justify-center text-gray-600">
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
                    </div>
                 </div>
             </div>

             <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-gray-100 p-5">
                 <p className="text-gray-500 text-sm mb-1">Elections</p>
                 <div className="flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-bold text-gray-900">7</p>
                      <p className="text-emerald-500 text-xs mt-2 flex items-center font-medium"><svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 15l7-7 7 7"/></svg> +12% from last month</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[#f1f5f9] flex items-center justify-center text-gray-600">
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    </div>
                 </div>
             </div>

             <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-gray-100 p-5">
                 <p className="text-gray-500 text-sm mb-1">Candidates</p>
                 <div className="flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-bold text-gray-900">123</p>
                      <p className="text-emerald-500 text-xs mt-2 flex items-center font-medium"><svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 15l7-7 7 7"/></svg> +12% from last month</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[#dcfce7]/60 flex items-center justify-center text-[#146c4f]">
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                 </div>
             </div>
          </div>

          {/* Table Section */}
          <div className="bg-white border border-gray-100 rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden">
             <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                 <h3 className="font-semibold text-gray-900">Recent Candidates</h3>
                 <a href="#" className="text-sm font-medium text-[#146c4f]">View All</a>
             </div>
             <div className="overflow-x-auto w-full">
                <table className="w-full text-sm text-left">
                  <thead className="text-[0.7rem] text-gray-500 uppercase bg-transparent">
                     <tr>
                        <th className="px-6 py-4 font-semibold tracking-wider">Name</th>
                        <th className="px-6 py-4 font-semibold tracking-wider">Party</th>
                        <th className="px-6 py-4 font-semibold tracking-wider">Position</th>
                        <th className="px-6 py-4 font-semibold tracking-wider">State</th>
                        <th className="px-6 py-4 font-semibold tracking-wider">Status</th>
                        <th className="px-6 py-4 font-semibold tracking-wider text-right">Action</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                     {[
                       { name: 'Babajide Sanwo-Olu', party: 'APC', position: 'Governor', state: 'Lagos', status: 'Active' },
                       { name: 'Peter Obi', party: 'LP', position: 'President', state: 'Anambra', status: 'Active' },
                       { name: 'Atiku Abubakar', party: 'PDP', position: 'President', state: 'Adamawa', status: 'Pending' },
                       { name: 'Natasha Akpoti', party: 'PDP', position: 'Senator', state: 'Kogi', status: 'Active' },
                       { name: 'Seyi Makinde', party: 'PDP', position: 'Governor', state: 'Oyo', status: 'Inactive' },
                     ].map((item, i) => (
                       <tr key={i} className="hover:bg-gray-50/50">
                          <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                          <td className="px-6 py-4 text-gray-600">{item.party}</td>
                          <td className="px-6 py-4 text-gray-600">{item.position}</td>
                          <td className="px-6 py-4 text-gray-600">{item.state}</td>
                          <td className="px-6 py-4">
                             <span className={`px-3 py-1 rounded-full text-xs font-medium 
                                ${item.status === 'Active' ? 'bg-emerald-100/50 text-emerald-700' : 
                                  item.status === 'Pending' ? 'bg-amber-100/50 text-amber-700' : 
                                  'bg-gray-100 text-gray-600'}`
                             }>
                               {item.status}
                             </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="text-[#146c4f] font-medium text-sm hover:underline">Edit</button>
                          </td>
                       </tr>
                     ))}
                  </tbody>
                </table>
             </div>
          </div>

          {/* Bottom Split Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
             {/* Recent Activity */}
             <div className="bg-white border border-gray-100 rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] p-5">
                <h3 className="font-semibold text-gray-900 mb-6">Recent Activity</h3>
                <div className="space-y-6">
                   {[
                      { title: 'Musa created new admin', desc: 'Added Musa Musa\' as Party Support Admin', time: '2 minutes ago', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z', color: 'bg-emerald-50 text-[#146c4f]' },
                      { title: 'Isa updated candidate', desc: 'Updated profile for \'Bola Tinubu\'', time: '45 minutes ago', icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z', color: 'bg-emerald-50 text-[#146c4f]' },
                      { title: 'Election list modified', desc: 'New legislative election added', time: '3 hours ago', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', color: 'bg-gray-100 text-gray-600' },
                      { title: 'Position archived', desc: '\'LGA Governor\' was removed', time: 'Yesterday', icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16', color: 'bg-red-50 text-red-500' },
                      { title: 'New blog post published', desc: '\'Tinubu\'s promises for the 2027 campaign\'', time: 'Yesterday', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z', color: 'bg-emerald-50 text-[#146c4f]' },
                   ].map((item, i) => (
                     <div key={i} className="flex gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${item.color}`}>
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon}/></svg>
                        </div>
                        <div>
                           <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                           <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                           <p className="text-xs text-gray-400 mt-1">{item.time}</p>
                        </div>
                     </div>
                   ))}
                </div>
                <div className="mt-6 flex justify-center">
                   <Button variant="outline" className="w-[80%] rounded-xl text-gray-700 bg-white border-gray-200">View Full Logs</Button>
                </div>
             </div>

             {/* Registration Trends Chart (Mock Layout) */}
             <div className="bg-white border border-gray-100 rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] p-5 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                   <div>
                      <h3 className="font-semibold text-gray-900">Registration Trends</h3>
                      <p className="text-xs text-gray-500">Monthly user vs candidate registrations</p>
                   </div>
                   <div className="flex items-center gap-1 text-xs text-gray-500 font-medium cursor-pointer">
                      Last 6 Months
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                   </div>
                </div>
                
                {/* Visual Chart Placeholder matching the screenshot */}
                <div className="flex-1 w-full mt-4 relative min-h-[250px]">
                   {/* Y-axis labels and grid lines */}
                   <div className="absolute inset-0 flex flex-col justify-between text-xs text-gray-400 pb-8 z-0">
                      <div className="flex items-center w-full"><span className="w-8">2000</span><div className="flex-1 border-b border-gray-100 ml-2 border-dashed"></div></div>
                      <div className="flex items-center w-full"><span className="w-8">1600</span><div className="flex-1 border-b border-gray-100 ml-2 border-dashed"></div></div>
                      <div className="flex items-center w-full"><span className="w-8">1200</span><div className="flex-1 border-b border-gray-100 ml-2 border-dashed"></div></div>
                      <div className="flex items-center w-full"><span className="w-8">800</span><div className="flex-1 border-b border-gray-100 ml-2 border-dashed"></div></div>
                      <div className="flex items-center w-full"><span className="w-8">400</span><div className="flex-1 border-b border-gray-100 ml-2 border-dashed"></div></div>
                      <div className="flex items-center w-full"><span className="w-8">0</span><div className="flex-1 border-b border-gray-300 ml-2"></div></div>
                   </div>
                   
                   {/* X-axis labels */}
                   <div className="absolute bottom-1 left-10 right-0 flex justify-between text-xs text-gray-400 px-4">
                     <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                   </div>

                   {/* Mock SVG lines to match the organic look of the chart */}
                   <svg className="absolute inset-x-10 inset-y-0 h-[calc(100%-2rem)] w-[calc(100%-2.5rem)] overflow-visible z-10" preserveAspectRatio="none" viewBox="0 0 500 200">
                     {/* User Line (Purple-ish blue) */}
                     <path d="M 0 195 C 100 195, 80 180, 120 180 C 180 180, 200 40, 250 40 C 300 40, 350 70, 400 70 C 450 70, 470 65, 500 65" 
                           fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                     {/* Candidate Line (Pink-ish red) */}
                     <path d="M 0 195 C 100 195, 150 190, 250 195 C 350 200, 400 185, 450 190 C 480 195, 490 195, 500 195" 
                           fill="none" stroke="#fca5a5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                     
                     {/* Points */}
                     <circle cx="0" cy="195" r="3" fill="white" stroke="#818cf8" strokeWidth="2" />
                     <circle cx="120" cy="180" r="3" fill="white" stroke="#818cf8" strokeWidth="2" />
                     <circle cx="250" cy="40" r="3" fill="white" stroke="#818cf8" strokeWidth="2" />
                     <circle cx="400" cy="70" r="3" fill="white" stroke="#818cf8" strokeWidth="2" />
                     <circle cx="500" cy="65" r="3" fill="white" stroke="#818cf8" strokeWidth="2" />

                     <circle cx="0" cy="195" r="3" fill="white" stroke="#fca5a5" strokeWidth="2" />
                     <circle cx="120" cy="195" r="3" fill="white" stroke="#fca5a5" strokeWidth="2" />
                     <circle cx="250" cy="195" r="3" fill="white" stroke="#fca5a5" strokeWidth="2" />
                     <circle cx="400" cy="185" r="3" fill="white" stroke="#fca5a5" strokeWidth="2" />
                     <circle cx="500" cy="195" r="3" fill="white" stroke="#fca5a5" strokeWidth="2" />
                   </svg>
                   
                   {/* Legend */}
                   <div className="absolute -bottom-2 left-0 right-0 flex justify-center gap-6 text-[0.65rem] text-gray-500">
                     <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full border-2 border-[#818cf8] bg-white"></div> User</span>
                     <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full border-2 border-[#fca5a5] bg-white"></div> Candidate</span>
                   </div>
                </div>
             </div>
          </div>
        </main>
      </div>
    </div>
  )
}