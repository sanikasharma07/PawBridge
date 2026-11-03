import React, { useState, useEffect, useCallback } from 'react'
import { AlertTriangle } from 'lucide-react'
import API from '@/api/axios'
import { formatDateTime } from '@/lib/utils'

// Report investigation. GET /admin/reports (?status, ?targetType);
// GET /admin/reports/:id returns report + targetSummary +
// previousReports + previousActions. Decide: PATCH /admin/reports/:id
// { status, adminNote, actionTaken } — transitions Pending →
// Under Review/Resolved/Dismissed and Under Review →
// Resolved/Dismissed; terminal decisions REQUIRE an admin note.
// actionTaken is a SUMMARY only: enforcement happens through the
// moderation endpoints (warn/suspend/remove), which is stated on the
// form so admins don't mistake recording a decision for enforcing it.
const STATUSES = ['Pending', 'Under Review', 'Resolved', 'Dismissed']
const ACTION_TAKEN = ['None', 'Warning', 'Temporary Suspension', 'Indefinite Suspension', 'Campaign Removal', 'Content Removal', 'Escalation']

export default function AdminReports() {
  const [reports, setReports] = useState([])
  const [filter, setFilter] = useState('Pending')
  const [detail, setDetail] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [decision, setDecision] = useState({ status: 'Resolved', adminNote: '', actionTaken: 'None' })

  const load = useCallback(async () => {
    try {
      const res = await API.get('/admin/reports', { params: filter ? { status: filter } : {} })
      setReports(res.data?.data || [])
    } catch (err) {
      setError(err.message || 'Could not load reports.')
    }
  }, [filter])

  useEffect(() => { load() }, [load])

  const openDetail = async (id) => {
    setError('')
    try {
      const res = await API.get(`/admin/reports/${id}`)
      setDetail(res.data?.data)
      setDecision({ status: 'Resolved', adminNote: '', actionTaken: 'None' })
    } catch (err) {
      setError(err.message || 'Could not load the report.')
    }
  }

  const decide = async () => {
    if ((decision.status === 'Resolved' || decision.status === 'Dismissed') && !decision.adminNote.trim()) {
      setError('An admin note is required for a Resolved or Dismissed decision.')
      return
    }
    setError('')
    try {
      await API.patch(`/admin/reports/${detail.report._id}`, decision)
      setNotice('Decision recorded. The reporter has been notified.')
      setDetail(null)
      await load()
    } catch (err) {
      setError(err.message || 'Could not record the decision.')
    }
  }

  return (
    <div className="space-y-5">
      {error && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3 flex gap-2"><AlertTriangle className="w-5 h-5 shrink-0" />{error}</p>}
      {notice && <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-3">{notice}</p>}
      <div className="flex flex-wrap gap-2">
        {['', ...STATUSES].map((s) => (
          <button key={s || 'all'} onClick={() => setFilter(s)} className={`px-4 py-2.5 rounded-full text-sm font-bold ${filter === s ? 'bg-[#087F70] text-white' : 'bg-white border border-slate-200'}`}>{s || 'All'}</button>
        ))}
      </div>
      <section className="space-y-2">
        {reports.length === 0 && <p className="text-sm text-slate-500">No reports in this filter.</p>}
        {reports.map((r) => (
          <article key={r._id} className="bg-white border rounded-2xl p-4 shadow-sm flex flex-wrap justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-slate-900">{r.reason} • {r.targetType}</p>
              <p className="text-sm text-slate-600 line-clamp-2">{r.explanation}</p>
              <p className="text-xs text-slate-400">{r.status} • Reporter: {r.reporter?.name || '—'} • Previous reports against this target: {r.previousReportCount ?? '—'} • {formatDateTime(r.createdAt)}</p>
            </div>
            <button onClick={() => openDetail(r._id)} className="px-4 py-2 bg-[#087F70] text-white text-xs font-bold rounded-full hover:bg-[#183B35] self-start">Investigate</button>
          </article>
        ))}
      </section>

      {detail && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto" role="dialog" aria-modal="true" aria-label="Investigate report">
          <div className="bg-white w-full max-w-2xl rounded-t-3xl sm:rounded-3xl p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <h2 className="font-display text-xl font-bold text-[#183B35]">Investigate report</h2>
            <div className="text-sm text-slate-700 space-y-1">
              <p><strong>Reason:</strong> {detail.report.reason}</p>
              <p><strong>Target:</strong> {detail.report.targetType} — {detail.report.targetId}</p>
              <p><strong>Reporter:</strong> {detail.report.reporter?.name} ({detail.report.reporter?.email})</p>
              <p><strong>Explanation:</strong> {detail.report.explanation}</p>
              <p><strong>Current status:</strong> {detail.report.status}</p>
              {detail.targetSummary && <p><strong>Target summary:</strong> {typeof detail.targetSummary === 'string' ? detail.targetSummary : JSON.stringify(detail.targetSummary)}</p>}
            </div>
            {(detail.previousReports || []).length > 0 && (
              <div>
                <h3 className="font-bold text-sm text-slate-900">Previous reports against this target ({detail.previousReports.length})</h3>
                {detail.previousReports.map((pr) => <p key={pr._id} className="text-sm text-slate-600">{pr.reason} • {pr.status} • {pr.reporter?.name}</p>)}
              </div>
            )}
            {(detail.previousActions || []).length > 0 && (
              <div>
                <h3 className="font-bold text-sm text-slate-900">Previous admin actions ({detail.previousActions.length})</h3>
                {detail.previousActions.map((pa) => <p key={pa._id} className="text-sm text-slate-600">{pa.actionType} • {pa.reason}</p>)}
              </div>
            )}
            <div className="space-y-3 border-t border-slate-100 pt-4">
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-xl p-3">Recording an action here is a summary only. To actually warn, suspend or remove, use the Users / Campaigns sections — those endpoints create the AdminAction records.</p>
              <label className="block text-sm font-bold text-slate-700">New status
                <select value={decision.status} onChange={(e) => setDecision({ ...decision, status: e.target.value })} className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-normal">
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </label>
              <label className="block text-sm font-bold text-slate-700">Action taken (summary)
                <select value={decision.actionTaken} onChange={(e) => setDecision({ ...decision, actionTaken: e.target.value })} className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-normal">
                  {ACTION_TAKEN.map((a) => <option key={a}>{a}</option>)}
                </select>
              </label>
              <label className="block text-sm font-bold text-slate-700">Admin note * (required for Resolved/Dismissed)
                <textarea required rows={3} value={decision.adminNote} onChange={(e) => setDecision({ ...decision, adminNote: e.target.value })} className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-normal" />
              </label>
              <div className="flex gap-2">
                <button onClick={() => setDetail(null)} className="flex-1 py-3 bg-white border border-slate-200 text-sm font-bold rounded-xl hover:bg-slate-50">Close</button>
                <button onClick={decide} className="flex-1 py-3 bg-[#087F70] text-white text-sm font-bold rounded-xl hover:bg-[#183B35]">Record decision</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
