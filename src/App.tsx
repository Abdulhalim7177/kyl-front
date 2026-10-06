import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import PublicHomePage from '@/pages/PublicHomePage'
import DistrictsExplorerPage from '@/pages/DistrictsExplorerPage'
import DirectoryPage from '@/pages/DirectoryPage'

import LeadersDirectoryPage from '@/pages/LeadersDirectoryPage'
import PublicProfilePage from '@/pages/PublicProfilePage'
import PublicElectionPage from '@/pages/PublicElectionPage'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import PartiesPage from '@/pages/PartiesPage'
import PartyProfilePage from '@/pages/PartyProfilePage'
import PartyChairmanPage from '@/pages/PartyChairmanPage'
import UsersManagementPage from '@/pages/UsersManagementPage'
import AddUserWizard from '@/pages/AddUserWizard'
import UserDetailPage from '@/pages/UserDetailPage'
import CandidatesPage from '@/pages/CandidatesPage'
import AddCandidateWizard from '@/pages/AddCandidateWizard'
import CandidateDetailPage from '@/pages/CandidateDetailPage'
import ActivityLogsPage from '@/pages/ActivityLogsPage'
import ElectionsPage from '@/pages/ElectionsPage'
import ElectionFormPage from '@/pages/ElectionFormPage'
import ElectionDetailPage from '@/pages/ElectionDetailPage'
import RolesManagementPage from '@/pages/RolesManagementPage'
import AdminLayout from '@/components/AdminLayout'
import AdminPollsPage from '@/pages/AdminPollsPage'
import AdminPollFormPage from '@/pages/AdminPollFormPage'
import AdminBlogsPage from '@/pages/AdminBlogsPage'
import AdminBlogFormPage from '@/pages/AdminBlogFormPage'
import PublicPollsPage from '@/pages/PublicPollsPage'
import PublicBlogsPage from '@/pages/PublicBlogsPage'
import PublicBlogDetailPage from '@/pages/PublicBlogDetailPage'
import PublicPollDetailPage from '@/pages/PublicPollDetailPage'
import PublicElectionsPage from '@/pages/PublicElectionsPage'
import PublicPartiesPage from '@/pages/PublicPartiesPage'
import PublicPartyProfilePage from '@/pages/PublicPartyProfilePage'
import PublicAboutPage from '@/pages/PublicAboutPage'
import PublicContactPage from '@/pages/PublicContactPage'
import './App.css'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/k8s9d7f3-auth-login" replace />
  }
  
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  if (isAuthenticated) {
    return <Navigate to="/k8s9d7f3-admin-panel" replace />
  }
  
  return <>{children}</>
}

import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Menu } from 'lucide-react'
import { useState } from 'react'
import { HelmetProvider } from 'react-helmet-async'
import Footer from '@/components/Footer'
import DistrictsPage from '@/pages/DistrictsPage'
import StateDetailPage from '@/pages/StateDetailPage'
import WardDetailPage from '@/pages/WardDetailPage'
import LgaDetailPage from '@/pages/LgaDetailPage'

function Navigation() {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const isActive = (path: string) => location.pathname === path
  
  const NavLinks = () => (
    <>
      <Link to="/" onClick={() => setOpen(false)} className={`px-4 py-2 rounded-lg transition-colors font-medium ${isActive('/') ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>Home</Link>
      <Link to="/districts" onClick={() => setOpen(false)} className={`px-4 py-2 rounded-lg transition-colors font-medium ${isActive('/districts') ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>Districts</Link>
      <Link to="/directory" onClick={() => setOpen(false)} className={`px-4 py-2 rounded-lg transition-colors font-medium ${isActive('/directory') ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>Directory</Link>

      <Link to="/leaders" onClick={() => setOpen(false)} className={`px-4 py-2 rounded-lg transition-colors font-medium ${isActive('/leaders') ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>Elected Leaders</Link>
      <Link to="/polls" onClick={() => setOpen(false)} className={`px-4 py-2 rounded-lg transition-colors font-medium ${isActive('/polls') ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>Polls</Link>
      <Link to="/elections" onClick={() => setOpen(false)} className={`px-4 py-2 rounded-lg transition-colors font-medium ${isActive('/elections') ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>Elections</Link>
      <Link to="/parties" onClick={() => setOpen(false)} className={`px-4 py-2 rounded-lg transition-colors font-medium ${isActive('/parties') ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>Parties</Link>
      <Link to="/blogs" onClick={() => setOpen(false)} className={`px-4 py-2 rounded-lg transition-colors font-medium ${isActive('/blogs') ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>Blogs</Link>
      <Link to="/about" onClick={() => setOpen(false)} className={`px-4 py-2 rounded-lg transition-colors font-medium ${isActive('/about') ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>About</Link>
    </>
  )

  return (
    <nav className="bg-white border-b border-border sticky top-0 z-50 shadow-sm relative">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center">
             <img src="/frame-51.png" alt="KYL Logo" className="h-[2.5rem] w-auto object-contain" />
          </Link>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex gap-1">
            <NavLinks />
          </div>

          {/* Mobile Nav */}
          <div className="md:hidden flex items-center gap-2">
            <Link to="/k8s9d7f3-auth-login" className="text-sm font-medium text-primary hover:underline block mr-2">Admin Login</Link>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button className="p-2 text-muted-foreground hover:bg-muted rounded-md focus:outline-none">
                  <Menu className="w-6 h-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] max-w-sm flex flex-col gap-4 pt-12">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="flex flex-col gap-2 relative">
                  <NavLinks />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}

function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="max-w-md mx-auto">
        <div className="text-6xl font-bold text-primary mb-4">404</div>
        <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
        <p className="text-muted-foreground mb-6">The page you're looking for doesn't exist.</p>
        <Link 
          to="/" 
          className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Go back to home
        </Link>
      </div>
    </div>
  )
}

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  )
}

function PublicLayoutOld({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      {children}
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <HelmetProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicLayout><PublicHomePage /></PublicLayout>} />
          <Route path="/districts" element={<PublicLayout><DistrictsExplorerPage /></PublicLayout>} />
          <Route path="/directory" element={<PublicLayout><DirectoryPage /></PublicLayout>} />

          <Route path="/leaders" element={<PublicLayout><LeadersDirectoryPage /></PublicLayout>} />
          <Route path="/profile/:id" element={<PublicLayout><PublicProfilePage /></PublicLayout>} />
          <Route path="/election/:id" element={<PublicLayout><PublicElectionPage /></PublicLayout>} />
          <Route path="/polls" element={<PublicLayout><PublicPollsPage /></PublicLayout>} />
          <Route path="/blogs" element={<PublicLayout><PublicBlogsPage /></PublicLayout>} />
          <Route path="/blog/:id" element={<PublicLayout><PublicBlogDetailPage /></PublicLayout>} />
          <Route path="/poll/:id" element={<PublicLayout><PublicPollDetailPage /></PublicLayout>} />
          <Route path="/elections" element={<PublicLayout><PublicElectionsPage /></PublicLayout>} />
          <Route path="/parties" element={<PublicLayout><PublicPartiesPage /></PublicLayout>} />
          <Route path="/party/:id" element={<PublicLayout><PublicPartyProfilePage /></PublicLayout>} />
          <Route path="/about" element={<PublicLayout><PublicAboutPage /></PublicLayout>} />
          <Route path="/contact" element={<PublicLayout><PublicContactPage /></PublicLayout>} />
          
          <Route
            path="/k8s9d7f3-auth-login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          
          <Route
            path="/k8s9d7f3-admin-panel"
            element={
              <ProtectedRoute>
                <AdminLayout title="Admin Dashboard">
                  <DashboardPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/k8s9d7f3-parties"
            element={
              <ProtectedRoute>
                <AdminLayout title="Admin / Party Management">
                  <PartiesPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/k8s9d7f3-parties/:partyId"
            element={
              <ProtectedRoute>
                <AdminLayout title="Admin / Party Profile">
                  <PartyProfilePage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/k8s9d7f3-parties/:partyId/chairman"
            element={
              <ProtectedRoute>
                <AdminLayout title="Admin / Party Chairman">
                  <PartyChairmanPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/k8s9d7f3-users"
            element={
              <ProtectedRoute>
                <AdminLayout title="Admin / User Management">
                  <UsersManagementPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/k8s9d7f3-users-add"
            element={
              <ProtectedRoute>
                <AdminLayout title="Admin / User Management / Add User">
                  <AddUserWizard />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/k8s9d7f3-users-edit/:id"
            element={
              <ProtectedRoute>
                <AdminLayout title="Admin / User Management / Edit User">
                  <AddUserWizard />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/k8s9d7f3-users-view/:id"
            element={
              <ProtectedRoute>
                <AdminLayout title="Admin / User Management / View User">
                  <UserDetailPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/k8s9d7f3-roles"
            element={
              <ProtectedRoute>
                <AdminLayout title="Admin / Roles & Permissions">
                  <RolesManagementPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/k8s9d7f3-candidates"
            element={
              <ProtectedRoute>
                <AdminLayout title="Admin / Candidates">
                  <CandidatesPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/k8s9d7f3-candidates-add"
            element={
              <ProtectedRoute>
                <AdminLayout title="Admin / Candidates / Add Candidate">
                  <AddCandidateWizard />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/k8s9d7f3-candidates-edit/:id"
            element={
              <ProtectedRoute>
                <AdminLayout title="Admin / Candidates / Edit Candidate">
                  <AddCandidateWizard />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/k8s9d7f3-candidates-view/:id"
            element={
              <ProtectedRoute>
                <AdminLayout title="Admin / Candidates / View Candidate">
                  <CandidateDetailPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/k8s9d7f3-activity-logs"
            element={
              <ProtectedRoute>
                <AdminLayout title="Admin / Activity Logs">
                  <ActivityLogsPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/k8s9d7f3-elections"
            element={
              <ProtectedRoute>
                <AdminLayout title="Admin / Elections">
                  <ElectionsPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/k8s9d7f3-elections-add"
            element={
              <ProtectedRoute>
                <AdminLayout title="Admin / Elections / Add Election">
                  <ElectionFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/k8s9d7f3-elections-edit/:id"
            element={
              <ProtectedRoute>
                <AdminLayout title="Admin / Elections / Edit Election">
                  <ElectionFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/k8s9d7f3-elections-view/:id"
            element={
              <ProtectedRoute>
                <AdminLayout title="Admin / Elections / View Election">
                  <ElectionDetailPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          
                    <Route
            path="/k8s9d7f3-districts/states"
            element={
              <ProtectedRoute>
                <AdminLayout title="Admin / Districts / States">
                  <DistrictsPage type="states" title="States" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/k8s9d7f3-districts/states/:id"
            element={
              <ProtectedRoute>
                <AdminLayout title="Manage Governatorial">
                  <StateDetailPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/k8s9d7f3-districts/senatorial"
            element={
              <ProtectedRoute>
                <AdminLayout title="Admin / Districts / Senatorial">
                  <DistrictsPage type="senatorial" title="Senatorial Districts" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/k8s9d7f3-districts/federal"
            element={
              <ProtectedRoute>
                <AdminLayout title="Admin / Districts / Federal Constituencies">
                  <DistrictsPage type="federal" title="Federal Constituencies" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/k8s9d7f3-districts/state-house"
            element={
              <ProtectedRoute>
                <AdminLayout title="Admin / Districts / State Constituencies">
                  <DistrictsPage type="state-house" title="State Constituencies" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/k8s9d7f3-districts/lgas"
            element={
              <ProtectedRoute>
                <AdminLayout title="Admin / Districts / LGAs">
                  <DistrictsPage type="lgas" title="Local Government Areas" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/k8s9d7f3-districts/lgas/:id"
            element={
              <ProtectedRoute>
                <AdminLayout title="Admin / Districts / LGA Details">
                  <LgaDetailPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/k8s9d7f3-districts/wards"
            element={
              <ProtectedRoute>
                <AdminLayout title="Admin / Districts / Wards">
                  <DistrictsPage type="wards" title="Wards" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/k8s9d7f3-districts/wards/:id"
            element={
              <ProtectedRoute>
                <AdminLayout title="Admin / Districts / Ward Details">
                  <WardDetailPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
                      <Route path="/k8s9d7f3-polls" element={<ProtectedRoute><AdminLayout title="Admin / Polls"><AdminPollsPage /></AdminLayout></ProtectedRoute>} />
            <Route path="/k8s9d7f3-polls-add" element={<ProtectedRoute><AdminLayout title="Admin / Polls / Add"><AdminPollFormPage /></AdminLayout></ProtectedRoute>} />
            <Route path="/k8s9d7f3-polls-edit/:id" element={<ProtectedRoute><AdminLayout title="Admin / Polls / Edit"><AdminPollFormPage /></AdminLayout></ProtectedRoute>} />
            
            <Route path="/k8s9d7f3-blogs" element={<ProtectedRoute><AdminLayout title="Admin / Blogs"><AdminBlogsPage /></AdminLayout></ProtectedRoute>} />
            <Route path="/k8s9d7f3-blogs-add" element={<ProtectedRoute><AdminLayout title="Admin / Blogs / Add"><AdminBlogFormPage /></AdminLayout></ProtectedRoute>} />
            <Route path="/k8s9d7f3-blogs-edit/:id" element={<ProtectedRoute><AdminLayout title="Admin / Blogs / Edit"><AdminBlogFormPage /></AdminLayout></ProtectedRoute>} />
            
            <Route path="*" element={<PublicLayout><NotFound /></PublicLayout>} />
        </Routes>
      </BrowserRouter>
      </HelmetProvider>
    </AuthProvider>
  )
}

export default App




