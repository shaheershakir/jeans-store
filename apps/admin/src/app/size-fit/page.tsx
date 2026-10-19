'use client'

import * as React from 'react'
import { Ruler, Save } from 'lucide-react'
import { useAdminStore } from '@/store/admin-store'
import { saveSizeChart } from '@/services/catalog'
import { PageContent, PageHeader } from '@/components/ui/page-header'
import { Button, Card, CardHeader, Field, Input, Select, Textarea } from '@/components/ui/primitives'
import { toastSuccess, toastError } from '@/components/ui/toast'
export default function SizeFitPage() {
  const sizeCharts = useAdminStore((s) => s.data.sizeCharts)
  const categories = useAdminStore((s) => s.data.categories)
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<number>(categories[0]?.id ?? 1)

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId) ?? categories[0]
  const categoryName = selectedCategory?.name ?? 'Category'

  const currentChart = React.useMemo(() => {
    return (
      sizeCharts.find((c) => c.categoryId === selectedCategoryId) ?? {
        categoryId: selectedCategoryId,
        description: `${categoryName} sizing guide and body measurements in inches.`,
        measurements: [
          { size: 'S', waist: 29.5, hip: 37, inseam: 32, thigh: 22.5 },
          { size: 'M', waist: 31.5, hip: 39, inseam: 32, thigh: 23.5 },
          { size: 'L', waist: 33.5, hip: 41, inseam: 32, thigh: 24.5 },
          { size: 'XL', waist: 35.5, hip: 43, inseam: 32, thigh: 25.5 },
          { size: 'XXL', waist: 37.5, hip: 45, inseam: 32, thigh: 26.5 },
        ],
      }
    )
  }, [sizeCharts, selectedCategoryId, categoryName])

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
        categoryId: selectedCategoryId,
        description,
        measurements,
      })
      toastSuccess(`Saved size chart for ${categoryName}.`)
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
        description="Configure measurement standards and category sizing charts displayed to customers"
      />

      <PageContent>
        {/* Select Category */}
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-ink">Select Category:</span>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    selectedCategoryId === cat.id
                      ? 'bg-primary text-white'
                      : 'bg-surface-subtle text-ink-2 hover:bg-surface-subtle/80 hover:text-ink'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Measurements Editor */}
        <Card className="p-5 space-y-4">
          <CardHeader
            title={`${categoryName} Measurements (Inches)`}
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
