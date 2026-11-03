import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router'
import { AlertTriangle } from 'lucide-react'
import API from '@/api/axios'
import AuthRequiredState from '@/components/common/AuthRequiredState'
import { formatCurrency } from '@/lib/utils'

// Donations (Guide §7.6). Real Razorpay flow, step by step:
// 1) amount (backend minimum ₹50 — controller rejects amount < 50)
// 2) POST /donations/campaigns/:id/donate → { order, campaignId, keyId }
//    (the key comes from the backend; the frontend has no Razorpay key)
// 3) Razorpay Checkout with that order; 4) POST
//    /donations/campaigns/:id/verify with razorpay_order_id,
//    razorpay_payment_id, razorpay_signature. Success is shown ONLY after
//    verify succeeds. If verify fails, the payment may have been taken
//    but was not recorded — the message says so and to keep the payment
//    ID. Cancelling shows no success. No 80G claims, no platform totals:
//    the totals bar is derived from the listed campaigns only, and says so.
function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function DonatePage() {
  const { isAuthenticated, user } = useSelector((state) => state.auth)
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [amount, setAmount] = useState('')
  const [modalError, setModalError] = useState('')
  const [modalState, setModalState] = useState('form') // form | processing | success | failed
  const [paymentId, setPaymentId] = useState('')

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return }
    API.get('/donations/campaigns')
      .then((res) => setCampaigns(res.data?.data || []))
      .catch((err) => setError(err.message || 'Could not load campaigns.'))
      .finally(() => setLoading(false))
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F7F5EF] p-6 pb-20 md:pb-6 flex items-start justify-center">
        <div className="w-full max-w-lg pt-10"><AuthRequiredState title="Sign in to see active campaigns" message="Donation campaigns need a signed-in account, because the backend requires authentication for the campaign list." /></div>
      </div>
    )
  }

  const totalRaised = campaigns.reduce((s, c) => s + (c.raisedAmount || 0), 0)
  const totalTarget = campaigns.reduce((s, c) => s + (c.targetAmount || 0), 0)

  const openDonate = (campaign) => {
    setSelected(campaign); setAmount(''); setModalError(''); setModalState('form'); setPaymentId('')
  }

  const handleDonate = async () => {
    const value = Number(amount)
    if (!Number.isFinite(value) || value < 50) {
      setModalError('Donation amount must be at least ₹50.')
      return
    }
    setModalState('processing'); setModalError('')
    try {
      const res = await API.post(`/donations/campaigns/${selected._id}/donate`, { amount: value })
      const { order, keyId } = res.data?.data || {}
      if (!order || !keyId) {
        setModalError('The backend did not return a payment order. No payment was taken.')
        setModalState('form')
        return
      }
      const loaded = await loadRazorpay()
      if (!loaded) {
        setModalError('Razorpay Checkout could not be loaded. No payment was taken.')
        setModalState('form')
        return
      }
      const rzp = new window.Razorpay({
        key: keyId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'PawBridge',
        description: selected.title,
        order_id: order.id,
        theme: { color: '#087F70' },
        handler: async (response) => {
          try {
            await API.post(`/donations/campaigns/${selected._id}/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            setModalState('success')
            const refreshed = await API.get('/donations/campaigns')
            setCampaigns(refreshed.data?.data || [])
          } catch (err) {
            setPaymentId(response.razorpay_payment_id || '')
            setModalError(err.message || 'Payment was taken but recording it failed. Please keep your payment ID and contact the NGO.')
            setModalState('failed')
          }
        },
        modal: {
          ondismiss: () => {
            if (modalState === 'processing') {
              setModalError('Payment was cancelled. No donation was recorded.')
              setModalState('form')
            }
          },
        },
      })
      rzp.on('payment.failed', () => {
        setModalError('Payment failed. No donation was recorded.')
        setModalState('form')
      })
      rzp.open()
    } catch (err) {
      setModalError(err.message || 'Could not start the donation.')
      setModalState('form')
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F5EF] pb-20 md:pb-6">
      <main className="max-w-5xl mx-auto p-4 sm:p-6 space-y-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#183B35]">Donate</h1>
          <p className="text-sm text-slate-600 mt-1">Donations go to verified NGOs' campaigns and are processed through Razorpay. Only verified NGOs can create campaigns.</p>
        </div>

        <section className="bg-white border rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-slate-600">
            Across the campaigns listed below: <strong className="text-[#183B35]">{formatCurrency(totalRaised)}</strong> raised of <strong className="text-[#183B35]">{formatCurrency(totalTarget)}</strong> target.
            <span className="block text-xs text-slate-400 mt-1">These totals cover only the campaigns shown here — the backend has no platform-wide statistics endpoint, so no larger totals are claimed.</span>
          </p>
        </section>

        {error && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3 flex gap-2"><AlertTriangle className="w-5 h-5 shrink-0" />{error}</p>}
        {loading && <p className="text-sm text-slate-500">Loading campaigns…</p>}
        {!loading && campaigns.length === 0 && !error && (
          <div className="bg-white border rounded-2xl p-6 text-center">
            <p className="font-bold text-slate-900">No active campaigns right now</p>
            <p className="text-sm text-slate-500 mt-1">Check back later, or find help nearby in the meantime.</p>
          </div>
        )}

        <section className="grid sm:grid-cols-2 gap-4">
          {campaigns.map((c) => {
            const pct = c.targetAmount ? Math.min(100, Math.round(((c.raisedAmount || 0) / c.targetAmount) * 100)) : 0
            return (
              <article key={c._id} className="bg-white border rounded-2xl p-5 shadow-sm space-y-3">
                {c.impact?.photos?.[0] && <img src={c.impact.photos[0]} alt="" className="w-full h-40 object-cover rounded-xl" loading="lazy" />}
                <div>
                  <h2 className="font-bold text-slate-900">{c.title}</h2>
                  <p className="text-sm text-slate-600 mt-1 line-clamp-3">{c.description}</p>
                </div>
                <div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-[#087F70]" style={{ width: `${pct}%` }} /></div>
                  <p className="text-sm text-slate-600 mt-1">{formatCurrency(c.raisedAmount || 0)} raised of {formatCurrency(c.targetAmount)} • {pct}% • {c.status}</p>
                  <p className="text-xs text-slate-400">Donor names and counts are not shown here — the backend strips donors from the campaign list.</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openDonate(c)} className="flex-1 py-2.5 bg-[#087F70] text-white text-sm font-bold rounded-xl hover:bg-[#183B35]">Donate</button>
                  <Link to={`/campaign/${c._id}`} className="flex-1 text-center py-2.5 bg-white border border-slate-200 text-sm font-bold rounded-xl hover:bg-slate-50">Details</Link>
                </div>
              </article>
            )
          })}
        </section>

        {user?.role === 'ngo' && (
          <p className="text-sm text-slate-500">Manage your own campaigns — create one and upload impact proof — from your <Link to="/ngo/dashboard" className="font-bold text-[#087F70]">NGO dashboard</Link>.</p>
        )}
      </main>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label="Donate">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-4">
            <h2 className="font-display text-xl font-bold text-[#183B35]">Donate to {selected.title}</h2>
            {modalState === 'success' ? (
              <div className="space-y-3">
                <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-4">Thank you — your donation was recorded. The campaign total has been updated.</p>
                <button onClick={() => setSelected(null)} className="w-full py-3 bg-[#087F70] text-white text-sm font-bold rounded-xl hover:bg-[#183B35]">Done</button>
              </div>
            ) : (
              <>
                {modalError && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3">{modalError}{paymentId ? ` Payment ID: ${paymentId}` : ''}</p>}
                <label className="block text-sm font-bold text-slate-700">Amount (₹, at least 50)
                  <input type="number" min="50" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 500" className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-normal" />
                </label>
                <div className="flex gap-2">
                  <button onClick={() => setSelected(null)} className="flex-1 py-3 bg-white border border-slate-200 text-sm font-bold rounded-xl hover:bg-slate-50">Cancel</button>
                  <button onClick={handleDonate} disabled={modalState === 'processing'} className="flex-1 py-3 bg-[#087F70] text-white text-sm font-bold rounded-xl hover:bg-[#183B35] disabled:opacity-50">{modalState === 'processing' ? 'Processing…' : 'Pay with Razorpay'}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
