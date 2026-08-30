'use client'

import * as React from 'react'
import { Save, Truck, Plus } from 'lucide-react'
import { useAdminStore } from '@/store/admin-store'
import { PageContent, PageHeader } from '@/components/ui/page-header'
import { Button, Card, CardHeader, Field, Input } from '@/components/ui/primitives'
import { toastSuccess, toastError } from '@/components/ui/toast'
import { formatINR } from '@/lib/format'

export default function ShippingPage() {
  const settings = useAdminStore((s) => s.data.settings)
  const shippingZones = useAdminStore((s) => s.data.shippingZones)
  const updateSettings = useAdminStore((s) => s.updateSettings)

  const [threshold, setThreshold] = React.useState(settings.freeShippingThreshold)
  const [defaultMethod, setDefaultMethod] = React.useState(settings.defaultShippingMethod)
  const [loading, setLoading] = React.useState(false)

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      updateSettings({
        freeShippingThreshold: Number(threshold),
        defaultShippingMethod: defaultMethod,
      })
      toastSuccess('Shipping configuration saved.')
    } catch (err: any) {
      toastError(err?.message || 'Failed to save shipping settings.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader title="Shipping & Delivery" description="Configure shipping rates, delivery zones, and free shipping thresholds" />

      <PageContent>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* General Rules */}
          <div className="space-y-6 lg:col-span-2">
            <form onSubmit={handleSaveSettings}>
              <Card className="p-5 space-y-4">
                <CardHeader
                  title="Free Shipping & Default Rules"
                  action={
                    <Button type="submit" size="sm" disabled={loading}>
                      <Save className="h-3.5 w-3.5" /> Save Changes
                    </Button>
                  }
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Free Shipping Minimum Order Value (₹)" hint="Orders above this get free express shipping">
                    <Input
                      type="number"
                      value={threshold}
                      onChange={(e) => setThreshold(Number(e.target.value))}
                    />
                  </Field>

                  <Field label="Standard Express Carrier">
                    <Input
                      value={defaultMethod}
                      onChange={(e) => setDefaultMethod(e.target.value)}
                    />
                  </Field>
                </div>
              </Card>
            </form>

            {/* Zones */}
            <Card className="p-5 space-y-4">
              <CardHeader title="Regional Shipping Zones" />

              <div className="space-y-4">
                {shippingZones.map((zone) => (
                  <div key={zone.id} className="rounded-lg border border-line p-4 bg-surface space-y-3">
                    <div className="flex justify-between items-center border-b border-divider pb-2">
                      <div>
                        <h4 className="font-semibold text-xs text-ink">{zone.name}</h4>
                        <p className="text-[11px] text-ink-3">Covering: {zone.regions.join(', ')}</p>
                      </div>
                      <span className="text-xs font-semibold text-primary">
                        Free above {formatINR(zone.freeShippingThreshold)}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {zone.methods.map((method) => (
                        <div key={method.id} className="flex justify-between items-center text-xs py-1">
                          <span className="font-medium text-ink">
                            {method.name} ({method.minDays}–{method.maxDays} days)
                          </span>
                          <span className="tnum font-bold text-ink">
                            {method.rate === 0 ? 'FREE' : formatINR(method.rate)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Logistics Overview */}
          <div className="space-y-6">
            <Card className="p-5 space-y-3">
              <CardHeader title="Courier Partners" />
              <div className="space-y-2 text-xs text-ink-2">
                <div className="flex justify-between py-1 border-b border-divider">
                  <span className="font-medium text-ink">Delhivery Surface</span>
                  <span className="text-success font-semibold">Integrated</span>
                </div>
                <div className="flex justify-between py-1 border-b border-divider">
                  <span className="font-medium text-ink">BlueDart Air Express</span>
                  <span className="text-success font-semibold">Integrated</span>
                </div>
                <div className="flex justify-between py-1 border-b border-divider">
                  <span className="font-medium text-ink">Ecom Express COD</span>
                  <span className="text-success font-semibold">Integrated</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </PageContent>
    </div>
  )
}
