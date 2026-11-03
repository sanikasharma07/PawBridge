import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router'
import { useSelector } from 'react-redux'
import { AlertTriangle } from 'lucide-react'
import API from '@/api/axios'
import AuthRequiredState from '@/components/common/AuthRequiredState'
import { formatCurrency } from '@/lib/utils'

// Campaign detail (Guide §7.6). GET /donations/campaigns/:id strips
// donors, so donor counts are not shown or invented. The Donate button
// goes to /donate for Active campaigns; finished campaigns show their
// real status. Impact proof renders only when the NGO uploaded it.
export default function CampaignDetails() {
  const { id } = useParams()
  const { isAuthenticated } = useSelector((state) => state.auth)
  const [campaign, setCampaign] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return }
    API.get(`/donations/campaigns/${id}`)
      .then((res) => setCampaign(res.data?.data))
      .catch((err) => setError(err.message || 'Could not load this campaign.'))
      .finally(() => setLoading(false))
  }, [id, isAuthenticated])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F7F5EF] p-6 pb-20 md:pb-6 flex items-start justify-center">
        <div className="w-full max-w-lg pt-10"><AuthRequiredState title="Sign in to view campaign details" message="Campaign details need a signed-in account, because the backend requires authentication for them." /></div>
      </div>
    )
  }
  if (loading) return <div className="min-h-screen bg-[#F7F5EF] flex items-center justify-center p-6"><p className="text-slate-500 text-sm">Loading campaign…</p></div>
  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-[#F7F5EF] flex items-center justify-center p-6">
        <div className="bg-white border rounded-2xl p-6 max-w-md text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
          <h1 className="font-display text-xl font-bold text-[#183B35]">Campaign not found</h1>
          <p className="text-sm text-slate-600">{error}</p>
          <Link to="/donate" className="text-sm font-bold text-[#087F70] hover:underline">Browse active campaigns</Link>
        </div>
      </div>
    )
  }

  const pct = campaign.targetAmount ? Math.min(100, Math.round(((campaign.raisedAmount || 0) / campaign.targetAmount) * 100)) : 0

  return (
    <div className="min-h-screen bg-[#F7F5EF] pb-20 md:pb-6">
      <main className="max-w-3xl mx-auto p-4 sm:p-6 space-y-5">
        <div>
          <Link to="/donate" className="text-sm font-bold text-[#087F70] hover:underline">← All campaigns</Link>
          <h1 className="font-display text-2xl font-bold text-[#183B35] mt-2">{campaign.title}</h1>
          <p className="text-sm text-slate-500">{campaign.status}{campaign.ngo?.organizationName ? ` • by ${campaign.ngo.organizationName}` : ''} • <Link to={`/report?targetType=DonationCampaign&targetId=${campaign._id}`} className="font-bold text-[#087F70] hover:underline">Report this campaign</Link></p>
          <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">{campaign.description}</p>
        </div>
        <section className="bg-white border rounded-2xl p-5 shadow-sm space-y-2">
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-[#087F70]" style={{ width: `${pct}%` }} /></div>
          <p className="text-sm text-slate-600">{formatCurrency(campaign.raisedAmount || 0)} raised of {formatCurrency(campaign.targetAmount)} • {pct}%</p>
          <p className="text-xs text-slate-400">Donor names are hidden by the backend on this page.</p>
          {campaign.status === 'Active'
            ? <Link to="/donate" className="inline-block mt-2 px-5 py-2.5 bg-[#087F70] text-white text-sm font-bold rounded-xl hover:bg-[#183B35]">Donate to this campaign</Link>
            : <p className="text-sm text-slate-500 mt-2">This campaign is {campaign.status} and is no longer accepting donations.</p>}
        </section>
        {campaign.impact && (campaign.impact.message || (campaign.impact.photos || []).length > 0) && (
          <section className="bg-white border rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-[#183B35] mb-2">Impact update from the NGO</h2>
            {campaign.impact.message && <p className="text-sm text-slate-700 whitespace-pre-wrap">{campaign.impact.message}</p>}
            {(campaign.impact.photos || []).length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                {campaign.impact.photos.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer"><img src={url} alt={`Impact photo ${i + 1}`} className="w-full h-32 object-cover rounded-xl" loading="lazy" /></a>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}
