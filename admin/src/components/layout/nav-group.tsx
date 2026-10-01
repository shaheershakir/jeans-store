'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { NavItem, NavGroup as NavGroupProps } from './nav'
import { useSession } from '@/hooks/use-data'

export function NavGroup({ label, items, perm }: NavGroupProps) {
  const { state, isMobile } = useSidebar()
  const pathname = usePathname()
  const session = useSession()

  const hasPerm = (p?: string) => {
    if (!p) return true
    if (!session) return false
    return session.permissions.includes(p)
  }

  if (!hasPerm(perm)) return null

  const allowedItems = items.filter((item) => hasPerm(item.perm))
  if (allowedItems.length === 0) return null

  return (
    <SidebarGroup>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarMenu>
        {allowedItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <SidebarMenuLink
              key={item.href}
              item={item}
              isActive={isActive}
            />
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

function SidebarMenuLink({
  item,
  isActive,
}: {
  item: NavItem
  isActive: boolean
}) {
  const { setOpenMobile } = useSidebar()
  const Icon = item.icon

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={item.label}
        className={isActive ? 'font-semibold text-primary' : ''}
      >
        <Link href={item.href} onClick={() => setOpenMobile(false)}>
          <Icon className="h-4 w-4 shrink-0" />
          <span className="truncate">{item.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
