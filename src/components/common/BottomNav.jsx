import React from 'react'
import { Link, useLocation } from 'react-router'
import { useSelector } from 'react-redux'
import { Home, MapPin, HeartHandshake, User } from 'lucide-react'
import { homePathForRole } from '@/store/slices/authSlice'

// Mobile bottom navigation, signed-in users only (Guide §9). Dashboards
// have their own navigation, so pages hide this bar themselves by not
// rendering the layout that includes it — see App.jsx: this component is
// only rendered on non-dashboard routes. Home is role-aware.
export default function BottomNav() {
  const { isAuthenticated, user } = useSelector((state) => state.auth)
  const location = useLocation()
  if (!isAuthenticated) return null
  const homePath = homePathForRole(user?.role)
  const items = [
    { to: homePath, label: 'Home', Icon: Home },
    { to: '/nearby-ngos', label: 'Nearby', Icon: MapPin },
    { to: '/donate', label: 'Donate', Icon: HeartHandshake },
    { to: '/profile', label: 'Profile', Icon: User },
  ]
  return (
    <nav aria-label="Primary" className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 md:hidden">
      <div className="grid grid-cols-4">
        {items.map(({ to, label, Icon }) => {
          const active = location.pathname === to
          return (
            <Link key={to} to={to} className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-bold ${active ? 'text-[#087F70]' : 'text-slate-500'}`}>
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
