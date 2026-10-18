'use client'

import { useEffect, useRef } from 'react'

/**
 * app/template.tsx — Page-level transition wrapper (Task 3).
 *
 * Each route change mounts a new <Template>. We use CSS @starting-style
 * for modern browsers and a useEffect-based data-mounted pattern as fallback.
 * Only opacity + translateY are animated — no layout shift.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  // data-mounted fallback for browsers that don't support @starting-style
  useEffect(() => {
    if (ref.current) {
      ref.current.setAttribute('data-mounted', 'true')
    }
  }, [])

  return (
    <div ref={ref} className="page-transition-wrapper">
      {children}
    </div>
  )
}
