'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function TimetablePasteForm() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const busy = isPending || isSubmitting

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        error?: string
        imported?: number
      }
      if (!res.ok) {
        setError(data.error ?? `Import failed (HTTP ${res.status}).`)
        return
      }
      setSuccess(`Imported ${data.imported} event${data.imported === 1 ? '' : 's'}.`)
      startTransition(() => router.refresh())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Label htmlFor="timetable-url">Paste your ANU MyTimetable iCal link</Label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id="timetable-url"
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://mytimetable.anu.edu.au/even/rest/calendar/ical/..."
          disabled={busy}
        />
        <Button type="submit" disabled={busy || url.trim().length === 0}>
          {busy ? 'Importing...' : 'Import'}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        In MyTimetable: Calendar - Subscribe - copy the iCal URL.
      </p>
      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          {success}
        </p>
      ) : null}
    </form>
  )
}
