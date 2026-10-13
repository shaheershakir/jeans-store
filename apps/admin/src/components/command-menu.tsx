'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Laptop,
  Moon,
  Package,
  ShoppingCart,
  Sun,
  Users,
} from 'lucide-react'
import { useSearch } from '@/context/search-provider'
import { useTheme } from '@/context/theme-provider'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { ScrollArea } from '@/components/ui/scroll-area'
import { NAV_GROUPS } from '@/components/layout/nav'
import { useAdminStore } from '@/store/admin-store'

export function CommandMenu() {
  const router = useRouter()
  const { setTheme } = useTheme()
  const { open, setOpen } = useSearch()

  const products = useAdminStore((s) => s.data.products)
  const orders = useAdminStore((s) => s.data.orders)
  const customers = useAdminStore((s) => s.data.customers)

  const runCommand = React.useCallback(
    (command: () => unknown) => {
      setOpen(false)
      command()
    },
    [setOpen]
  )

  return (
    <CommandDialog modal open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <ScrollArea className="h-80 pe-1">
          <CommandEmpty>No results found.</CommandEmpty>

          {/* Navigation Groups */}
          {NAV_GROUPS.map((group, idx) => (
            <CommandGroup key={group.label || `group-${idx}`} heading={group.label || 'General'}>
              {group.items.map((item) => {
                const Icon = item.icon
                return (
                  <CommandItem
                    key={item.href}
                    value={`${group.label || ''} ${item.label}`}
                    onSelect={() => {
                      runCommand(() => router.push(item.href))
                    }}
                  >
                    <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{item.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          ))}

          {/* Quick Products Search */}
          {products.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Recent Products">
                {products.slice(0, 5).map((p) => (
                  <CommandItem
                    key={p.id}
                    value={`product ${p.name} ${p.sku}`}
                    onSelect={() => {
                      runCommand(() => router.push(`/products/${p.id}`))
                    }}
                  >
                    <Package className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{p.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{p.sku}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {/* Quick Orders Search */}
          {orders.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Recent Orders">
                {orders.slice(0, 5).map((o) => (
                  <CommandItem
                    key={o.id}
                    value={`order ${o.number} ${o.shippingAddress?.city || ''}`}
                    onSelect={() => {
                      runCommand(() => router.push(`/orders/${o.id}`))
                    }}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{o.number}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      ₹{o.total.toLocaleString('en-IN')}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {/* Theme switcher */}
          <CommandSeparator />
          <CommandGroup heading="Theme">
            <CommandItem onSelect={() => runCommand(() => setTheme('light'))}>
              <Sun className="mr-2 h-4 w-4" /> <span>Light Mode</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme('dark'))}>
              <Moon className="mr-2 h-4 w-4" /> <span>Dark Mode</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme('system'))}>
              <Laptop className="mr-2 h-4 w-4" /> <span>System Preference</span>
            </CommandItem>
          </CommandGroup>
        </ScrollArea>
      </CommandList>
    </CommandDialog>
  )
}
