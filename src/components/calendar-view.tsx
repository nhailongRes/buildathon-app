'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const TIME_ZONE = 'Australia/Sydney'
const HOUR_HEIGHT = 64
const START_HOUR = 7
const END_HOUR = 22

export type CalendarTask = {
  id: string
  title: string
  subject: string | null
  dueDate: string | null
}

export type CalendarTimetableEvent = {
  id: string
  title: string
  startAt: string
  endAt: string
  location: string | null
  description: string | null
}

type CalendarDay = {
  date: Date
  key: string
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function startOfWeek(date: Date) {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const day = start.getDay()
  const diff = day === 0 ? -6 : 1 - day
  start.setDate(start.getDate() + diff)
  return start
}

function dayKey(date: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function parseDateKey(key: string) {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function sameDayKey(a: Date, b: Date) {
  return dayKey(a) === dayKey(b)
}

function timeLabel(date: Date) {
  return new Intl.DateTimeFormat('en-AU', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
    timeZone: TIME_ZONE,
  }).format(date)
}

function dayLabel(date: Date) {
  return new Intl.DateTimeFormat('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: TIME_ZONE,
  }).format(date)
}

function longDayLabel(date: Date) {
  return new Intl.DateTimeFormat('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: TIME_ZONE,
  }).format(date)
}

function minutesSinceStartOfDay(date: Date) {
  const parts = new Intl.DateTimeFormat('en-AU', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
    timeZone: TIME_ZONE,
  }).formatToParts(date)
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? 0)
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? 0)
  return hour * 60 + minute
}

function eventTop(startAt: Date) {
  return ((minutesSinceStartOfDay(startAt) - START_HOUR * 60) / 60) * HOUR_HEIGHT
}

function eventHeight(startAt: Date, endAt: Date) {
  const start = minutesSinceStartOfDay(startAt)
  const end = minutesSinceStartOfDay(endAt)
  return Math.max(((end - start) / 60) * HOUR_HEIGHT, 28)
}

function durationMinutes(startAt: Date, endAt: Date) {
  return Math.max(0, Math.round((endAt.getTime() - startAt.getTime()) / 60000))
}

export function CalendarView({
  tasks,
  events,
}: {
  tasks: CalendarTask[]
  events: CalendarTimetableEvent[]
}) {
  const today = useMemo(() => new Date(), [])
  const todayKey = dayKey(today)
  const [weekStartKey, setWeekStartKey] = useState(dayKey(startOfWeek(today)))
  const [selectedDayKey, setSelectedDayKey] = useState(todayKey)
  const nowRef = useRef<HTMLDivElement>(null)

  const weekStart = useMemo(() => parseDateKey(weekStartKey), [weekStartKey])
  const days = useMemo<CalendarDay[]>(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = addDays(weekStart, index)
        return { date, key: dayKey(date) }
      }),
    [weekStart],
  )

  useEffect(() => {
    if (selectedDayKey === todayKey) {
      nowRef.current?.scrollIntoView({ block: 'center' })
    }
  }, [selectedDayKey, todayKey])

  const tasksByDay = useMemo(() => {
    const grouped = new Map<string, CalendarTask[]>()
    for (const task of tasks) {
      if (!task.dueDate) continue
      const key = dayKey(new Date(task.dueDate))
      grouped.set(key, [...(grouped.get(key) ?? []), task])
    }
    return grouped
  }, [tasks])

  const unscheduledTasks = useMemo(
    () => tasks.filter((task) => !task.dueDate).slice(0, 6),
    [tasks],
  )

  const eventsByDay = useMemo(() => {
    const grouped = new Map<string, CalendarTimetableEvent[]>()
    for (const event of events) {
      const key = dayKey(new Date(event.startAt))
      grouped.set(key, [...(grouped.get(key) ?? []), event])
    }
    return grouped
  }, [events])

  const selectedDate = parseDateKey(selectedDayKey)
  const selectedEvents = eventsByDay.get(selectedDayKey) ?? []
  const selectedTasks = tasksByDay.get(selectedDayKey) ?? []
  const totalTimelineHeight = (END_HOUR - START_HOUR + 1) * HOUR_HEIGHT
  const hours = Array.from(
    { length: END_HOUR - START_HOUR + 1 },
    (_, index) => START_HOUR + index,
  )
  const nowTop = eventTop(today)
  const showNow =
    selectedDayKey === todayKey &&
    minutesSinceStartOfDay(today) >= START_HOUR * 60 &&
    minutesSinceStartOfDay(today) <= END_HOUR * 60

  function moveWeek(offset: number) {
    const nextStart = addDays(parseDateKey(weekStartKey), offset * 7)
    const nextKey = dayKey(nextStart)
    setWeekStartKey(nextKey)
    setSelectedDayKey(nextKey)
  }

  function resetWeek() {
    setWeekStartKey(dayKey(startOfWeek(new Date())))
    setSelectedDayKey(dayKey(new Date()))
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Week of {dayLabel(weekStart)}</h2>
          <p className="text-sm text-muted-foreground">
            Timetable blocks and task due dates in one place.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="icon" onClick={() => moveWeek(-1)}>
            <ChevronLeft />
          </Button>
          <Button type="button" variant="outline" onClick={resetWeek}>
            Today
          </Button>
          <Button type="button" variant="outline" size="icon" onClick={() => moveWeek(1)}>
            <ChevronRight />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-7">
        {days.map((day) => {
          const dayEvents = eventsByDay.get(day.key) ?? []
          const dayTasks = tasksByDay.get(day.key) ?? []
          const isSelected = day.key === selectedDayKey
          const isToday = sameDayKey(day.date, today)
          const scheduledHours =
            Math.round(
              dayEvents.reduce((sum, event) => {
                return (
                  sum +
                  durationMinutes(new Date(event.startAt), new Date(event.endAt))
                )
              }, 0) / 6,
            ) / 10

          return (
            <button
              key={day.key}
              type="button"
              onClick={() => setSelectedDayKey(day.key)}
              className={cn(
                'flex min-h-32 flex-col gap-2 rounded-lg border bg-card p-3 text-left transition hover:border-zinc-400',
                isSelected && 'border-zinc-900 ring-2 ring-zinc-900/10',
                !isSelected && isToday && 'border-zinc-400 bg-zinc-50',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    {new Intl.DateTimeFormat('en-AU', {
                      weekday: 'short',
                      timeZone: TIME_ZONE,
                    }).format(day.date)}
                  </p>
                  <p className="text-2xl font-semibold">
                    {new Intl.DateTimeFormat('en-AU', {
                      day: 'numeric',
                      timeZone: TIME_ZONE,
                    }).format(day.date)}
                  </p>
                </div>
                {isToday ? <Badge variant="secondary">Today</Badge> : null}
              </div>

              <div className="text-xs text-muted-foreground">
                {scheduledHours > 0 ? `${scheduledHours}h timetable` : 'No timetable'}
                {dayTasks.length > 0 ? `, ${dayTasks.length} task${dayTasks.length === 1 ? '' : 's'}` : ''}
              </div>

              <div className="flex flex-col gap-1">
                {dayEvents.slice(0, 2).map((event) => (
                  <span
                    key={event.id}
                    className="truncate rounded bg-sky-50 px-2 py-1 text-xs text-sky-700"
                  >
                    {timeLabel(new Date(event.startAt))} {event.title}
                  </span>
                ))}
                {dayTasks.slice(0, 2).map((task) => (
                  <span
                    key={task.id}
                    className="truncate rounded bg-amber-50 px-2 py-1 text-xs text-amber-800"
                  >
                    Due {task.title}
                  </span>
                ))}
                {dayEvents.length + dayTasks.length > 4 ? (
                  <span className="text-xs text-muted-foreground">
                    +{dayEvents.length + dayTasks.length - 4} more
                  </span>
                ) : null}
              </div>
            </button>
          )
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="rounded-lg border bg-card">
          <div className="flex flex-col gap-1 border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-muted-foreground" />
              <h3 className="font-semibold">{longDayLabel(selectedDate)}</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {selectedEvents.length} timetable block{selectedEvents.length === 1 ? '' : 's'} and{' '}
              {selectedTasks.length} due task{selectedTasks.length === 1 ? '' : 's'}.
            </p>
          </div>

          {selectedTasks.length > 0 ? (
            <div className="border-b bg-amber-50/50 px-4 py-3">
              <p className="mb-2 text-xs font-semibold uppercase text-amber-900/70">
                Due tasks
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {selectedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-md border border-amber-200 bg-white px-3 py-2"
                  >
                    <p className="text-sm font-medium">{task.title}</p>
                    {task.subject ? (
                      <p className="text-xs text-muted-foreground">{task.subject}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="max-h-[640px] overflow-y-auto px-4 py-4">
            <div className="relative" style={{ height: totalTimelineHeight }}>
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="absolute left-0 right-0 flex border-t border-zinc-100"
                  style={{ top: (hour - START_HOUR) * HOUR_HEIGHT }}
                >
                  <span className="-mt-2 w-14 pr-2 text-right font-mono text-xs text-muted-foreground">
                    {String(hour).padStart(2, '0')}:00
                  </span>
                </div>
              ))}

              {selectedEvents.length === 0 ? (
                <div className="absolute left-16 right-2 top-6 rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                  Nothing fixed in the timetable for this day.
                </div>
              ) : null}

              {selectedEvents.map((event) => {
                const startAt = new Date(event.startAt)
                const endAt = new Date(event.endAt)
                return (
                  <div
                    key={event.id}
                    className="absolute left-16 right-2 overflow-hidden rounded-md border-l-4 border-sky-500 bg-sky-50 px-3 py-2 shadow-sm"
                    style={{
                      top: Math.max(eventTop(startAt), 0),
                      height: eventHeight(startAt, endAt),
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="truncate text-sm font-medium text-sky-950">{event.title}</p>
                      <span className="shrink-0 font-mono text-xs text-sky-700">
                        {timeLabel(startAt)}-{timeLabel(endAt)}
                      </span>
                    </div>
                    {event.location ? (
                      <p className="mt-1 flex items-center gap-1 truncate text-xs text-sky-800/80">
                        <MapPin className="size-3" />
                        {event.location}
                      </p>
                    ) : null}
                  </div>
                )
              })}

              {showNow ? (
                <div
                  ref={nowRef}
                  className="absolute left-14 right-0 z-10 flex items-center"
                  style={{ top: nowTop }}
                >
                  <div className="size-2 rounded-full bg-red-500" />
                  <div className="h-px flex-1 bg-red-500" />
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <aside className="flex flex-col gap-3">
          <div className="rounded-lg border bg-card p-4">
            <div className="mb-3 flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" />
              <h3 className="font-semibold">Unscheduled tasks</h3>
            </div>
            {unscheduledTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Every task has a due date.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {unscheduledTasks.map((task) => (
                  <div key={task.id} className="rounded-md border px-3 py-2">
                    <p className="text-sm font-medium">{task.title}</p>
                    {task.subject ? (
                      <p className="text-xs text-muted-foreground">{task.subject}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border bg-zinc-50 p-4 text-sm text-muted-foreground">
            <p>
              Blue blocks come from imported timetable events. Amber blocks are task due
              dates from the task list.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
