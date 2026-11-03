import { useState, useCallback } from 'react'

// Device location with NO silent fallback. Substituting one city's
// coordinates for the user's real location would send rescuers and
// nearby results to the wrong place. On failure the caller must let the
// user enter a location manually.
export function useGeolocation() {
  const [location, setLocation] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser. Please enter your location manually.')
      return
    }
    setIsLoading(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({ lat: position.coords.latitude, lng: position.coords.longitude })
        setError(null)
        setIsLoading(false)
      },
      (err) => {
        setError(`${err.message}. Please enter your location manually instead.`)
        setIsLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    )
  }, [])

  return { location, error, isLoading, requestLocation }
}
