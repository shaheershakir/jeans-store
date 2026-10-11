'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Fit } from '@/lib/constants'

export interface CarouselSlide {
  id: string
  countdown?: boolean
  eyebrow: string
  title: string
  subtitle: string
  leftImage: {
    url: string
    alt: string
  }
  rightImage: {
    url: string
    alt: string
  }
  buttons: {
    label: string
    category?: string
    fit?: Fit
    href?: string
  }[]
}

const CAROUSEL_SLIDES: CarouselSlide[] = [
  {
    id: 'heavyweight-tees',
    countdown: true,
    eyebrow: 'ONLINE EXCLUSIVE // SS 2026',
    title: 'Heavyweight Tees',
    subtitle: '260-280 GSM combed cotton stripes, drop-shoulder silhouettes & full sleeves.',
    leftImage: {
      url: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80',
      alt: 'Model in heavy striped boxy tee'
    },
    rightImage: {
      url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80',
      alt: 'Model in drop sleeve oversized streetwear tee'
    },
    buttons: [
      { label: 'Stripes', category: 'stripes' },
      { label: 'Drsleeve', category: 'drsleeve' }
    ]
  },
  {
    id: 'street-bottomwear',
    countdown: false,
    eyebrow: 'NEW BOTTOMWEAR DROP // 2026',
    title: 'Trackpants & Sweatpants',
    subtitle: '450 GSM organic looped French terry & matte nylon shell cargo trackpants built for everyday wear.',
    leftImage: {
      url: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=800&q=80',
      alt: 'Urban utility cargo trackpants'
    },
    rightImage: {
      url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
      alt: '450 GSM French terry sweatpants'
    },
    buttons: [
      { label: 'Trackpants', category: 'trackpants' },
      { label: 'Sweatpants', category: 'sweatpants' }
    ]
  },
  {
    id: 'printed-ringer',
    countdown: false,
    eyebrow: 'ARCHIVAL GRAPHICS // STUDIO EDIT',
    title: 'Printed & Ringer Tees',
    subtitle: 'High-density screenprints, Tokyo garage typography, and 70s contrast ribbed ringer collars.',
    leftImage: {
      url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80',
      alt: 'Distressed cyber garage printed graphic tee'
    },
    rightImage: {
      url: 'https://images.unsplash.com/photo-1503342394128-c104d54dba01?auto=format&fit=crop&w=800&q=80',
      alt: 'Vintage 70s contrast ringer tee'
    },
    buttons: [
      { label: 'Printed Tees', category: 'printed-tees' },
      { label: 'Ringer Tees', category: 'ringer-tees' }
    ]
  }
]

interface HeroCarouselProps {
  onSelectCategory?: (category: string) => void
  onSelectFit?: (fit: Fit) => void
}

export default function HeroCarousel({ onSelectCategory, onSelectFit }: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [timeLeft, setTimeLeft] = useState('12:12:25')
  const touchStartX = useRef<number | null>(null)

  // Live countdown timer ticking every second
  useEffect(() => {
    const target = new Date()
    target.setHours(target.getHours() + 12, target.getMinutes() + 12, target.getSeconds() + 25)

    const timer = setInterval(() => {
      const now = new Date()
      const diff = Math.max(0, target.getTime() - now.getTime())
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      )
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length)
  }, [])

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length)
  }, [])

  // Auto-play timer — 5 s per slide
  useEffect(() => {
    if (isPaused) return
    const interval = setInterval(nextSlide, 5000)
    return () => clearInterval(interval)
  }, [isPaused, nextSlide])


  const handleButtonClick = (btn: CarouselSlide['buttons'][0]) => {
    if (btn.category && onSelectCategory) {
      onSelectCategory(btn.category)
    }
    if (btn.fit && onSelectFit) {
      onSelectFit(btn.fit)
    }
    const catalogEl = document.getElementById('catalog') || document.querySelector('.collection-toolbar-wrapper')
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section
      className="hero-carousel-container"
      aria-label="Promotional Flash Sale Carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return
        const diff = touchStartX.current - e.changedTouches[0].clientX
        if (diff > 50) nextSlide()
        else if (diff < -50) prevSlide()
        touchStartX.current = null
      }}
    >
      <div className="hero-carousel-track">
        {CAROUSEL_SLIDES.map((item, idx) => {
          const isActive = idx === currentSlide
          return (
            <div
              key={item.id}
              className={`hero-slide-split ${isActive ? 'active' : ''}`}
              aria-hidden={!isActive}
            >
              {/* Left Lifestyle Image */}
              <div className="hero-panel-image hero-panel-left">
                <Image
                  src={item.leftImage.url}
                  alt={item.leftImage.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 35vw"
                  className="hero-img-cover"
                  priority={idx === 0}
                />
              </div>

              {/* Center Black Promotional Panel */}
              <div className="hero-panel-center">
                <div className="hero-center-content">
                  <div className="hero-center-eyebrow">
                    {item.countdown ? `${item.eyebrow}${timeLeft}` : item.eyebrow}
                  </div>
                  <h2 className="hero-center-title">{item.title}</h2>
                  <p className="hero-center-desc">{item.subtitle}</p>
                  <div className="hero-center-actions">
                    {item.buttons.map((btn) => (
                      <button
                        key={btn.label}
                        type="button"
                        className="hero-pill-btn"
                        onClick={() => handleButtonClick(btn)}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Lifestyle Image */}
              <div className="hero-panel-image hero-panel-right">
                <Image
                  src={item.rightImage.url}
                  alt={item.rightImage.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 35vw"
                  className="hero-img-cover"
                  priority={idx === 0}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Prev / Next Arrows */}
      <button
        type="button"
        className="carousel-nav-btn carousel-prev"
        aria-label="Previous slide"
        onClick={prevSlide}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <button
        type="button"
        className="carousel-nav-btn carousel-next"
        aria-label="Next slide"
        onClick={nextSlide}
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dots Indicator */}
      <div className="carousel-indicators" role="tablist" aria-label="Slide indicators">
        {CAROUSEL_SLIDES.map((_, idx) => (
          <button
            key={idx}
            type="button"
            role="tab"
            aria-selected={idx === currentSlide}
            aria-label={`Go to slide ${idx + 1}`}
            className={`carousel-dot ${idx === currentSlide ? 'active' : ''}`}
            onClick={() => setCurrentSlide(idx)}
          />
        ))}
      </div>
    </section>
  )
}
