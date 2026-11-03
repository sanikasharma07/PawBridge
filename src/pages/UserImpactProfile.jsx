import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router'
import { AlertTriangle } from 'lucide-react'
import API from '@/api/axios'
import { formatDate } from '@/lib/utils'

// Impact profile (Guide §7.8). GET /users/impact-profile returns
// { lifetimeStats, timeline[] }. Stats default to zero only when the
// loaded state is empty — never invented history. A fetch failure is an
// error with retry, not fallback data.
export default function UserImpactProfile() {
  const { user } = useSelector((state) => state.auth)
  const [stats, setStats] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true); setError('')
    try {
      const res = await API.get('/users/impact-profile')
      const data = res.data?.data || {}
      setStats(data.lifetimeStats || {})
      setTimeline(data.timeline || [])
    } catch (err) {
      setError(err.message || 'Could not load your impact profile.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const initials = (user?.name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="min-h-screen bg-[#F7F5EF] pb-20 md:pb-6">
      <main className="max-w-3xl mx-auto p-4 sm:p-6 space-y-5">
        <div className="flex items-center gap-4">
          <span className="w-14 h-14 rounded-full bg-[#DDE9DF] text-[#087F70] flex items-center justify-center font-display text-xl font-bold">{initials}</span>
          <div>
            <h1 className="font-display text-2xl font-bold text-[#183B35]">{user?.name}</h1>
            <p className="text-sm text-slate-500">{user?.email} • {user?.role}</p>
          </div>
        </div>
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-2xl p-4 space-y-2">
            <p className="flex gap-2"><AlertTriangle className="w-5 h-5 shrink-0" />{error}</p>
            <p>No fallback data is shown: showing invented rescues, donations or NGOs as if they were your own history would be dishonest.</p>
            <button onClick={load} className="px-4 py-2 bg-white border border-slate-200 text-sm font-bold rounded-xl hover:bg-slate-50">Retry</button>
          </div>
        )}
        {loading && <p className="text-sm text-slate-500">Loading impact…</p>}
        {!loading && !error && (
          <>
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                ['Emergencies reported', stats?.rescuesReported || 0],
                ['Supplies donated', stats?.suppliesDonated || 0],
                ['Campaigns funded', stats?.campaignsFunded || 0],
                ['Volunteer hours', stats?.volunteerHours || 0],
              ].map(([label, n]) => (
                <div key={label} className="bg-white border rounded-2xl p-4 shadow-sm">
                  <p className="font-display text-2xl font-bold text-[#183B35]">{n}</p>
                  <p className="text-sm text-slate-500">{label}</p>
                </div>
              ))}
            </section>
            <section className="bg-white border rounded-2xl p-5 shadow-sm space-y-3">
              <h2 className="font-bold text-[#183B35]">Your timeline</h2>
              {timeline.length === 0 && <p className="text-sm text-slate-500">Nothing here yet — your reports, donations and pledges will appear here as you make them.</p>}
              {timeline.map((t, i) => (
                <div key={i} className="py-2 border-b border-slate-100 last:border-0">
                  <p className="text-sm font-bold text-slate-900">{t.title}</p>
                  <p className="text-xs text-slate-500">{t.type}{t.ngoName ? ` • ${t.ngoName}` : ''}{t.date ? ` • ${formatDate(t.date)}` : ''}</p>
                </div>
              ))}
            </section>
          </>
        )}
        <Link to="/dashboard" className="text-sm font-bold text-[#087F70] hover:underline">← Back to dashboard</Link>
      </main>
    </div>
  )
}
