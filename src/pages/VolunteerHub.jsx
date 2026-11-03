import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { AlertTriangle } from 'lucide-react'
import API from '@/api/axios'
import AuthRequiredState from '@/components/common/AuthRequiredState'

// Volunteer (Guide §7.8). Board: GET /volunteer with ?linked=general or
// ?linked=emergency. Apply: POST /volunteer/:id/apply with exactly
// { message, experience }. My applications: GET /volunteer/my-applications
// (status + hoursContributed). NGO create: POST /volunteer with
// { title, description, volunteersNeeded } — only verified NGOs, and
// backend refusals are shown, not papered over. Our Heroes: GET/POST
// /volunteer/heroes (photo field "photo", story max 2000 chars); posting
// is gated by the backend to users with an Approved or Completed
// application, and its 403 is shown as-is.
export default function VolunteerHub() {
  const { isAuthenticated, user } = useSelector((state) => state.auth)
  const [board, setBoard] = useState([])
  const [linked, setLinked] = useState('')
  const [mine, setMine] = useState([])
  const [heroes, setHeroes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [applyFor, setApplyFor] = useState(null)
  const [applyMsg, setApplyMsg] = useState('')
  const [applyExp, setApplyExp] = useState('')
  const [applyError, setApplyError] = useState('')
  const [create, setCreate] = useState({ title: '', description: '', volunteersNeeded: '' })
  const [hero, setHero] = useState({ title: '', story: '', opportunityId: '' })
  const [heroPhoto, setHeroPhoto] = useState(null)

  const load = async () => {
    try {
      const params = linked ? { linked } : {}
      const [b, m, h] = await Promise.allSettled([
        API.get('/volunteer', { params }),
        API.get('/volunteer/my-applications'),
        API.get('/volunteer/heroes'),
      ])
      if (b.status === 'fulfilled') setBoard(b.value.data?.data || [])
      if (m.status === 'fulfilled') setMine(m.value.data?.data || [])
      if (h.status === 'fulfilled') setHeroes(h.value.data?.data || [])
    } catch (err) {
      setError(err.message || 'Could not load volunteer opportunities.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, linked])

  const submitApply = async () => {
    setApplyError('')
    try {
      await API.post(`/volunteer/${applyFor._id}/apply`, { message: applyMsg || undefined, experience: applyExp || undefined })
      setNotice('Application submitted. The NGO will review it.')
      setApplyFor(null); setApplyMsg(''); setApplyExp('')
      await load()
    } catch (err) {
      setApplyError(err.message || 'Could not submit the application.')
    }
  }

  const submitCreate = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await API.post('/volunteer', { ...create, volunteersNeeded: Number(create.volunteersNeeded) })
      setNotice('Opportunity posted.')
      setCreate({ title: '', description: '', volunteersNeeded: '' })
      await load()
    } catch (err) {
      setError(err.message || 'Could not post the opportunity.')
    }
  }

  const submitHero = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const form = new FormData()
      form.append('title', hero.title)
      form.append('story', hero.story)
      if (hero.opportunityId) form.append('opportunityId', hero.opportunityId)
      if (heroPhoto) form.append('photo', heroPhoto)
      await API.post('/volunteer/heroes', form)
      setNotice('Your story was posted to Our Heroes.')
      setHero({ title: '', story: '', opportunityId: '' }); setHeroPhoto(null)
      await load()
    } catch (err) {
      setError(err.message || 'Could not post the story.')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F7F5EF] p-6 pb-20 md:pb-6 flex items-start justify-center">
        <div className="w-full max-w-lg pt-10"><AuthRequiredState title="Sign in to volunteer" message="Volunteer opportunities need a signed-in account, because the backend requires authentication for them." /></div>
      </div>
    )
  }

  const appliedIds = new Set(mine.map((a) => String(a.opportunity?._id || a.opportunity)))

  return (
    <div className="min-h-screen bg-[#F7F5EF] pb-20 md:pb-6">
      <main className="max-w-5xl mx-auto p-4 sm:p-6 space-y-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#183B35]">Volunteer</h1>
          <p className="text-sm text-slate-600 mt-1">Give time to verified NGOs — general opportunities and emergency-linked ones, listed separately by the backend.</p>
        </div>
        {notice && <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-3">{notice}</p>}
        {error && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3 flex gap-2"><AlertTriangle className="w-5 h-5 shrink-0" />{error}</p>}

        <div className="flex gap-2">
          {[
            ['All', ''],
            ['General', 'general'],
            ['Emergency-linked', 'emergency'],
          ].map(([label, value]) => (
            <button key={label} onClick={() => setLinked(value)} className={`px-4 py-2 rounded-full text-sm font-bold ${linked === value ? 'bg-[#087F70] text-white' : 'bg-white border border-slate-200'}`}>{label}</button>
          ))}
        </div>

        {loading && <p className="text-sm text-slate-500">Loading opportunities…</p>}
        <section className="grid sm:grid-cols-2 gap-4">
          {board.map((o) => (
            <article key={o._id} className="bg-white border rounded-2xl p-5 shadow-sm space-y-2">
              <h2 className="font-bold text-slate-900">{o.title}</h2>
              <p className="text-sm text-slate-600">{o.description}</p>
              <p className="text-sm text-slate-500">{o.volunteersNeeded} volunteers needed • {o.linkedEmergency ? 'Emergency-linked' : 'General'} • {o.status}{o.ngo?.organizationName ? ` • ${o.ngo.organizationName}` : ''}</p>
              {appliedIds.has(String(o._id))
                ? <p className="text-sm font-bold text-emerald-700">You have applied to this opportunity.</p>
                : <button onClick={() => { setApplyFor(o); setApplyMsg(''); setApplyExp(''); setApplyError('') }} className="px-4 py-2 bg-[#087F70] text-white text-sm font-bold rounded-xl hover:bg-[#183B35]">Apply</button>}
            </article>
          ))}
          {!loading && board.length === 0 && <p className="text-sm text-slate-500 col-span-2">No open opportunities in this filter.</p>}
        </section>

        {mine.length > 0 && (
          <section className="bg-white border rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-[#183B35] mb-2">My applications ({mine.length})</h2>
            {mine.map((a) => (
              <p key={a._id} className="text-sm text-slate-700 py-1 border-b border-slate-100 last:border-0">
                {a.opportunity?.title || 'Opportunity'} — {a.status}{a.hoursContributed ? ` • ${a.hoursContributed} hours contributed` : ''}
              </p>
            ))}
          </section>
        )}

        {user?.role === 'ngo' && (
          <section className="bg-white border rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-[#183B35] mb-2">Post an opportunity</h2>
            <p className="text-xs text-slate-500 mb-3">Only verified NGOs can post — the backend refuses otherwise.</p>
            <form onSubmit={submitCreate} className="grid sm:grid-cols-3 gap-3">
              <input required value={create.title} onChange={(e) => setCreate({ ...create, title: e.target.value })} placeholder="Title" className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm" />
              <input type="number" min="1" required value={create.volunteersNeeded} onChange={(e) => setCreate({ ...create, volunteersNeeded: e.target.value })} placeholder="Volunteers needed" className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm" />
              <button className="py-2.5 bg-[#087F70] text-white text-sm font-bold rounded-xl hover:bg-[#183B35]">Post opportunity</button>
              <textarea required rows={2} value={create.description} onChange={(e) => setCreate({ ...create, description: e.target.value })} placeholder="What will volunteers do?" className="sm:col-span-3 px-3 py-2.5 border border-slate-200 rounded-xl text-sm" />
            </form>
          </section>
        )}

        <section className="bg-white border rounded-2xl p-5 shadow-sm space-y-3">
          <h2 className="font-bold text-[#183B35]">Our Heroes</h2>
          <p className="text-xs text-slate-500">Stories from volunteers. Posting is gated by the backend to people with an Approved or Completed application — if you don't qualify yet, its refusal is shown instead of a fake success.</p>
          {heroes.length === 0 && <p className="text-sm text-slate-500">No stories yet.</p>}
          {heroes.map((h) => (
            <article key={h._id} className="py-2 border-b border-slate-100 last:border-0">
              <p className="text-sm font-bold text-slate-900">{h.title}</p>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{h.story}</p>
              {h.photo && <img src={h.photo} alt="" className="w-40 h-28 object-cover rounded-xl mt-2" loading="lazy" />}
            </article>
          ))}
          <form onSubmit={submitHero} className="space-y-3 border-t border-slate-100 pt-4">
            <input required value={hero.title} onChange={(e) => setHero({ ...hero, title: e.target.value })} placeholder="Story title" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm" />
            <textarea required rows={3} maxLength={2000} value={hero.story} onChange={(e) => setHero({ ...hero, story: e.target.value })} placeholder="Your story (max 2000 characters)" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm" />
            <input type="file" accept="image/*" onChange={(e) => setHeroPhoto(e.target.files[0] || null)} className="w-full text-sm" />
            <button className="px-5 py-2.5 bg-[#087F70] text-white text-sm font-bold rounded-xl hover:bg-[#183B35]">Share story</button>
          </form>
        </section>
      </main>

      {applyFor && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label="Apply to volunteer">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-4">
            <h2 className="font-display text-xl font-bold text-[#183B35]">Apply: {applyFor.title}</h2>
            {applyError && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3">{applyError}</p>}
            <label className="block text-sm font-bold text-slate-700">Why do you want to help? (optional)
              <textarea rows={3} value={applyMsg} onChange={(e) => setApplyMsg(e.target.value)} className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-normal" />
            </label>
            <label className="block text-sm font-bold text-slate-700">Relevant experience (optional)
              <textarea rows={2} value={applyExp} onChange={(e) => setApplyExp(e.target.value)} className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-normal" />
            </label>
            <div className="flex gap-2">
              <button onClick={() => setApplyFor(null)} className="flex-1 py-3 bg-white border border-slate-200 text-sm font-bold rounded-xl hover:bg-slate-50">Cancel</button>
              <button onClick={submitApply} className="flex-1 py-3 bg-[#087F70] text-white text-sm font-bold rounded-xl hover:bg-[#183B35]">Submit application</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
