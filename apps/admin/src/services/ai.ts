'use client'

import type { DbState } from '@/lib/types'
import { useAdminStore } from '@/store/admin-store'

/**
 * AI Assistant abstraction + provider registry.
 *
 * The UI only talks to `askAssistant`. To wire a real LLM backend,
 * implement `AiProvider` (e.g. an HttpAiProvider that POSTs to your
 * `/api/ai` route) and call `setAiProvider(...)`. The default provider
 * (`DataBackedAiProvider` in ./ai-provider) answers from live store
 * data so nothing here is ever faked.
 */

export interface AiTable {
  columns: { key: string; label: string }[]
  rows: Record<string, string | number>[]
}

export interface AiChart {
  title: string
  points: { label: string; value: number }[]
}

export interface AiAnswer {
  text: string
  bullets?: string[]
  table?: AiTable
  chart?: AiChart
  followUps: string[]
}

export interface AiProvider {
  ask(query: string, data: () => DbState): Promise<AiAnswer>
}

export const GUIDE_FOLLOWUPS = [
  'Which apparel products sold best last month?',
  'Which sizes are likely to run out this week?',
  'Why did revenue change this month?',
  'Which products have high views but low sales?',
  'Which fit has the highest return rate?',
  'What should I reorder?',
]

let provider: AiProvider | null = null

/** Swap in a real LLM-backed provider when the backend exists. */
export function setAiProvider(next: AiProvider): void {
  provider = next
}

const dataProvider = (): DbState => useAdminStore.getState().data

export async function askAssistant(query: string): Promise<AiAnswer> {
  if (!provider) {
    const { DataBackedAiProvider } = await import('./ai-provider')
    provider = new DataBackedAiProvider()
  }
  return provider.ask(query, dataProvider)
}

/** Stub for a future LLM endpoint — wire this to your own backend. */
export class HttpAiProvider implements AiProvider {
  constructor(private readonly endpoint = '/api/ai') {}

  async ask(query: string, _data: () => DbState): Promise<AiAnswer> {
    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    })
    if (!res.ok) throw new Error(`AI service returned ${res.status}.`)
    return (await res.json()) as AiAnswer
  }
}
