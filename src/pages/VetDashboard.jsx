import React, { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router'
import { AlertTriangle, LogOut } from 'lucide-react'
import API from '@/api/axios'
import { logoutUser } from '@/store/slices/authSlice'
import NotificationsPanel from '@/components/common/NotificationsPanel'

// Vet dashboard (Guide §7.10): professional and organised — profile,
// verification status, documents presence, and what a vet can actually
// do. Vets are NOT assigned emergency cases in the backend, and that is
// stated plainly instead of inventing a vet workflow.
export default function VetDashboard() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [missing, setMissing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const res = await API.get('/vets/profile')
        setProfile(res.data?.data)
      } catch (err) {
        if (err.statusCode === 404) setMissing(true)
        else setError(err.message || 'Could not load your vet profile.')
      }
    })()
  }, [])

  const logout = async () => { await dispatch(logoutUser()); navigate('/login', { replace: true }) }

  if (missing) {
    return (
      <div className="min-h-screen bg-[#F7F5EF] flex items-center justify-center p-6">
        <div className="bg-white border rounded-3xl p-8 max-w-md text-center space-y-3 shadow-sm">
          <h1 className="font-display text-2xl font-bold text-[#183B35]">No vet profile yet</h1>
          <p className="text-sm text-slate-600">Create your vet profile first, with your licence and degree documents. An admin must verify it before you appear in Nearby Help.</p>
          <Link to="/vet/onboarding" className="block py-3 bg-[#087F70] text-white text-sm font-bold rounded-xl hover:bg-[#183B35]">Create vet profile</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F5EF] pb-6">
      <main className="max-w-3xl mx-auto p-4 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-[#183B35]">{profile?.clinicName || 'Vet dashboard'}</h1>
            <p className="text-sm text-slate-500">Vet • {profile?.verificationStatus || '…'}</p>
          </div>
          <button onClick={logout} className="inline-flex items-center gap-1 px-4 py-2 bg-white border border-slate-200 text-sm font-bold rounded-xl hover:bg-slate-50"><LogOut className="w-4 h-4" /> Sign out</button>
        </div>
        {error && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3 flex gap-2"><AlertTriangle className="w-5 h-5 shrink-0" />{error}</p>}
        {profile && profile.verificationStatus !== 'verified' && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-2xl p-4">
            Your profile is <strong>{profile.verificationStatus}</strong>
            {profile.rejectionReason ? ` — ${profile.rejectionReason}` : ''}. You appear in Nearby Help only once verified.
            {' '}<Link to="/vet/onboarding" className="font-bold underline">Update profile</Link> (this resets verification to pending).
          </div>
        )}
        {profile && (
          <section className="bg-white border rounded-2xl p-5 shadow-sm space-y-2 text-sm text-slate-700">
            <p><strong>Specialisation:</strong> {profile.specialization}</p>
            <p><strong>Qualifications:</strong> {profile.qualifications}</p>
            <p><strong>Experience:</strong> {profile.yearsExperience} years</p>
            <p><strong>Licence number:</strong> {profile.licenseNumber}</p>
            <p><strong>Services:</strong> {(profile.servicesProvided || []).join(', ') || '—'}</p>
            {profile.clinicPhone && <p><strong>Clinic phone:</strong> {profile.clinicPhone}</p>}
            <p><strong>Address:</strong> {[profile.address?.street, profile.address?.city, profile.address?.state, profile.address?.pinCode].filter(Boolean).join(', ') || '—'}</p>
            <p><strong>Documents:</strong> licence {profile.documents?.licenseCertificate ? 'uploaded' : 'missing'} • degree {profile.documents?.degreeCertificate ? 'uploaded' : 'missing'}</p>
          </section>
        )}
        <NotificationsPanel />
        <section className="bg-white border rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-[#183B35] mb-2">What vets do on PawBridge</h2>
          <p className="text-sm text-slate-600">Verified vets appear in Nearby Help so people nearby can find and contact them. Vets are not assigned emergency cases through the platform — emergency cases are accepted and managed by verified NGOs. You can still report emergencies and track cases you reported.</p>
          <Link to="/nearby-ngos" className="inline-block mt-3 px-4 py-2 bg-[#087F70] text-white text-sm font-bold rounded-xl hover:bg-[#183B35]">See Nearby Help</Link>
        </section>
      </main>
    </div>
  )
}
