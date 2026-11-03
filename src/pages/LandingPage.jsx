import React from 'react'
import { Link } from 'react-router'
import { useSelector } from 'react-redux'
import { Siren, MapPin, HeartHandshake, HandHeart, PawPrint, ShieldCheck, Bell, FileWarning, ArrowRight } from 'lucide-react'
import { homePathForRole } from '@/store/slices/authSlice'
import heroIllustration from '@/assets/heroIllustration.js'

// Common landing page — the one interface every user type shares
// (citizen, NGO, vet, admin). Role interfaces live on their own
// dashboards; this page is for everyone, signed in or not.
// Styled after the calm editorial reference the user shared: light
// ivory ground, large serif headlines with an italic accent, one warm
// illustration, and honest copy. The illustration is brand artwork —
// it is not a photo of a real animal or rescue, and nothing here claims
// a rescue count, a platform total, or a live dispatch.
const PATHWAYS = [
  { to: '/nearby-ngos', Icon: MapPin, title: 'Find care nearby', text: 'Need a vet or rescue group? Explore verified NGOs and vets, plus external clinics and shelters — clearly labelled.' },
  { to: '/adopt', Icon: PawPrint, title: 'Meet animals waiting for home', text: 'Browse animals ready for foster or adoption from verified NGOs. Every listing shows what the animal actually needs.' },
  { to: '/volunteer', Icon: ShieldCheck, title: 'Give your time', text: 'Help a local shelter do more. Opportunities from verified NGOs, and stories from volunteers on Our Heroes.' },
  { to: '/donate', Icon: HeartHandshake, title: 'Fund a campaign', text: 'Donate to verified NGOs’ campaigns through Razorpay. Sign-in required, because the backend requires it for campaigns.' },
  { to: '/supplies', Icon: HandHeart, title: 'Pledge supplies', text: 'Promise food, medicine or accessories in kind. No payment — the NGO marking your pledge Received is what counts.' },
  { to: '/report', Icon: FileWarning, title: 'Report a problem', text: 'Fake NGOs or campaigns, misleading information, suspicious donations, false emergencies — investigated by admins.' },
]

export default function LandingPage({ onReport }) {
  const { isAuthenticated, user } = useSelector((state) => state.auth)
  return (
    <div className="min-h-screen bg-[#F7F5EF] pb-20 md:pb-6">
      <main>
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-12 grid lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-5">
            <p className="text-xs font-bold tracking-widest uppercase text-[#087F70]">A lifeline for every animal</p>
            <h1 className="font-display text-4xl sm:text-6xl font-bold leading-[1.05] text-[#183B35]">
              Every animal <em className="text-[#087F70]">deserves help.</em>
            </h1>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-lg">
              When an animal is hurt, lost, or simply waiting for a home, small acts of care can change everything.
              PawBridge brings the people, places, and practical actions around animal care into one calmer place.
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={onReport} className="inline-flex items-center gap-2 px-6 py-3 bg-[#C96A4A] text-white text-sm font-bold rounded-full hover:bg-[#183B35]">
                <Siren className="w-4 h-4" /> Report an emergency
              </button>
              <Link to="/nearby-ngos" className="inline-flex items-center gap-2 px-6 py-3 bg-[#183B35] text-white text-sm font-bold rounded-full hover:bg-[#087F70]">
                <MapPin className="w-4 h-4" /> Find nearby help
              </Link>
            </div>
            {isAuthenticated ? (
              <p className="text-sm text-slate-600">
                Signed in as {user?.name || 'you'}. <Link to={homePathForRole(user?.role)} className="font-bold text-[#087F70] hover:underline">Go to your dashboard →</Link>
              </p>
            ) : (
              <p className="text-sm text-slate-600">
                New here? <Link to="/signup" className="font-bold text-[#087F70] hover:underline">Create an account</Link>
                {' '}· Already have one? <Link to="/login" className="font-bold text-[#087F70] hover:underline">Sign in</Link>
                {' '}· Just looking? <Link to="/nearby-ngos" className="font-bold text-[#087F70] hover:underline">Browse Nearby Help without signing in</Link>
              </p>
            )}
            <p className="text-xs text-slate-400">Honest by design · No live rescue claims · Just clear next steps</p>
          </div>
          <div className="rounded-[2rem] overflow-hidden border border-[#DDE9DF] shadow-sm bg-[#DDE9DF]">
            <img src={heroIllustration} alt="Brand illustration of a resting dog being comforted by a gentle hand, surrounded by leaves" className="w-full h-auto block" />
          </div>
        </section>

        {/* How reporting works — the urgent moment, stated plainly */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
          <div className="bg-[#183B35] text-white rounded-[2rem] p-6 sm:p-8 grid md:grid-cols-3 gap-6">
            <div>
              <h2 className="font-display text-2xl font-bold">Designed for the urgent moment</h2>
              <p className="text-sm text-[#DDE9DF] mt-2">Fewer promises. Better next steps. Helpful whether you’re logged in or not.</p>
            </div>
            <ol className="md:col-span-2 space-y-3 text-sm text-[#DDE9DF]">
              <li className="flex gap-3"><span className="font-bold text-white">1.</span> You report the animal — species, what happened, and where it is. Photos are optional.</li>
              <li className="flex gap-3"><span className="font-bold text-white">2.</span> Verified NGOs see the case. One accepts it and starts the rescue.</li>
              <li className="flex gap-3"><span className="font-bold text-white">3.</span> You track each status update as the assigned NGO posts it. Reporting alone does not dispatch anyone automatically, and cases stay private to the reporter, the assigned NGO and admins.</li>
            </ol>
          </div>
        </section>

        {/* A place to begin */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
          <h2 className="font-display text-3xl font-bold text-[#183B35]">There is always <em className="text-[#087F70]">a next right step.</em></h2>
          <p className="text-sm text-slate-500 mt-2 mb-6">Start with what you need today. Every pathway below is a real feature backed by the PawBridge backend — nothing here is a demo or a mock.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PATHWAYS.map(({ to, Icon, title, text }) => (
              <Link key={to} to={to} className="group bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow transition-shadow">
                <span className="w-11 h-11 rounded-2xl bg-[#DDE9DF] flex items-center justify-center text-[#087F70] mb-3"><Icon className="w-5 h-5" /></span>
                <h3 className="font-bold text-slate-900 flex items-center gap-1">{title} <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" /></h3>
                <p className="text-sm text-slate-600 mt-1">{text}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* How we show up */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
          <h2 className="font-display text-3xl font-bold text-[#183B35] mb-6">How we show up</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-6">
              <ShieldCheck className="w-6 h-6 text-[#087F70] mb-3" />
              <h3 className="font-bold text-slate-900">Clear about what’s real</h3>
              <p className="text-sm text-slate-600 mt-1">Verified providers are distinguished from external listings. External OpenStreetMap listings are labelled “Not registered on PawBridge” and can never accept rescues through it.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-3xl p-6">
              <Bell className="w-6 h-6 text-[#087F70] mb-3" />
              <h3 className="font-bold text-slate-900">Kept in the loop</h3>
              <p className="text-sm text-slate-600 mt-1">Once signed in, case updates, donation and pledge news, application decisions and report outcomes arrive as in-app notifications on your dashboard.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-3xl p-6">
              <FileWarning className="w-6 h-6 text-[#087F70] mb-3" />
              <h3 className="font-bold text-slate-900">Accountable, reversibly</h3>
              <p className="text-sm text-slate-600 mt-1">Admins verify NGOs and vets, investigate reports, and moderate with reversible actions — every action recorded in an audit history.</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-6">Nearby Help data: © OpenStreetMap contributors, available under the Open Database License (ODbL). External listings are not verified by PawBridge.</p>
        </section>

        <footer className="border-t border-[#DDE9DF]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-wrap gap-x-6 gap-y-2 justify-between text-xs text-slate-500">
            <p>PawBridge — animal emergency & welfare frontend.</p>
            <p>
              {isAuthenticated
                ? <Link to={homePathForRole(user?.role)} className="font-bold text-[#087F70] hover:underline">My dashboard</Link>
                : <><Link to="/signup" className="font-bold text-[#087F70] hover:underline">Create an account</Link> · <Link to="/login" className="font-bold text-[#087F70] hover:underline">Sign in</Link></>}
              {' '}· Backend: Animal-Lifeline (read-only for this project).
            </p>
          </div>
        </footer>
      </main>
    </div>
  )
}
