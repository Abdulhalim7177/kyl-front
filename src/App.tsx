import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import LandingPage from '@/pages/LandingPage'
import AboutPage from '@/pages/AboutPage'
import PoliticiansPage from '@/pages/PoliticiansPage'
import PositionsPage from '@/pages/PositionsPage'
import './App.css'

function Navigation() {
  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex gap-6">
        <Link to="/" className="hover:text-gray-300">Home</Link>
        <Link to="/about" className="hover:text-gray-300">About</Link>
        <Link to="/politicians" className="hover:text-gray-300">Politicians</Link>
        <Link to="/positions" className="hover:text-gray-300">Positions</Link>
      </div>
    </nav>
  )
}

function NotFound() {
  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-muted-foreground mb-4">The page you're looking for doesn't exist.</p>
      <Link to="/" className="text-blue-600 hover:underline">Go back to home</Link>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Navigation />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/politicians" element={<PoliticiansPage />} />
        <Route path="/positions" element={<PositionsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
