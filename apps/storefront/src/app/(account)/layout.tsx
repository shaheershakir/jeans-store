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
    <div className="min-h-screen bg-[#FAF9F6] text-[#111111] selection:bg-black selection:text-white">
      <div className="mx-auto max-w-[1240px] px-6 lg:px-8 py-10 max-[768px]:py-6">
        <div className="flex gap-10 lg:gap-14 max-[860px]:flex-col max-[860px]:gap-6">
          <AccountSidebar />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  )
}
