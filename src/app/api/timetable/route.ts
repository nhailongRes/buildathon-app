import { NextResponse } from 'next/server'
import { z } from 'zod'
import { fetchICalText, parseICal } from '@/lib/ical'
import { upsertTimetableEvents } from '@/lib/timetable'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Hardcoded for demo - replaced with real auth in a later slice
const DEMO_USER_ID = 'demo-user-1'

const Body = z.object({
  url: z
    .string()
    .trim()
    .min(1, 'Paste your timetable link.')
    .url("That doesn't look like a valid URL."),
})

export async function POST(request: Request) {
  let parsed
  try {
    parsed = Body.parse(await request.json())
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.issues[0]?.message ?? 'Invalid input.'
        : 'Invalid input.'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  let icalText: string
  try {
    icalText = await fetchICalText(parsed.url)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch the calendar.'
    return NextResponse.json({ error: message }, { status: 502 })
  }

  const events = parseICal(icalText)
  if (events.length === 0) {
    return NextResponse.json(
      { error: 'No events found in this calendar.' },
      { status: 422 },
    )
  }

  try {
    const imported = await upsertTimetableEvents(DEMO_USER_ID, parsed.url, events)
    return NextResponse.json({ imported })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Storage failed.'
    return NextResponse.json({ error: `Storage failed: ${message}` }, { status: 500 })
  }
}
