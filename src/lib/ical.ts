import ical from 'node-ical'

export type ParsedEvent = {
  uid: string
  title: string
  startAt: Date
  endAt: Date
  location: string | null
  description: string | null
}

export async function fetchICalText(url: string): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15_000)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'StudyPlanner/0.1 (+anu-buildathon)' },
      cache: 'no-store',
    })
    if (!res.ok) {
      throw new Error(`Calendar source returned HTTP ${res.status}.`)
    }
    const text = await res.text()
    if (!text.includes('BEGIN:VCALENDAR')) {
      throw new Error('Response does not look like an iCal feed.')
    }
    return text
  } finally {
    clearTimeout(timeout)
  }
}

export function parseICal(text: string): ParsedEvent[] {
  const data = ical.sync.parseICS(text)
  const events: ParsedEvent[] = []
  for (const key of Object.keys(data)) {
    const item = data[key]
    if (!item || item.type !== 'VEVENT') continue
    if (!item.start || !item.end) continue
    const startAt = item.start instanceof Date ? item.start : new Date(item.start as unknown as string)
    const endAt = item.end instanceof Date ? item.end : new Date(item.end as unknown as string)
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) continue
    events.push({
      uid: String(item.uid ?? key),
      title: String(item.summary ?? 'Untitled'),
      startAt,
      endAt,
      location: item.location ? String(item.location) : null,
      description: item.description ? String(item.description) : null,
    })
  }
  return events
}
