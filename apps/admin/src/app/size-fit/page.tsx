'use client'

import * as React from 'react'
import { Ruler, Save } from 'lucide-react'
import { useAdminStore } from '@/store/admin-store'
import { saveSizeChart } from '@/services/catalog'
import { PageContent, PageHeader } from '@/components/ui/page-header'
import { Button, Card, CardHeader, Field, Input, Select, Textarea } from '@/components/ui/primitives'
import { toastSuccess, toastError } from '@/components/ui/toast'
import type { Fit, SizeChart } from '@/lib/types'

const FITS: Fit[] = ['Straight', 'Skinny', 'Slim', 'Relaxed', 'Bootcut']

export default function SizeFitPage() {
  const sizeCharts = useAdminStore((s) => s.data.sizeCharts)
  const [selectedFit, setSelectedFit] = React.useState<Fit>('Straight')

  const currentChart = React.useMemo(() => {
    return (
      sizeCharts.find((c) => c.fit === selectedFit) ?? {
        fit: selectedFit,
        description: `${selectedFit} fit sizing guide and body measurements in inches.`,
        measurements: [
          { size: 28, waist: 29.5, hip: 37, inseam: 32, thigh: 22.5 },
          { size: 30, waist: 31.5, hip: 39, inseam: 32, thigh: 23.5 },
          { size: 32, waist: 33.5, hip: 41, inseam: 32, thigh: 24.5 },
          { size: 34, waist: 35.5, hip: 43, inseam: 32, thigh: 25.5 },
          { size: 36, waist: 37.5, hip: 45, inseam: 32, thigh: 26.5 },
        ],
      }
    )
  }, [sizeCharts, selectedFit])

  const [description, setDescription] = React.useState(currentChart.description)
  const [measurements, setMeasurements] = React.useState(currentChart.measurements)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    setDescription(currentChart.description)
    setMeasurements(currentChart.measurements)
  }, [currentChart])

  const updateMeasurement = (idx: number, key: keyof (typeof measurements)[0], val: number) => {
    const next = [...measurements]
    next[idx] = { ...next[idx], [key]: val }
    setMeasurements(next)
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      await saveSizeChart({
        fit: selectedFit,
        description,
        measurements,
      })
      toastSuccess(`Saved size chart for ${selectedFit} fit.`)
    } catch (err: any) {
      toastError(err?.message || 'Failed to save size chart.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Size & Fit Guide"
        description="Configure measurement standards and fit sizing charts displayed to customers"
      />

      <PageContent>
        {/* Select Fit */}
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-ink">Select Fit Type:</span>
            <div className="flex gap-2">
              {FITS.map((fit) => (
                <button
                  key={fit}
                  onClick={() => setSelectedFit(fit)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    selectedFit === fit
                      ? 'bg-primary text-white'
                      : 'bg-surface-subtle text-ink-2 hover:bg-surface-subtle/80 hover:text-ink'
                  }`}
                >
                  {fit} Fit
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Measurements Editor */}
        <Card className="p-5 space-y-4">
          <CardHeader
            title={`${selectedFit} Fit Measurements (Inches)`}
            action={
              <Button size="sm" onClick={handleSave} disabled={loading}>
                <Save className="h-3.5 w-3.5" /> Save Chart
              </Button>
            }
          />

          <Field label="Fit Description & Sizing Advice">
            <Textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-divider bg-surface-subtle text-ink-3">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Waist Size</th>
                  <th className="px-4 py-2.5 font-semibold">Waist Circumference</th>
                  <th className="px-4 py-2.5 font-semibold">Hip Circumference</th>
                  <th className="px-4 py-2.5 font-semibold">Inseam Length</th>
                  <th className="px-4 py-2.5 font-semibold">Thigh Width</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {measurements.map((m, idx) => (
                  <tr key={idx} className="hover:bg-surface-subtle">
                    <td className="px-4 py-2 font-bold text-ink w-28">W{m.size}</td>
                    <td className="px-4 py-2 w-36">
                      <Input
                        type="number"
                        step="0.5"
                        value={m.waist}
                        onChange={(e) => updateMeasurement(idx, 'waist', Number(e.target.value))}
                      />
                    </td>
                    <td className="px-4 py-2 w-36">
                      <Input
                        type="number"
                        step="0.5"
                        value={m.hip}
                        onChange={(e) => updateMeasurement(idx, 'hip', Number(e.target.value))}
                      />
                    </td>
                    <td className="px-4 py-2 w-36">
                      <Input
                        type="number"
                        step="0.5"
                        value={m.inseam}
                        onChange={(e) => updateMeasurement(idx, 'inseam', Number(e.target.value))}
                      />
                    </td>
                    <td className="px-4 py-2 w-36">
                      <Input
                        type="number"
                        step="0.5"
                        value={m.thigh}
                        onChange={(e) => updateMeasurement(idx, 'thigh', Number(e.target.value))}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </PageContent>
    </div>
  )
}
