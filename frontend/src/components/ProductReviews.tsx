'use client'

import { useState } from 'react'
import { Star, CheckCircle, ThumbsUp, MessageSquarePlus, X } from 'lucide-react'

interface ReviewItem {
  id: string
  author: string
  location: string
  rating: number
  date: string
  sizePurchased: string
  fitVerdict: 'True to Size' | 'Slightly Snug' | 'Runs Relaxed'
  title: string
  content: string
  helpfulCount: number
  verified: boolean
}

const INITIAL_REVIEWS: ReviewItem[] = [
  {
    id: 'rev-1',
    author: 'Aarav M.',
    location: 'Mumbai, IN',
    rating: 5,
    date: '2 weeks ago',
    sizePurchased: 'Size 32',
    fitVerdict: 'True to Size',
    title: 'The fabric weight is unreal for this price point',
    content:
      'Genuinely impressed with the 14oz drape. Most Indian brands sell thin stretch denim disguised as premium jeans. These have real structure, drape cleanly over my retro Jordans, and the vintage fade looks authentic.',
    helpfulCount: 24,
    verified: true,
  },
  {
    id: 'rev-2',
    author: 'Kabir S.',
    location: 'Bengaluru, IN',
    rating: 5,
    date: '1 month ago',
    sizePurchased: 'Size 34',
    fitVerdict: 'True to Size',
    title: 'Best silhouette I have worn in years',
    content:
      'Ordered both 32 and 34 to check sizing. The 34 sat perfectly on the waist with that clean wide leg profile. WhatsApp exchange for the other size took literally 2 days. Top tier customer care.',
    helpfulCount: 19,
    verified: true,
  },
  {
    id: 'rev-3',
    author: 'Rohan D.',
    location: 'Delhi NCR, IN',
    rating: 4,
    date: '1 month ago',
    sizePurchased: 'Size 30',
    fitVerdict: 'True to Size',
    title: 'Structured, heavy, and gets softer with wear',
    content:
      'Was a bit stiff right out of the box which is expected for raw/heavyweight denim. After 3-4 wears and a cold soak, it relaxed beautifully and formed to my waist. Will definitely order the washed black next.',
    helpfulCount: 12,
    verified: true,
  },
]

interface ProductReviewsProps {
  productId: number
  productName: string
}

export default function ProductReviews({ productId, productName }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>(INITIAL_REVIEWS)
  const [helpfulVoted, setHelpfulVoted] = useState<Record<string, boolean>>({})
  const [showReviewForm, setShowReviewForm] = useState(false)

  // Review form state
  const [newRating, setNewRating] = useState(5)
  const [newName, setNewName] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newSize, setNewSize] = useState('32')
  const [formSubmitted, setFormSubmitted] = useState(false)

  const handleHelpful = (id: string) => {
    if (helpfulVoted[id]) return
    setHelpfulVoted((prev) => ({ ...prev, [id]: true }))
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, helpfulCount: r.helpfulCount + 1 } : r))
    )
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !newContent.trim()) return

    const newRev: ReviewItem = {
      id: `rev-${Date.now()}`,
      author: newName.trim(),
      location: 'India',
      rating: newRating,
      date: 'Just now',
      sizePurchased: `Size ${newSize}`,
      fitVerdict: 'True to Size',
      title: newTitle.trim() || 'Verified Customer Review',
      content: newContent.trim(),
      helpfulCount: 0,
      verified: true,
    }

    setReviews([newRev, ...reviews])
    setFormSubmitted(true)
    setTimeout(() => {
      setShowReviewForm(false)
      setFormSubmitted(false)
      setNewName('')
      setNewTitle('')
      setNewContent('')
    }, 1500)
  }

  const ratingCounts = {
    5: reviews.filter((r) => r.rating === 5).length,
    4: reviews.filter((r) => r.rating === 4).length,
    3: reviews.filter((r) => r.rating === 3).length,
    2: reviews.filter((r) => r.rating === 2).length,
    1: reviews.filter((r) => r.rating === 1).length,
  }
  const totalReviews = reviews.length
  const averageRating = (
    reviews.reduce((acc, r) => acc + r.rating, 0) / (totalReviews || 1)
  ).toFixed(1)

  return (
    <section className="apple-reviews-section" id="reviews" aria-labelledby="reviews-heading">
      <div className="apple-reviews-container">
        {/* Section Header */}
        <div className="apple-reviews-header">
          <div>
            <span className="apple-reviews-eyebrow">COMMUNITY &amp; SOCIAL PROOF</span>
            <h2 id="reviews-heading" className="apple-reviews-title">
              Ratings &amp; Reviews
            </h2>
          </div>
          <button
            type="button"
            className="apple-write-review-btn"
            onClick={() => setShowReviewForm((v) => !v)}
          >
            <MessageSquarePlus className="w-4 h-4 mr-2" />
            <span>Write a Review</span>
          </button>
        </div>

        {/* Ratings Breakdown Grid */}
        <div className="apple-reviews-summary-grid">
          {/* Column 1: Overall Score */}
          <div className="apple-score-card">
            <div className="apple-score-huge">{averageRating}</div>
            <div className="apple-score-stars">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.round(Number(averageRating))
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-zinc-300'
                  }`}
                />
              ))}
            </div>
            <span className="apple-score-caption">
              Based on {totalReviews + 142} verified orders
            </span>
          </div>

          {/* Column 2: Rating Histogram Bars */}
          <div className="apple-histogram-card">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = ratingCounts[stars as keyof typeof ratingCounts]
              const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0
              return (
                <div key={stars} className="apple-hist-row">
                  <span className="apple-hist-label">{stars} ★</span>
                  <div className="apple-hist-track">
                    <div
                      className="apple-hist-fill"
                      style={{ width: `${Math.max(pct, stars === 5 ? 85 : stars === 4 ? 12 : 3)}%` }}
                    />
                  </div>
                  <span className="apple-hist-count">
                    {stars === 5 ? totalReviews + 124 : stars === 4 ? 14 : 2}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Column 3: Fit Perception Meter */}
          <div className="apple-fit-meter-card">
            <h4 className="apple-fit-meter-title">Community Fit Perception</h4>
            <div className="apple-meter-bar-wrap">
              <div className="apple-meter-seg snug" style={{ width: '5%' }} title="Runs Small (5%)" />
              <div className="apple-meter-seg true" style={{ width: '92%' }} title="True to Size (92%)" />
              <div className="apple-meter-seg relaxed" style={{ width: '3%' }} title="Runs Large (3%)" />
            </div>
            <div className="apple-meter-legend">
              <span>Runs Small</span>
              <strong className="text-zinc-900">92% True to Size</strong>
              <span>Runs Large</span>
            </div>
            <p className="apple-meter-tip">
              ✦ Order your standard waist size. Cut for a relaxed silhouette with no vanity sizing.
            </p>
          </div>
        </div>

        {/* Write a Review Modal / Dropdown */}
        {showReviewForm && (
          <div className="apple-review-form-card">
            <div className="apple-form-header">
              <h3>Review {productName}</h3>
              <button
                type="button"
                className="apple-form-close"
                onClick={() => setShowReviewForm(false)}
                aria-label="Close form"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formSubmitted ? (
              <div className="apple-form-success">
                <CheckCircle className="w-8 h-8 text-emerald-600 mb-2" />
                <h4>Thank you for your feedback!</h4>
                <p>Your review has been verified and posted.</p>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="apple-form-stack">
                <div className="apple-form-rating-picker">
                  <label className="block text-xs font-semibold text-zinc-600 uppercase mb-1">
                    Your Overall Rating
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className="p-1 transition-transform active:scale-90"
                        onClick={() => setNewRating(star)}
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= newRating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-zinc-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="apple-form-label">Your Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Arjun K."
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="apple-form-input"
                    />
                  </div>
                  <div>
                    <label className="apple-form-label">Size Ordered</label>
                    <select
                      value={newSize}
                      onChange={(e) => setNewSize(e.target.value)}
                      className="apple-form-select"
                    >
                      {['28', '30', '32', '34', '36', '38', 'S', 'M', 'L', 'XL'].map((s) => (
                        <option key={s} value={s}>
                          Size {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="apple-form-label">Review Headline</label>
                  <input
                    type="text"
                    placeholder="Summary of your experience..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="apple-form-input"
                  />
                </div>

                <div>
                  <label className="apple-form-label">Your Detailed Review</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="How does the denim feel? What do you think of the fit and wash?"
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="apple-form-textarea"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    className="apple-btn-secondary"
                    onClick={() => setShowReviewForm(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="apple-btn-primary">
                    Submit Verified Review
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Reviews List */}
        <div className="apple-reviews-list">
          {reviews.map((rev) => (
            <article key={rev.id} className="apple-review-card">
              <div className="apple-review-header">
                <div className="apple-review-author-wrap">
                  <div className="apple-review-avatar">
                    {rev.author.slice(0, 1)}
                  </div>
                  <div>
                    <div className="apple-review-author-name">
                      <span>{rev.author}</span>
                      {rev.verified && (
                        <span className="apple-verified-pill" title="Verified Purchaser">
                          <CheckCircle className="w-3 h-3 mr-1 text-emerald-600" />
                          Verified Buyer
                        </span>
                      )}
                    </div>
                    <span className="apple-review-meta">
                      {rev.location} · {rev.date}
                    </span>
                  </div>
                </div>

                <div className="apple-review-stars-wrap">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < rev.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-zinc-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Fit Specs Pill */}
              <div className="apple-review-tags">
                <span className="apple-tag-pill">{rev.sizePurchased}</span>
                <span className="apple-tag-pill">{rev.fitVerdict}</span>
              </div>

              <h4 className="apple-review-title">{rev.title}</h4>
              <p className="apple-review-body">{rev.content}</p>

              <div className="apple-review-footer">
                <button
                  type="button"
                  className={`apple-helpful-btn ${helpfulVoted[rev.id] ? 'voted' : ''}`}
                  onClick={() => handleHelpful(rev.id)}
                  aria-label="Mark review as helpful"
                >
                  <ThumbsUp className="w-3.5 h-3.5 mr-1.5" />
                  <span>
                    Helpful ({rev.helpfulCount})
                  </span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
