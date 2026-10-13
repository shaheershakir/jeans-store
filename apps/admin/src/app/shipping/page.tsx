'use client'

import * as React from 'react'
import { Calculator, Save, Truck } from 'lucide-react'
import { apiFetch } from '@/services/api'
import { PageContent, PageHeader } from '@/components/ui/page-header'
import { Button, Card, CardHeader, Field, Input } from '@/components/ui/primitives'
import { toastError, toastSuccess } from '@/components/ui/toast'
import { formatINR } from '@/lib/format'

interface WeightRate {
  baseWeightGrams: number
  baseCharge: number
  additionalWeightGrams: number
  additionalCharge: number
}

interface ShippingRates {
  kerala: WeightRate
  restOfIndia: WeightRate
}

const DEFAULT_RATES: ShippingRates = {
  kerala: { baseWeightGrams: 500, baseCharge: 60, additionalWeightGrams: 500, additionalCharge: 20 },
  restOfIndia: { baseWeightGrams: 500, baseCharge: 90, additionalWeightGrams: 500, additionalCharge: 30 },
}

function chargeFor(weight: number, rate: WeightRate) {
  return rate.baseCharge + Math.ceil(Math.max(0, weight - rate.baseWeightGrams) / rate.additionalWeightGrams) * rate.additionalCharge
}

export default function ShippingPage() {
  const [rates, setRates] = React.useState<ShippingRates>(DEFAULT_RATES)
  const [sampleWeight, setSampleWeight] = React.useState(1000)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let active = true
    void apiFetch<{ rates: ShippingRates }>('/api/shipping/rates')
      .then((result) => { if (active) setRates(result.rates) })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : 'Could not load delivery rates.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const setRate = (zone: keyof ShippingRates, key: keyof WeightRate, value: number) => {
    setRates((current) => ({ ...current, [zone]: { ...current[zone], [key]: value } }))
  }

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if ([...Object.values(rates.kerala), ...Object.values(rates.restOfIndia)].some((value) => !Number.isInteger(value) || value < 1)) {
      toastError('Every weight band and delivery charge must be a positive whole number.')
      return
    }
    try {
      setSaving(true)
      const result = await apiFetch<{ rates: ShippingRates }>('/api/admin/shipping/rates', { method: 'PUT', body: JSON.stringify(rates) })
      setRates(result.rates)
      setError(null)
      toastSuccess('Paid delivery rates saved.')
    } catch (reason) {
      toastError(reason instanceof Error ? reason.message : 'Could not save delivery rates.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader title="Delivery charges" description="Configure paid, weight-based delivery for Kerala and the rest of India." />
      <PageContent>
        <form onSubmit={save} className="space-y-5">
          <Card className="space-y-5 p-5">
            <CardHeader title="Weight-based delivery rates" subtitle="The base charge covers the first weight band. Each started additional band adds its configured charge." action={<Button type="submit" size="sm" disabled={saving || loading}><Save className="h-4 w-4" />{saving ? 'Saving…' : 'Save rates'}</Button>} />
            {error && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
            {loading ? <p className="py-6 text-center text-sm text-muted-foreground">Loading saved rates…</p> : <div className="grid gap-5 lg:grid-cols-2">
              <RateEditor title="Kerala" description="Orders delivered within Kerala." value={rates.kerala} onChange={(key, value) => setRate('kerala', key, value)} />
              <RateEditor title="Outside Kerala" description="All other Indian delivery states." value={rates.restOfIndia} onChange={(key, value) => setRate('restOfIndia', key, value)} />
            </div>}
            <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
              <Truck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-muted-foreground">Delivery is always charged. The checkout calculates the shipment weight from product quantities and applies these rates on the server; customers cannot override the fee.</p>
            </div>
          </Card>

          <Card className="space-y-4 p-5">
            <CardHeader title="Rate preview" subtitle="Check the delivery fee for a sample cart weight." />
            <div className="grid gap-5 md:grid-cols-[220px_1fr_1fr] md:items-end">
              <Field label="Sample cart weight (grams)"><Input min={1} max={100000} type="number" value={sampleWeight} onChange={(event) => setSampleWeight(Math.max(1, Number(event.target.value)))} /></Field>
              <Preview title="Kerala" amount={chargeFor(sampleWeight, rates.kerala)} />
              <Preview title="Outside Kerala" amount={chargeFor(sampleWeight, rates.restOfIndia)} />
            </div>
          </Card>
        </form>
      </PageContent>
    </div>
  )
}

function RateEditor({ title, description, value, onChange }: { title: string; description: string; value: WeightRate; onChange: (key: keyof WeightRate, value: number) => void }) {
  return (
    <section className="space-y-4 rounded-xl border border-border p-4">
      <div><h2 className="text-sm font-semibold">{title}</h2><p className="mt-1 text-xs text-muted-foreground">{description}</p></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Base weight (grams)"><Input min={1} type="number" value={value.baseWeightGrams} onChange={(event) => onChange('baseWeightGrams', Number(event.target.value))} /></Field>
        <Field label="Base delivery charge (₹)"><Input min={1} type="number" value={value.baseCharge} onChange={(event) => onChange('baseCharge', Number(event.target.value))} /></Field>
        <Field label="Each additional band (grams)"><Input min={1} type="number" value={value.additionalWeightGrams} onChange={(event) => onChange('additionalWeightGrams', Number(event.target.value))} /></Field>
        <Field label="Charge per additional band (₹)"><Input min={1} type="number" value={value.additionalCharge} onChange={(event) => onChange('additionalCharge', Number(event.target.value))} /></Field>
      </div>
      <p className="border-t border-border pt-3 text-xs text-muted-foreground">{formatINR(value.baseCharge)} for up to {value.baseWeightGrams} g, then {formatINR(value.additionalCharge)} per started {value.additionalWeightGrams} g.</p>
    </section>
  )
}

function Preview({ title, amount }: { title: string; amount: number }) {
  return <div className="flex items-center gap-3 rounded-lg bg-muted/60 p-4"><Calculator className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">{title}</p><p className="text-lg font-semibold tabular-nums">{formatINR(amount)}</p></div></div>
}
