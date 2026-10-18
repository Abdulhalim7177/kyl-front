import React, { useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { canAccessPath } from '@/lib/routePermissions'
import AccessDeniedPage from '@/pages/AccessDeniedPage'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Bell, 
  HelpCircle, 
  LogOut,
  LayoutDashboard,
  Users,
  Flag,
  Vote,
  BarChart,
  MapPin,
  UserCheck,
  FileText,
  Activity,
  Menu,
  ChevronDown,
  Search
} from 'lucide-react'
import { Input } from '@/components/ui/input'

const SIDEBAR_ITEMS = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/k8s9d7f3-admin-panel' },
  { name: 'Users', icon: Users, path: '/k8s9d7f3-users' },
  { name: 'Candidates', icon: UserCheck, path: '/k8s9d7f3-candidates' },
  { name: 'Political Parties', icon: Flag, path: '/k8s9d7f3-parties' },
  { name: 'Elections', icon: Vote, path: '/k8s9d7f3-elections' },
  { 
    name: 'Districts', 
    icon: MapPin, 
    path: '#',
    subItems: [
      { name: 'Presidency', path: '/k8s9d7f3-districts/presidency' },
      { name: 'States', path: '/k8s9d7f3-districts/states' },
      { name: 'Senatorial Districts', path: '/k8s9d7f3-districts/senatorial' },
      { name: 'Federal Constituencies', path: '/k8s9d7f3-districts/federal' },
      { name: 'State Constituencies', path: '/k8s9d7f3-districts/state-house' },
      { name: 'LGAs', path: '/k8s9d7f3-districts/lgas' },
      { name: 'Wards', path: '/k8s9d7f3-districts/wards' },
    ]
  },
  { name: 'Polls', icon: BarChart, path: '/k8s9d7f3-polls' },
  { name: 'Blog', icon: FileText, path: '/k8s9d7f3-blogs' },
  { name: 'Activity Logs', icon: Activity, path: '/k8s9d7f3-activity-logs' },
]

interface AdminLayoutProps {
  children: React.ReactNode
  title: string
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
    // Navigate to login page
    window.location.href = '/k8s9d7f3-auth-login'
  }

  const SidebarContent = () => {
    const [openMenus, setOpenMenus] = useState<string[]>([])
    const toggleMenu = (name: string) => {
      setOpenMenus(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name])
    }
    return (
    <div className="flex flex-col h-full bg-white">
      <div className="mb-6 pt-6 flex justify-center">
        <Link to="/" aria-label="Know Your Leaders home">
          <img src="/frame-51.png" alt="KYL Logo" className="h-[4.5rem] w-auto object-contain cursor-pointer" />
        </Link>
      </div>
      
      <nav aria-label="Admin navigation" className="w-full flex-1 px-4 space-y-1 overflow-y-auto">
        {SIDEBAR_ITEMS.map((item, index) => {
          const IconComponent = item.icon
          const visibleSubItems = item.subItems?.filter(sub => canAccessPath(user, sub.path)) ?? []
          const hasSubItems = visibleSubItems.length > 0
          const isVisible = hasSubItems || canAccessPath(user, item.path)
          const isMenuOpen = openMenus.includes(item.name)

          if (!isVisible) return null

          const isSubActive = hasSubItems && visibleSubItems.some(sub => location.pathname.startsWith(sub.path))
          const isActive = location.pathname === item.path || isSubActive

          return (
            <div key={index} className="flex flex-col">
              {hasSubItems ? (
                <button 
                  onClick={() => toggleMenu(item.name)}
                  aria-expanded={isMenuOpen}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-colors ${isActive || isMenuOpen ? 'bg-[#dcfce7]/20 text-[#146c4f]' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <div className="flex items-center">
                    <IconComponent aria-hidden="true" className={`w-5 h-5 mr-3 ${isActive || isMenuOpen ? 'text-[#146c4f]' : 'text-gray-400'}`} />
                    {item.name}
                  </div>
                  <ChevronDown aria-hidden="true" className={`w-4 h-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                </button>
              ) : (
                <Link 
                  to={item.path} 
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-4 py-3 rounded-xl font-medium transition-colors ${isActive ? 'bg-[#dcfce7]/50 text-[#146c4f]' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <IconComponent aria-hidden="true" className={`w-5 h-5 mr-3 ${isActive ? 'text-[#146c4f]' : 'text-gray-400'}`} />
                  {item.name}
                </Link>
              )}
              
              {hasSubItems && (
                <div 
                  className={`flex flex-col ml-4 pl-4 border-l border-gray-200 space-y-1 overflow-hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-[500px] mt-1 opacity-100' : 'max-h-0 mt-0 opacity-0 pointer-events-none'}`}
                >
                  {visibleSubItems.map((subItem, subIndex) => {
                    const isSubItemActive = location.pathname === subItem.path
                    return (
                      <Link
                        key={subIndex}
                        to={subItem.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`px-4 py-2 rounded-lg text-sm transition-colors ${isSubItemActive ? 'text-[#146c4f] font-medium bg-[#dcfce7]/30' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                      >
                        {subItem.name}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Bottom Profile and Logout */}
      <div className="w-full px-4 mt-auto border-t border-gray-100 py-4 flex items-center justify-between pb-6">
        <div className="flex items-center gap-2 overflow-hidden">
          <Avatar className="w-9 h-9 border border-gray-200">
            <AvatarFallback className="bg-[#f59e0b] text-white">
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-semibold truncate text-gray-900">{user?.name || 'Aminu Isa Musa'}</span>
            <span className="text-xs text-gray-500 truncate">{user?.role?.name || 'Super Admin'}</span>
          </div>
        </div>
        <button 
          onClick={handleLogout} 
          aria-label="Log out"
          title="Log out"
          className="p-2 text-gray-400 hover:text-red-500 transition-colors shrink-0"
        >
           <LogOut aria-hidden="true" className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
  }

  const routeAllowed = canAccessPath(user, location.pathname)

  return (
    <div className="flex h-[100dvh] bg-[#f8fafc] font-sans text-sm overflow-hidden">
      <a
        href="#admin-main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>
      {/* Desktop Sidebar */}
      <aside className="w-[260px] border-r border-[#e2e8f0] h-full shrink-0 z-10 transition-all hidden md:block">
         <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full relative overflow-y-auto">
        <div className="absolute top-8 left-4 object-contain opacity-[0.03] pointer-events-none w-64 h-64 -z-10 rotate-12 bg-no-repeat bg-contain" style={{ backgroundImage: "url('/vite.svg')" }} />
        
        {/* Top Header - Mobile Responsive */}
        <header className="h-[72px] bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-8 z-50 shrink-0 sticky top-0">
          <div className="flex items-center gap-3">
             <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
               <SheetTrigger asChild>
                 <button aria-label="Open navigation menu" className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-md">
                   <Menu aria-hidden="true" className="w-6 h-6" />
                 </button>
               </SheetTrigger>
               <SheetContent side="left" className="w-[80vw] max-w-sm p-0 m-0 [&>button]:hidden">
                 <SheetTitle className="sr-only">Sidebar Menu</SheetTitle>
                 <SidebarContent />
               </SheetContent>
             </Sheet>
             <h1 className="text-lg sm:text-xl font-semibold text-gray-800">{title}</h1>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 text-gray-500">
             {title === 'Admin / Districts / States' && (
               <div className="relative w-36 sm:w-56">
                 <Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                 <Input
                   value={searchParams.get('stateSearch') || ''}
                   onChange={(event) => {
                     const nextParams = new URLSearchParams(searchParams)
                     if (event.target.value) {
                       nextParams.set('stateSearch', event.target.value)
                     } else {
                       nextParams.delete('stateSearch')
                     }
                     setSearchParams(nextParams)
                   }}
                   placeholder="Search states"
                   aria-label="Search states by name"
                   className="h-9 bg-gray-50 pl-9"
                 />
               </div>
             )}
             <button aria-label="Notifications" className="hover:text-primary transition-colors p-1.5"><Bell aria-hidden="true" className="w-5 h-5" /></button>
             <button aria-label="Help" className="hover:text-primary transition-colors p-1.5 hidden sm:block"><HelpCircle aria-hidden="true" className="w-5 h-5" /></button>
           </div>
         </header>

         {/* Dynamic Page Content block */}
         <main
           id="admin-main-content"
           tabIndex={-1}
           className="flex-1 w-full px-4 sm:px-8 pb-8 max-w-[1400px] mx-auto z-10 flex flex-col pt-2 sm:pt-4"
         >
           {routeAllowed ? children : <AccessDeniedPage />}
         </main>
      </div>
    </div>
  )
}
