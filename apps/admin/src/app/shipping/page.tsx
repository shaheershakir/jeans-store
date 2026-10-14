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
  estimatedDaysMin?: number
  estimatedDaysMax?: number
  exactDeliveryDate?: string
}

interface ShippingRates {
  kerala: WeightRate
  restOfIndia: WeightRate
}

const DEFAULT_RATES: ShippingRates = {
  kerala: {
    baseWeightGrams: 500,
    baseCharge: 60,
    additionalWeightGrams: 500,
    additionalCharge: 20,
    estimatedDaysMin: 2,
    estimatedDaysMax: 5,
    exactDeliveryDate: ''
  },
  restOfIndia: {
    baseWeightGrams: 500,
    baseCharge: 90,
    additionalWeightGrams: 500,
    additionalCharge: 30,
    estimatedDaysMin: 7,
    estimatedDaysMax: 14,
    exactDeliveryDate: ''
  },
}

function chargeFor(weight: number, rate: WeightRate) {
  return rate.baseCharge + Math.ceil(Math.max(0, weight - rate.baseWeightGrams) / rate.additionalWeightGrams) * rate.additionalCharge
}

function formatDeliveryRange(minDays = 2, maxDays = 5, exact?: string): string {
  if (exact && exact.trim()) return exact.trim()
  const now = new Date()
  const minDate = new Date(now.getTime() + minDays * 86400000)
  const maxDate = new Date(now.getTime() + maxDays * 86400000)
  const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  return `${fmt(minDate)} – ${fmt(maxDate)}`
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
      .then((result) => {
        if (active && result.rates) {
          setRates({
            kerala: {
              ...DEFAULT_RATES.kerala,
              ...result.rates.kerala,
              estimatedDaysMin: result.rates.kerala.estimatedDaysMin ?? 2,
              estimatedDaysMax: result.rates.kerala.estimatedDaysMax ?? 5,
              exactDeliveryDate: result.rates.kerala.exactDeliveryDate ?? ''
            },
            restOfIndia: {
              ...DEFAULT_RATES.restOfIndia,
              ...result.rates.restOfIndia,
              estimatedDaysMin: result.rates.restOfIndia.estimatedDaysMin ?? 7,
              estimatedDaysMax: result.rates.restOfIndia.estimatedDaysMax ?? 14,
              exactDeliveryDate: result.rates.restOfIndia.exactDeliveryDate ?? ''
            }
          })
        }
      })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : 'Could not load delivery rates.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const setRateField = <K extends keyof WeightRate>(zone: keyof ShippingRates, key: K, value: WeightRate[K]) => {
    setRates((current) => ({ ...current, [zone]: { ...current[zone], [key]: value } }))
  }

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    const numericKeys: Array<keyof WeightRate> = ['baseWeightGrams', 'baseCharge', 'additionalWeightGrams', 'additionalCharge']
    const hasInvalidNumeric = numericKeys.some(
      (k) => !Number.isInteger(rates.kerala[k]) || (rates.kerala[k] as number) < 1 ||
             !Number.isInteger(rates.restOfIndia[k]) || (rates.restOfIndia[k] as number) < 1
    )
    if (hasInvalidNumeric) {
      toastError('Every weight band and delivery charge must be a positive whole number.')
      return
    }
    try {
      setSaving(true)
      const result = await apiFetch<{ rates: ShippingRates }>('/api/admin/shipping/rates', { method: 'PUT', body: JSON.stringify(rates) })
      setRates(result.rates)
      setError(null)
      toastSuccess('Delivery charges and estimation timelines saved.')
    } catch (reason) {
      toastError(reason instanceof Error ? reason.message : 'Could not save delivery rates.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader title="Delivery charges & estimation" description="Configure paid delivery fees and customer delivery timelines for Kerala and outside Kerala." />
      <PageContent>
        <form onSubmit={save} className="space-y-5">
          <Card className="space-y-5 p-5">
            <CardHeader title="Weight-based delivery rates & estimation" subtitle="Base charge covers initial weight band. Delivery estimations sync directly with customer checkout." action={<Button type="submit" size="sm" disabled={saving || loading}><Save className="h-4 w-4" />{saving ? 'Saving…' : 'Save rates'}</Button>} />
            {error && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
            {loading ? <p className="py-6 text-center text-sm text-muted-foreground">Loading saved rates…</p> : <div className="grid gap-5 lg:grid-cols-2">
              <RateEditor title="Kerala" description="Orders delivered within Kerala (Default: 2–5 days)." value={rates.kerala} onChange={(key, value) => setRateField('kerala', key, value)} />
              <RateEditor title="Outside Kerala" description="All other Indian states (Default: 1–2 weeks / 7–14 days)." value={rates.restOfIndia} onChange={(key, value) => setRateField('restOfIndia', key, value)} />
            </div>}
            <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
              <Truck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-muted-foreground">Delivery fees and estimated delivery dates sync in real-time with customer checkout. Changing days or specifying an exact date override immediately updates what customers see on checkout.</p>
            </div>
          </Card>

          <Card className="space-y-4 p-5">
            <CardHeader title="Rate & timeline preview" subtitle="Check the delivery fee and customer estimation for a sample cart weight." />
            <div className="grid gap-5 md:grid-cols-[220px_1fr_1fr] md:items-end">
              <Field label="Sample cart weight (grams)"><Input min={1} max={100000} type="number" value={sampleWeight} onChange={(event) => setSampleWeight(Math.max(1, Number(event.target.value)))} /></Field>
              <Preview title="Kerala" amount={chargeFor(sampleWeight, rates.kerala)} timeline={formatDeliveryRange(rates.kerala.estimatedDaysMin, rates.kerala.estimatedDaysMax, rates.kerala.exactDeliveryDate)} />
              <Preview title="Outside Kerala" amount={chargeFor(sampleWeight, rates.restOfIndia)} timeline={formatDeliveryRange(rates.restOfIndia.estimatedDaysMin, rates.restOfIndia.estimatedDaysMax, rates.restOfIndia.exactDeliveryDate)} />
            </div>
          </Card>
        </form>
      </PageContent>
    </div>
  )
}

function RateEditor({
  title,
  description,
  value,
  onChange
}: {
  title: string
  description: string
  value: WeightRate
  onChange: <K extends keyof WeightRate>(key: K, value: WeightRate[K]) => void
}) {
  const minDays = value.estimatedDaysMin ?? 2
  const maxDays = value.estimatedDaysMax ?? 5
  const formattedLive = formatDeliveryRange(minDays, maxDays, value.exactDeliveryDate)

  return (
    <section className="space-y-4 rounded-xl border border-border p-4">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Base weight (grams)"><Input min={1} type="number" value={value.baseWeightGrams} onChange={(event) => onChange('baseWeightGrams', Number(event.target.value))} /></Field>
        <Field label="Base delivery charge (₹)"><Input min={1} type="number" value={value.baseCharge} onChange={(event) => onChange('baseCharge', Number(event.target.value))} /></Field>
        <Field label="Each additional band (grams)"><Input min={1} type="number" value={value.additionalWeightGrams} onChange={(event) => onChange('additionalWeightGrams', Number(event.target.value))} /></Field>
        <Field label="Charge per additional band (₹)"><Input min={1} type="number" value={value.additionalCharge} onChange={(event) => onChange('additionalCharge', Number(event.target.value))} /></Field>
      </div>

      <div className="border-t border-border pt-3">
        <h3 className="text-xs font-semibold text-foreground mb-2">Delivery Estimation Window</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Min Days"><Input min={1} max={60} type="number" value={minDays} onChange={(event) => onChange('estimatedDaysMin', Math.max(1, Number(event.target.value)))} /></Field>
          <Field label="Max Days"><Input min={1} max={90} type="number" value={maxDays} onChange={(event) => onChange('estimatedDaysMax', Math.max(1, Number(event.target.value)))} /></Field>
        </div>
        <div className="mt-2">
          <Field label="Exact Date / Override (Optional)"><Input type="text" placeholder="e.g. 16 Oct 2026 - 21 Oct 2026" value={value.exactDeliveryDate ?? ''} onChange={(event) => onChange('exactDeliveryDate', event.target.value)} /></Field>
        </div>
        <p className="mt-2 text-xs font-medium text-emerald-600">
          Checkout shows: <strong>{formattedLive}</strong>
        </p>
      </div>

      <p className="border-t border-border pt-3 text-xs text-muted-foreground">{formatINR(value.baseCharge)} for up to {value.baseWeightGrams} g, then {formatINR(value.additionalCharge)} per started {value.additionalWeightGrams} g.</p>
    </section>
  )
}

function Preview({ title, amount, timeline }: { title: string; amount: number; timeline: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-muted/60 p-4">
      <Calculator className="h-4 w-4 text-muted-foreground shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="text-lg font-semibold tabular-nums">{formatINR(amount)}</p>
        <p className="text-xs text-primary font-medium mt-0.5">{timeline}</p>
      </div>
    </div>
  )
}

