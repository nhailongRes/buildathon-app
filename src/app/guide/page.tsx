import Link from "next/link"
import {
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ListChecks,
  MessageSquareText,
  RefreshCw,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const workflow = [
  {
    icon: MessageSquareText,
    title: "Capture anything",
    description:
      "Use the chat window for study tasks, errands, appointments, dinner plans, part-time work, and other life commitments.",
  },
  {
    icon: Clock3,
    title: "Include timing details",
    description:
      "Write naturally, like \"work at 5pm tomorrow\" or \"finish the lab by Sunday\". The app uses those details when it creates tasks.",
  },
  {
    icon: CalendarDays,
    title: "Review the week",
    description:
      "Open the calendar to see fixed timetable blocks, timed personal tasks, due tasks, and planned study sessions together.",
  },
  {
    icon: Sparkles,
    title: "Plan open tasks",
    description:
      "Use Plan this week to place unscheduled tasks into realistic free time around classes and existing commitments.",
  },
]

const examples = [
  "I have dinner with Alex at 8pm tonight.",
  "I need to write a climate essay outline by Sunday.",
  "I am working 5pm to 9pm tomorrow.",
  "Plan two hours for my RAG assignment this week.",
]

const legend = [
  {
    label: "Timetable",
    detail: "Imported classes and fixed calendar events.",
    className: "border-sky-200 bg-sky-50 text-sky-800",
  },
  {
    label: "Scheduled",
    detail: "Tasks with a clear time, such as dinner at 8pm.",
    className: "border-indigo-200 bg-indigo-50 text-indigo-800",
  },
  {
    label: "Planned",
    detail: "Tasks placed by the weekly planner.",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  {
    label: "Due",
    detail: "Tasks with a deadline but no exact working slot yet.",
    className: "border-amber-200 bg-amber-50 text-amber-800",
  },
]

const roadmap = [
  {
    icon: RefreshCw,
    title: "Smarter rescheduling",
    description:
      "Move unfinished work automatically when plans change, while protecting fixed events and personal time.",
  },
  {
    icon: ListChecks,
    title: "Richer task breakdowns",
    description:
      "Turn large goals into smaller steps with clearer effort estimates, dependencies, and progress tracking.",
  },
  {
    icon: CalendarCheck,
    title: "Calendar sync",
    description:
      "Connect Google Calendar, Apple Calendar, or Outlook so the weekly plan follows the tools students already use.",
  },
  {
    icon: CheckCircle2,
    title: "Daily review",
    description:
      "Summarize what was completed, what slipped, and what should be prioritized next.",
  },
]

export default function GuidePage() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50/60">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-base font-semibold tracking-tight">
            AI Study Planner
          </Link>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/dashboard/calendar">Open calendar</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 py-10 sm:px-6">
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Guide
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Balance study, life, and deadlines in one weekly plan.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              This planner is built for students who need more than a homework list. Add
              classes, assignments, work shifts, meals, appointments, and revision sessions,
              then use the calendar to keep the week realistic.
            </p>
          </div>
          <Card className="border-border bg-background">
            <CardContent className="p-5">
              <p className="text-sm font-medium text-foreground">Best demo flow</p>
              <ol className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-3">
                  <span className="font-semibold text-foreground">1.</span>
                  <span>Add a timed personal task through chat.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-foreground">2.</span>
                  <span>Open the calendar and confirm it lands in the right slot.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-foreground">3.</span>
                  <span>Run Plan this week for remaining unscheduled tasks.</span>
                </li>
              </ol>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {workflow.map((item) => (
            <Card key={item.title} className="bg-background">
              <CardContent className="flex h-full flex-col gap-3 p-5">
                <div className="flex size-10 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
                  <item.icon className="size-5" />
                </div>
                <h2 className="text-base font-semibold">{item.title}</h2>
                <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="rounded-lg border border-border bg-background p-6">
            <h2 className="text-xl font-semibold tracking-tight">Try these chat prompts</h2>
            <div className="mt-5 grid gap-3">
              {examples.map((example) => (
                <div
                  key={example}
                  className="rounded-md border border-border bg-zinc-50 px-4 py-3 text-sm text-foreground"
                >
                  {example}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-background p-6">
            <h2 className="text-xl font-semibold tracking-tight">Calendar colors</h2>
            <div className="mt-5 grid gap-3">
              {legend.map((item) => (
                <div key={item.label} className="flex gap-3">
                  <span
                    className={`mt-0.5 inline-flex h-6 shrink-0 items-center rounded-md border px-2 text-xs font-medium ${item.className}`}
                  >
                    {item.label}
                  </span>
                  <p className="text-sm leading-6 text-muted-foreground">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-background p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Future Plans
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Where the product can go next</h2>
            </div>
            <Button variant="outline" asChild>
              <Link href="/dashboard/calendar">
                Start planning
                <ArrowRight />
              </Link>
            </Button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {roadmap.map((item) => (
              <div key={item.title} className="flex gap-4 rounded-md border border-border p-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <item.icon className="size-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
