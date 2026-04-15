import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await login(email, password)
      navigate('/k8s9d7f3-admin-panel')
    } catch (err: unknown) {
      console.error('Login error:', err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Login failed. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white relative flex flex-col items-center justify-center font-sans">
      {/* Background radial/gradient at the bottom exactly as in the mock */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-1/2 opacity-40 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at bottom, rgba(34,122,91,0.2) 0%, rgba(255,255,255,0) 70%)'
        }}
      />
      
      <div className="z-10 w-full max-w-md px-10 py-12 flex flex-col items-center bg-white/70 backdrop-blur-md border border-white/40 shadow-[0_20px_50px_rgba(20,108,79,0.08)] rounded-[2rem]">
        {/* Logo and Branding exactly like the design */}
        <div className="flex items-center justify-center mb-2">
          <div className="text-[3.5rem] leading-none font-bold text-[#146c4f] tracking-tighter flex items-center gap-1 font-serif">
            <span style={{ fontFamily: 'Georgia, serif' }}>KYL</span>
            <span className="text-[0.6rem] border border-[#146c4f] rounded-full px-1 py-0.5 ml-1 mt-4 items-center justify-center font-sans tracking-normal font-medium leading-none">NG</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-[#146c4f] mb-8 font-serif" style={{ fontFamily: 'Georgia, serif' }}>Know Your Leaders</h1>
        
        <h2 className="text-[#64748b] text-xl font-medium tracking-tight mb-8">Admin Portal</h2>

        <form onSubmit={handleSubmit} className="w-full space-y-6">
          {error && (
            <div className="bg-red-50/80 backdrop-blur-sm border border-red-100 text-red-600 px-4 py-3.5 rounded-xl text-sm text-center font-medium shadow-sm flex items-center justify-center gap-2">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-900">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@kyl.gov.ng"
              className="w-full px-4 py-3.5 bg-gray-50/50 hover:bg-gray-50 border border-gray-200/60 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-[#146c4f]/10 focus:border-[#146c4f] focus:bg-white text-sm transition-all duration-200"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-900">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="*************"
              className="w-full px-4 py-3.5 bg-gray-50/50 hover:bg-gray-50 border border-gray-200/60 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-[#146c4f]/10 focus:border-[#146c4f] focus:bg-white text-sm tracking-widest transition-all duration-200"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end">
            <a href="#" className="text-sm text-[#146c4f] hover:text-[#146c4f]/80">
              Forgot your Password?
            </a>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-6 bg-[#187555] hover:bg-[#146c4f] text-white rounded-xl font-medium text-base shadow-lg shadow-[#187555]/25 hover:shadow-[#146c4f]/40 hover:-translate-y-0.5 transition-all duration-300"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  )
}