import React from 'react'
import { Link } from 'react-router'
import { Lock } from 'lucide-react'

// Shown on data pages to logged-out visitors. Only Nearby Help is public
// in the backend, so every other data page needs this honest sign-in
// state instead of mock data, an empty-looking page, or a fake success.
export default function AuthRequiredState({ title = 'Sign in to continue', message = 'This section needs a signed-in account, because the backend requires authentication for it.' }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 text-center shadow-sm max-w-lg mx-auto">
      <div className="w-12 h-12 rounded-full bg-[#DDE9DF] flex items-center justify-center mx-auto mb-4 text-[#087F70]">
        <Lock className="w-6 h-6" />
      </div>
      <h2 className="font-display text-xl font-bold text-[#183B35] mb-2">{title}</h2>
      <p className="text-sm text-slate-600 mb-6">{message}</p>
      <div className="flex flex-col sm:flex-row gap-2 justify-center">
        <Link to="/login" className="px-6 py-3 bg-[#087F70] text-white text-sm font-bold rounded-xl hover:bg-[#183B35]">Sign in</Link>
        <Link to="/signup" className="px-6 py-3 bg-white border border-slate-200 text-sm font-bold rounded-xl hover:bg-slate-50">Create account</Link>
      </div>
    </div>
  )
}
