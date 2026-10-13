'use client'

import * as React from 'react'
import { Sparkles, Send, Bot, User, ArrowRight, RefreshCw } from 'lucide-react'
import { askAssistant, GUIDE_FOLLOWUPS, type AiAnswer } from '@/services/ai'
import { PageContent, PageHeader } from '@/components/ui/page-header'
import { Button, Card, Input, Spinner } from '@/components/ui/primitives'
import { MiniBarChart } from '@/components/ui/charts'

interface Message {
  id: number
  sender: 'user' | 'ai'
  text: string
  bullets?: string[]
  table?: AiAnswer['table']
  chart?: AiAnswer['chart']
  followUps?: string[]
}

export default function AiAssistantPage() {
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: 1,
      sender: 'ai',
      text: 'Hello! I am your TEESGARAGE Operations AI Assistant. Ask me anything about store performance, reorder predictions, top products, or revenue analytics.',
      followUps: GUIDE_FOLLOWUPS.slice(0, 4),
    },
  ])

  const [input, setInput] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const handleSend = async (queryText?: string) => {
    const q = (queryText || input).trim()
    if (!q || loading) return

    const userMsgId = Date.now()
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, sender: 'user', text: q },
    ])
    setInput('')
    setLoading(true)

    try {
      const res = await askAssistant(q)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: res.text,
          bullets: res.bullets,
          table: res.table,
          chart: res.chart,
          followUps: res.followUps,
        },
      ])
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: 'Sorry, I encountered an error answering that query. Please try again.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="AI Operations Assistant"
        description="Data-backed assistant for store analytics, reorder forecasting, and copy generation"
      />

      <PageContent>
        <Card className="flex flex-col h-[calc(100vh-14rem)] overflow-hidden">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white font-bold">
                    <Sparkles className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-xl p-4 text-xs space-y-3 ${
                    msg.sender === 'user'
                      ? 'bg-primary text-white'
                      : 'bg-surface-subtle border border-line text-ink'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                  {msg.bullets && msg.bullets.length > 0 && (
                    <ul className="list-disc pl-4 space-y-1">
                      {msg.bullets.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  )}

                  {msg.table && (
                    <div className="overflow-x-auto rounded-lg border border-line bg-surface p-2">
                      <table className="w-full text-left text-[11px]">
                        <thead className="border-b border-divider text-ink-3">
                          <tr>
                            {msg.table.columns.map((col) => (
                              <th key={col.key} className="p-1.5 font-semibold">
                                {col.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-divider text-ink">
                          {msg.table.rows.map((row, i) => (
                            <tr key={i}>
                              {msg.table!.columns.map((col) => (
                                <td key={col.key} className="p-1.5 font-mono">
                                  {String(row[col.key] ?? '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {msg.chart && (
                    <div className="rounded-lg border border-line bg-surface p-3">
                      <p className="font-semibold text-xs text-ink mb-2">{msg.chart.title}</p>
                      <MiniBarChart points={msg.chart.points} height={140} />
                    </div>
                  )}

                  {msg.followUps && msg.followUps.length > 0 && (
                    <div className="pt-2 border-t border-divider space-y-1.5">
                      <p className="text-[10px] font-semibold text-ink-3">Suggested questions:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.followUps.map((f, i) => (
                          <button
                            key={i}
                            onClick={() => handleSend(f)}
                            disabled={loading}
                            className="rounded-full border border-primary/20 bg-primary-soft px-2.5 py-1 text-[11px] font-medium text-primary hover:bg-primary/10 transition-colors text-left"
                          >
                            {f} &rarr;
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
                  <Sparkles className="h-4 w-4 animate-spin" />
                </div>
                <div className="rounded-xl bg-surface-subtle border border-line p-4 text-xs text-ink-3 flex items-center gap-2">
                  <Spinner className="h-4 w-4" /> Analyzing store data...
                </div>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <div className="border-t border-divider p-3 bg-surface">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="flex gap-2"
            >
              <Input
                placeholder="Ask about inventory, sales, product copy..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
              />
              <Button type="submit" disabled={loading || !input.trim()}>
                <Send className="h-4 w-4" /> Send
              </Button>
            </form>
          </div>
        </Card>
      </PageContent>
    </div>
  )
}
