'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const SUNLIT_SLIDES = [
  {
    src: '/auth-slide-1.png',
    alt: 'Sunlit Teesgarage Back Print Editorial',
    heading: 'Good tees.\nBetter days.',
    subtitle: 'Sign in to access your orders,\nsaved items and personalized\nrecommendations.'
  },
  {
    src: '/auth-slide-2.png',
    alt: 'Sunlit TEESGARAGE Rooftop Streetwear',
    heading: 'Sunlit craft.\nEveryday luxury.',
    subtitle: 'Premium heavyweight cotton cuts engineered for lasting silhouette and comfort.'
  },
  {
    src: '/auth-slide-3.png',
    alt: 'Sunlit Teesgarage Streetwear Lookbook',
    heading: 'Quiet luxury.\nRaw aesthetic.',
    subtitle: 'Curated apparel designed with substance, precision, and honest utility.'
  }
]

interface AuthVisualPanelProps {
  mode?: 'signin' | 'signup'
  customSubtitle?: string
}

export default function AuthVisualPanel({ mode = 'signin', customSubtitle }: AuthVisualPanelProps) {
  const [activeSlide, setActiveSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    timerRef.current = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SUNLIT_SLIDES.length)
    }, 10000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPaused, activeSlide])

  const handleSelectSlide = (index: number) => {
    setActiveSlide(index)
  }

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full h-[380px] sm:h-[480px] lg:h-full min-h-[380px] lg:min-h-[calc(100vh-2.5rem)] rounded-[28px] sm:rounded-[32px] overflow-hidden bg-neutral-950 flex flex-col justify-between p-6 sm:p-8 lg:p-10 select-none shadow-xl animate-auth-enter"
    >
      {/* 3 Sunlit Slides with 10-second Cross-fade and subtle ease-out scale */}
      {SUNLIT_SLIDES.map((slide, index) => {
        const isActive = activeSlide === index
        return (
          <div
            key={slide.src}
            className={`absolute inset-0 transition-opacity duration-1000 ease-[cubic-bezier(0.77,0,0.175,1)] ${
              isActive ? 'opacity-100 z-0' : 'opacity-0 pointer-events-none'
            }`}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              priority={index === 0}
              sizes="(max-width: 1024px) 100vw, 55vw"
              className={`object-cover object-center transform transition-transform duration-[10000ms] ease-out ${
                isActive ? 'scale-100' : 'scale-105'
              }`}
            />
          </div>
        )
      })}

      {/* Top subtle vignette for contrast */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/55 via-black/20 to-transparent z-10 pointer-events-none" />

      {/* Bottom heavy vignette to ensure bold white text legibility */}
      <div className="absolute inset-x-0 bottom-0 h-96 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-10 pointer-events-none" />

      {/* Top Bar: Back to Shop */}
      <div className="relative z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 group cursor-pointer"
          aria-label="Back to shop"
        >
          <span className="w-9 h-9 rounded-full bg-black/25 hover:bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-sm group-hover:scale-105 active:scale-95">
            <ArrowLeft className="w-4 h-4 text-white" />
          </span>
          <span className="text-sm font-medium text-white/90 group-hover:text-white transition-colors duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] drop-shadow-sm">
            Back to shop
          </span>
        </Link>
      </div>

      {/* Bottom Content: Bold Typography, Subtitle, and 3 Indicators */}
      <div className="relative z-20 mt-auto">
        <div key={`${activeSlide}-${mode}`} className="animate-auth-enter">
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-white tracking-tight leading-[1.08] mb-3 whitespace-pre-line drop-shadow-md">
            {mode === 'signup' && activeSlide === 0
              ? 'Good tees.\nBetter days.'
              : SUNLIT_SLIDES[activeSlide].heading}
          </h2>

          <p className="text-white/85 text-xs sm:text-sm lg:text-[15px] leading-relaxed max-w-[360px] mb-7 font-normal whitespace-pre-line drop-shadow-sm">
            {customSubtitle ||
              (mode === 'signup' && activeSlide === 0
                ? 'Create an account to access your orders,\nsaved items and personalized\nrecommendations.'
                : SUNLIT_SLIDES[activeSlide].subtitle)}
          </p>
        </div>

        {/* 3 Pagination Pill Bars (changes every 10s or on click with ease-out transition) */}
        <div
          className="flex items-center gap-2"
          role="tablist"
          aria-label="Sunlit gallery indicators"
        >
          {SUNLIT_SLIDES.map((_, idx) => {
            const isActive = activeSlide === idx
            return (
              <button
                key={idx}
                type="button"
                role="tab"
                onClick={() => handleSelectSlide(idx)}
                className={`cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                  isActive
                    ? 'relative h-1.5 w-10 bg-white/30 overflow-hidden rounded-full'
                    : 'h-1.5 w-5 bg-white/35 hover:bg-white/60 rounded-full'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
                aria-selected={isActive}
              >
                {isActive && (
                  <span
                    key={activeSlide}
                    className="absolute inset-0 bg-white rounded-full origin-left animate-auth-progress"
                    style={{ animationPlayState: isPaused ? 'paused' : 'running' }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
