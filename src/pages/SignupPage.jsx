import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router'
import { LogoMark } from '@/components/common/Logo'
import { AlertTriangle } from 'lucide-react'
import { registerUser, clearError, homePathForRole } from '@/store/slices/authSlice'

// Role intent, borrowed from the Emergent reference's signup screen.
// This only chooses where a new account goes first — it does not grant
// a role. The backend always creates a regular user; NGO and vet roles
// come from creating (and getting admin approval for) a profile, so
// those choices route to the matching onboarding form after signup.
const ROLE_CHOICES = [
  { key: 'user', label: 'I need help', hint: 'Report and track emergencies', to: '/dashboard' },
  { key: 'ngo', label: 'I run an NGO', hint: 'Set up a verified organisation profile', to: '/ngo/onboarding' },
  { key: 'vet', label: "I'm a veterinarian", hint: 'Set up a verified practice profile', to: '/vet/onboarding' },
  { key: 'volunteer', label: 'I want to volunteer', hint: 'Find opportunities from verified NGOs', to: '/volunteer' },
]

export default function SignupPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isLoading, error, isAuthenticated, user } = useSelector((state) => state.auth)
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
  const [roleChoice, setRoleChoice] = useState('user')

  useEffect(() => { dispatch(clearError()) }, [dispatch])
  useEffect(() => {
    if (isAuthenticated) navigate(homePathForRole(user?.role), { replace: true })
  }, [isAuthenticated, user, navigate])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await dispatch(registerUser({ ...form, name: form.name.trim(), email: form.email.trim() }))
    if (registerUser.fulfilled.match(result)) {
      // A brand-new account is always role "user"; the chosen intent only
      // decides the first screen, and onboarding routes allow role "user".
      const choice = ROLE_CHOICES.find((r) => r.key === roleChoice) || ROLE_CHOICES[0]
      navigate(choice.to, { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F5EF] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-2">
          <LogoMark size={40} />
          <h1 className="font-display text-2xl font-bold text-[#183B35]">Join PawBridge</h1>
        </div>
        <p className="text-sm text-slate-600 mb-6">One account for reporting emergencies, donating, pledging supplies and volunteering. Your account starts as a regular user; choosing NGO or vet below takes you to its profile setup right after signup, and the role itself comes from admin verification.</p>
        <fieldset className="mb-6">
          <legend className="text-sm font-bold text-slate-700 mb-2">How will you use PawBridge?</legend>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="How will you use PawBridge?">
            {ROLE_CHOICES.map((choice) => (
              <button
                key={choice.key}
                type="button"
                role="radio"
                aria-checked={roleChoice === choice.key}
                onClick={() => setRoleChoice(choice.key)}
                className={`text-left px-3 py-2.5 rounded-xl border text-sm ${roleChoice === choice.key ? 'border-[#087F70] bg-[#DDE9DF] text-[#183B35] font-bold' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
              >
                {choice.label}
                <span className="block text-xs font-normal text-slate-500 mt-0.5">{choice.hint}</span>
              </button>
            ))}
          </div>
        </fieldset>
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl p-3 mb-4 flex gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" /><span>{error}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-bold text-slate-700">Full name
            <input required value={form.name} onChange={set('name')} autoComplete="name" className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-normal" placeholder="Your name" />
          </label>
          <label className="block text-sm font-bold text-slate-700">Email
            <input type="email" required value={form.email} onChange={set('email')} autoComplete="email" className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-normal" placeholder="you@example.com" />
          </label>
          <label className="block text-sm font-bold text-slate-700">Password
            <input type="password" required minLength={8} value={form.password} onChange={set('password')} autoComplete="new-password" className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-normal" placeholder="Strong password required" />
            <span className="text-xs font-normal text-slate-500">At least 8 characters, with an uppercase letter, a lowercase letter, a number and a symbol — the backend rejects weaker passwords.</span>
          </label>
          <label className="block text-sm font-bold text-slate-700">Phone
            <input required value={form.phone} onChange={set('phone')} autoComplete="tel" className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-normal" placeholder="Your phone number" />
          </label>
          <button type="submit" disabled={isLoading} className="w-full py-3 bg-[#087F70] text-white text-sm font-bold rounded-xl hover:bg-[#183B35] disabled:opacity-50">
            {isLoading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="text-sm text-slate-600 text-center mt-6">
          Already have an account? <Link to="/login" className="font-bold text-[#087F70] hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
