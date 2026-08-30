'use client'

import * as React from 'react'
import { Save, Building2 } from 'lucide-react'
import { useAdminStore } from '@/store/admin-store'
import { updateSettings } from '@/services/admin'
import { PageContent, PageHeader } from '@/components/ui/page-header'
import { Button, Card, CardHeader, Field, Input, Select, Checkbox } from '@/components/ui/primitives'
import { toastSuccess, toastError } from '@/components/ui/toast'

export default function StoreSettingsPage() {
  const settings = useAdminStore((s) => s.data.settings)

  const [storeName, setStoreName] = React.useState(settings.storeName)
  const [supportEmail, setSupportEmail] = React.useState(settings.supportEmail)
  const [supportPhone, setSupportPhone] = React.useState(settings.supportPhone)
  const [address, setAddress] = React.useState(settings.address)
  const [currency, setCurrency] = React.useState(settings.currency)
  const [taxRate, setTaxRate] = React.useState(settings.taxRate)
  const [orderPrefix, setOrderPrefix] = React.useState(settings.orderPrefix)
  const [returnWindowDays, setReturnWindowDays] = React.useState(settings.returnWindowDays)
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      await updateSettings({
        storeName: storeName.trim(),
        supportEmail: supportEmail.trim(),
        supportPhone: supportPhone.trim(),
        address: address.trim(),
        currency,
        taxRate: Number(taxRate),
        orderPrefix: orderPrefix.trim(),
        returnWindowDays: Number(returnWindowDays),
      })
      toastSuccess('Store settings updated.')
    } catch (err: any) {
      toastError(err?.message || 'Failed to update store settings.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader title="Store Settings" description="General store configuration, contact details, and tax defaults" />

      <PageContent>
        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
          <Card className="p-5 space-y-4">
            <CardHeader
              title="Brand & Support Profile"
              action={
                <Button type="submit" size="sm" disabled={loading}>
                  <Save className="h-3.5 w-3.5" /> Save Settings
                </Button>
              }
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Store Name" required>
                <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} />
              </Field>

              <Field label="Support Email" required>
                <Input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
              </Field>

              <Field label="Support Phone Number" required>
                <Input value={supportPhone} onChange={(e) => setSupportPhone(e.target.value)} />
              </Field>

              <Field label="HQ Address">
                <Input value={address} onChange={(e) => setAddress(e.target.value)} />
              </Field>
            </div>
          </Card>

          <Card className="p-5 space-y-4">
            <CardHeader title="Regional & Policy Settings" />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Store Currency">
                <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                </Select>
              </Field>

              <Field label="GST Tax Rate (%)">
                <Input type="number" step="0.01" value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))} />
              </Field>

              <Field label="Order Prefix">
                <Input value={orderPrefix} onChange={(e) => setOrderPrefix(e.target.value)} />
              </Field>

              <Field label="Return Window (Days)">
                <Input type="number" value={returnWindowDays} onChange={(e) => setReturnWindowDays(Number(e.target.value))} />
              </Field>
            </div>
          </Card>
        </form>
      </PageContent>
    </div>
  )
}
