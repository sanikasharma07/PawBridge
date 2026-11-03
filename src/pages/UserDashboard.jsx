import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router'
import { AlertTriangle } from 'lucide-react'
import API from '@/api/axios'
import EmergencySOSModal from '@/components/emergency/EmergencySOSModal'
import NotificationsPanel from '@/components/common/NotificationsPanel'
import { caseSpecies, caseDescription } from '@/lib/emergency'
import { formatDate } from '@/lib/utils'

// User dashboard (Guide §7.10): personal and motivating, bento-style.
// Real data only: impact stats + timeline from /users/impact-profile,
// and the user's own cases from /emergency/my, each linking to its
// tracker. The SOS button opens the real report modal. No city totals,
// no invented activity feed.
export default function UserDashboard() {
  const { user } = useSelector((state) => state.auth)
  const [stats, setStats] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [cases, setCases] = useState([])
  const [error, setError] = useState('')
  const [sosOpen, setSosOpen] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const [impact, my] = await Promise.allSettled([
          API.get('/users/impact-profile'),
          API.get('/emergency/my'),
        ])
        if (impact.status === 'fulfilled') {
          setStats(impact.value.data?.data?.lifetimeStats || {})
          setTimeline(impact.value.data?.data?.timeline || [])
        }
        if (my.status === 'fulfilled') setCases(my.value.data?.data || [])
        if (impact.status === 'rejected' && my.status === 'rejected') {
          setError('Could not load your dashboard.')
        }
      } catch (err) {
        setError(err.message || 'Could not load your dashboard.')
      }
    })()
  }, [])

  return (
    <div className="min-h-screen bg-[#F7F5EF] pb-20 md:pb-6">
      <main className="max-w-5xl mx-auto p-4 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-[#183B35]">Welcome back, {user?.name?.split(' ')[0] || 'friend'}</h1>
            <p className="text-sm text-slate-500">Your rescues, donations, pledges and volunteering — in one place.</p>
          </div>
          <button onClick={() => setSosOpen(true)} className="px-5 py-3 bg-[#C96A4A] text-white text-sm font-bold rounded-xl hover:bg-[#183B35]">Report emergency</button>
        </div>
        {error && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3 flex gap-2"><AlertTriangle className="w-5 h-5 shrink-0" />{error}</p>}

        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            ['Emergencies reported', stats?.rescuesReported || 0, '/profile'],
            ['Supplies donated', stats?.suppliesDonated || 0, '/profile'],
            ['Campaigns funded', stats?.campaignsFunded || 0, '/donate'],
            ['Volunteer hours', stats?.volunteerHours || 0, '/volunteer'],
          ].map(([label, n, to]) => (
            <Link key={label} to={to} className="bg-white border rounded-2xl p-4 shadow-sm hover:shadow">
              <p className="font-display text-2xl font-bold text-[#183B35]">{n}</p>
              <p className="text-sm text-slate-500">{label}</p>
            </Link>
          ))}
        </section>

        <NotificationsPanel />

        <section className="grid md:grid-cols-2 gap-5 items-start">
          <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-3">
            <h2 className="font-bold text-[#183B35]">Your emergency cases ({cases.length})</h2>
            {cases.length === 0 && <p className="text-sm text-slate-500">You haven't reported an emergency yet.</p>}
            {cases.slice(0, 6).map((c) => (
              <Link key={c._id} to={`/tracker/${c._id}`} className="block py-2 border-b border-slate-100 last:border-0">
                <p className="text-sm font-bold text-slate-900 hover:text-[#087F70]">{caseSpecies(c)} — {c.status}</p>
                <p className="text-sm text-slate-600 line-clamp-1">{caseDescription(c)}</p>
                <p className="text-xs text-slate-400">{formatDate(c.createdAt)}{c.assignedNgo?.organizationName ? ` • Assigned to ${c.assignedNgo.organizationName}` : ' • Awaiting acceptance'}</p>
              </Link>
            ))}
          </div>
          <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-3">
            <h2 className="font-bold text-[#183B35]">Recent activity</h2>
            {timeline.length === 0 && <p className="text-sm text-slate-500">Your activity will appear here as you report, donate, pledge or volunteer.</p>}
            {timeline.slice(0, 6).map((t, i) => (
              <div key={i} className="py-2 border-b border-slate-100 last:border-0">
                <p className="text-sm font-bold text-slate-900">{t.title}</p>
                <p className="text-xs text-slate-500">{t.type}{t.ngoName ? ` • ${t.ngoName}` : ''}{t.date ? ` • ${formatDate(t.date)}` : ''}</p>
              </div>
            ))}
            <div className="flex flex-wrap gap-2 pt-1">
              <Link to="/nearby-ngos" className="text-sm font-bold text-[#087F70] hover:underline">Nearby Help</Link>
              <Link to="/donate" className="text-sm font-bold text-[#087F70] hover:underline">Donate</Link>
              <Link to="/supplies" className="text-sm font-bold text-[#087F70] hover:underline">Supplies</Link>
              <Link to="/volunteer" className="text-sm font-bold text-[#087F70] hover:underline">Volunteer</Link>
              <Link to="/foster" className="text-sm font-bold text-[#087F70] hover:underline">Foster & adopt</Link>
              <Link to="/profile" className="text-sm font-bold text-[#087F70] hover:underline">Full impact profile</Link>
            </div>
          </div>
        </section>
      </main>
      <EmergencySOSModal open={sosOpen} onClose={() => setSosOpen(false)} />
    </div>
  )
}
