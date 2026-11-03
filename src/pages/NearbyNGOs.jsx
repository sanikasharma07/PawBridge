import React, { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { MapPin, Phone, Globe, Navigation, ShieldCheck, AlertTriangle, Search, LocateFixed } from 'lucide-react'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useNearbyHelp } from '@/hooks/useNearbyHelp'

// Nearby Help — the only fully public feature (Guide §7.5).
// Location first: no invented map centre. Until the user grants device
// location or enters manual coordinates, the map area is an explanatory
// placeholder, not a map centred on a guessed city.
// Verified vs external are separate sections with distinct badges and
// colours. External entries never link to a platform profile and never
// offer rescue actions. Distance-less entries say "Distance
// unavailable" — distances are never invented. Directions and map
// actions are hidden when coordinates are null.
function dotIcon(color, selected) {
  return L.divIcon({
    className: '',
    html: `<div style="width:${selected ? 28 : 20}px;height:${selected ? 28 : 20}px;border-radius:9999px;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:11px;">${selected ? '●' : ''}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })
}

function FocusOn({ center, selected }) {
  const map = useMap()
  useEffect(() => {
    if (selected?.latitude != null && selected?.longitude != null) {
      map.flyTo([selected.latitude, selected.longitude], Math.max(map.getZoom(), 13), { duration: 0.6 })
    } else if (center) {
      map.flyTo([center.lat, center.lng], 12, { duration: 0.6 })
    }
  }, [map, center, selected])
  return null
}

function ResourceCard({ entry, selected, onSelect }) {
  const verified = entry.source === 'animal_lifeline'
  const hasCoords = entry.latitude != null && entry.longitude != null
  const directionsUrl = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${entry.latitude},${entry.longitude}`
    : null
  return (
    <article
      onClick={() => onSelect(entry)}
      className={`cursor-pointer text-left w-full bg-white border rounded-2xl p-4 shadow-sm hover:shadow transition-all ${selected ? 'border-[#087F70] ring-2 ring-[#087F70]/30' : 'border-slate-200'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold text-slate-900 leading-snug">{entry.name}</h3>
        <span className={`shrink-0 text-[11px] font-bold px-2 py-1 rounded-full ${verified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
          {verified ? 'Verified' : 'Not registered'}
        </span>
      </div>
      <p className="text-xs text-slate-500 mt-1">
        {verified ? 'Verified on PawBridge' : 'Not registered on PawBridge'}
        {entry.type === 'vet' ? ' • Veterinary professional' : entry.type === 'ngo' ? ' • NGO' : entry.category ? ` • ${entry.category}` : ''}
      </p>
      {(entry.city || entry.state || entry.address) && (
        <p className="text-sm text-slate-600 mt-2 flex items-start gap-1">
          <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{[entry.address, entry.city, entry.state].filter(Boolean).join(', ')}</span>
        </p>
      )}
      <p className="text-sm font-semibold text-[#183B35] mt-1">{entry.distanceLabel || 'Distance unavailable'}</p>
      {!verified && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5 mt-2">
          This listing cannot accept rescues through PawBridge. Contact it directly using the details below.
        </p>
      )}
      {(entry.services || []).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {entry.services.slice(0, 6).map((s) => (
            <span key={s} className="text-xs px-2 py-1 bg-slate-100 rounded-full">{s}</span>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
        {entry.contact?.phone && (
          <a href={`tel:${entry.contact.phone}`} className="inline-flex items-center gap-1 text-xs font-bold px-3 py-2 bg-[#087F70] text-white rounded-full hover:bg-[#183B35]">
            <Phone className="w-3.5 h-3.5" /> Call
          </a>
        )}
        {entry.contact?.website && (
          <a href={entry.contact.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold px-3 py-2 bg-white border border-slate-200 rounded-full hover:bg-slate-50">
            <Globe className="w-3.5 h-3.5" /> Website
          </a>
        )}
        {directionsUrl && (
          <a href={directionsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold px-3 py-2 bg-white border border-slate-200 rounded-full hover:bg-slate-50">
            <Navigation className="w-3.5 h-3.5" /> Directions
          </a>
        )}
        {verified && entry.type === 'ngo' && (
          <Link to={`/ngo/${entry.id}`} className="inline-flex items-center gap-1 text-xs font-bold px-3 py-2 bg-white border border-slate-200 rounded-full hover:bg-slate-50">
            View profile
          </Link>
        )}
      </div>
      {entry.contact?.email && <p className="text-xs text-slate-500 mt-2">{entry.contact.email}</p>}
    </article>
  )
}

export default function NearbyNGOs() {
  const { location: geo, error: geoError, isLoading: geoLoading, requestLocation } = useGeolocation()
  const [manualLat, setManualLat] = useState('')
  const [manualLng, setManualLng] = useState('')
  const [manualError, setManualError] = useState('')
  const [radiusKm, setRadiusKm] = useState(25)
  const [group, setGroup] = useState('all')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)

  const center = useMemo(() => {
    if (geo) return geo
    if (manualLat !== '' && manualLng !== '') {
      const lat = Number(manualLat)
      const lng = Number(manualLng)
      if (Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng }
      }
    }
    return null
  }, [geo, manualLat, manualLng])

  const { verified, nonVerified, attribution, osmStatus, loading, error } = useNearbyHelp(center, radiusKm)

  const applyManual = () => {
    const lat = Number(manualLat)
    const lng = Number(manualLng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setManualError('Enter a valid latitude (−90 to 90) and longitude (−180 to 180).')
      return
    }
    setManualError('')
    setSelected(null)
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const match = (e) => {
      if (!q) return true
      return [e.name, e.city, e.state, e.address, e.category, ...(e.services || [])].filter(Boolean).join(' ').toLowerCase().includes(q)
    }
    const v = verified.filter(match)
    const nv = nonVerified.filter(match)
    if (group === 'verified') return { verified: v, nonVerified: [] }
    if (group === 'external') return { verified: [], nonVerified: nv }
    return { verified: v, nonVerified: nv }
  }, [verified, nonVerified, group, query])

  const mapEntries = [...filtered.verified, ...filtered.nonVerified].filter((e) => e.latitude != null && e.longitude != null)

  return (
    <div className="min-h-screen bg-[#F7F5EF] pb-20 md:pb-6">
      <header className="bg-white border-b border-[#DDE9DF] px-4 sm:px-6 py-4 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-[#183B35]">Nearby Help</h1>
            <p className="text-sm text-slate-500">Verified PawBridge providers and external clinics & shelters near you — no sign-in needed.</p>
          </div>
          <Link to="/" className="text-sm font-bold text-[#087F70] hover:underline">← PawBridge home</Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 sm:p-6 space-y-5">
        {!center && (
          <section className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="font-bold text-[#183B35]">Where should we look?</h2>
            <p className="text-sm text-slate-600">Nearby Help needs a location to search from. Nothing is pre-filled — use your device location or enter coordinates yourself.</p>
            <button onClick={requestLocation} disabled={geoLoading} className="inline-flex items-center gap-2 px-5 py-3 bg-[#087F70] text-white text-sm font-bold rounded-xl hover:bg-[#183B35] disabled:opacity-50">
              <LocateFixed className="w-4 h-4" /> {geoLoading ? 'Locating…' : 'Use my device location'}
            </button>
            {geoError && <p className="text-sm text-rose-600">{geoError}</p>}
            <div className="grid grid-cols-2 gap-2 max-w-md">
              <label className="block text-xs font-bold text-slate-700">Latitude (−90 to 90)
                <input type="number" step="any" min="-90" max="90" value={manualLat} onChange={(e) => setManualLat(e.target.value)} placeholder="e.g. 25.2138" className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-normal" />
              </label>
              <label className="block text-xs font-bold text-slate-700">Longitude (−180 to 180)
                <input type="number" step="any" min="-180" max="180" value={manualLng} onChange={(e) => setManualLng(e.target.value)} placeholder="e.g. 75.8648" className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-normal" />
              </label>
            </div>
            {manualError && <p className="text-sm text-rose-600">{manualError}</p>}
            <button onClick={applyManual} className="px-5 py-2.5 bg-white border border-slate-200 text-sm font-bold rounded-xl hover:bg-slate-50">Search this location</button>
          </section>
        )}

        {center && (
          <>
            <section className="bg-white border rounded-2xl p-4 shadow-sm flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2 bg-slate-100 rounded-full p-1">
                {[
                  { key: 'all', label: `All (${verified.length + nonVerified.length})` },
                  { key: 'verified', label: `Verified (${verified.length})` },
                  { key: 'external', label: `Not registered (${nonVerified.length})` },
                ].map((g) => (
                  <button key={g.key} onClick={() => setGroup(g.key)} className={`px-3 py-2.5 rounded-full text-xs font-bold ${group === g.key ? 'bg-[#087F70] text-white' : 'text-slate-600'}`}>{g.label}</button>
                ))}
              </div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700">Radius
                <input type="range" min="5" max="100" value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))} className="accent-[#087F70]" />
                <span className="text-[#087F70]">{radiusKm} km</span>
              </label>
              <label className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, city, service…" className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm" />
              </label>
              <button onClick={requestLocation} className="text-xs font-bold text-[#087F70] hover:underline">Use device location instead</button>
            </section>

            {osmStatus === 'unavailable' && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-2xl p-4 flex gap-2">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>External listings are temporarily unavailable — only verified resources are shown right now.</span>
              </div>
            )}
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-2xl p-4 flex gap-2">
                <AlertTriangle className="w-5 h-5 shrink-0" /><span>{error} No organisations are shown from stored or invented data.</span>
              </div>
            )}

            <div className="grid lg:grid-cols-2 gap-5 items-start">
              <section className="bg-white border rounded-2xl overflow-hidden shadow-sm sticky top-24">
                <div className="h-[420px] lg:h-[560px] w-full">
                  <MapContainer center={[center.lat, center.lng]} zoom={12} scrollWheelZoom className="h-full w-full" attributionControl>
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <FocusOn center={center} selected={selected} />
                    <Marker position={[center.lat, center.lng]} icon={dotIcon('#183B35', false)}>
                      <Popup>Your search location</Popup>
                    </Marker>
                    {mapEntries.map((e) => (
                      <Marker
                        key={e.id}
                        position={[e.latitude, e.longitude]}
                        icon={dotIcon(e.source === 'animal_lifeline' ? '#087F70' : '#C96A4A', selected?.id === e.id)}
                        eventHandlers={{ click: () => setSelected(e) }}
                      >
                        <Popup>
                          <strong>{e.name}</strong><br />
                          {e.source === 'animal_lifeline' ? 'Verified on PawBridge' : 'Not registered on PawBridge'} • {e.distanceLabel}
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
                <p className="text-xs text-slate-400 px-4 py-2">Teal markers: verified providers. Coral markers: external listings. Dark marker: your search location.</p>
              </section>

              <section className="space-y-5">
                {loading && <p className="text-sm text-slate-500">Loading nearby resources…</p>}
                {!loading && filtered.verified.length === 0 && filtered.nonVerified.length === 0 && !error && (
                  <div className="bg-white border rounded-2xl p-6 text-center">
                    <p className="font-bold text-slate-900">No resources in this radius</p>
                    <p className="text-sm text-slate-500 mt-1">Try widening the radius or searching a different location.</p>
                  </div>
                )}
                {filtered.verified.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="font-bold text-[#183B35] flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-[#087F70]" /> Verified on PawBridge ({filtered.verified.length})</h2>
                    {filtered.verified.map((e) => (
                      <ResourceCard key={e.id} entry={e} selected={selected?.id === e.id} onSelect={setSelected} />
                    ))}
                  </div>
                )}
                {filtered.nonVerified.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="font-bold text-[#183B35]">Not registered on PawBridge ({filtered.nonVerified.length})</h2>
                    <p className="text-xs text-slate-500 -mt-1">External NGOs, veterinary clinics and animal shelters discovered through OpenStreetMap. They are not verified by PawBridge.</p>
                    {filtered.nonVerified.map((e) => (
                      <ResourceCard key={e.id} entry={e} selected={selected?.id === e.id} onSelect={setSelected} />
                    ))}
                  </div>
                )}
                {attribution && <p className="text-xs text-slate-400">{attribution}</p>}
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
