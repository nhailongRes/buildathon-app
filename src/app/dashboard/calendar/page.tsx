import { CalendarView, type CalendarTask, type CalendarTimetableEvent } from '@/components/calendar-view'
import { TimetablePasteForm } from '@/components/timetable-paste-form'
import { Card, CardContent } from '@/components/ui/card'
import { getEventsForRange } from '@/lib/timetable'
import { getTasksByUser } from '@/lib/tasks'

export const dynamic = 'force-dynamic'

// Hardcoded for demo - replaced with real auth in a later slice
const DEMO_USER_ID = 'demo-user-1'

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
  const [tasks, events] = await Promise.all([
    getTasksByUser(DEMO_USER_ID),
    getEventsForRange(DEMO_USER_ID, rangeStart, rangeEnd),
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

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <p className="text-sm text-muted-foreground">
          Review due tasks alongside imported ANU MyTimetable events.
        </p>
      </header>

      <Card>
        <CardContent className="p-5">
          <TimetablePasteForm />
        </CardContent>
      </Card>

      <CalendarView tasks={calendarTasks} events={calendarEvents} />
    </div>
  )
}
