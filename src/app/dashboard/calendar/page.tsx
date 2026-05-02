import Link from 'next/link'
import {
  CalendarView,
  type CalendarPlannedBlock,
  type CalendarTask,
  type CalendarTimetableEvent,
} from '@/components/calendar-view'
import { TimetablePasteForm } from '@/components/timetable-paste-form'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getEventsForRange } from '@/lib/timetable'
import { getTasksByUser } from '@/lib/tasks'
import { getScheduleBlocksForRange } from '@/lib/task-schedule'
import { DEMO_USER_ID } from '@/lib/demo-user'

export const dynamic = 'force-dynamic'

function startOfWeek(date: Date) {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const day = start.getDay()
  const diff = day === 0 ? -6 : 1 - day
  start.setDate(start.getDate() + diff)
  return start
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export default async function CalendarPage() {
  const rangeStart = addDays(startOfWeek(new Date()), -7)
  const rangeEnd = addDays(rangeStart, 56)
  const [tasks, events, plannedBlocks] = await Promise.all([
    getTasksByUser(DEMO_USER_ID),
    getEventsForRange(DEMO_USER_ID, rangeStart, rangeEnd),
    getScheduleBlocksForRange(DEMO_USER_ID, rangeStart, rangeEnd),
  ])

  const calendarTasks: CalendarTask[] = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    subject: task.subject,
    dueDate: task.dueDate?.toISOString() ?? null,
    scratchpadContent: task.scratchpadContent,
  }))

  const calendarEvents: CalendarTimetableEvent[] = events.map((event) => ({
    id: event.id,
    title: event.title,
    startAt: event.startAt.toISOString(),
    endAt: event.endAt.toISOString(),
    location: event.location,
    description: event.description,
  }))

  const calendarPlannedBlocks: CalendarPlannedBlock[] = plannedBlocks.map((block) => ({
    id: block.id,
    taskId: block.taskId,
    title: block.task.title,
    subject: block.task.subject,
    startAt: block.startAt.toISOString(),
    endAt: block.endAt.toISOString(),
  }))

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="text-base font-semibold tracking-tight">AI Study Planner</Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">← Dashboard</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/timetable">Timetable</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-8 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review due tasks alongside your imported timetable events.
          </p>
        </div>

        <Card>
          <CardContent className="p-5">
            <TimetablePasteForm />
          </CardContent>
        </Card>

        <CalendarView
          tasks={calendarTasks}
          events={calendarEvents}
          plannedBlocks={calendarPlannedBlocks}
        />
      </main>
    </div>
  )
}
