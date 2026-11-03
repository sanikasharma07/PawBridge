import React from 'react'
import { Link } from 'react-router'
import { Siren, MapPin, HeartHandshake, HandHeart, PawPrint, ShieldCheck, Bell, FileWarning } from 'lucide-react'

// Homepage (Guide §8): the most expressive page, but every claim is
// one the backend supports. No rescue counts, no platform totals, no
// "India's #1" superlatives, no organisation names — the backend has no
// public statistics endpoint. Reporting is described exactly as it
// works: a report becomes visible to verified NGOs, one accepts it, and
// the reporter tracks status updates from there. Nearby Help works
// without signing in; everything else shows an honest sign-in state.
const PATHWAYS = [
  { to: '/nearby-ngos', Icon: MapPin, title: 'Nearby Help', text: 'Verified NGOs and vets near you, plus external clinics and shelters from OpenStreetMap — clearly labelled, no sign-in needed.' },
  { to: '/donate', Icon: HeartHandshake, title: 'Donate', text: 'Fund verified NGOs’ campaigns through Razorpay. Sign-in required, because the backend requires it for campaigns.' },
  { to: '/supplies', Icon: HandHeart, title: 'Pledge supplies', text: 'Promise food, medicine or accessories in kind. No payment — the NGO marking your pledge Received is what counts.' },
  { to: '/volunteer', Icon: ShieldCheck, title: 'Volunteer', text: 'General and emergency-linked opportunities from verified NGOs, plus stories from volunteers on Our Heroes.' },
  { to: '/foster', Icon: PawPrint, title: 'Foster & adopt', text: 'Animals ready for a foster home or a forever home, listed by verified NGOs.' },
  { to: '/report', Icon: FileWarning, title: 'Report a problem', text: 'Fake NGOs or campaigns, misleading information, suspicious donations, false emergencies — investigated by admins.' },
]

export default function LandingPage({ onReport }) {
  return (
    <div className="min-h-screen bg-[#F7F5EF] pb-20 md:pb-6">
      <main>
        <section className="bg-[#183B35] text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20 grid lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-5">
              <p className="text-xs font-bold tracking-widest uppercase text-[#DDE9DF]">Animal emergency & welfare, in one place</p>
              <h1 className="font-display text-4xl sm:text-5xl font-bold leading-tight">When an animal needs help, help should be easy to find.</h1>
              <p className="text-base text-[#DDE9DF] leading-relaxed">
                PawBridge connects citizens, verified NGOs, veterinary professionals, volunteers and donors.
                Report an animal in distress, find verified help nearby, donate to real campaigns, or give your time.
              </p>
              <div className="flex flex-wrap gap-3">
                <button onClick={onReport} className="inline-flex items-center gap-2 px-6 py-3 bg-[#C96A4A] text-white text-sm font-bold rounded-full hover:bg-[#E7A18A] hover:text-[#183B35]">
                  <Siren className="w-4 h-4" /> Report an emergency
                </button>
                <Link to="/nearby-ngos" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#183B35] text-sm font-bold rounded-full hover:bg-[#DDE9DF]">
                  <MapPin className="w-4 h-4" /> Find help nearby
                </Link>
              </div>
              <p className="text-xs text-[#DDE9DF]/80">Reporting needs a sign-in so the case can be tracked back to you. Nearby Help works without signing in.</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-3xl p-6 space-y-4 border border-white/10">
              <h2 className="font-display text-xl font-bold">How reporting works</h2>
              <ol className="space-y-3 text-sm text-[#DDE9DF]">
                <li className="flex gap-3"><span className="font-bold text-white">1.</span> You report the animal — species, what happened, and where it is. Photos are optional.</li>
                <li className="flex gap-3"><span className="font-bold text-white">2.</span> Verified NGOs see the case. One accepts it and starts the rescue.</li>
                <li className="flex gap-3"><span className="font-bold text-white">3.</span> You track each status update as the assigned NGO posts it. Reporting alone does not dispatch anyone automatically.</li>
              </ol>
              <p className="text-xs text-[#DDE9DF]/70">Emergency cases are private: only the reporter, the assigned NGO and admins can view them.</p>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <h2 className="font-display text-2xl font-bold text-[#183B35] mb-1">Ways to help</h2>
          <p className="text-sm text-slate-500 mb-6">Every pathway below is a real feature backed by the PawBridge backend — nothing here is a demo or a mock.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PATHWAYS.map(({ to, Icon, title, text }) => (
              <Link key={to} to={to} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow transition-shadow">
                <span className="w-11 h-11 rounded-2xl bg-[#DDE9DF] flex items-center justify-center text-[#087F70] mb-3"><Icon className="w-5 h-5" /></span>
                <h3 className="font-bold text-slate-900">{title}</h3>
                <p className="text-sm text-slate-600 mt-1">{text}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 grid md:grid-cols-2 gap-6">
            <div>
              <h2 className="font-display text-2xl font-bold text-[#183B35]">Nearby Help, labelled honestly</h2>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Verified providers are NGOs and vets verified by PawBridge. Everything else is an external listing
                discovered through OpenStreetMap — a clinic, shelter or animal organisation that is <strong>not registered
                on PawBridge</strong> and cannot accept rescues through it. The two groups are never mixed, and external
                listings are never shown as verified.
              </p>
            </div>
            <div className="space-y-3 text-sm">
              <p className="flex gap-2"><Bell className="w-5 h-5 shrink-0 text-[#087F70]" /> Signed in? Case updates, donation and pledge news, application decisions and report outcomes arrive as in-app notifications on your dashboard.</p>
              <p className="flex gap-2"><ShieldCheck className="w-5 h-5 shrink-0 text-[#087F70]" /> Admins verify NGOs and vets, investigate reports, and moderate with reversible actions — every action recorded in an audit history.</p>
              <p className="text-xs text-slate-400">Nearby Help data: © OpenStreetMap contributors, available under the Open Database License (ODbL). External listings are not verified by PawBridge.</p>
            </div>
          </div>
        </section>

        <footer className="border-t border-[#DDE9DF]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-wrap gap-x-6 gap-y-2 justify-between text-xs text-slate-500">
            <p>PawBridge — animal emergency & welfare frontend.</p>
            <p>Backend: Animal-Lifeline (read-only for this project). No account yet? Create one to report, donate, pledge and volunteer.</p>
          </div>
        </footer>
      </main>
    </div>
  )
}
