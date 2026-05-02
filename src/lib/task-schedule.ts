import { prisma } from '@/lib/prisma'
import type { Task, TaskScheduleBlock } from '@/generated/prisma/client'

export type { TaskScheduleBlock }

const TIME_ZONE = 'Australia/Sydney'
const AUTO_SOURCE = 'auto'
const PLAN_DAYS = 7
const MAX_TASKS_PER_PLAN = 8
const SLOT_STEP_MINUTES = 30

type BusyInterval = {
  startAt: Date
  endAt: Date
}

type PlannedBlockWithTask = TaskScheduleBlock & {
  task: {
    title: string
    subject: string | null
  }
}

type PlanCandidate = Task & {
  scheduleBlocks: { id: string }[]
}

type PlannedSlot = {
  task: PlanCandidate
  startAt: Date
  endAt: Date
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
  return { year, month, day }
}

function addDaysToKey(key: string, days: number) {
  const { year, month, day } = parseDateKey(key)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + days)
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function zonedParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)

  return {
    year: Number(parts.find((part) => part.type === 'year')?.value ?? 0),
    month: Number(parts.find((part) => part.type === 'month')?.value ?? 0),
    day: Number(parts.find((part) => part.type === 'day')?.value ?? 0),
    hour: Number(parts.find((part) => part.type === 'hour')?.value ?? 0),
    minute: Number(parts.find((part) => part.type === 'minute')?.value ?? 0),
  }
}

function zonedDateTime(dateKey: string, minutes: number) {
  const { year, month, day } = parseDateKey(dateKey)
  const hour = Math.floor(minutes / 60)
  const minute = minutes % 60
  const targetUtc = Date.UTC(year, month - 1, day, hour, minute)
  let guess = targetUtc

  for (let index = 0; index < 3; index += 1) {
    const parts = zonedParts(new Date(guess))
    const renderedUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
    )
    guess -= renderedUtc - targetUtc
  }

  return new Date(guess)
}

function startOfSydneyDay(date: Date) {
  return zonedDateTime(dayKey(date), 0)
}

function minutesSinceSydneyMidnight(date: Date) {
  const parts = zonedParts(date)
  return parts.hour * 60 + parts.minute
}

function roundUpToStep(minutes: number) {
  return Math.ceil(minutes / SLOT_STEP_MINUTES) * SLOT_STEP_MINUTES
}

function roundDuration(minutes: number) {
  return Math.min(
    Math.max(roundUpToStep(minutes), SLOT_STEP_MINUTES),
    90,
  )
}

function estimateTaskMinutes(task: Pick<Task, 'title' | 'subject' | 'scratchpadContent'>) {
  const text = `${task.title} ${task.subject ?? ''} ${task.scratchpadContent}`.toLowerCase()

  if (/\b(essay|report|assignment|project|buildathon|presentation|research)\b/.test(text)) {
    return 90
  }

  if (/\b(read|reading|revise|revision|study|practice|quiz|exam)\b/.test(text)) {
    return 60
  }

  if (/\b(grocery|groceries|errand|admin|email|call|chores?|laundry)\b/.test(text)) {
    return 45
  }

  return 60
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

  return Number(twentyFourHourMatch[1]) * 60 + Number(twentyFourHourMatch[2])
}

function parseExplicitTaskTime(text: string) {
  const scheduledMatch = text.match(
    /scheduled time:\s*([01]?\d|2[0-3]):([0-5]\d)(?:\s*[-–]\s*([01]?\d|2[0-3]):([0-5]\d))?/i,
  )

  if (scheduledMatch) {
    const startMinutes = Number(scheduledMatch[1]) * 60 + Number(scheduledMatch[2])
    const endMinutes =
      scheduledMatch[3] && scheduledMatch[4]
        ? Number(scheduledMatch[3]) * 60 + Number(scheduledMatch[4])
        : null

    return {
      startMinutes,
      endMinutes: endMinutes !== null && endMinutes > startMinutes ? endMinutes : null,
    }
  }

  const naturalTimes = Array.from(
    text.matchAll(/\b((?:[01]?\d|2[0-3]):[0-5]\d|(?:1[0-2]|0?[1-9])(?::[0-5]\d)?\s*(?:am|pm))\b/gi),
  )
    .map((match) => naturalClockToMinutes(match[1]))
    .filter((minutes): minutes is number => minutes !== null)

  if (naturalTimes.length === 0) return null

  return {
    startMinutes: naturalTimes[0],
    endMinutes: naturalTimes[1] && naturalTimes[1] > naturalTimes[0] ? naturalTimes[1] : null,
  }
}

function getTimedTaskInterval(task: Task): BusyInterval | null {
  if (!task.dueDate) return null

  const parsed = parseExplicitTaskTime(`${task.scratchpadContent}\n${task.title}`)
  if (!parsed) return null

  const dateKey = dayKey(task.dueDate)
  const startAt = zonedDateTime(dateKey, parsed.startMinutes)
  const endAt = zonedDateTime(dateKey, parsed.endMinutes ?? parsed.startMinutes + 60)
  return { startAt, endAt }
}

function dayWindows(dateKey: string) {
  const { year, month, day } = parseDateKey(dateKey)
  const localDay = new Date(year, month - 1, day).getDay()

  if (localDay === 0 || localDay === 6) {
    return [
      [10 * 60, 13 * 60],
      [14 * 60, 18 * 60],
    ] as const
  }

  return [
    [9 * 60, 12 * 60],
    [13 * 60, 17 * 60],
    [18 * 60 + 30, 21 * 60],
  ] as const
}

function addBusyInterval(grouped: Map<string, BusyInterval[]>, interval: BusyInterval) {
  const key = dayKey(interval.startAt)
  grouped.set(key, [...(grouped.get(key) ?? []), interval])
}

function overlaps(startAt: Date, endAt: Date, intervals: BusyInterval[]) {
  return intervals.some((interval) => startAt < interval.endAt && endAt > interval.startAt)
}

function findSlot({
  durationMinutes,
  busyByDay,
  now,
}: {
  durationMinutes: number
  busyByDay: Map<string, BusyInterval[]>
  now: Date
}) {
  const todayKey = dayKey(now)
  const nowMinutes = minutesSinceSydneyMidnight(now)

  for (let dayOffset = 0; dayOffset < PLAN_DAYS; dayOffset += 1) {
    const dateKey = addDaysToKey(todayKey, dayOffset)
    const minStart = dateKey === todayKey ? roundUpToStep(nowMinutes + 15) : 0

    for (const [windowStart, windowEnd] of dayWindows(dateKey)) {
      const firstStart = roundUpToStep(Math.max(windowStart, minStart))

      for (
        let startMinutes = firstStart;
        startMinutes + durationMinutes <= windowEnd;
        startMinutes += SLOT_STEP_MINUTES
      ) {
        const startAt = zonedDateTime(dateKey, startMinutes)
        const endAt = zonedDateTime(dateKey, startMinutes + durationMinutes)
        const intervals = busyByDay.get(dateKey) ?? []

        if (!overlaps(startAt, endAt, intervals)) {
          return { startAt, endAt }
        }
      }
    }
  }

  return null
}

export async function getScheduleBlocksForRange(
  userId: string,
  start: Date,
  end: Date,
): Promise<PlannedBlockWithTask[]> {
  return prisma.taskScheduleBlock.findMany({
    where: {
      userId,
      status: 'planned',
      startAt: { gte: start, lt: end },
    },
    include: {
      task: {
        select: {
          title: true,
          subject: true,
        },
      },
    },
    orderBy: { startAt: 'asc' },
  })
}

export async function planWeekForUser(userId: string) {
  const now = new Date()
  const rangeStart = startOfSydneyDay(now)
  const rangeEnd = zonedDateTime(addDaysToKey(dayKey(now), PLAN_DAYS), 0)

  const deleted = await prisma.taskScheduleBlock.deleteMany({
    where: {
      userId,
      source: AUTO_SOURCE,
      status: 'planned',
      startAt: { gte: rangeStart, lt: rangeEnd },
    },
  })

  const [tasks, timetableEvents, dateTasks, existingBlocks] = await Promise.all([
    prisma.task.findMany({
      where: {
        userId,
        dueDate: null,
      },
      include: {
        scheduleBlocks: {
          where: {
            status: 'planned',
            endAt: { gte: now },
            NOT: { source: AUTO_SOURCE },
          },
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: MAX_TASKS_PER_PLAN,
    }),
    prisma.timetableEvent.findMany({
      where: {
        userId,
        startAt: { gte: rangeStart, lt: rangeEnd },
      },
      orderBy: { startAt: 'asc' },
    }),
    prisma.task.findMany({
      where: {
        userId,
        dueDate: { gte: rangeStart, lt: rangeEnd },
      },
      orderBy: { dueDate: 'asc' },
    }),
    prisma.taskScheduleBlock.findMany({
      where: {
        userId,
        status: 'planned',
        startAt: { gte: rangeStart, lt: rangeEnd },
      },
      orderBy: { startAt: 'asc' },
    }),
  ])

  const busyByDay = new Map<string, BusyInterval[]>()

  for (const event of timetableEvents) {
    addBusyInterval(busyByDay, { startAt: event.startAt, endAt: event.endAt })
  }

  for (const block of existingBlocks) {
    addBusyInterval(busyByDay, { startAt: block.startAt, endAt: block.endAt })
  }

  for (const task of dateTasks) {
    const interval = getTimedTaskInterval(task)
    if (interval) addBusyInterval(busyByDay, interval)
  }

  const candidates = tasks.filter((task) => task.scheduleBlocks.length === 0)
  const planned: PlannedSlot[] = []
  const skippedTasks: Array<{ id: string; title: string; reason: string }> = []

  for (const task of candidates) {
    const durationMinutes = roundDuration(estimateTaskMinutes(task))
    const slot = findSlot({ durationMinutes, busyByDay, now })

    if (!slot) {
      skippedTasks.push({
        id: task.id,
        title: task.title,
        reason: 'No free slot found this week.',
      })
      continue
    }

    planned.push({ task, startAt: slot.startAt, endAt: slot.endAt })
    addBusyInterval(busyByDay, slot)
  }

  const createdBlocks = planned.length === 0
    ? []
    : await prisma.$transaction(
        planned.map((slot) =>
          prisma.taskScheduleBlock.create({
            data: {
              userId,
              taskId: slot.task.id,
              startAt: slot.startAt,
              endAt: slot.endAt,
              source: AUTO_SOURCE,
              status: 'planned',
            },
            include: {
              task: {
                select: {
                  title: true,
                  subject: true,
                },
              },
            },
          }),
        ),
      )

  return {
    createdBlocks,
    skippedTasks,
    replacedBlockCount: deleted.count,
  }
}
