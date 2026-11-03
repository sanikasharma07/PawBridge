import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { AlertTriangle } from 'lucide-react'
import API from '@/api/axios'
import AuthRequiredState from '@/components/common/AuthRequiredState'

// Supplies (Guide §7.7). Supply pledges are in-kind — no payment, ever.
// A pledge is exactly { pledgedQuantity, message? } to
// POST /supplies/:id/pledge, made in the signed-in user's name. What
// counts is the NGO marking a pledge Received: that raises
// receivedQuantity, and reaching the required quantity fulfils the
// request. NGOs manage their own requests below: create, view pledges,
// and move each pledge through Pledged → Contacted → Delivery Arranged
// → Received (or Cancelled). Success is shown only on a 2xx response.
const CATEGORIES = ['Food', 'Medicine', 'Accessories', 'Other']
const PLEDGE_STATUSES = ['Pledged', 'Contacted', 'Delivery Arranged', 'Received', 'Cancelled']

export default function SuppliesPage() {
  const { isAuthenticated, user } = useSelector((state) => state.auth)
  const [requests, setRequests] = useState([])
  const [mine, setMine] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [pledgeFor, setPledgeFor] = useState(null)
  const [pledgeQty, setPledgeQty] = useState('')
  const [pledgeMsg, setPledgeMsg] = useState('')
  const [pledgeError, setPledgeError] = useState('')
  const [create, setCreate] = useState({ title: '', description: '', category: 'Food', requiredQuantity: '', unit: '' })

  const load = async () => {
    try {
      const res = await API.get('/supplies')
      setRequests(res.data?.data || [])
      if (user?.role === 'ngo') {
        const m = await API.get('/supplies/mine')
        setMine(m.data?.data || [])
      }
    } catch (err) {
      setError(err.message || 'Could not load supply requests.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  const submitPledge = async () => {
    const qty = Number(pledgeQty)
    if (!Number.isFinite(qty) || qty <= 0) { setPledgeError('Enter a quantity greater than 0.'); return }
    setPledgeError('')
    try {
      await API.post(`/supplies/${pledgeFor._id}/pledge`, { pledgedQuantity: qty, message: pledgeMsg || undefined })
      setNotice(`Pledge recorded for ${pledgeFor.title}. The NGO will contact you through the platform's next steps — pledges are in-kind, no payment is involved.`)
      setPledgeFor(null); setPledgeQty(''); setPledgeMsg('')
      await load()
    } catch (err) {
      setPledgeError(err.message || 'Could not record the pledge.')
    }
  }

  const createRequest = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await API.post('/supplies', { ...create, requiredQuantity: Number(create.requiredQuantity) })
      setNotice('Supply request created.')
      setCreate({ title: '', description: '', category: 'Food', requiredQuantity: '', unit: '' })
      await load()
    } catch (err) {
      setError(err.message || 'Could not create the supply request.')
    }
  }

  const setPledgeStatus = async (requestId, pledgeId, status) => {
    setError('')
    try {
      await API.patch(`/supplies/${requestId}/pledge/${pledgeId}/status`, { status })
      setNotice(`Pledge moved to ${status}.`)
      await load()
    } catch (err) {
      setError(err.message || 'Could not update the pledge.')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F7F5EF] p-6 pb-20 md:pb-6 flex items-start justify-center">
        <div className="w-full max-w-lg pt-10"><AuthRequiredState title="Sign in to see supply requests" message="Supply requests need a signed-in account, because the backend requires authentication for them." /></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F5EF] pb-20 md:pb-6">
      <main className="max-w-5xl mx-auto p-4 sm:p-6 space-y-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#183B35]">Supplies</h1>
          <p className="text-sm text-slate-600 mt-1">In-kind help: food, medicine and accessories that NGOs actually need. Pledging costs nothing — you promise items, and the NGO marks the pledge Received when they arrive.</p>
        </div>
        {notice && <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-3">{notice}</p>}
        {error && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3 flex gap-2"><AlertTriangle className="w-5 h-5 shrink-0" />{error}</p>}
        {loading && <p className="text-sm text-slate-500">Loading supply requests…</p>}

        <section className="grid sm:grid-cols-2 gap-4">
          {requests.map((r) => (
            <article key={r._id} className="bg-white border rounded-2xl p-5 shadow-sm space-y-2">
              <h2 className="font-bold text-slate-900">{r.title}</h2>
              <p className="text-sm text-slate-600">{r.description}</p>
              <p className="text-sm text-slate-600">{r.category} • {r.receivedQuantity || 0}/{r.requiredQuantity} {r.unit} • {r.status}</p>
              <button onClick={() => { setPledgeFor(r); setPledgeQty(''); setPledgeMsg(''); setPledgeError('') }} className="px-4 py-2 bg-[#087F70] text-white text-sm font-bold rounded-xl hover:bg-[#183B35]">Pledge supplies</button>
            </article>
          ))}
          {!loading && requests.length === 0 && !error && (
            <p className="text-sm text-slate-500 col-span-2">No open supply requests right now.</p>
          )}
        </section>

        {user?.role === 'ngo' && (
          <section className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="font-bold text-[#183B35]">Your supply requests</h2>
            <form onSubmit={createRequest} className="grid sm:grid-cols-2 gap-3 border-b border-slate-100 pb-4">
              <label className="block text-sm font-bold text-slate-700">Title *
                <input required value={create.title} onChange={(e) => setCreate({ ...create, title: e.target.value })} className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-normal" />
              </label>
              <label className="block text-sm font-bold text-slate-700">Category *
                <select value={create.category} onChange={(e) => setCreate({ ...create, category: e.target.value })} className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-normal">
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>
              <label className="block text-sm font-bold text-slate-700 sm:col-span-2">Description *
                <textarea required rows={2} value={create.description} onChange={(e) => setCreate({ ...create, description: e.target.value })} className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-normal" />
              </label>
              <label className="block text-sm font-bold text-slate-700">Required quantity *
                <input type="number" min="1" step="any" required value={create.requiredQuantity} onChange={(e) => setCreate({ ...create, requiredQuantity: e.target.value })} className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-normal" />
              </label>
              <label className="block text-sm font-bold text-slate-700">Unit *
                <input required value={create.unit} onChange={(e) => setCreate({ ...create, unit: e.target.value })} placeholder="kg, units, boxes…" className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-normal" />
              </label>
              <button className="sm:col-span-2 py-2.5 bg-[#087F70] text-white text-sm font-bold rounded-xl hover:bg-[#183B35]">Create supply request</button>
            </form>
            {mine.length === 0 && <p className="text-sm text-slate-500">You have no supply requests yet.</p>}
            {mine.map((r) => (
              <div key={r._id} className="space-y-2">
                <p className="text-sm font-bold text-slate-900">{r.title} — {r.receivedQuantity || 0}/{r.requiredQuantity} {r.unit} • {r.status}</p>
                {(r.pledges || []).length === 0 && <p className="text-xs text-slate-500">No pledges yet.</p>}
                {(r.pledges || []).map((pl) => (
                  <div key={pl._id} className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-slate-700">{pl.pledgedQuantity} {r.unit} • {pl.status}{pl.message ? ` — “${pl.message}”` : ''}</span>
                    <select value={pl.status} onChange={(e) => setPledgeStatus(r._id, pl._id, e.target.value)} className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-bold">
                      {PLEDGE_STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            ))}
          </section>
        )}
      </main>

      {pledgeFor && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label="Pledge supplies">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-4">
            <h2 className="font-display text-xl font-bold text-[#183B35]">Pledge for {pledgeFor.title}</h2>
            <p className="text-sm text-slate-600">Needed: {pledgeFor.requiredQuantity - (pledgeFor.receivedQuantity || 0)} {pledgeFor.unit} more to fulfil this request.</p>
            {pledgeError && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3">{pledgeError}</p>}
            <label className="block text-sm font-bold text-slate-700">Quantity ({pledgeFor.unit})
              <input type="number" min="0" step="any" value={pledgeQty} onChange={(e) => setPledgeQty(e.target.value)} className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-normal" />
            </label>
            <label className="block text-sm font-bold text-slate-700">Message (optional)
              <textarea rows={2} value={pledgeMsg} onChange={(e) => setPledgeMsg(e.target.value)} className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-normal" />
            </label>
            <div className="flex gap-2">
              <button onClick={() => setPledgeFor(null)} className="flex-1 py-3 bg-white border border-slate-200 text-sm font-bold rounded-xl hover:bg-slate-50">Cancel</button>
              <button onClick={submitPledge} className="flex-1 py-3 bg-[#087F70] text-white text-sm font-bold rounded-xl hover:bg-[#183B35]">Confirm pledge</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
