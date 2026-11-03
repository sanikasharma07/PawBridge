import React, { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router'
import { AlertTriangle, LogOut } from 'lucide-react'
import API from '@/api/axios'
import { logoutUser } from '@/store/slices/authSlice'
import { caseSpecies, caseDescription } from '@/lib/emergency'
import NotificationsPanel from '@/components/common/NotificationsPanel'

// NGO dashboard (Guide §7.10): operational clarity, no decoration.
// Profile + verification status, open cases (accept), assigned cases
// (advance via tracker), campaigns and supply requests. All data is real;
// a missing profile points to onboarding instead of showing invented
// metrics. Backend errors from accept/advance are shown, not swallowed.
export default function NGODashboard() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [profileMissing, setProfileMissing] = useState(false)
  const [openCases, setOpenCases] = useState([])
  const [assigned, setAssigned] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [supplies, setSupplies] = useState([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [newCampaign, setNewCampaign] = useState({ title: '', description: '', targetAmount: '' })
  const [impactMsg, setImpactMsg] = useState({})

  useEffect(() => {
    (async () => {
      try {
        const p = await API.get('/ngo/profile')
        setProfile(p.data?.data)
      } catch (err) {
        if (err.statusCode === 404) setProfileMissing(true)
        else setError(err.message || 'Could not load your NGO profile.')
      }
      const [o, a, c, s] = await Promise.allSettled([
        API.get('/emergency/open'),
        API.get('/emergency/assigned'),
        API.get('/donations/campaigns/mine'),
        API.get('/supplies/mine'),
      ])
      if (o.status === 'fulfilled') setOpenCases(o.value.data?.data || [])
      if (a.status === 'fulfilled') setAssigned(a.value.data?.data || [])
      if (c.status === 'fulfilled') setCampaigns(c.value.data?.data || [])
      if (s.status === 'fulfilled') setSupplies(s.value.data?.data || [])
    })()
  }, [])

  const accept = async (id) => {
    setNotice(''); setError('')
    try {
      await API.patch(`/emergency/${id}/accept`)
      setNotice('Case accepted. It now appears under your assigned cases.')
      const o = await API.get('/emergency/open')
      const a = await API.get('/emergency/assigned')
      setOpenCases(o.data?.data || [])
      setAssigned(a.value?.data?.data || a.data?.data || [])
    } catch (err) {
      setError(err.message || 'Could not accept this case.')
    }
  }

  const logout = async () => { await dispatch(logoutUser()); navigate('/login', { replace: true }) }

  if (profileMissing) {
    return (
      <div className="min-h-screen bg-[#F7F5EF] flex items-center justify-center p-6">
        <div className="bg-white border rounded-3xl p-8 max-w-md text-center space-y-3 shadow-sm">
          <h1 className="font-display text-2xl font-bold text-[#183B35]">No NGO profile yet</h1>
          <p className="text-sm text-slate-600">Create your NGO profile first. Your role becomes NGO when the profile is created, and an admin must verify it before you can accept emergencies.</p>
          <Link to="/ngo/onboarding" className="block py-3 bg-[#087F70] text-white text-sm font-bold rounded-xl hover:bg-[#183B35]">Create NGO profile</Link>
        </div>
      </div>
    )
  }

  const verified = profile?.verificationStatus === 'verified'

  return (
    <div className="min-h-screen bg-[#F7F5EF] pb-6">
      <main className="max-w-5xl mx-auto p-4 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-[#183B35]">{profile?.organizationName || 'NGO dashboard'}</h1>
            <p className="text-sm text-slate-500">NGO • {profile?.verificationStatus || '…'}</p>
          </div>
          <button onClick={logout} className="inline-flex items-center gap-1 px-4 py-2 bg-white border border-slate-200 text-sm font-bold rounded-xl hover:bg-slate-50"><LogOut className="w-4 h-4" /> Sign out</button>
        </div>

        {error && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3 flex gap-2"><AlertTriangle className="w-5 h-5 shrink-0" />{error}</p>}
        {notice && <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-3">{notice}</p>}
        {profile && !verified && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-2xl p-4">
            Your profile is <strong>{profile.verificationStatus}</strong>
            {profile.rejectionReason ? ` — ${profile.rejectionReason}` : ''}. You can browse cases, but accepting emergencies and appearing in Nearby Help require verification.
            {' '}<Link to="/ngo/onboarding" className="font-bold underline">Update profile</Link> (this resets verification to pending).
          </div>
        )}

        <NotificationsPanel />
        <section className="grid sm:grid-cols-4 gap-3">
          {[
            ['Open cases', openCases.length],
            ['Assigned to you', assigned.length],
            ['Your campaigns', campaigns.length],
            ['Supply requests', supplies.length],
          ].map(([label, n]) => (
            <div key={label} className="bg-white border rounded-2xl p-4 shadow-sm">
              <p className="font-display text-2xl font-bold text-[#183B35]">{n}</p>
              <p className="text-sm text-slate-500">{label}</p>
            </div>
          ))}
        </section>

        <section className="bg-white border rounded-2xl p-5 shadow-sm space-y-3">
          <h2 className="font-bold text-[#183B35]">Open emergency cases ({openCases.length})</h2>
          {openCases.length === 0 && <p className="text-sm text-slate-500">No open cases right now.</p>}
          {openCases.map((c) => (
            <article key={c._id} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 last:border-0 pb-3 last:pb-0">
              <div>
                <p className="text-sm font-bold text-slate-900">{caseSpecies(c)} — {c.status}</p>
                <p className="text-sm text-slate-600">{caseDescription(c)}</p>
              </div>
              <div className="flex gap-2">
                <Link to={`/tracker/${c._id}`} className="px-3 py-2 bg-white border border-slate-200 text-xs font-bold rounded-full hover:bg-slate-50">Details</Link>
                <button onClick={() => accept(c._id)} className="px-3 py-2 bg-[#087F70] text-white text-xs font-bold rounded-full hover:bg-[#183B35]">Accept</button>
              </div>
            </article>
          ))}
        </section>

        <section className="bg-white border rounded-2xl p-5 shadow-sm space-y-3">
          <h2 className="font-bold text-[#183B35]">Assigned to you ({assigned.length})</h2>
          {assigned.length === 0 && <p className="text-sm text-slate-500">No cases assigned to your NGO yet.</p>}
          {assigned.map((c) => (
            <article key={c._id} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 last:border-0 pb-3 last:pb-0">
              <div>
                <p className="text-sm font-bold text-slate-900">{caseSpecies(c)} — {c.status}</p>
                <p className="text-sm text-slate-600">{caseDescription(c)}</p>
              </div>
              <Link to={`/tracker/${c._id}`} className="px-3 py-2 bg-[#087F70] text-white text-xs font-bold rounded-full hover:bg-[#183B35]">Open tracker</Link>
            </article>
          ))}
        </section>

        <section className="bg-white border rounded-2xl p-5 shadow-sm space-y-3">
          <h2 className="font-bold text-[#183B35]">Create a campaign</h2>
          <p className="text-xs text-slate-500">Only verified NGOs can create campaigns — the backend refuses otherwise, and its message is shown below.</p>
          <form onSubmit={async (e) => { e.preventDefault(); setError(''); try { await API.post('/donations/campaigns', { title: newCampaign.title, description: newCampaign.description, targetAmount: Number(newCampaign.targetAmount) }); setNotice('Campaign created.'); setNewCampaign({ title: '', description: '', targetAmount: '' }); const c = await API.get('/donations/campaigns/mine'); setCampaigns(c.data?.data || []) } catch (err) { setError(err.message || 'Could not create the campaign.') } }} className="grid sm:grid-cols-3 gap-3">
            <input required value={newCampaign.title} onChange={(e) => setNewCampaign({ ...newCampaign, title: e.target.value })} placeholder="Campaign title" className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm" />
            <input type="number" min="1" step="any" required value={newCampaign.targetAmount} onChange={(e) => setNewCampaign({ ...newCampaign, targetAmount: e.target.value })} placeholder="Target amount (₹)" className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm" />
            <button className="py-2.5 bg-[#087F70] text-white text-sm font-bold rounded-xl hover:bg-[#183B35]">Create campaign</button>
            <textarea required rows={2} value={newCampaign.description} onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })} placeholder="What will the money fund?" className="sm:col-span-3 px-3 py-2.5 border border-slate-200 rounded-xl text-sm" />
          </form>
        </section>

        <section className="grid md:grid-cols-2 gap-5">
          <div className="bg-white border rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-[#183B35] mb-2">Your campaigns ({campaigns.length})</h2>
            {campaigns.length === 0 ? <p className="text-sm text-slate-500">No campaigns yet.</p>
              : campaigns.slice(0, 5).map((c) => (
                <div key={c._id} className="py-2 border-b border-slate-100 last:border-0">
                  <p className="text-sm text-slate-700">{c.title} — ₹{c.raisedAmount || 0} / ₹{c.targetAmount} • {c.status}</p>
                  {c.raisedAmount > 0 && (
                    <form onSubmit={async (e) => { e.preventDefault(); setError(''); try { const form = new FormData(); form.append('message', impactMsg[c._id] || ''); await API.post(`/donations/campaigns/${c._id}/impact`, form); setNotice('Impact update posted — donors have been notified.'); const cc = await API.get('/donations/campaigns/mine'); setCampaigns(cc.data?.data || []) } catch (err) { setError(err.message || 'Could not post the impact update.') } }} className="flex gap-2 mt-1">
                      <input value={impactMsg[c._id] || ''} onChange={(e) => setImpactMsg((m) => ({ ...m, [c._id]: e.target.value }))} placeholder="Impact update for donors" className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs" />
                      <button className="px-3 py-1.5 bg-white border border-slate-200 text-xs font-bold rounded-lg hover:bg-slate-50">Post impact</button>
                    </form>
                  )}
                </div>
              ))}
          </div>
          <div className="bg-white border rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-[#183B35] mb-2">Your supply requests ({supplies.length})</h2>
            {supplies.length === 0 ? <p className="text-sm text-slate-500">No supply requests yet. Supply management arrives in Phase 5.</p>
              : supplies.slice(0, 5).map((s) => <p key={s._id} className="text-sm text-slate-700 py-1 border-b border-slate-100 last:border-0">{s.title} — {s.receivedQuantity || 0}/{s.requiredQuantity} {s.unit} • {s.status}</p>)}
          </div>
        </section>
      </main>
    </div>
  )
}
