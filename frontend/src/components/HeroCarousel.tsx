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
    id: 'flash-sale',
    countdown: true,
    eyebrow: 'Online only: ends in ',
    title: 'Flash Sale',
    subtitle: '40-60% off signature denim silhouettes, heavyweight hoodies & wardrobe essentials.',
    leftImage: {
      url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80',
      alt: 'Models wearing heavyweight raw denim'
    },
    rightImage: {
      url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80',
      alt: 'Model in vintage faded indigo jeans'
    },
    buttons: [
      { label: 'Women', category: 'tops' },
      { label: 'Men', category: 'jeans' }
    ]
  },
  {
    id: 'heavy-fleece',
    countdown: false,
    eyebrow: 'LIMITED ARCHIVE DROP // 2026',
    title: 'Heavy Fleece',
    subtitle: '450 GSM organic looped French terry hoodies with zero drawstrings & structural crossover hoods.',
    leftImage: {
      url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
      alt: 'Heavy french terry pullover hoodie'
    },
    rightImage: {
      url: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=800&q=80',
      alt: 'Vintage mineral washed zip hoodie'
    },
    buttons: [
      { label: 'Hoodies', category: 'hoodies' },
      { label: 'Accessories', category: 'hats' }
    ]
  },
  {
    id: 'baggy-wide',
    countdown: false,
    eyebrow: 'EXCLUSIVE CUTS // STUDIO EDIT',
    title: 'Baggy & Wide',
    subtitle: 'Cut loose through the seat and thigh with generous leg opening and stacking ankle breaks.',
    leftImage: {
      url: 'https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=800&q=80',
      alt: 'Relaxed wide leg stacking jeans'
    },
    rightImage: {
      url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80',
      alt: 'Classic straight leg rinsed indigo jeans'
    },
    buttons: [
      { label: 'Baggy Fit', fit: 'Baggy' },
      { label: 'Straight Fit', fit: 'Straight' }
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

  // Auto-play timer
  useEffect(() => {
    if (isPaused) return
    const interval = setInterval(nextSlide, 7000)
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
