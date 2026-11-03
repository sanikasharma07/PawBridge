import React from 'react'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router'
import { homePathForRole } from '@/store/slices/authSlice'

// Route guard (Guide §4). Not signed in → /login. Signed in with the
// wrong role → that role's own dashboard, never a redirect loop (the old
// frontend bounced vets to the user dashboard forever).
export default function ProtectedRoute({ allowedRoles, children }) {
  const { isAuthenticated, user } = useSelector((state) => state.auth)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to={homePathForRole(user?.role)} replace />
  }
  return children
}
