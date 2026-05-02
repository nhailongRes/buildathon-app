'use client'

import { useMemo, useState } from 'react'
import { Plus, SendHorizontal, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type {
  TaskDraft,
  TaskIntakeMessage,
  TaskIntakeResponse,
} from '@/lib/task-intake'

const initialMessage: TaskIntakeMessage = {
  role: 'assistant',
  content: 'Tell me what you need to do, and I will turn it into task drafts.',
}

function formatDraftDate(date: string | null) {
  if (!date) return 'No due date'
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-AU', {
    month: 'short',
    day: 'numeric',
  })
}

export function TaskIntakeChat() {
  const router = useRouter()
  const [messages, setMessages] = useState<TaskIntakeMessage[]>([initialMessage])
  const [input, setInput] = useState('')
  const [drafts, setDrafts] = useState<TaskDraft[]>([])
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [savedKeys, setSavedKeys] = useState<Set<string>>(() => new Set())
  const [error, setError] = useState<string | null>(null)
  const [isThinking, setIsThinking] = useState(false)

  const canSend = input.trim().length > 0 && !isThinking

  const latestDraftKeys = useMemo(
    () => drafts.map((draft, index) => `${draft.title}-${draft.dueDate ?? 'none'}-${index}`),
    [drafts],
  )

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSend) return

    const nextUserMessage: TaskIntakeMessage = {
      role: 'user',
      content: input.trim(),
    }
    const nextMessages = [...messages, nextUserMessage]

    setMessages(nextMessages)
    setInput('')
    setError(null)
    setIsThinking(true)

    try {
      const response = await fetch('/api/task-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages.slice(-12) }),
      })
      const raw = (await response.json().catch(() => ({}))) as unknown

      if (!response.ok) {
        const errorData = raw as { error?: string }
        setError(errorData.error ?? `Task intake failed (HTTP ${response.status}).`)
        return
      }

      const data = raw as TaskIntakeResponse
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: data.assistantMessage },
      ])
      if (data.tasks.length > 0) {
        setDrafts(data.tasks)
        setSavedKeys(new Set())
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Network error.')
    } finally {
      setIsThinking(false)
    }
  }

  async function saveDraft(draft: TaskDraft, key: string) {
    if (savedKeys.has(key)) return
    setError(null)
    setSavingKey(key)

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: draft.title,
          subject: draft.subject ?? undefined,
          dueDate: draft.dueDate ?? undefined,
          scratchpadContent: draft.scratchpadContent ?? undefined,
        }),
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string }
        setError(data.error ?? `Save failed (HTTP ${response.status}).`)
        return
      }

      setSavedKeys((current) => new Set(current).add(key))
      router.refresh()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Network error.')
    } finally {
      setSavingKey(null)
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader className="flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-zinc-500" />
          <CardTitle>Task intake</CardTitle>
        </div>
        <Badge variant="outline">AI draft</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex max-h-72 min-h-40 flex-col gap-3 overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-50 p-3">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={
                message.role === 'user'
                  ? 'ml-auto max-w-[85%] rounded-lg bg-zinc-900 px-3 py-2 text-sm text-white'
                  : 'mr-auto max-w-[85%] rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700'
              }
            >
              {message.content}
            </div>
          ))}
          {isThinking ? (
            <div className="mr-auto rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-500">
              Thinking...
            </div>
          ) : null}
        </div>

        {drafts.length > 0 ? (
          <div className="grid gap-2">
            {drafts.map((draft, index) => {
              const key = latestDraftKeys[index]
              const saved = savedKeys.has(key)
              return (
                <div
                  key={key}
                  className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-3 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium text-zinc-900">{draft.title}</h3>
                      {draft.subject ? (
                        <Badge variant="secondary">{draft.subject}</Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      {formatDraftDate(draft.dueDate)}
                    </p>
                    {draft.scratchpadContent ? (
                      <p className="mt-2 line-clamp-2 text-sm text-zinc-600">
                        {draft.scratchpadContent}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant={saved ? 'secondary' : 'default'}
                    disabled={saved || savingKey === key}
                    onClick={() => saveDraft(draft, key)}
                  >
                    <Plus />
                    {saved ? 'Saved' : savingKey === key ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              )
            })}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="e.g. I have a COMP3120 report due next Friday and need to review the rubric."
            className="min-h-24 w-full resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
            disabled={isThinking}
          />
          <div className="flex items-center justify-between gap-3">
            <p className="min-h-5 text-sm text-red-600">{error}</p>
            <Button type="submit" disabled={!canSend}>
              <SendHorizontal />
              Send
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
