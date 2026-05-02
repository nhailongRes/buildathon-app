import { getEventsForNextDays } from '@/lib/timetable'
import { TimetablePasteForm } from '@/components/timetable-paste-form'
import { TimetableWeekView } from '@/components/timetable-week-view'
import { Card, CardContent } from '@/components/ui/card'
import { DEMO_USER_ID } from '@/lib/demo-user'

export const dynamic = 'force-dynamic'

export default async function TimetablePage() {
  const events = await getEventsForNextDays(DEMO_USER_ID, 7)

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Timetable</h1>
        <p className="text-sm text-muted-foreground">
          Paste your ANU MyTimetable link to see the next 7 days. AI study suggestions slot in around these
          fixed events.
        </p>
      </header>

      <Card>
        <CardContent className="p-5">
          <TimetablePasteForm />
        </CardContent>
      </Card>

      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No events yet. Paste a timetable link above to get started.
        </p>
      ) : (
        <section className="flex flex-col gap-4">
          <h2 className="text-base font-semibold">Next 7 days</h2>
          <TimetableWeekView events={events} />
        </section>
      )}
    </div>
  )
}
