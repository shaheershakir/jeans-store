import type { Metadata } from 'next'
import AccountSidebar from '@/components/AccountSidebar'

export const metadata: Metadata = {
  title: 'My Account — TEESGARAGE',
  description: 'Manage your profile, orders, addresses, and account settings.',
}

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#111111] selection:bg-black selection:text-white pb-20 md:pb-0">
      <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex gap-8 lg:gap-10 max-[860px]:flex-col max-[860px]:gap-6">
          <AccountSidebar />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  )
}
