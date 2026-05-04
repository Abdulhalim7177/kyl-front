import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
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
  Building2,
  MapPin,
  UserCheck,
  FileText,
  Activity,
  Menu
} from 'lucide-react'

const SIDEBAR_ITEMS = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/k8s9d7f3-admin-panel' },
  { name: 'Users', icon: Users, path: '/k8s9d7f3-users' },
  { name: 'Candidates', icon: UserCheck, path: '/k8s9d7f3-candidates' },
  { name: 'Political Parties', icon: Flag, path: '#' },
  { name: 'Elections', icon: Vote, path: '#' },
  { name: 'Offices', icon: Building2, path: '#' },
  { name: 'Districts', icon: MapPin, path: '#' },
  { name: 'Elected Officials', icon: UserCheck, path: '#' },
  { name: 'Blogs', icon: FileText, path: '#' },
  { name: 'Activity Logs', icon: Activity, path: '#' },
]

interface AdminLayoutProps {
  children: React.ReactNode
  title: string
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const { user, logout } = useAuth()
  const location = useLocation()
  
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

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white">
      <div className="mb-6 pt-6 flex justify-center">
        <Link to="/">
          <img src="/frame-51.png" alt="KYL Logo" className="h-[4.5rem] w-auto object-contain cursor-pointer" />
        </Link>
      </div>
      
      <nav className="w-full flex-1 px-4 space-y-1 overflow-y-auto">
        {SIDEBAR_ITEMS.map((item, index) => {
          const IconComponent = item.icon
          const isActive = location.pathname === item.path
          return (
            <Link 
              key={index} 
              to={item.path} 
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center px-4 py-3 rounded-xl font-medium transition-colors ${isActive ? 'bg-[#dcfce7]/50 text-[#146c4f]' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <IconComponent className={`w-5 h-5 mr-3 ${isActive ? 'text-[#146c4f]' : 'text-gray-400'}`} />
              {item.name}
            </Link>
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
          className="p-2 text-gray-400 hover:text-red-500 transition-colors shrink-0"
        >
           <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-[100dvh] bg-[#f8fafc] font-sans text-sm overflow-hidden">
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
                 <button className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-md">
                   <Menu className="w-6 h-6" />
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
             <button className="hover:text-primary transition-colors p-1.5"><Bell className="w-5 h-5" /></button>
             <button className="hover:text-primary transition-colors p-1.5 hidden sm:block"><HelpCircle className="w-5 h-5" /></button>
          </div>
        </header>

        {/* Dynamic Page Content block */}
        <main className="flex-1 w-full px-4 sm:px-8 pb-8 max-w-[1400px] mx-auto z-10 flex flex-col pt-2 sm:pt-4">
          {children}
        </main>
      </div>
    </div>
  )
}
