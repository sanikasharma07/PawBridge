import React, { Suspense, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import BottomNav from '@/components/common/BottomNav'
import LoginPage, { SessionWatcher } from '@/pages/LoginPage'
import SignupPage from '@/pages/SignupPage'
import NearbyNGOs from '@/pages/NearbyNGOs'
import ActiveRescueTracker from '@/pages/ActiveRescueTracker'
import EmergencySOSModal from '@/components/emergency/EmergencySOSModal'
import NGOOnboarding from '@/pages/NGOOnboarding'
import VetOnboarding from '@/pages/VetOnboarding'
import NGOPublicProfile from '@/pages/NGOPublicProfile'
import NGODashboard from '@/pages/NGODashboard'
import VetDashboard from '@/pages/VetDashboard'
import DonatePage from '@/pages/DonatePage'
import CampaignDetails from '@/pages/CampaignDetails'
import SuppliesPage from '@/pages/SuppliesPage'
import VolunteerHub from '@/pages/VolunteerHub'
import FosterPage from '@/pages/FosterPage'
import UserDashboard from '@/pages/UserDashboard'
import UserImpactProfile from '@/pages/UserImpactProfile'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import ReportPage from '@/pages/ReportPage'

// Phase 1: real auth pages + route guards. Other sections remain honest
// placeholders, replaced phase by phase (Phase 2 Nearby Help, Phase 3
// emergency, and so on). No dead routes: every link in the app points at
// a route in this table (Guide §9).
const Placeholder = ({ title, phase }) => (
  <div className="min-h-screen bg-[#F7F5EF] flex flex-col items-center justify-center p-6 pb-24 md:pb-6 text-center gap-3">
    <h1 className="font-display text-3xl font-bold text-[#183B35]">{title}</h1>
    <p className="text-slate-600 max-w-md">This section is being built in {phase} of the PawBridge rebuild. Nothing here is placeholder data — the real page replaces this screen when its phase lands.</p>
    <Link to="/" className="text-sm font-bold text-[#087F70] hover:underline">Back to home</Link>
  </div>
)

const Page = (title, phase) => () => <Placeholder title={title} phase={phase} />

const LandingPage = Page('PawBridge', 'Phase 8 (design polish)')


function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#F7F5EF] flex flex-col items-center justify-center p-6 text-center gap-3">
      <h1 className="font-display text-3xl font-bold text-[#183B35]">Page not found</h1>
      <p className="text-slate-600">That page does not exist. Try the homepage or Nearby Help instead.</p>
      <div className="flex gap-4">
        <Link to="/" className="text-sm font-bold text-[#087F70] hover:underline">Home</Link>
        <Link to="/nearby-ngos" className="text-sm font-bold text-[#087F70] hover:underline">Nearby Help</Link>
      </div>
    </div>
  )
}

function PageLoader() {
  return (
    <div className="min-h-screen bg-[#F7F5EF] flex items-center justify-center p-6">
      <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full" role="status" aria-label="Loading page" />
    </div>
  )
}

// Bottom navigation is hidden on NGO/vet/admin dashboards, which have
// their own navigation (Guide §9).
function Shell() {
  const location = useLocation()
  const [sosOpen, setSosOpen] = useState(false)
  const hideBottomNav = ['/ngo/dashboard', '/vet/dashboard', '/admin'].some((p) => location.pathname.startsWith(p))
  const hideTopBar = ['/login', '/signup'].some((p) => location.pathname.startsWith(p))
  return (
    <>
      <SessionWatcher />
      {!hideTopBar && (
        <header className="bg-white border-b border-[#DDE9DF] px-4 py-3 sticky top-0 z-30">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
            <Link to="/" className="font-display text-lg font-bold text-[#183B35]">PawBridge</Link>
            <div className="flex items-center gap-3">
              <Link to="/nearby-ngos" className="text-sm font-bold text-[#087F70] hover:underline hidden sm:inline">Nearby Help</Link>
              <button onClick={() => setSosOpen(true)} className="px-4 py-2 bg-[#C96A4A] text-white text-sm font-bold rounded-full hover:bg-[#183B35]">Report emergency</button>
            </div>
          </div>
        </header>
      )}
      <EmergencySOSModal open={sosOpen} onClose={() => setSosOpen(false)} />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/nearby-ngos" element={<NearbyNGOs />} />
          <Route path="/ngo/:id" element={<NGOPublicProfile />} />
          <Route path="/ngo/onboarding" element={<ProtectedRoute allowedRoles={['user', 'ngo']}><NGOOnboarding /></ProtectedRoute>} />
          <Route path="/vet/onboarding" element={<ProtectedRoute allowedRoles={['user', 'vet']}><VetOnboarding /></ProtectedRoute>} />
          <Route path="/campaign/:id" element={<CampaignDetails />} />
          <Route path="/volunteer" element={<VolunteerHub />} />
          <Route path="/donate" element={<DonatePage />} />
          <Route path="/supplies" element={<SuppliesPage />} />
          <Route path="/foster" element={<FosterPage />} />
          <Route path="/adopt" element={<FosterPage />} />
          <Route path="/tracker/:id" element={<ProtectedRoute allowedRoles={['user', 'ngo', 'admin']}><ActiveRescueTracker /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['user']}><UserDashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute allowedRoles={['user', 'ngo', 'vet']}><UserImpactProfile /></ProtectedRoute>} />
          <Route path="/ngo/dashboard/*" element={<ProtectedRoute allowedRoles={['ngo']}><NGODashboard /></ProtectedRoute>} />
          <Route path="/vet/dashboard" element={<ProtectedRoute allowedRoles={['vet']}><VetDashboard /></ProtectedRoute>} />
          <Route path="/admin/*" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/report" element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      {!hideBottomNav && <BottomNav />}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  )
}
