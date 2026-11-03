import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router'
import { AlertTriangle } from 'lucide-react'
import API from '@/api/axios'

// Vet onboarding (Guide §7.10 — this form did not exist in the old
// frontend). POST /vets/profile. Required: specialization, qualifications,
// yearsExperience (0 or more), licenseNumber (unique), clinicName, city,
// state, at least one service, and BOTH documents (license + degree).
// Coordinates are lng/lat, both together or neither. Creating the profile
// flips the user's role to "vet"; listing still requires admin approval,
// and updating later resets verification to pending.
export default function VetOnboarding() {
  const { user } = useSelector((state) => state.auth)
  const [form, setForm] = useState({ specialization: '', qualifications: '', yearsExperience: '', licenseNumber: '', clinicName: '', servicesProvided: '', clinicPhone: '', street: '', city: '', state: '', pinCode: '', lng: '', lat: '' })
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
      if (files.licenseCertificate) data.append('licenseCertificate', files.licenseCertificate)
      if (files.degreeCertificate) data.append('degreeCertificate', files.degreeCertificate)
      await API.post('/vets/profile', data)
      setDone(true)
    } catch (err) {
      setError(err.message || 'Could not save the vet profile.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#F7F5EF] flex items-center justify-center p-6 pb-20 md:pb-6">
        <div className="bg-white border rounded-3xl p-8 max-w-md text-center space-y-3 shadow-sm">
          <h1 className="font-display text-2xl font-bold text-[#183B35]">Profile submitted</h1>
          <p className="text-sm text-slate-600">Your vet profile is pending admin review. It will appear in Nearby Help only once verified.</p>
          <Link to="/vet/dashboard" className="block py-3 bg-[#087F70] text-white text-sm font-bold rounded-xl hover:bg-[#183B35]">Go to vet dashboard</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F5EF] pb-20 md:pb-6">
      <main className="max-w-2xl mx-auto p-4 sm:p-6">
        <h1 className="font-display text-2xl font-bold text-[#183B35]">Register as a vet</h1>
        <p className="text-sm text-slate-600 mt-1">Signed in as {user?.name}. Creating this profile changes your role to vet; an admin must verify it before you appear in Nearby Help.</p>
        {error && <p className="mt-4 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3 flex gap-2"><AlertTriangle className="w-5 h-5 shrink-0" />{error}</p>}
        <form onSubmit={handleSubmit} className="bg-white border rounded-3xl p-6 mt-4 space-y-4 shadow-sm">
          {[
            ['specialization', 'Specialisation *', 'text'],
            ['qualifications', 'Qualifications *', 'text'],
            ['yearsExperience', 'Years of experience *', 'number'],
            ['licenseNumber', 'Licence number *', 'text'],
            ['clinicName', 'Clinic name *', 'text'],
            ['servicesProvided', 'Services provided (comma-separated) *', 'text'],
            ['clinicPhone', 'Clinic phone', 'text'],
            ['street', 'Street', 'text'],
            ['city', 'City *', 'text'],
            ['state', 'State *', 'text'],
            ['pinCode', 'PIN code', 'text'],
            ['lng', 'Longitude (optional, needs latitude too)', 'number'],
            ['lat', 'Latitude (optional, needs longitude too)', 'number'],
          ].map(([key, label, type]) => (
            <label key={key} className="block text-sm font-bold text-slate-700">{label}
              <input type={type} step="any" min={key === 'yearsExperience' ? 0 : undefined} required={label.includes('*')} value={form[key]} onChange={set(key)} className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-normal" />
            </label>
          ))}
          <div className="space-y-3">
            <p className="text-sm font-bold text-slate-700">Documents (both required)</p>
            {[
              ['licenseCertificate', 'Licence certificate *'],
              ['degreeCertificate', 'Degree certificate *'],
            ].map(([key, label]) => (
              <label key={key} className="block text-sm font-bold text-slate-700">{label}
                <input type="file" accept=".jpg,.jpeg,.png,.pdf" required onChange={(e) => setFiles((f) => ({ ...f, [key]: e.target.files[0] }))} className="mt-1 w-full text-sm font-normal" />
              </label>
            ))}
          </div>
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-xl p-3">Saving this form resets verification to pending, even for an existing verified profile.</p>
          <button disabled={submitting} className="w-full py-3 bg-[#087F70] text-white text-sm font-bold rounded-xl hover:bg-[#183B35] disabled:opacity-50">{submitting ? 'Saving…' : 'Submit vet profile'}</button>
        </form>
      </main>
    </div>
  )
}
