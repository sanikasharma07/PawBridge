import React, { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router'
import { useSelector } from 'react-redux'
import { AlertTriangle, MapPin } from 'lucide-react'
import API from '@/api/axios'
import { formatDateTime } from '@/lib/utils'
import { caseSpecies, caseDescription } from '@/lib/emergency'

// Rescue tracker (Guide §7.4). Real case data only: the 7-status
// pipeline, the case's own updates (newest first), and aiCare shown
// exactly as rule-based first-aid guidance — never as a diagnosis, and
// never with invented ETAs, rescuer phone numbers, or chat.
// NGO actions (advance status, post an update, request more info,
// unable to respond) are shown to signed-in NGOs viewing an assigned,
// non-Resolved case; the backend enforces the assigned-NGO check and its
// error is shown when it refuses. Cases are private: only the reporter,
// the assigned NGO and admins can view them (403 otherwise).
const PIPELINE = ['Reported', 'Help Requested', 'Rescue Accepted', 'Rescuer On The Way', 'Animal Picked Up', 'At Veterinary Facility', 'Resolved']
const NEXT_TRACKING = {
  'Rescue Accepted': 'Rescuer On The Way',
  'Rescuer On The Way': 'Animal Picked Up',
  'Animal Picked Up': 'At Veterinary Facility',
  'At Veterinary Facility': 'Resolved',
}
const UPDATE_TYPES = ['Rescue', 'Animal Picked Up', 'Veterinary Facility', 'Treatment', 'General Update']

export default function ActiveRescueTracker() {
  const { id } = useParams()
  const { user } = useSelector((state) => state.auth)
  const [caseData, setCaseData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [actionOk, setActionOk] = useState('')
  const [updateType, setUpdateType] = useState('General Update')
  const [updateMessage, setUpdateMessage] = useState('')
  const [updatePhotos, setUpdatePhotos] = useState([])
  const [busy, setBusy] = useState(false)

  const fetchCase = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await API.get(`/emergency/${id}`)
      setCaseData(res.data?.data)
    } catch (err) {
      setError(err.message || 'Could not load this case.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchCase() }, [fetchCase])

  const runAction = async (fn) => {
    setBusy(true); setActionError(''); setActionOk('')
    try { await fn(); setActionOk('Done.'); await fetchCase() } catch (err) { setActionError(err.message || 'That action failed.') } finally { setBusy(false) }
  }

  if (loading) return <div className="min-h-screen bg-[#F7F5EF] flex items-center justify-center p-6"><p className="text-slate-500 text-sm">Loading case…</p></div>
  if (error || !caseData) {
    return (
      <div className="min-h-screen bg-[#F7F5EF] flex items-center justify-center p-6">
        <div className="bg-white border rounded-2xl p-6 max-w-md text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
          <h1 className="font-display text-xl font-bold text-[#183B35]">Could not open this case</h1>
          <p className="text-sm text-slate-600">{error}</p>
          <p className="text-sm text-slate-500">Cases are private: only the reporter, the assigned NGO and admins can view them.</p>
          <Link to="/" className="text-sm font-bold text-[#087F70] hover:underline">Back to home</Link>
        </div>
      </div>
    )
  }

  const currentIndex = PIPELINE.indexOf(caseData.status)
  const isNgo = user?.role === 'ngo'
  const showNgoActions = isNgo && caseData.status !== 'Resolved'
  const coords = caseData.location?.coordinates
  const nextStatus = NEXT_TRACKING[caseData.status]

  return (
    <div className="min-h-screen bg-[#F7F5EF] pb-20 md:pb-6">
      <main className="max-w-3xl mx-auto p-4 sm:p-6 space-y-5">
        <div>
          <Link to="/" className="text-sm font-bold text-[#087F70] hover:underline">← Home</Link>
          <h1 className="font-display text-2xl font-bold text-[#183B35] mt-2">Rescue case: {caseSpecies(caseData)}</h1>
          <p className="text-sm text-slate-600 mt-1">{caseDescription(caseData)}</p>
          <p className="text-sm text-slate-500 mt-1">
            Reported {formatDateTime(caseData.createdAt)}
            {caseData.reporter?.name ? ` by ${caseData.reporter.name}` : ''}
            {caseData.assignedNgo?.organizationName ? ` • Assigned to ${caseData.assignedNgo.organizationName}` : ' • Not yet accepted by an NGO'}
          </p>
          {coords && (
            <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
              <MapPin className="w-4 h-4" /> {coords[1]?.toFixed(5)}, {coords[0]?.toFixed(5)}
              {' • '}
              <a href={`https://www.google.com/maps?q=${coords[1]},${coords[0]}`} target="_blank" rel="noreferrer" className="font-bold text-[#087F70] hover:underline">Open in Maps</a>
            </p>
          )}
        </div>

        <section className="bg-white border rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-[#183B35] mb-3">Status: {caseData.status}</h2>
          <ol className="space-y-0">
            {PIPELINE.map((s, i) => (
              <li key={s} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i <= currentIndex ? 'bg-[#087F70] text-white' : 'bg-slate-200 text-slate-500'}`}>{i < currentIndex || caseData.status === 'Resolved' && i <= currentIndex ? '✓' : i + 1}</span>
                  {i < PIPELINE.length - 1 && <span className={`w-0.5 flex-1 min-h-4 ${i < currentIndex ? 'bg-[#087F70]' : 'bg-slate-200'}`} />}
                </div>
                <p className={`pb-4 text-sm ${i === currentIndex ? 'font-bold text-slate-900' : 'text-slate-500'}`}>{s}{i === currentIndex ? ' — current' : ''}</p>
              </li>
            ))}
          </ol>
        </section>

        {caseData.media?.length > 0 && (
          <section className="bg-white border rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-[#183B35] mb-3">Photos</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {caseData.media.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noreferrer"><img src={url} alt={`Case photo ${i + 1}`} className="w-full h-32 object-cover rounded-xl" loading="lazy" /></a>
              ))}
            </div>
          </section>
        )}

        {caseData.aiCare?.isRequested && caseData.aiCare?.aiGuidanceProvided && (
          <section className="bg-white border rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-[#183B35] mb-2">First-aid guidance</h2>
            <p className="text-xs text-slate-500 mb-2">Rule-based first-aid guidance from the backend — not a diagnosis and not veterinary advice.</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{caseData.aiCare.aiGuidanceProvided}</p>
          </section>
        )}

        <section className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="font-bold text-[#183B35]">Progress updates ({(caseData.updates || []).length})</h2>
          {(caseData.updates || []).length === 0 && <p className="text-sm text-slate-500">No progress updates yet.</p>}
          {[...(caseData.updates || [])].reverse().map((u, i) => (
            <article key={i} className="border-b border-slate-100 last:border-0 pb-3 last:pb-0">
              <p className="text-sm font-bold text-slate-900">{u.type} <span className="font-normal text-slate-500">• {u.ngo?.organizationName || 'Assigned NGO'} • {formatDateTime(u.createdAt)}</span></p>
              <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{u.message}</p>
              {u.photos?.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {u.photos.map((url, j) => (
                    <a key={j} href={url} target="_blank" rel="noreferrer"><img src={url} alt={`Update photo ${j + 1}`} className="w-20 h-20 object-cover rounded-lg" loading="lazy" /></a>
                  ))}
                </div>
              )}
            </article>
          ))}
        </section>

        {showNgoActions && (
          <section className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="font-bold text-[#183B35]">NGO actions</h2>
            <p className="text-xs text-slate-500">These actions are enforced by the backend: only the assigned, verified NGO can use them. If the backend refuses, its message is shown below.</p>
            {actionError && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3">{actionError}</p>}
            {actionOk && <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-3">{actionOk}</p>}
            <div className="flex flex-wrap gap-2">
              {nextStatus && (
                <button disabled={busy} onClick={() => runAction(() => API.patch(`/emergency/${id}/status`, { status: nextStatus }))} className="px-4 py-2.5 bg-[#087F70] text-white text-sm font-bold rounded-xl hover:bg-[#183B35] disabled:opacity-50">
                  Advance to {nextStatus}
                </button>
              )}
              <button disabled={busy} onClick={() => runAction(() => API.patch(`/emergency/${id}/request-info`))} className="px-4 py-2.5 bg-white border border-slate-200 text-sm font-bold rounded-xl hover:bg-slate-50 disabled:opacity-50">Request more information</button>
              <button disabled={busy} onClick={() => runAction(() => API.patch(`/emergency/${id}/unable-to-respond`))} className="px-4 py-2.5 bg-white border border-rose-200 text-rose-700 text-sm font-bold rounded-xl hover:bg-rose-50 disabled:opacity-50">Unable to respond</button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); runAction(async () => { const form = new FormData(); form.append('type', updateType); form.append('message', updateMessage.trim()); updatePhotos.slice(0, 3).forEach((f) => form.append('photos', f)); await API.post(`/emergency/${id}/updates`, form); setUpdateMessage(''); setUpdatePhotos([]) }) }} className="space-y-3 border-t border-slate-100 pt-4">
              <label className="block text-sm font-bold text-slate-700">Post a progress update
                <select value={updateType} onChange={(e) => setUpdateType(e.target.value)} className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-normal">
                  {UPDATE_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </label>
              <textarea required rows={3} value={updateMessage} onChange={(e) => setUpdateMessage(e.target.value)} placeholder="What has happened with this case?" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm" />
              <label className="block text-sm font-bold text-slate-700">Photos (optional, up to 3)
                <input type="file" accept="image/*" multiple onChange={(e) => setUpdatePhotos(Array.from(e.target.files).slice(0, 3))} className="mt-1 w-full text-sm" />
              </label>
              <button disabled={busy || !updateMessage.trim()} className="px-5 py-2.5 bg-[#087F70] text-white text-sm font-bold rounded-xl hover:bg-[#183B35] disabled:opacity-50">Post update</button>
            </form>
          </section>
        )}
      </main>
    </div>
  )
}
