import React, { useState } from 'react'
import { useSearchParams, Link } from 'react-router'
import { AlertTriangle } from 'lucide-react'
import API from '@/api/axios'

// Reporting (Guide §7.11). POST /reports with exactly:
// { targetType, targetId, reason, explanation }.
// Reasons are the backend's enum, verbatim. A written explanation is
// required (max 2000 chars) — evidence uploads are NOT part of reporting
// and are not offered. The reporter's identity is never exposed to the
// reported party, and a duplicate open report (same reporter + target)
// is refused with 400 by the backend. Reporters can see their own reports
// below; admins investigate from /admin/reports.
const TARGET_TYPES = ['User', 'Ngo', 'Vet', 'DonationCampaign', 'SupplyRequest', 'EmergencyCase', 'Animal', 'VolunteerRequest', 'VolunteerStory']
const REASONS = ['Fake NGO', 'Fake fundraising campaign', 'Misleading information', 'Suspicious donation activity', 'False emergency', 'Misuse of platform', 'Animal welfare concern', 'Other']

export default function ReportPage() {
  const [params] = useSearchParams()
  const [form, setForm] = useState({
    targetType: params.get('targetType') || 'Ngo',
    targetId: params.get('targetId') || '',
    reason: 'Other',
    explanation: '',
  })
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [mine, setMine] = useState(null)

  const loadMine = async () => {
    try {
      const res = await API.get('/reports/my')
      setMine(res.data?.data || [])
    } catch { /* own-reports list is secondary */ }
  }

  React.useEffect(() => { loadMine() }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await API.post('/reports', form)
      setDone(true)
      await loadMine()
    } catch (err) {
      setError(err.message || 'Could not submit the report.')
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#F7F5EF] flex items-center justify-center p-6 pb-20 md:pb-6">
        <div className="bg-white border rounded-3xl p-8 max-w-md text-center space-y-3 shadow-sm">
          <h1 className="font-display text-2xl font-bold text-[#183B35]">Report submitted</h1>
          <p className="text-sm text-slate-600">An admin will investigate. You will be notified here when the report is resolved or dismissed. Your identity is not shared with the reported party.</p>
          <Link to="/" className="block py-3 bg-[#087F70] text-white text-sm font-bold rounded-xl hover:bg-[#183B35]">Back to home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F5EF] pb-20 md:pb-6">
      <main className="max-w-2xl mx-auto p-4 sm:p-6 space-y-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#183B35]">Report a problem</h1>
          <p className="text-sm text-slate-600 mt-1">Report fake NGOs or campaigns, misleading information, suspicious donations, false emergencies, or misuse. Reports are investigated by admins; enforcement (warnings, suspensions, removals) is a separate admin action and is recorded in the audit history.</p>
        </div>
        {error && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3 flex gap-2"><AlertTriangle className="w-5 h-5 shrink-0" />{error}</p>}
        <form onSubmit={submit} className="bg-white border rounded-3xl p-6 space-y-4 shadow-sm">
          <label className="block text-sm font-bold text-slate-700">What are you reporting?
            <select value={form.targetType} onChange={(e) => setForm({ ...form, targetType: e.target.value })} className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-normal">
              {TARGET_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
          <label className="block text-sm font-bold text-slate-700">ID of the thing you are reporting *
            <input required value={form.targetId} onChange={(e) => setForm({ ...form, targetId: e.target.value })} placeholder="Paste the ID from its page" className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-normal" />
            <span className="text-xs font-normal text-slate-500">Links from NGO profiles and campaign pages fill this in for you.</span>
          </label>
          <label className="block text-sm font-bold text-slate-700">Reason *
            <select value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-normal">
              {REASONS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </label>
          <label className="block text-sm font-bold text-slate-700">Written explanation * (max 2000 characters)
            <textarea required rows={5} maxLength={2000} value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} placeholder="What happened, in your own words? Be specific — dates, amounts, and what was misleading." className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-normal" />
          </label>
          <button className="w-full py-3 bg-[#087F70] text-white text-sm font-bold rounded-xl hover:bg-[#183B35]">Submit report</button>
        </form>

        {mine !== null && (
          <section className="bg-white border rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-[#183B35] mb-2">Your reports ({mine.length})</h2>
            {mine.length === 0 && <p className="text-sm text-slate-500">You haven't submitted any reports.</p>}
            {mine.map((r) => (
              <div key={r._id} className="py-2 border-b border-slate-100 last:border-0">
                <p className="text-sm font-bold text-slate-900">{r.reason} • {r.targetType}</p>
                <p className="text-sm text-slate-600 line-clamp-2">{r.explanation}</p>
                <p className="text-xs text-slate-400">{r.status}{r.adminNote ? ` • Admin note: ${r.adminNote}` : ''}</p>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  )
}
