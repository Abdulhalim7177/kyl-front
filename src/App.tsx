import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import LandingPage from '@/pages/LandingPage'
import AboutPage from '@/pages/AboutPage'
import PoliticiansPage from '@/pages/PoliticiansPage'
import PositionsPage from '@/pages/PositionsPage'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import PartiesPage from '@/pages/PartiesPage'
import PartyProfilePage from '@/pages/PartyProfilePage'
import PartyChairmanPage from '@/pages/PartyChairmanPage'
import UsersManagementPage from '@/pages/UsersManagementPage'
import AdminLayout from '@/components/AdminLayout'
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

function Navigation() {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const isActive = (path: string) => location.pathname === path
  
  const NavLinks = () => (
    <>
      <Link to="/" onClick={() => setOpen(false)} className={`px-4 py-2 rounded-lg transition-colors font-medium ${isActive('/') ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>Home</Link>
      <Link to="/politicians" onClick={() => setOpen(false)} className={`px-4 py-2 rounded-lg transition-colors font-medium ${isActive('/politicians') ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>Politicians</Link>
      <Link to="/positions" onClick={() => setOpen(false)} className={`px-4 py-2 rounded-lg transition-colors font-medium ${isActive('/positions') ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>Positions</Link>
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
    <div className="min-h-screen bg-background">
      <Navigation />
      {children}
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicLayout><LandingPage /></PublicLayout>} />
          <Route path="/about" element={<PublicLayout><AboutPage /></PublicLayout>} />
          <Route path="/politicians" element={<PublicLayout><PoliticiansPage /></PublicLayout>} />
          <Route path="/positions" element={<PublicLayout><PositionsPage /></PublicLayout>} />
          
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
          
          <Route path="*" element={<PublicLayout><NotFound /></PublicLayout>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App