'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CalendarDays,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
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
  scratchpadContent: string | null
}

export type CalendarTimetableEvent = {
  id: string
  title: string
  startAt: string
  endAt: string
  location: string | null
  description: string | null
}

export type CalendarPlannedBlock = {
  id: string
  taskId: string
  title: string
  subject: string | null
  startAt: string
  endAt: string
}

type CalendarDay = {
  date: Date
  key: string
}

type TaskSchedule = {
  startMinutes: number
  endMinutes: number
}

type ScheduledTask = CalendarTask & TaskSchedule

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

function blockTop(minutes: number) {
  return ((minutes - START_HOUR * 60) / 60) * HOUR_HEIGHT
}

function blockHeight(startMinutes: number, endMinutes: number) {
  return Math.max(((endMinutes - startMinutes) / 60) * HOUR_HEIGHT, 28)
}

function clockLabel(minutes: number) {
  const hour = Math.floor(minutes / 60)
  const minute = minutes % 60
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function toClockMinutes(hourValue: string, minuteValue: string) {
  const hour = Number(hourValue)
  const minute = Number(minuteValue)
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null
  return hour * 60 + minute
}

function naturalClockToMinutes(value: string) {
  const text = value.trim().toLowerCase()
  const ampmMatch = text.match(/^(\d{1,2})(?::([0-5]\d))?\s*(am|pm)$/)

  if (ampmMatch) {
    let hour = Number(ampmMatch[1])
    const minute = Number(ampmMatch[2] ?? '0')
    if (hour < 1 || hour > 12) return null
    if (ampmMatch[3] === 'pm' && hour !== 12) hour += 12
    if (ampmMatch[3] === 'am' && hour === 12) hour = 0
    return hour * 60 + minute
  }

  const twentyFourHourMatch = text.match(/^([01]?\d|2[0-3]):([0-5]\d)$/)
  if (!twentyFourHourMatch) return null
  return toClockMinutes(twentyFourHourMatch[1], twentyFourHourMatch[2])
}

function parseExplicitTaskTime(text: string): Partial<TaskSchedule> | null {
  const scheduledMatch = text.match(
    /scheduled time:\s*([01]?\d|2[0-3]):([0-5]\d)(?:\s*[-–]\s*([01]?\d|2[0-3]):([0-5]\d))?/i,
  )

  if (scheduledMatch) {
    const startMinutes = toClockMinutes(scheduledMatch[1], scheduledMatch[2])
    const endMinutes =
      scheduledMatch[3] && scheduledMatch[4]
        ? toClockMinutes(scheduledMatch[3], scheduledMatch[4])
        : null

    if (startMinutes !== null) {
      return {
        startMinutes,
        ...(endMinutes !== null && endMinutes > startMinutes ? { endMinutes } : {}),
      }
    }
  }

  const naturalTimes = Array.from(
    text.matchAll(/\b((?:[01]?\d|2[0-3]):[0-5]\d|(?:1[0-2]|0?[1-9])(?::[0-5]\d)?\s*(?:am|pm))\b/gi),
  )
    .map((match) => naturalClockToMinutes(match[1]))
    .filter((minutes): minutes is number => minutes !== null)

  if (naturalTimes.length === 0) return null

  const [startMinutes, possibleEndMinutes] = naturalTimes
  return {
    startMinutes,
    ...(possibleEndMinutes !== undefined && possibleEndMinutes > startMinutes
      ? { endMinutes: possibleEndMinutes }
      : {}),
  }
}

function defaultDurationForTask(task: CalendarTask) {
  const text = `${task.title} ${task.subject ?? ''} ${task.scratchpadContent ?? ''}`
  return /\b(dinner|lunch|breakfast|brunch|meal|social|party|catch up|meet)\b/i.test(text)
    ? 90
    : 60
}

function getTaskSchedule(task: CalendarTask): TaskSchedule | null {
  if (!task.dueDate) return null

  const text = `${task.scratchpadContent ?? ''}\n${task.title}`
  const parsed = parseExplicitTaskTime(text)
  if (!parsed || parsed.startMinutes === undefined) return null

  const endMinutes =
    parsed.endMinutes ?? Math.min(parsed.startMinutes + defaultDurationForTask(task), 24 * 60)

  return {
    startMinutes: parsed.startMinutes,
    endMinutes,
  }
}

function plural(count: number, singular: string, pluralLabel = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralLabel}`
}

export function CalendarView({
  tasks,
  events,
  plannedBlocks,
}: {
  tasks: CalendarTask[]
  events: CalendarTimetableEvent[]
  plannedBlocks: CalendarPlannedBlock[]
}) {
  const router = useRouter()
  const today = useMemo(() => new Date(), [])
  const todayKey = dayKey(today)
  const [weekStartKey, setWeekStartKey] = useState(dayKey(startOfWeek(today)))
  const [selectedDayKey, setSelectedDayKey] = useState(todayKey)
  const [planning, setPlanning] = useState(false)
  const [planMessage, setPlanMessage] = useState<string | null>(null)
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
    const dueTasks = new Map<string, CalendarTask[]>()
    const scheduledTasks = new Map<string, ScheduledTask[]>()

    for (const task of tasks) {
      if (!task.dueDate) continue
      const key = dayKey(new Date(task.dueDate))
      const schedule = getTaskSchedule(task)

      if (schedule) {
        scheduledTasks.set(key, [
          ...(scheduledTasks.get(key) ?? []),
          { ...task, ...schedule },
        ])
        continue
      }

      dueTasks.set(key, [...(dueTasks.get(key) ?? []), task])
    }

    for (const [key, dayTasks] of scheduledTasks) {
      scheduledTasks.set(
        key,
        [...dayTasks].sort((a, b) => a.startMinutes - b.startMinutes),
      )
    }

    return { dueTasks, scheduledTasks }
  }, [tasks])

  const plannedBlocksByDay = useMemo(() => {
    const grouped = new Map<string, CalendarPlannedBlock[]>()
    for (const block of plannedBlocks) {
      const key = dayKey(new Date(block.startAt))
      grouped.set(key, [...(grouped.get(key) ?? []), block])
    }

    for (const [key, dayBlocks] of grouped) {
      grouped.set(
        key,
        [...dayBlocks].sort(
          (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
        ),
      )
    }

    return grouped
  }, [plannedBlocks])

  const plannedTaskIds = useMemo(() => {
    const ids = new Set<string>()
    for (const block of plannedBlocks) {
      if (new Date(block.endAt) >= today) ids.add(block.taskId)
    }
    return ids
  }, [plannedBlocks, today])

  const unscheduledTasks = useMemo(
    () => tasks.filter((task) => !task.dueDate && !plannedTaskIds.has(task.id)).slice(0, 6),
    [plannedTaskIds, tasks],
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
  const selectedDueTasks = tasksByDay.dueTasks.get(selectedDayKey) ?? []
  const selectedScheduledTasks = tasksByDay.scheduledTasks.get(selectedDayKey) ?? []
  const selectedPlannedBlocks = plannedBlocksByDay.get(selectedDayKey) ?? []
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

  async function planWeek() {
    setPlanning(true)
    setPlanMessage(null)

    try {
      const response = await fetch('/api/schedule/week', { method: 'POST' })
      const data = (await response.json().catch(() => ({}))) as {
        plannedCount?: number
        replacedBlockCount?: number
        skippedTasks?: Array<{ title: string }>
        error?: string
      }

      if (!response.ok) {
        setPlanMessage(data.error ?? `Planning failed (HTTP ${response.status}).`)
        return
      }

      const plannedCount = data.plannedCount ?? 0
      const skippedCount = data.skippedTasks?.length ?? 0
      const replacedCount = data.replacedBlockCount ?? 0
      const replacedText = replacedCount > 0 ? ` Replaced ${plural(replacedCount, 'older block')}.` : ''
      const skippedText = skippedCount > 0 ? ` ${plural(skippedCount, 'task')} still needs a slot.` : ''

      setPlanMessage(`Planned ${plural(plannedCount, 'task block')}.${replacedText}${skippedText}`)
      router.refresh()
    } catch (error) {
      setPlanMessage(error instanceof Error ? error.message : 'Planning failed.')
    } finally {
      setPlanning(false)
    }
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
          const dayDueTasks = tasksByDay.dueTasks.get(day.key) ?? []
          const dayScheduledTasks = tasksByDay.scheduledTasks.get(day.key) ?? []
          const dayPlannedBlocks = plannedBlocksByDay.get(day.key) ?? []
          const isSelected = day.key === selectedDayKey
          const isToday = sameDayKey(day.date, today)
          const dayPreviewItems = [
            ...dayEvents.map((event) => ({
              id: `event-${event.id}`,
              label: `${timeLabel(new Date(event.startAt))} ${event.title}`,
              startMinutes: minutesSinceStartOfDay(new Date(event.startAt)),
              className: 'bg-sky-50 text-sky-700',
            })),
            ...dayScheduledTasks.map((task) => ({
              id: `task-${task.id}`,
              label: `${clockLabel(task.startMinutes)} ${task.title}`,
              startMinutes: task.startMinutes,
              className: 'bg-amber-50 text-amber-800',
            })),
            ...dayPlannedBlocks.map((block) => ({
              id: `plan-${block.id}`,
              label: `${timeLabel(new Date(block.startAt))} ${block.title}`,
              startMinutes: minutesSinceStartOfDay(new Date(block.startAt)),
              className: 'bg-emerald-50 text-emerald-800',
            })),
          ].sort((a, b) => a.startMinutes - b.startMinutes)
          const scheduledHours =
            Math.round(
              dayEvents.reduce((sum, event) => {
                return (
                  sum +
                  durationMinutes(new Date(event.startAt), new Date(event.endAt))
                )
              }, 0) / 6,
            ) / 10
          const displayedPreviewCount =
            Math.min(dayPreviewItems.length, 3) + Math.min(dayDueTasks.length, 2)
          const totalPreviewCount = dayPreviewItems.length + dayDueTasks.length

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
                {dayScheduledTasks.length > 0
                  ? `, ${plural(dayScheduledTasks.length, 'scheduled task')}`
                  : ''}
                {dayPlannedBlocks.length > 0
                  ? `, ${plural(dayPlannedBlocks.length, 'planned block')}`
                  : ''}
                {dayDueTasks.length > 0 ? `, ${plural(dayDueTasks.length, 'due task')}` : ''}
              </div>

              <div className="flex flex-col gap-1">
                {dayPreviewItems.slice(0, 3).map((item) => (
                  <span
                    key={item.id}
                    className={cn('truncate rounded px-2 py-1 text-xs', item.className)}
                  >
                    {item.label}
                  </span>
                ))}
                {dayDueTasks.slice(0, 2).map((task) => (
                  <span
                    key={task.id}
                    className="truncate rounded bg-amber-50 px-2 py-1 text-xs text-amber-800"
                  >
                    Due {task.title}
                  </span>
                ))}
                {totalPreviewCount > displayedPreviewCount ? (
                  <span className="text-xs text-muted-foreground">
                    +{totalPreviewCount - displayedPreviewCount} more
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
              {plural(selectedEvents.length, 'timetable block')},{' '}
              {plural(selectedScheduledTasks.length, 'scheduled task')},{' '}
              {plural(selectedPlannedBlocks.length, 'planned block')}, and{' '}
              {plural(selectedDueTasks.length, 'due task')}.
            </p>
          </div>

          {selectedDueTasks.length > 0 ? (
            <div className="border-b bg-amber-50/50 px-4 py-3">
              <p className="mb-2 text-xs font-semibold uppercase text-amber-900/70">
                Due tasks
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {selectedDueTasks.map((task) => (
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

              {selectedEvents.length === 0 &&
              selectedScheduledTasks.length === 0 &&
              selectedPlannedBlocks.length === 0 ? (
                <div className="absolute left-16 right-2 top-6 rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                  Nothing scheduled on the timeline for this day.
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

              {selectedScheduledTasks.map((task) => (
                <div
                  key={task.id}
                  className="absolute left-16 right-2 overflow-hidden rounded-md border-l-4 border-amber-500 bg-amber-50 px-3 py-2 shadow-sm"
                  style={{
                    top: Math.max(blockTop(task.startMinutes), 0),
                    height: blockHeight(task.startMinutes, task.endMinutes),
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="truncate text-sm font-medium text-amber-950">
                      {task.title}
                    </p>
                    <span className="shrink-0 font-mono text-xs text-amber-800">
                      {clockLabel(task.startMinutes)}-{clockLabel(task.endMinutes)}
                    </span>
                  </div>
                  {task.subject ? (
                    <p className="mt-1 truncate text-xs text-amber-900/80">
                      {task.subject}
                    </p>
                  ) : null}
                </div>
              ))}

              {selectedPlannedBlocks.map((block) => {
                const startAt = new Date(block.startAt)
                const endAt = new Date(block.endAt)
                return (
                  <div
                    key={block.id}
                    className="absolute left-16 right-2 overflow-hidden rounded-md border-l-4 border-emerald-500 bg-emerald-50 px-3 py-2 shadow-sm"
                    style={{
                      top: Math.max(eventTop(startAt), 0),
                      height: eventHeight(startAt, endAt),
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="truncate text-sm font-medium text-emerald-950">
                        {block.title}
                      </p>
                      <span className="shrink-0 font-mono text-xs text-emerald-800">
                        {timeLabel(startAt)}-{timeLabel(endAt)}
                      </span>
                    </div>
                    {block.subject ? (
                      <p className="mt-1 truncate text-xs text-emerald-900/80">
                        {block.subject}
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
            <div className="mb-3 flex items-start gap-2">
              <CalendarPlus className="mt-0.5 size-4 text-muted-foreground" />
              <div>
                <h3 className="font-semibold">Plan this week</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Place unscheduled tasks into open calendar slots.
                </p>
              </div>
            </div>
            <Button
              type="button"
              className="w-full"
              disabled={planning || unscheduledTasks.length === 0}
              onClick={planWeek}
            >
              {planning ? <Loader2 className="animate-spin" /> : <CalendarPlus />}
              {planning ? 'Planning...' : 'Plan week'}
            </Button>
            {planMessage ? (
              <p className="mt-3 text-sm text-muted-foreground">{planMessage}</p>
            ) : null}
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="mb-3 flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" />
              <h3 className="font-semibold">Unscheduled tasks</h3>
            </div>
            {unscheduledTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Every task has a due date or a planned block.
              </p>
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
              Blue blocks come from imported timetable events. Amber blocks are scheduled
              tasks or due dates from the task list. Green blocks are auto-planned work
              sessions.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
