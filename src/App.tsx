import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import LandingPage from '@/pages/LandingPage'
import AboutPage from '@/pages/AboutPage'
import PoliticiansPage from '@/pages/PoliticiansPage'
import PositionsPage from '@/pages/PositionsPage'
import './App.css'

function Navigation() {
  const location = useLocation()
  
  const isActive = (path: string) => location.pathname === path
  
  return (
    <nav className="bg-white border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <span className="font-bold text-xl text-foreground">Know Your Leaders</span>
          </Link>
          
          <div className="flex gap-1">
            <Link 
              to="/" 
              className={`px-4 py-2 rounded-lg transition-colors ${
                isActive('/') 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              Home
            </Link>
            <Link 
              to="/politicians" 
              className={`px-4 py-2 rounded-lg transition-colors ${
                isActive('/politicians') 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              Politicians
            </Link>
            <Link 
              to="/positions" 
              className={`px-4 py-2 rounded-lg transition-colors ${
                isActive('/positions') 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              Positions
            </Link>
            <Link 
              to="/about" 
              className={`px-4 py-2 rounded-lg transition-colors ${
                isActive('/about') 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              About
            </Link>
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

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        <Navigation />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/politicians" element={<PoliticiansPage />} />
          <Route path="/positions" element={<PositionsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
