'use client'

import { useEffect, useRef, useCallback } from 'react'

/**
 * useScrollReveal — reusable IntersectionObserver hook (Task 3).
 *
 * Marks elements with data-reveal="true" once they enter the viewport.
 * Stagger is applied via CSS --reveal-index custom property set on each child.
 * Elements animate only once (once: true).
 *
 * Usage:
 *   const ref = useScrollReveal()
 *   <div ref={ref} className="reveal-container">
 *     <div className="reveal-item">...</div>
 *   </div>
 *
 * Or for individual elements:
 *   const ref = useScrollReveal({ single: true })
 *   <section ref={ref} className="reveal-item">...</section>
 */
interface ScrollRevealOptions {
  /** Root margin for IntersectionObserver (default: '-48px') */
  rootMargin?: string
  /** If true, observe the ref element itself instead of its children */
  single?: boolean
  /** CSS selector for children to stagger (default: '.reveal-item') */
  childSelector?: string
}

export function useScrollReveal(options: ScrollRevealOptions = {}) {
  const {
    rootMargin = '-48px',
    single = false,
    childSelector = '.reveal-item',
  } = options

  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const container = ref.current
    if (!container) return

    // Respect prefers-reduced-motion at the hook level
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (single) {
      if (reducedMotion) {
        container.setAttribute('data-revealed', 'true')
        return
      }
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            container.setAttribute('data-revealed', 'true')
            observer.disconnect()
          }
        },
        { rootMargin, threshold: 0.1 }
      )
      observer.observe(container)
      return () => observer.disconnect()
    }

    // Container mode: stagger children
    const items = Array.from(container.querySelectorAll<HTMLElement>(childSelector))
    if (items.length === 0) return

    if (reducedMotion) {
      items.forEach((el) => el.setAttribute('data-revealed', 'true'))
      return
    }

    // Set stagger index
    items.forEach((el, i) => {
      el.style.setProperty('--reveal-index', String(i))
    })

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            ;(entry.target as HTMLElement).setAttribute('data-revealed', 'true')
            observer.unobserve(entry.target)
          }
        })
      },
      { rootMargin, threshold: 0.1 }
    )

    items.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [rootMargin, single, childSelector])

  return ref as React.RefObject<HTMLDivElement>
}

/**
 * useReducedMotion — returns true if the user prefers reduced motion.
 */
export function useReducedMotion(): boolean {
  const ref = useRef(
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  )
  return ref.current
}
