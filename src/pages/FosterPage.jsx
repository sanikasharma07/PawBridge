import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { AlertTriangle, PawPrint } from 'lucide-react'
import API from '@/api/axios'
import AuthRequiredState from '@/components/common/AuthRequiredState'

// Foster & adoption (Guide §7.8). GET /animals/available returns only
// animals with status "Available for Foster" or "Available for Adoption"
// (and not admin-removed). Real fields only: name, species, breed, age,
// description, medicalHistory, media[], status. There is no
// gender/vaccinated/sterilised/city field in the backend, so none is
// shown. Apply: POST /animals/:id/apply with exactly
// { applicationType: "Foster" | "Adoption", experience, homeEnvironment }
// — both text fields are required, and duplicates are refused by the
// backend. Favourites are a local-only toggle, never presented as a
// backend feature.
const SPECIES_FILTERS = ['All', 'Dog', 'Cat', 'Bird', 'Cattle', 'Other']
const STATUS_FILTERS = ['All', 'Available for Foster', 'Available for Adoption']

export default function FosterPage() {
  const { isAuthenticated } = useSelector((state) => state.auth)
  const [animals, setAnimals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [speciesFilter, setSpeciesFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [favourites, setFavourites] = useState(() => new Set())
  const [applyFor, setApplyFor] = useState(null)
  const [applyType, setApplyType] = useState('Foster')
  const [experience, setExperience] = useState('')
  const [homeEnvironment, setHomeEnvironment] = useState('')
  const [applyError, setApplyError] = useState('')

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return }
    API.get('/animals/available')
      .then((res) => setAnimals(res.data?.data || []))
      .catch((err) => setError(err.message || 'Could not load available animals.'))
      .finally(() => setLoading(false))
  }, [isAuthenticated])

  const submitApply = async () => {
    setApplyError('')
    try {
      await API.post(`/animals/${applyFor._id}/apply`, { applicationType: applyType, experience, homeEnvironment })
      setNotice(`Your ${applyType.toLowerCase()} application was submitted. The NGO will review it.`)
      setApplyFor(null); setExperience(''); setHomeEnvironment('')
    } catch (err) {
      setApplyError(err.message || 'Could not submit the application.')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F7F5EF] p-6 pb-20 md:pb-6 flex items-start justify-center">
        <div className="w-full max-w-lg pt-10"><AuthRequiredState title="Sign in to foster or adopt" message="Available animals need a signed-in account, because the backend requires authentication for the list." /></div>
      </div>
    )
  }

  const filtered = animals.filter((a) =>
    (speciesFilter === 'All' || a.species === speciesFilter) &&
    (statusFilter === 'All' || a.status === statusFilter),
  )

  return (
    <div className="min-h-screen bg-[#F7F5EF] pb-20 md:pb-6">
      <main className="max-w-5xl mx-auto p-4 sm:p-6 space-y-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#183B35]">Foster & adoption</h1>
          <p className="text-sm text-slate-600 mt-1">Animals ready for a foster home or a forever home, listed by verified NGOs.</p>
        </div>
        {notice && <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-3">{notice}</p>}
        {error && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3 flex gap-2"><AlertTriangle className="w-5 h-5 shrink-0" />{error}</p>}
        <div className="flex flex-wrap gap-2">
          {SPECIES_FILTERS.map((s) => (
            <button key={s} onClick={() => setSpeciesFilter(s)} className={`px-3 py-1.5 rounded-full text-xs font-bold ${speciesFilter === s ? 'bg-[#087F70] text-white' : 'bg-white border border-slate-200'}`}>{s}</button>
          ))}
          <span className="w-px bg-slate-200 mx-1" />
          {STATUS_FILTERS.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-full text-xs font-bold ${statusFilter === s ? 'bg-[#183B35] text-white' : 'bg-white border border-slate-200'}`}>{s}</button>
          ))}
        </div>
        {loading && <p className="text-sm text-slate-500">Loading animals…</p>}
        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((a) => (
            <article key={a._id} className="bg-white border rounded-2xl overflow-hidden shadow-sm">
              {a.media?.[0]
                ? <img src={a.media[0]} alt={a.name} className="w-full h-44 object-cover" loading="lazy" />
                : <div className="w-full h-44 bg-[#DDE9DF] flex items-center justify-center text-[#087F70]"><PawPrint className="w-10 h-10" /></div>}
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-bold text-slate-900">{a.name}</h2>
                  <button
                    aria-label={favourites.has(a._id) ? 'Remove from favourites (saved on this device only)' : 'Save as favourite (on this device only)'}
                    onClick={() => setFavourites((f) => { const n = new Set(f); n.has(a._id) ? n.delete(a._id) : n.add(a._id); return n })}
                    className="text-lg leading-none"
                  >{favourites.has(a._id) ? '♥' : '♡'}</button>
                </div>
                <p className="text-sm text-slate-600">{a.species}{a.breed && a.breed !== 'Unknown' ? ` • ${a.breed}` : ''}{a.age ? ` • ${a.age}` : ''}</p>
                <p className="text-xs font-bold text-emerald-700">{a.status}</p>
                <p className="text-sm text-slate-600 line-clamp-3">{a.description}</p>
                {a.medicalHistory && <p className="text-xs text-slate-500">Medical history: {a.medicalHistory}</p>}
                <button onClick={() => { setApplyFor(a); setApplyType(a.status === 'Available for Adoption' ? 'Adoption' : 'Foster'); setExperience(''); setHomeEnvironment(''); setApplyError('') }} className="w-full py-2.5 bg-[#087F70] text-white text-sm font-bold rounded-xl hover:bg-[#183B35]">Apply to {a.status === 'Available for Adoption' ? 'adopt' : 'foster'}</button>
              </div>
            </article>
          ))}
          {!loading && filtered.length === 0 && <p className="text-sm text-slate-500 col-span-3">No animals match these filters right now.</p>}
        </section>
      </main>

      {applyFor && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label="Apply to foster or adopt">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-4">
            <h2 className="font-display text-xl font-bold text-[#183B35]">Apply for {applyFor.name}</h2>
            {applyError && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3">{applyError}</p>}
            <div className="flex gap-2">
              {['Foster', 'Adoption'].map((t) => (
                <button key={t} onClick={() => setApplyType(t)} className={`flex-1 py-2 rounded-full text-sm font-bold ${applyType === t ? 'bg-[#087F70] text-white' : 'bg-white border border-slate-200'}`}>{t}</button>
              ))}
            </div>
            <label className="block text-sm font-bold text-slate-700">Your experience with animals *
              <textarea required rows={3} value={experience} onChange={(e) => setExperience(e.target.value)} className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-normal" />
            </label>
            <label className="block text-sm font-bold text-slate-700">Your home environment *
              <textarea required rows={3} value={homeEnvironment} onChange={(e) => setHomeEnvironment(e.target.value)} className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-normal" />
            </label>
            <div className="flex gap-2">
              <button onClick={() => setApplyFor(null)} className="flex-1 py-3 bg-white border border-slate-200 text-sm font-bold rounded-xl hover:bg-slate-50">Cancel</button>
              <button onClick={submitApply} disabled={!experience.trim() || !homeEnvironment.trim()} className="flex-1 py-3 bg-[#087F70] text-white text-sm font-bold rounded-xl hover:bg-[#183B35] disabled:opacity-50">Submit application</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
