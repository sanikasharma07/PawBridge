import React, { useState, useEffect, useCallback } from 'react'
import { AlertTriangle } from 'lucide-react'
import API from '@/api/axios'

// Admin campaign management. GET /admin/campaigns (?removedByAdmin=true
// for removed ones). Soft removal only: POST
// /admin/moderation/remove-campaign { campaignId, reason } hides the
// campaign from public lists while keeping it visible to its NGO and to
// admins; POST /admin/moderation/restore-campaign reverses it. Both are
// recorded in the AdminAction history.
export default function AdminCampaigns() {
  const [campaigns, setCampaigns] = useState([])
  const [showRemoved, setShowRemoved] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    try {
      const res = await API.get('/admin/campaigns', { params: showRemoved ? { removedByAdmin: true } : {} })
      setCampaigns(res.data?.data || [])
    } catch (err) {
      setError(err.message || 'Could not load campaigns.')
    }
  }, [showRemoved])

  useEffect(() => { load() }, [load])

  const act = async (path, body) => {
    if (!reason.trim()) { setError('A reason is required for removal or restoration.'); return }
    setError('')
    try {
      await API.post(path, body)
      setNotice('Action recorded.')
      await load()
    } catch (err) {
      setError(err.message || 'Could not record the action.')
    }
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3 flex gap-2"><AlertTriangle className="w-5 h-5 shrink-0" />{error}</p>}
      {notice && <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-3">{notice}</p>}
      <div className="bg-white border rounded-2xl p-4 shadow-sm flex flex-wrap gap-3 items-end">
        <label className="block text-sm font-bold text-slate-700 flex-1 min-w-[220px]">Reason (applies to the button you press next)
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Campaign misrepresents its purpose" className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-normal" />
        </label>
        <div className="flex gap-2">
          <button onClick={() => setShowRemoved(false)} className={`px-4 py-2 rounded-full text-sm font-bold ${!showRemoved ? 'bg-[#087F70] text-white' : 'bg-white border border-slate-200'}`}>Live</button>
          <button onClick={() => setShowRemoved(true)} className={`px-4 py-2 rounded-full text-sm font-bold ${showRemoved ? 'bg-[#087F70] text-white' : 'bg-white border border-slate-200'}`}>Removed</button>
        </div>
      </div>
      <p className="text-xs text-slate-500">Removal is soft and reversible: removed campaigns disappear from public lists but stay visible to their NGO and to admins.</p>
      <section className="space-y-2">
        {campaigns.length === 0 && <p className="text-sm text-slate-500">No campaigns in this view.</p>}
        {campaigns.map((c) => (
          <article key={c._id} className="bg-white border rounded-2xl p-4 shadow-sm flex flex-wrap justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-slate-900">{c.title} • {c.status}</p>
              <p className="text-sm text-slate-600">₹{c.raisedAmount || 0} / ₹{c.targetAmount}</p>
            </div>
            {showRemoved
              ? <button onClick={() => act('/admin/moderation/restore-campaign', { campaignId: c._id, reason })} className="px-4 py-2 bg-white border border-emerald-200 text-emerald-700 text-xs font-bold rounded-full hover:bg-emerald-50 self-start">Restore</button>
              : <button onClick={() => act('/admin/moderation/remove-campaign', { campaignId: c._id, reason })} className="px-4 py-2 bg-white border border-rose-200 text-rose-700 text-xs font-bold rounded-full hover:bg-rose-50 self-start">Remove</button>}
          </article>
        ))}
      </section>
    </div>
  )
}
