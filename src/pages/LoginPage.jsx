import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router'
import { PawPrint, AlertTriangle } from 'lucide-react'
import { loginUser, clearError, homePathForRole } from '@/store/slices/authSlice'

const PROTECTED_PREFIXES = ['/dashboard', '/profile', '/tracker', '/ngo/dashboard', '/vet/dashboard', '/admin']

// Session watcher (Guide §10): on session expiry, go to /login only
// from a protected page. A logged-out visitor on a public page is never
// force-redirected.
export function SessionWatcher() {
  const navigate = useNavigate()
  useEffect(() => {
    const handler = () => {
      if (PROTECTED_PREFIXES.some((p) => window.location.pathname.startsWith(p))) {
        navigate('/login', { replace: true })
      }
    }
    window.addEventListener('al:session-expired', handler)
    return () => window.removeEventListener('al:session-expired', handler)
  }, [navigate])
  return null
}

export default function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isLoading, error, isAuthenticated, user } = useSelector((state) => state.auth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => { dispatch(clearError()) }, [dispatch])
  useEffect(() => {
    if (isAuthenticated) navigate(homePathForRole(user?.role), { replace: true })
  }, [isAuthenticated, user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await dispatch(loginUser({ email: email.trim(), password }))
    if (loginUser.fulfilled.match(result)) {
      navigate(homePathForRole(result.payload.user?.role), { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F5EF] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-10 h-10 rounded-xl bg-[#DDE9DF] flex items-center justify-center text-[#087F70]"><PawPrint className="w-5 h-5" /></span>
          <h1 className="font-display text-2xl font-bold text-[#183B35]">Welcome back to PawBridge</h1>
        </div>
        <p className="text-sm text-slate-600 mb-6">Sign in to report and track emergencies, donate, pledge supplies and volunteer.</p>
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl p-3 mb-4 flex gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" /><span>{error}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-bold text-slate-700">Email
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-normal" placeholder="you@example.com" />
          </label>
          <label className="block text-sm font-bold text-slate-700">Password
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-normal" placeholder="Your password" />
          </label>
          <button type="submit" disabled={isLoading} className="w-full py-3 bg-[#087F70] text-white text-sm font-bold rounded-xl hover:bg-[#183B35] disabled:opacity-50">
            {isLoading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="text-sm text-slate-600 text-center mt-6">
          New here? <Link to="/signup" className="font-bold text-[#087F70] hover:underline">Create an account</Link>
        </p>
        <p className="text-xs text-slate-400 text-center mt-3">Nearby Help works without signing in — <Link to="/nearby-ngos" className="underline">find help near you</Link>.</p>
      </div>
    </div>
  )
}
