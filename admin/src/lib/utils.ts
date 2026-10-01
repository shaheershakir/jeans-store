import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/** Deterministic PRNG so seed data is stable across regenerations. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

/** Percentage change from previous → current. Returns null when no baseline. */
export function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null
  return ((current - previous) / previous) * 100
}

export function isoDaysAgo(days: number, now = Date.now()): string {
  return new Date(now - days * 86400000).toISOString()
}

export function isoDaysAhead(days: number, now = Date.now()): string {
  return new Date(now + days * 86400000).toISOString()
}

export function isoFrom(date: Date): string {
  return date.toISOString()
}

export function pick<T>(rand: () => number, items: T[]): T {
  return items[Math.floor(rand() * items.length)]
}

export function randInt(rand: () => number, min: number, max: number): number {
  return min + Math.floor(rand() * (max - min + 1))
}

export function divideInt(rand: () => number, total: number, parts: number): number[] {
  const cut = Array.from({ length: parts - 1 }, () => rand())
    .sort((a, b) => a - b)
  const result: number[] = []
  let prev = 0
  for (const c of cut) {
    result.push(Math.round(total * (c - prev)))
    prev = c
  }
  result.push(Math.round(total * (1 - prev)))
  return result
}