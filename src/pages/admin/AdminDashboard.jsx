import React, { useState, useEffect } from 'react'
import { Link, Routes, Route, useLocation } from 'react-router'
import { AlertTriangle } from 'lucide-react'
import API from '@/api/axios'
import AdminVerifications from './AdminVerifications'
import AdminReports from './AdminReports'
import AdminUsers from './AdminUsers'
import AdminEmergencies from './AdminEmergencies'
import AdminCampaigns from './AdminCampaigns'

// Admin dashboard (Guide §7.11): dense and usable, not decorative.
// Overview counts come from the real admin lists, and the audit history
// (GET /admin/actions) is immutable — it is shown, never edited.
// There is deliberately NO flag-as-spam or delete-emergency action:
// the backend has no such endpoints. Content moderation is soft removal
// only, and every action is reversible and recorded.
const NAV = [
  ['/admin', 'Overview'],
  ['/admin/verifications', 'Verifications'],
  ['/admin/reports', 'Reports & moderation'],
  ['/admin/users', 'Users'],
  ['/admin/emergencies', 'Emergency cases'],
  ['/admin/campaigns', 'Campaigns'],
]

function Overview() {
  const [counts, setCounts] = useState({})
  const [actions, setActions] = useState([])
  const [error, setError] = useState('')
  useEffect(() => {
    (async () => {
      try {
        const [ngo, vet, rep, users, emerg, camp, act] = await Promise.allSettled([
          API.get('/admin/ngo/pending'),
          API.get('/admin/vet/pending'),
          API.get('/admin/reports', { params: { status: 'Pending' } }),
          API.get('/admin/users'),
          API.get('/admin/emergencies'),
          API.get('/admin/campaigns'),
          API.get('/admin/actions'),
        ])
        setCounts({
          ngo: ngo.status === 'fulfilled' ? (ngo.value.data?.data || []).length : '—',
          vet: vet.status === 'fulfilled' ? (vet.value.data?.data || []).length : '—',
          reports: rep.status === 'fulfilled' ? (rep.value.data?.data || []).length : '—',
          users: users.status === 'fulfilled' ? (users.value.data?.data || []).length : '—',
          emergencies: emerg.status === 'fulfilled' ? (emerg.value.data?.data || []).length : '—',
          campaigns: camp.status === 'fulfilled' ? (camp.value.data?.data || []).length : '—',
        })
        if (act.status === 'fulfilled') setActions(act.value.data?.data || [])
      } catch (err) {
        setError(err.message || 'Could not load admin overview.')
      }
    })()
  }, [])
  const cards = [
    ['Pending NGO verifications', counts.ngo, '/admin/verifications'],
    ['Pending vet verifications', counts.vet, '/admin/verifications'],
    ['Pending reports', counts.reports, '/admin/reports'],
    ['Users', counts.users, '/admin/users'],
    ['Emergency cases', counts.emergencies, '/admin/emergencies'],
    ['Campaigns', counts.campaigns, '/admin/campaigns'],
  ]
  return (
    <div className="space-y-5">
      {error && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3 flex gap-2"><AlertTriangle className="w-5 h-5 shrink-0" />{error}</p>}
      <section className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {cards.map(([label, n, to]) => (
          <Link key={label} to={to} className="bg-white border rounded-2xl p-4 shadow-sm hover:shadow">
            <p className="font-display text-2xl font-bold text-[#183B35]">{n}</p>
            <p className="text-sm text-slate-500">{label}</p>
          </Link>
        ))}
      </section>
      <section className="bg-white border rounded-2xl p-5 shadow-sm">
        <h2 className="font-bold text-[#183B35] mb-2">Admin action history (immutable)</h2>
        <p className="text-xs text-slate-500 mb-3">Every warning, suspension, removal, restoration and escalation is recorded here. History entries are never edited or deleted through the API.</p>
        {actions.length === 0 && <p className="text-sm text-slate-500">No admin actions recorded yet.</p>}
        {actions.slice(0, 20).map((a) => (
          <p key={a._id} className="text-sm text-slate-700 py-1 border-b border-slate-100 last:border-0">
            <strong>{a.actionType}</strong> • {a.targetType} • {a.reason}
          </p>
        ))}
      </section>
    </div>
  )
}

export default function AdminDashboard() {
  const location = useLocation()
  return (
    <div className="min-h-screen bg-[#F7F5EF] pb-6">
      <main className="max-w-6xl mx-auto p-4 sm:p-6">
        <h1 className="font-display text-2xl font-bold text-[#183B35] mb-4">Admin dashboard</h1>
        <nav aria-label="Admin sections" className="flex flex-wrap gap-2 mb-5">
          {NAV.map(([to, label]) => (
            <Link key={to} to={to} className={`px-4 py-2.5 rounded-full text-sm font-bold ${location.pathname === to ? 'bg-[#087F70] text-white' : 'bg-white border border-slate-200'}`}>{label}</Link>
          ))}
        </nav>
        <Routes>
          <Route index element={<Overview />} />
          <Route path="verifications" element={<AdminVerifications />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="emergencies" element={<AdminEmergencies />} />
          <Route path="campaigns" element={<AdminCampaigns />} />
        </Routes>
      </main>
    </div>
  )
}
