'use client'

import * as React from 'react'
import Link from 'next/link'
import { Check, MessageSquareQuote, Star, X } from 'lucide-react'
import { useAdminStore } from '@/store/admin-store'
import { setReviewStatus, respondToReview } from '@/services/marketing'
import { PageContent, PageHeader } from '@/components/ui/page-header'
import { Button, Card, Field, Textarea } from '@/components/ui/primitives'
import { ReviewBadge } from '@/components/ui/status'
import { toastSuccess, toastError } from '@/components/ui/toast'
import type { ReviewStatus } from '@/lib/types'

export default function ReviewsPage() {
  const reviews = useAdminStore((s) => s.data.reviews)
  const products = useAdminStore((s) => s.data.products)
  const customers = useAdminStore((s) => s.data.customers)

  const [activeReplyId, setActiveReplyId] = React.useState<number | null>(null)
  const [replyText, setReplyText] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const handleStatus = async (id: number, status: ReviewStatus) => {
    try {
      setLoading(true)
      await setReviewStatus(id, status)
      toastSuccess(`Review #${id} marked as ${status}.`)
    } catch (err: any) {
      toastError(err?.message || 'Failed to update review status.')
    } finally {
      setLoading(false)
    }
  }

  const handleSendReply = async (id: number) => {
    if (!replyText.trim()) return

    try {
      setLoading(true)
      await respondToReview(id, replyText.trim())
      toastSuccess(`Posted merchant reply to review #${id}.`)
      setActiveReplyId(null)
      setReplyText('')
    } catch (err: any) {
      toastError(err?.message || 'Failed to post reply.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader title="Customer Reviews" description="Moderate verified customer reviews and post merchant responses" />

      <PageContent>
        <div className="space-y-4">
          {reviews.map((rev) => {
            const product = products.find((p) => p.id === rev.productId)
            const customer = customers.find((c) => c.id === rev.customerId)

            return (
              <Card key={rev.id} className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${
                              i < rev.rating ? 'fill-current' : 'text-ink-4'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-bold text-xs text-ink">{rev.title}</span>
                      <ReviewBadge status={rev.status} />
                    </div>

                    <p className="mt-1 text-xs text-ink-2">{rev.content}</p>

                    <div className="mt-2 flex items-center gap-3 text-[11px] text-ink-3">
                      <span>By {customer?.name ?? 'Customer'}</span>
                      <span>&bull;</span>
                      <span>
                        Product:{' '}
                        <Link href={`/products/${rev.productId}`} className="font-medium text-primary hover:underline">
                          {product?.name ?? `Product #${rev.productId}`}
                        </Link>
                      </span>
                      <span>&bull;</span>
                      <span>{new Date(rev.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {rev.status !== 'Approved' && (
                      <Button size="sm" onClick={() => handleStatus(rev.id, 'Approved')} disabled={loading}>
                        Approve
                      </Button>
                    )}
                    {rev.status !== 'Rejected' && (
                      <Button variant="danger-outline" size="sm" onClick={() => handleStatus(rev.id, 'Rejected')} disabled={loading}>
                        Reject
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setActiveReplyId(activeReplyId === rev.id ? null : rev.id)
                        setReplyText(rev.response ?? '')
                      }}
                    >
                      Reply
                    </Button>
                  </div>
                </div>

                {/* Reply Form / Response Box */}
                {rev.response && activeReplyId !== rev.id && (
                  <div className="rounded-lg bg-surface-subtle p-3 text-xs border-l-2 border-primary space-y-1">
                    <p className="font-semibold text-primary">Merchant Official Response:</p>
                    <p className="text-ink-2">{rev.response}</p>
                  </div>
                )}

                {activeReplyId === rev.id && (
                  <div className="pt-2 space-y-2 border-t border-divider">
                    <Field label="Post Merchant Response">
                      <Textarea
                        rows={2}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Thank customer or clarify details..."
                      />
                    </Field>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setActiveReplyId(null)}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={() => handleSendReply(rev.id)} disabled={loading}>
                        Save Response
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      </PageContent>
    </div>
  )
}
