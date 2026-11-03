import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router'
import { AlertTriangle } from 'lucide-react'
import API from '@/api/axios'

// NGO onboarding (Guide §7.10). POST /ngo/profile is a combined
// create/update handler: text fields are flat (organizationName,
// registrationNumber, description, street, city, state, pinCode),
// animalsHandled and servicesProvided are comma-separated strings, and
// coordinates are lng/lat — both together or neither. Registration
// certificate and PAN card are required for a new profile; 12A and 80G
// certificates are optional. Any update resets verification to pending,
// and the profile appears in Nearby Help and can accept emergencies only
// once an admin verifies it.
const DOC_FIELDS = [
  { key: 'registrationCertificate', label: 'Registration certificate', required: true },
  { key: 'panCard', label: 'PAN card', required: true },
  { key: 'twelveACertificate', label: '12A certificate (optional)', required: false },
  { key: 'eightyGCertificate', label: '80G certificate (optional)', required: false },
]

export default function NGOOnboarding() {
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  const [form, setForm] = useState({ organizationName: '', registrationNumber: '', description: '', street: '', city: '', state: '', pinCode: '', animalsHandled: '', servicesProvided: '', lng: '', lat: '' })
  const [files, setFiles] = useState({})
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.lng !== '' && form.lat === '' || form.lng === '' && form.lat !== '') {
      setError('Coordinates must be given together: both longitude and latitude, or neither.')
      return
    }
    setSubmitting(true)
    try {
      const data = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v !== '') data.append(k, v) })
      DOC_FIELDS.forEach(({ key }) => { if (files[key]) data.append(key, files[key]) })
      await API.post('/ngo/profile', data)
      setDone(true)
    } catch (err) {
      setError(err.message || 'Could not save the NGO profile.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#F7F5EF] flex items-center justify-center p-6 pb-20 md:pb-6">
        <div className="bg-white border rounded-3xl p-8 max-w-md text-center space-y-3 shadow-sm">
          <h1 className="font-display text-2xl font-bold text-[#183B35]">Profile submitted</h1>
          <p className="text-sm text-slate-600">Your NGO profile is pending admin review. It will appear in Nearby Help and be able to accept emergencies only once verified — there is no fixed review time promised, because the backend gives none.</p>
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-xl p-3">Note: updating this profile later resets verification to pending.</p>
          <Link to="/ngo/dashboard" className="block py-3 bg-[#087F70] text-white text-sm font-bold rounded-xl hover:bg-[#183B35]">Go to NGO dashboard</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F5EF] pb-20 md:pb-6">
      <main className="max-w-2xl mx-auto p-4 sm:p-6">
        <h1 className="font-display text-2xl font-bold text-[#183B35]">Register your NGO</h1>
        <p className="text-sm text-slate-600 mt-1">Signed in as {user?.name}. Creating this profile changes your role to NGO; an admin must verify it before it can accept emergencies.</p>
        {error && <p className="mt-4 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3 flex gap-2"><AlertTriangle className="w-5 h-5 shrink-0" />{error}</p>}
        <form onSubmit={handleSubmit} className="bg-white border rounded-3xl p-6 mt-4 space-y-4 shadow-sm">
          {[
            ['organizationName', 'Organisation name *', 'text'],
            ['registrationNumber', 'Registration number *', 'text'],
            ['description', 'Description *', 'textarea'],
            ['street', 'Street', 'text'],
            ['city', 'City *', 'text'],
            ['state', 'State *', 'text'],
            ['pinCode', 'PIN code', 'text'],
            ['animalsHandled', 'Animals handled (comma-separated)', 'text'],
            ['servicesProvided', 'Services provided (comma-separated)', 'text'],
            ['lng', 'Longitude (optional, needs latitude too)', 'number'],
            ['lat', 'Latitude (optional, needs longitude too)', 'number'],
          ].map(([key, label, type]) => (
            <label key={key} className="block text-sm font-bold text-slate-700">{label}
              {type === 'textarea'
                ? <textarea required={label.includes('*')} rows={3} value={form[key]} onChange={set(key)} className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-normal" />
                : <input type={type} step="any" required={label.includes('*')} value={form[key]} onChange={set(key)} className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-normal" />}
            </label>
          ))}
          <div className="space-y-3">
            <p className="text-sm font-bold text-slate-700">Documents</p>
            <p className="text-xs text-slate-500 -mt-2">Verification is per profile, not per document. Documents already uploaded are kept if you do not re-upload them.</p>
            {DOC_FIELDS.map(({ key, label, required }) => (
              <label key={key} className="block text-sm font-bold text-slate-700">{label}{required ? ' *' : ''}
                <input type="file" accept=".jpg,.jpeg,.png,.pdf" required={required} onChange={(e) => setFiles((f) => ({ ...f, [key]: e.target.files[0] }))} className="mt-1 w-full text-sm font-normal" />
              </label>
            ))}
          </div>
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-xl p-3">Saving this form resets verification to pending, even for an existing verified profile.</p>
          <button disabled={submitting} className="w-full py-3 bg-[#087F70] text-white text-sm font-bold rounded-xl hover:bg-[#183B35] disabled:opacity-50">{submitting ? 'Saving…' : 'Submit NGO profile'}</button>
        </form>
      </main>
    </div>
  )
}
