import React, { useState, useEffect, useCallback } from 'react'
import { AlertTriangle } from 'lucide-react'
import API from '@/api/axios'

// User moderation. Warn: POST /admin/moderation/warn
// { targetType: "User", targetId, reason }. Suspend:
// POST /admin/moderation/suspend { targetId, reason, durationDays |
// suspendedUntil | indefinite } — suspension blocks login and
// authenticated requests, revokes the refresh token, and temporary
// suspensions expire on their own. Lift: POST
// /admin/moderation/lift-suspension { targetId, reason }. Every action
// is recorded in the AdminAction history.
export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [roleFilter, setRoleFilter] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [reason, setReason] = useState('')
  const [days, setDays] = useState(7)

  const load = useCallback(async () => {
    try {
      const res = await API.get('/admin/users')
      setUsers(res.data?.data || [])
    } catch (err) {
      setError(err.message || 'Could not load users.')
    }
  }, [])

  useEffect(() => { load() }, [load])

  const act = async (path, body) => {
    if (!reason.trim()) { setError('A reason is required for every moderation action.'); return }
    setError('')
    try {
      await API.post(path, body)
      setNotice('Moderation action recorded.')
      await load()
    } catch (err) {
      setError(err.message || 'Could not record the action.')
    }
  }

  const filtered = roleFilter ? users.filter((u) => u.role === roleFilter) : users

  return (
    <div className="space-y-5">
      {error && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3 flex gap-2"><AlertTriangle className="w-5 h-5 shrink-0" />{error}</p>}
      {notice && <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-3">{notice}</p>}
      <div className="bg-white border rounded-2xl p-4 shadow-sm flex flex-wrap gap-3 items-end">
        <label className="block text-sm font-bold text-slate-700 flex-1 min-w-[220px]">Reason for the action (applies to the button you press next)
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Repeated fake emergency reports" className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-normal" />
        </label>
        <label className="block text-sm font-bold text-slate-700">Suspension length (days)
          <input type="number" min="1" max="365" value={days} onChange={(e) => setDays(Number(e.target.value))} className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-normal" />
        </label>
        <div className="flex gap-2">
          {['', 'user', 'ngo', 'vet', 'admin'].map((r) => (
            <button key={r || 'all'} onClick={() => setRoleFilter(r)} className={`px-3 py-2 rounded-full text-xs font-bold ${roleFilter === r ? 'bg-[#087F70] text-white' : 'bg-white border border-slate-200'}`}>{r || 'All roles'}</button>
          ))}
        </div>
      </div>
      <section className="space-y-2">
        {filtered.length === 0 && <p className="text-sm text-slate-500">No users in this filter.</p>}
        {filtered.map((u) => (
          <article key={u._id} className="bg-white border rounded-2xl p-4 shadow-sm space-y-2">
            <p className="text-sm font-bold text-slate-900">{u.name} • {u.email}</p>
            <p className="text-xs text-slate-500">Role: {u.role} • Account: {u.accountStatus || 'Active'}{u.suspendedUntil ? ` until ${new Date(u.suspendedUntil).toLocaleDateString()}` : ''}{u.suspensionReason ? ` — ${u.suspensionReason}` : ''}</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => act('/admin/moderation/warn', { targetType: 'User', targetId: u._id, reason })} className="px-3 py-2 bg-white border border-slate-200 text-xs font-bold rounded-full hover:bg-slate-50">Warn</button>
              <button onClick={() => act('/admin/moderation/suspend', { targetId: u._id, reason, durationDays: days })} className="px-3 py-2 bg-white border border-rose-200 text-rose-700 text-xs font-bold rounded-full hover:bg-rose-50">Suspend {days}d</button>
              <button onClick={() => act('/admin/moderation/suspend', { targetId: u._id, reason, indefinite: true })} className="px-3 py-2 bg-white border border-rose-200 text-rose-700 text-xs font-bold rounded-full hover:bg-rose-50">Suspend indefinitely</button>
              <button onClick={() => act('/admin/moderation/lift-suspension', { targetId: u._id, reason })} className="px-3 py-2 bg-white border border-emerald-200 text-emerald-700 text-xs font-bold rounded-full hover:bg-emerald-50">Lift suspension</button>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
