import { prisma } from '@/lib/prisma'
import type { TimetableEvent } from '@/generated/prisma/client'
import type { ParsedEvent } from '@/lib/ical'

export type { TimetableEvent }

export async function getEventsForNextDays(
  userId: string,
  days: number,
): Promise<TimetableEvent[]> {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + days)

  return prisma.timetableEvent.findMany({
    where: {
      userId,
      startAt: { gte: start, lt: end },
    },
    orderBy: { startAt: 'asc' },
  })
}

export async function getEventsForRange(
  userId: string,
  start: Date,
  end: Date,
): Promise<TimetableEvent[]> {
  return prisma.timetableEvent.findMany({
    where: {
      userId,
      startAt: { gte: start, lt: end },
    },
    orderBy: { startAt: 'asc' },
  })
}

export async function upsertTimetableEvents(
  userId: string,
  sourceUrl: string,
  events: ParsedEvent[],
): Promise<number> {
  if (events.length === 0) return 0
  await prisma.$transaction(
    events.map((e) =>
      prisma.timetableEvent.upsert({
        where: { userId_uid: { userId, uid: e.uid } },
        create: {
          userId,
          uid: e.uid,
          title: e.title,
          startAt: e.startAt,
          endAt: e.endAt,
          location: e.location,
          description: e.description,
          sourceUrl,
        },
        update: {
          title: e.title,
          startAt: e.startAt,
          endAt: e.endAt,
          location: e.location,
          description: e.description,
          sourceUrl,
        },
      }),
    ),
  )
  return events.length
}
