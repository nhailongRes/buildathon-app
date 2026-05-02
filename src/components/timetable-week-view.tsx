import type { TimetableEvent } from '@/lib/timetable'

const TIMEZONE = 'Australia/Sydney'

const dayHeaderFmt = new Intl.DateTimeFormat('en-AU', {
  weekday: 'long',
  day: 'numeric',
  month: 'short',
  timeZone: TIMEZONE,
})

const timeFmt = new Intl.DateTimeFormat('en-AU', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: false,
  timeZone: TIMEZONE,
})

function dayKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: TIMEZONE,
  }).format(date)
}

export function TimetableWeekView({ events }: { events: TimetableEvent[] }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const days: { date: Date; key: string; events: TimetableEvent[] }[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    days.push({ date: d, key: dayKey(d), events: [] })
  }

  for (const ev of events) {
    const k = dayKey(new Date(ev.startAt))
    const slot = days.find((d) => d.key === k)
    if (slot) slot.events.push(ev)
  }

  return (
    <div className="flex flex-col gap-6">
      {days.map((day) => (
        <section key={day.key} className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {dayHeaderFmt.format(day.date)}
          </h2>
          {day.events.length === 0 ? (
            <p className="rounded-lg border border-dashed border-zinc-200 px-4 py-3 text-sm text-zinc-400 dark:border-zinc-800 dark:text-zinc-600">
              Nothing scheduled.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {day.events.map((ev) => (
                <li
                  key={ev.id}
                  className="flex flex-col gap-0.5 rounded-lg border border-zinc-200 bg-background px-4 py-3 dark:border-zinc-800"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-medium">{ev.title}</span>
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">
                      {timeFmt.format(new Date(ev.startAt))}-{timeFmt.format(new Date(ev.endAt))}
                    </span>
                  </div>
                  {ev.location ? (
                    <span className="text-xs text-muted-foreground">{ev.location}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  )
}
