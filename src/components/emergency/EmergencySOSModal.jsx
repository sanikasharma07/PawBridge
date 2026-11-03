import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router'
import { X, Camera, MapPin, AlertTriangle, LocateFixed } from 'lucide-react'
import API from '@/api/axios'
import { useGeolocation } from '@/hooks/useGeolocation'

// Emergency reporting (Guide §7.3). Three steps, nothing pre-filled:
// 1) photos — optional, at most 3, only files the user actually uploads
//    (no stock photos, no simulated camera); 2) species + description
//    (no severity field — the backend has none); 3) location — device
//    location or manual coordinates, never a guessed city.
// Submitting reports the case only. It does NOT dispatch anyone
// automatically: a verified NGO must accept it first, and the user tracks
// it from the tracker page. Requires sign-in (backend /report is auth-gated).
const SPECIES = ['Dog', 'Cat', 'Cow', 'Bird', 'Horse', 'Other']

export default function EmergencySOSModal({ open, onClose }) {
  const { isAuthenticated } = useSelector((state) => state.auth)
  const { location: geo, error: geoError, isLoading: geoLoading, requestLocation } = useGeolocation()
  const [step, setStep] = useState(1)
  const [photos, setPhotos] = useState([])
  const [species, setSpecies] = useState('')
  const [description, setDescription] = useState('')
  const [manualLat, setManualLat] = useState('')
  const [manualLng, setManualLng] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [createdId, setCreatedId] = useState(null)

  if (!open) return null

  const center = geo || (() => {
    if (manualLat !== '' && manualLng !== '') {
      const lat = Number(manualLat)
      const lng = Number(manualLng)
      if (Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) return { lat, lng }
    }
    return null
  })()

  const close = () => {
    setStep(1); setPhotos([]); setSpecies(''); setDescription('')
    setManualLat(''); setManualLng(''); setError(''); setCreatedId(null); onClose()
  }

  const handleSubmit = async () => {
    if (!center) { setError('Location is required to report an emergency. Please allow location access or enter coordinates.'); return }
    setSubmitting(true)
    setError('')
    try {
      const form = new FormData()
      form.append('species', species)
      form.append('quickDescription', description.trim())
      form.append('longitude', String(center.lng))
      form.append('latitude', String(center.lat))
      photos.slice(0, 3).forEach((f) => form.append('media', f))
      const res = await API.post('/emergency/report', form)
      // The created case id lives in the response data; fall back to the
      // tracker's id lookup only if the shape differs.
      const data = res.data?.data || {}
      setCreatedId(data._id || data.case?._id || null)
      setStep(4)
    } catch (err) {
      setError(err.message || 'Failed to report the emergency.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label="Report an animal emergency">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <h2 className="font-display text-2xl font-bold text-[#183B35]">Report an emergency</h2>
          <button onClick={close} aria-label="Close" className="p-2 rounded-full hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>

        {!isAuthenticated ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-slate-600">Reporting an emergency needs a signed-in account, so the case can be tracked back to you.</p>
            <Link to="/login" onClick={close} className="block text-center px-5 py-3 bg-[#087F70] text-white text-sm font-bold rounded-xl hover:bg-[#183B35]">Sign in to report</Link>
            <p className="text-sm text-slate-500 text-center">No account yet? <Link to="/signup" onClick={close} className="font-bold text-[#087F70]">Create one</Link> — or <Link to="/nearby-ngos" onClick={close} className="font-bold text-[#087F70]">find help nearby without signing in</Link>.</p>
          </div>
        ) : step === 4 ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-slate-700 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              Emergency reported. A verified NGO can now accept it, and you can track it from your dashboard.
              Reporting does not dispatch anyone automatically.
            </p>
            {createdId && (
              <Link to={`/tracker/${createdId}`} onClick={close} className="block text-center px-5 py-3 bg-[#087F70] text-white text-sm font-bold rounded-xl hover:bg-[#183B35]">Track this case</Link>
            )}
            <button onClick={close} className="block w-full text-center px-5 py-3 bg-white border border-slate-200 text-sm font-bold rounded-xl hover:bg-slate-50">Done</button>
          </div>
        ) : (
          <div className="mt-4 space-y-5">
            <p className="text-xs font-bold text-slate-500">Step {step} of 3</p>
            {error && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3 flex gap-2"><AlertTriangle className="w-5 h-5 shrink-0" />{error}</p>}

            {step === 1 && (
              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-700">Photos (optional, up to 3)
                  <span className="mt-1 flex items-center gap-2 px-4 py-3 border border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 font-normal">
                    <Camera className="w-5 h-5 text-slate-400" />
                    {photos.length === 0 ? 'Choose photos of the animal' : `${photos.length} photo${photos.length > 1 ? 's' : ''} selected`}
                    <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => setPhotos(Array.from(e.target.files).slice(0, 3))} />
                  </span>
                </label>
                <p className="text-xs text-slate-500">Only photos you take or upload are attached. No stock photos.</p>
                <button onClick={() => setStep(2)} className="w-full py-3 bg-[#087F70] text-white text-sm font-bold rounded-xl hover:bg-[#183B35]">Continue</button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-bold text-slate-700 mb-2">What animal is it?</p>
                  <div className="flex flex-wrap gap-2">
                    {SPECIES.map((s) => (
                      <button key={s} onClick={() => setSpecies(s)} className={`px-4 py-2 rounded-full text-sm font-bold border ${species === s ? 'bg-[#087F70] text-white border-[#087F70]' : 'bg-white border-slate-200'}`}>{s}</button>
                    ))}
                  </div>
                </div>
                <label className="block text-sm font-bold text-slate-700">What happened?
                  <textarea required rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the animal's condition and where exactly it is…" className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-normal" />
                </label>
                <div className="flex gap-2">
                  <button onClick={() => setStep(1)} className="flex-1 py-3 bg-white border border-slate-200 text-sm font-bold rounded-xl hover:bg-slate-50">Back</button>
                  <button onClick={() => species && description.trim() ? setStep(3) : setError('Please choose a species and describe what happened.')} className="flex-1 py-3 bg-[#087F70] text-white text-sm font-bold rounded-xl hover:bg-[#183B35]">Continue</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <p className="text-sm font-bold text-slate-700 flex items-center gap-1"><MapPin className="w-4 h-4" /> Where is the animal?</p>
                <button onClick={requestLocation} disabled={geoLoading} className="w-full inline-flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 text-sm font-bold rounded-xl hover:bg-slate-50 disabled:opacity-50">
                  <LocateFixed className="w-4 h-4" /> {geoLoading ? 'Locating…' : 'Use my device location'}
                </button>
                {geoError && <p className="text-sm text-rose-600">{geoError}</p>}
                {geo && <p className="text-sm text-emerald-700">Location set: {geo.lat.toFixed(5)}, {geo.lng.toFixed(5)}</p>}
                <div className="grid grid-cols-2 gap-2">
                  <label className="block text-xs font-bold text-slate-700">Latitude
                    <input type="number" step="any" value={manualLat} onChange={(e) => setManualLat(e.target.value)} placeholder="e.g. 25.2138" className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-normal" />
                  </label>
                  <label className="block text-xs font-bold text-slate-700">Longitude
                    <input type="number" step="any" value={manualLng} onChange={(e) => setManualLng(e.target.value)} placeholder="e.g. 75.8648" className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-normal" />
                  </label>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setStep(2)} className="flex-1 py-3 bg-white border border-slate-200 text-sm font-bold rounded-xl hover:bg-slate-50">Back</button>
                  <button onClick={handleSubmit} disabled={submitting || !center} className="flex-1 py-3 bg-[#C96A4A] text-white text-sm font-bold rounded-xl hover:bg-[#183B35] disabled:opacity-50">
                    {submitting ? 'Reporting…' : 'Report emergency'}
                  </button>
                </div>
                {!center && <p className="text-xs text-slate-500">Nothing is pre-filled. The report button stays disabled until a valid location is set.</p>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
