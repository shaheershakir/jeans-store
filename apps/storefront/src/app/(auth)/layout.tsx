'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import AuthVisualPanel from '@/components/AuthVisualPanel'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center p-3 sm:p-4 lg:p-5 xl:p-6">
      <div className="w-full max-w-[1360px] min-h-[calc(100vh-2rem)] grid grid-cols-1 lg:grid-cols-[1.14fr_0.86fr] gap-6 lg:gap-10 xl:gap-14 items-center">
        {/* Left Column: Visual Panel with 3 Sunlit Photos (10s auto-rotate) */}
        <div className="w-full h-full">
          <AuthVisualPanel mode={pathname === '/register' ? 'signup' : 'signin'} />
        </div>

        {/* Right Column: Clean Form Keyed by pathname for smooth page transition */}
        <div
          key={pathname}
          className="w-full flex flex-col justify-start items-start pt-4 sm:pt-6 lg:pt-10 xl:pt-12 pb-8 px-2 sm:px-4 lg:px-4 xl:px-6 animate-auth-stagger-1"
        >
          <div className="w-full max-w-[420px]">{children}</div>
        </div>
      </div>
    </div>
  )
}
