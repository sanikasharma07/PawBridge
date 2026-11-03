import { useState, useEffect, useCallback } from 'react'
import API from '@/api/axios'

// Public Nearby Help (Guide §7.5). Backend contract, verified from
// nearbycontroller.js: GET /nearby/help?lng=&lat=&radiusKm= returns
// { ngos, vets, verified, nonVerified, total, verifiedTotal,
// nonVerifiedTotal, radiusKm, attribution, osmStatus }.
// Verified entries: source "animal_lifeline", registrationStatus
// "Verified on Animal Lifeline", type ngo|vet, name, services, city,
// state, contact {name,email,phone}, latitude, longitude, distanceKm,
// distanceLabel. External entries: type "external", source
// "openstreetmap", registrationStatus "Not registered on Animal
// Lifeline", category, address, contact {phone,website,email},
// latitude/longitude possibly null, distanceKm possibly null with
// distanceLabel "Distance unavailable". No mock fallback: errors surface
// with empty lists.
export function useNearbyHelp(center, radiusKm = 25) {
  const [data, setData] = useState({ verified: [], nonVerified: [], attribution: '', osmStatus: '', total: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchHelp = useCallback(async () => {
    if (!center) return
    setLoading(true)
    setError('')
    try {
      const res = await API.get('/nearby/help', { params: { lat: center.lat, lng: center.lng, radiusKm } })
      const d = res.data?.data || {}
      setData({
        verified: d.verified || [],
        nonVerified: d.nonVerified || [],
        attribution: d.attribution || '',
        osmStatus: d.osmStatus || '',
        total: d.total ?? 0,
      })
    } catch (err) {
      setError(err.message || 'Nearby Help could not be loaded.')
      setData({ verified: [], nonVerified: [], attribution: '', osmStatus: '', total: 0 })
    } finally {
      setLoading(false)
    }
  }, [center?.lat, center?.lng, radiusKm])

  useEffect(() => { fetchHelp() }, [fetchHelp])

  return { ...data, loading, error, refetch: fetchHelp }
}
