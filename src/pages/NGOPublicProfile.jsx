import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router'
import { useSelector } from 'react-redux'
import { AlertTriangle, MapPin } from 'lucide-react'
import API from '@/api/axios'
import AuthRequiredState from '@/components/common/AuthRequiredState'

// Public NGO profile (Guide §7.10). The backend has no NGO-by-id
// endpoint, so the page finds the NGO in GET /ngo/verified (documents
// are excluded there, so they are never shown). Campaigns come from
// GET /donations/campaigns, matched on the campaign's ngo field, which
// may be an ObjectId string or a populated object. Logged-out visitors
// get the sign-in state, not a redirect and not mock data.
export default function NGOPublicProfile() {
  const { id } = useParams()
  const { isAuthenticated } = useSelector((state) => state.auth)
  const [ngo, setNgo] = useState(null)
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return }
    (async () => {
      try {
        const res = await API.get('/ngo/verified')
        const list = res.data?.data || []
        const found = list.find((n) => String(n._id) === String(id))
        if (!found) {
          setError('This NGO was not found among verified NGOs. It may be pending review, rejected, or nonexistent.')
          setLoading(false)
          return
        }
        setNgo(found)
        const camps = await API.get('/donations/campaigns')
        const all = camps.data?.data || []
        setCampaigns(all.filter((c) => String(c.ngo?._id || c.ngo) === String(id)))
      } catch (err) {
        setError(err.message || 'Could not load this NGO profile.')
      } finally {
        setLoading(false)
      }
    })()
  }, [id, isAuthenticated])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F7F5EF] p-6 pb-20 md:pb-6 flex items-start justify-center">
        <div className="w-full max-w-lg pt-10"><AuthRequiredState title="Sign in to view NGO profiles" message="NGO profiles need a signed-in account, because the backend requires authentication for the verified-NGO list." /></div>
      </div>
    )
  }
  if (loading) return <div className="min-h-screen bg-[#F7F5EF] flex items-center justify-center p-6"><p className="text-slate-500 text-sm">Loading profile…</p></div>
  if (error || !ngo) {
    return (
      <div className="min-h-screen bg-[#F7F5EF] flex items-center justify-center p-6">
        <div className="bg-white border rounded-2xl p-6 max-w-md text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
          <h1 className="font-display text-xl font-bold text-[#183B35]">NGO not found</h1>
          <p className="text-sm text-slate-600">{error}</p>
          <Link to="/nearby-ngos" className="text-sm font-bold text-[#087F70] hover:underline">Find help nearby instead</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F5EF] pb-20 md:pb-6">
      <main className="max-w-3xl mx-auto p-4 sm:p-6 space-y-5">
        <div>
          <Link to="/nearby-ngos" className="text-sm font-bold text-[#087F70] hover:underline">← Nearby Help</Link>
          <h1 className="font-display text-2xl font-bold text-[#183B35] mt-2">{ngo.organizationName}</h1>
          <p className="text-sm text-slate-500">Verified NGO on PawBridge • <Link to={`/report?targetType=Ngo&targetId=${ngo._id}`} className="font-bold text-[#087F70] hover:underline">Report this NGO</Link></p>
          <p className="text-sm text-slate-600 mt-2">{ngo.description}</p>
          {(ngo.address?.city || ngo.address?.state) && (
            <p className="text-sm text-slate-500 flex items-center gap-1 mt-1"><MapPin className="w-4 h-4" /> {[ngo.address?.city, ngo.address?.state].filter(Boolean).join(', ')}</p>
          )}
          {(ngo.servicesProvided || []).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {ngo.servicesProvided.map((s) => <span key={s} className="text-xs px-2 py-1 bg-slate-100 rounded-full">{s}</span>)}
            </div>
          )}
          {(ngo.animalsHandled || []).length > 0 && (
            <p className="text-sm text-slate-600 mt-2"><strong>Animals handled:</strong> {ngo.animalsHandled.join(', ')}</p>
          )}
          {ngo.user?.email && <p className="text-sm text-slate-600 mt-1"><strong>Contact:</strong> {ngo.user.email}{ngo.user?.phone ? ` • ${ngo.user.phone}` : ''}</p>}
        </div>
        <section className="bg-white border rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-[#183B35] mb-2">Campaigns ({campaigns.length})</h2>
          {campaigns.length === 0 && <p className="text-sm text-slate-500">This NGO has no active campaigns listed right now.</p>}
          {campaigns.map((c) => (
            <Link key={c._id} to={`/campaign/${c._id}`} className="block py-2 border-b border-slate-100 last:border-0">
              <p className="text-sm font-bold text-slate-900 hover:text-[#087F70]">{c.title}</p>
              <p className="text-sm text-slate-500">₹{c.raisedAmount || 0} raised of ₹{c.targetAmount} • {c.status}</p>
            </Link>
          ))}
        </section>
      </main>
    </div>
  )
}
