import React, { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { AlertTriangle } from 'lucide-react'
import API from '@/api/axios'
import { caseSpecies, caseDescription } from '@/lib/emergency'

// Admin emergency list. GET /admin/emergencies with a status filter.
// There is deliberately NO flag-as-spam or delete button: the backend
// has no such endpoints, so the page does not pretend otherwise.
const STATUSES = ['Reported', 'Help Requested', 'Rescue Accepted', 'Rescuer On The Way', 'Animal Picked Up', 'At Veterinary Facility', 'Resolved']

export default function AdminEmergencies() {
  const [cases, setCases] = useState([])
  const [filter, setFilter] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    API.get('/admin/emergencies')
      .then((res) => setCases(res.data?.data || []))
      .catch((err) => setError(err.message || 'Could not load emergency cases.'))
  }, [])

  const filtered = filter ? cases.filter((c) => c.status === filter) : cases

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3 flex gap-2"><AlertTriangle className="w-5 h-5 shrink-0" />{error}</p>}
      <div className="flex flex-wrap gap-2">
        {['', ...STATUSES].map((s) => (
          <button key={s || 'all'} onClick={() => setFilter(s)} className={`px-3 py-2.5 rounded-full text-xs font-bold ${filter === s ? 'bg-[#087F70] text-white' : 'bg-white border border-slate-200'}`}>{s || 'All statuses'}</button>
        ))}
      </div>
      <p className="text-xs text-slate-500">Admins can view cases here. There is no admin flag-as-spam or delete-emergency endpoint in the backend, so no such action is offered.</p>
      <section className="space-y-2">
        {filtered.length === 0 && <p className="text-sm text-slate-500">No cases in this filter.</p>}
        {filtered.map((c) => (
          <article key={c._id} className="bg-white border rounded-2xl p-4 shadow-sm flex flex-wrap justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-slate-900">{caseSpecies(c)} — {c.status}</p>
              <p className="text-sm text-slate-600">{caseDescription(c)}</p>
              <p className="text-xs text-slate-400">{c.assignedNgo?.organizationName ? `Assigned to ${c.assignedNgo.organizationName}` : 'Unassigned'}</p>
            </div>
            <Link to={`/tracker/${c._id}`} className="px-4 py-2 bg-[#087F70] text-white text-xs font-bold rounded-full hover:bg-[#183B35] self-start">View case</Link>
          </article>
        ))}
      </section>
    </div>
  )
}
