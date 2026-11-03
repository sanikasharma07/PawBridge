import React, { useState, useEffect, useCallback } from 'react'
import API from '@/api/axios'
import { formatDateTime } from '@/lib/utils'

// In-app notifications only (Guide §7.11) — no email, SMS or push.
// GET /notifications (own, newest first, ?unreadOnly=true),
// GET /notifications/unread-count (data.unreadCount),
// PATCH /notifications/:id/read, PATCH /notifications/read-all.
// A notification about another user returns 404, never leaked data.
export function useUnreadCount() {
  const [unread, setUnread] = useState(0)
  const refresh = useCallback(async () => {
    try {
      const res = await API.get('/notifications/unread-count')
      setUnread(res.data?.data?.unreadCount ?? 0)
    } catch {
      // Notifications are secondary: a failure here never blocks the page.
    }
  }, [])
  useEffect(() => { refresh() }, [refresh])
  return { unread, refresh }
}

export default function NotificationsPanel() {
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const [error, setError] = useState('')
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)

  const load = useCallback(async () => {
    try {
      const [list, count] = await Promise.all([
        API.get('/notifications', { params: showUnreadOnly ? { unreadOnly: true } : {} }),
        API.get('/notifications/unread-count'),
      ])
      setItems(list.data?.data || [])
      setUnread(count.data?.data?.unreadCount ?? 0)
    } catch (err) {
      setError(err.message || 'Could not load notifications.')
    }
  }, [showUnreadOnly])

  useEffect(() => { load() }, [load])

  const markRead = async (id) => {
    try { await API.patch(`/notifications/${id}/read`); await load() } catch { /* keep list as-is */ }
  }
  const markAllRead = async () => {
    try { await API.patch('/notifications/read-all'); await load() } catch { /* keep list as-is */ }
  }

  return (
    <section className="bg-white border rounded-2xl p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h2 className="font-bold text-[#183B35]">Notifications {unread > 0 && <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full ml-1">{unread} unread</span>}</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowUnreadOnly((v) => !v)} className="text-xs font-bold px-3 py-1.5 bg-white border border-slate-200 rounded-full hover:bg-slate-50">{showUnreadOnly ? 'Show all' : 'Unread only'}</button>
          {unread > 0 && <button onClick={markAllRead} className="text-xs font-bold px-3 py-1.5 bg-white border border-slate-200 rounded-full hover:bg-slate-50">Mark all read</button>}
        </div>
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      {items.length === 0 && !error && <p className="text-sm text-slate-500">No notifications yet. Updates about your cases, donations, pledges, applications and reports will appear here.</p>}
      <ul className="space-y-2">
        {items.slice(0, 10).map((n) => (
          <li key={n._id} className={`text-sm p-3 rounded-xl border ${n.isRead ? 'border-slate-100 bg-white' : 'border-[#DDE9DF] bg-[#F7F5EF]'}`}>
            <p className="font-bold text-slate-900">{n.title}</p>
            <p className="text-slate-600">{n.message}</p>
            <p className="text-xs text-slate-400 mt-1">{n.type} • {formatDateTime(n.createdAt)}</p>
            {!n.isRead && <button onClick={() => markRead(n._id)} className="text-xs font-bold text-[#087F70] hover:underline mt-1">Mark as read</button>}
          </li>
        ))}
      </ul>
      {items.length > 10 && <p className="text-xs text-slate-400 mt-2">Showing the 10 newest.</p>}
    </section>
  )
}
