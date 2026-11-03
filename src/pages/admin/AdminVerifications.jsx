import React, { useState, useEffect, useCallback } from 'react'
import { AlertTriangle } from 'lucide-react'
import API from '@/api/axios'

// NGO + vet verification queues. Approve: PATCH /admin/ngo|vet/:id/verify
// { status: "verified" }. Reject: same endpoint with
// { status: "rejected", rejectionReason } — the reason is required by the
// backend. Documents are NOT returned by the pending-list endpoints, so
// they cannot be previewed here; that limitation is stated, not hidden.
export default function AdminVerifications() {
  const [ngos, setNgos] = useState([])
  const [vets, setVets] = useState([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [rejectReason, setRejectReason] = useState({})

  const load = useCallback(async () => {
    try {
      const [n, v] = await Promise.all([API.get('/admin/ngo/pending'), API.get('/admin/vet/pending')])
      setNgos(n.data?.data || [])
      setVets(v.data?.data || [])
    } catch (err) {
      setError(err.message || 'Could not load verification queues.')
    }
  }, [])

  useEffect(() => { load() }, [load])

  const decide = async (kind, id, status) => {
    setError(''); setNotice('')
    try {
      const body = { status }
      if (status === 'rejected') {
        body.rejectionReason = rejectReason[`${kind}:${id}`] || ''
        if (!body.rejectionReason.trim()) { setError('A rejection reason is required.'); return }
      }
      await API.patch(`/admin/${kind}/${id}/verify`, body)
      setNotice(`${kind === 'ngo' ? 'NGO' : 'Vet'} ${status}.`)
      await load()
    } catch (err) {
      setError(err.message || 'Could not record the decision.')
    }
  }

  const renderQueue = (kind, list, nameOf) => (
    <div className="space-y-2">
      {list.length === 0 && <p className="text-sm text-slate-500">Nothing pending.</p>}
      {list.map((item) => (
        <article key={item._id} className="bg-white border rounded-2xl p-4 shadow-sm space-y-2">
          <p className="text-sm font-bold text-slate-900">{nameOf(item)}</p>
          <p className="text-sm text-slate-600">{item.description || item.specialization || ''}</p>
          <p className="text-xs text-slate-500">{[item.address?.city, item.address?.state].filter(Boolean).join(', ')}</p>
          <p className="text-xs text-amber-700">Documents cannot be previewed here — the pending-list endpoint does not return them.</p>
          <div className="flex flex-wrap gap-2 items-center">
            <button onClick={() => decide(kind, item._id, 'verified')} className="px-4 py-2.5 bg-[#087F70] text-white text-xs font-bold rounded-full hover:bg-[#183B35]">Approve</button>
            <input value={rejectReason[`${kind}:${item._id}`] || ''} onChange={(e) => setRejectReason((r) => ({ ...r, [`${kind}:${item._id}`]: e.target.value }))} placeholder="Rejection reason (required to reject)" className="flex-1 min-w-[200px] px-3 py-2 border border-slate-200 rounded-full text-xs" />
            <button onClick={() => decide(kind, item._id, 'rejected')} className="px-4 py-2.5 bg-white border border-rose-200 text-rose-700 text-xs font-bold rounded-full hover:bg-rose-50">Reject</button>
          </div>
        </article>
      ))}
    </div>
  )

  return (
    <div className="space-y-5">
      {error && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3 flex gap-2"><AlertTriangle className="w-5 h-5 shrink-0" />{error}</p>}
      {notice && <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-3">{notice}</p>}
      <section>
        <h2 className="font-bold text-[#183B35] mb-2">NGOs awaiting verification ({ngos.length})</h2>
        {renderQueue('ngo', ngos, (n) => n.organizationName)}
      </section>
      <section>
        <h2 className="font-bold text-[#183B35] mb-2">Vets awaiting verification ({vets.length})</h2>
        {renderQueue('vet', vets, (v) => `${v.clinicName} (${v.specialization || ''})`)}
      </section>
    </div>
  )
}
