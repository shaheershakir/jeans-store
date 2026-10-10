'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, Settings, ShieldCheck, User } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSession } from '@/hooks/use-data'
import { logout } from '@/services/auth'

export function ProfileDropdown() {
  const router = useRouter()
  const session = useSession()

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const initials = session?.userName
    ? session.userName
        .split(' ')
        .map((p) => p[0]?.toUpperCase())
        .slice(0, 2)
        .join('')
    : 'AD'

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold leading-none text-foreground">
              {session?.userName ?? 'Admin'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {session?.userEmail ?? 'admin@teesgarage.in'}
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                {session?.roleName ?? 'Administrator'}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/settings/store" className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Store Settings</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings/users" className="cursor-pointer">
              <ShieldCheck className="mr-2 h-4 w-4" />
              <span>Team & Roles</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={handleLogout}
          className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
