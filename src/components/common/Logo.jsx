import React from 'react'
import { Link } from 'react-router'
import { PawPrint } from 'lucide-react'

// PawBridge logo: a paw mark in a teal rounded square + the wordmark.
// One component everywhere (top bar, landing, login/signup) so the brand
// is identical on the common landing page and inside every role interface.
export function LogoMark({ size = 36 }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-2xl bg-[#087F70] text-white shrink-0"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <PawPrint style={{ width: size * 0.55, height: size * 0.55 }} />
    </span>
  )
}

export default function Logo({ size = 36, dark = false }) {
  return (
    <Link to="/" className="inline-flex items-center gap-2" aria-label="PawBridge home">
      <LogoMark size={size} />
      <span className={`font-display font-bold leading-none ${dark ? 'text-white' : 'text-[#183B35]'}`} style={{ fontSize: size * 0.55 }}>
        PawBridge
      </span>
    </Link>
  )
}
