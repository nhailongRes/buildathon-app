import Link from "next/link"
import {
  Calendar,
  Sparkles,
  Timer,
  GitBranch,
  Zap,
  BarChart2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const features = [
  {
    icon: Calendar,
    title: "Timetable Sync",
    description:
      "Paste your university timetable link and your classes are blocked out automatically — no manual entry.",
  },
  {
    icon: Sparkles,
    title: "AI Scheduling",
    description:
      "AI estimates how long each task takes and finds the best free slots around your lectures and commitments.",
  },
  {
    icon: Timer,
    title: "Pomodoro Breakdown",
    description:
      "Big assignments get split into focused 25-minute sessions, making overwhelming work feel achievable.",
  },
  {
    icon: GitBranch,
    title: "Task Dependencies",
    description:
      "Visualize how your tasks connect — see what to tackle first and how everything fits together.",
  },
  {
    icon: Zap,
    title: "Energy-Aware Planning",
    description:
      "Set your energy level each morning and your daily plan adjusts to match how you actually feel.",
  },
  {
    icon: BarChart2,
    title: "Daily Summary",
    description:
      "Get an AI recap of your day — what you did, what you skipped, and whether it was a productive day.",
  },
]

const steps = [
  {
    number: "01",
    title: "Sync your timetable",
    description: "Paste your uni calendar link. Your classes and fixed events are imported instantly.",
  },
  {
    number: "02",
    title: "Tell AI your tasks",
    description: "Type what you need to do in plain language. AI reads it, confirms with you, and adds it to your plan.",
  },
  {
    number: "03",
    title: "Get your plan",
    description: "AI schedules everything into your free time, respecting your energy and the tasks you can't move.",
  },
]

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <span className="text-base font-semibold tracking-tight">AI Study Planner</span>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">Get started</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        {/* Hero */}
        <section className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-6 py-24 text-center md:py-32">
          <span className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            AI-powered • Pomodoro-first • Energy-aware
          </span>
          <h1 className="max-w-3xl text-5xl font-bold tracking-tight md:text-7xl">
            Plan smarter.
            <br />
            Study better.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Sync your timetable, set your energy, and let AI build a realistic study schedule —
            broken into focused sessions with built-in breaks.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/signup">Get started for free</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="#how-it-works">See how it works</Link>
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="bg-muted/40 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold tracking-tight">Everything you need to stay on track</h2>
              <p className="mt-3 text-muted-foreground">
                Built for students who have too much to do and not enough time.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Card key={feature.title} className="bg-background">
                  <CardContent className="flex flex-col gap-3 p-6">
                    <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-muted">
                      <feature.icon className="size-5 text-foreground" />
                    </div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold tracking-tight">How it works</h2>
              <p className="mt-3 text-muted-foreground">From zero to a full weekly plan in minutes.</p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {steps.map((step) => (
                <div key={step.number} className="flex flex-col gap-3">
                  <span className="text-4xl font-bold text-muted-foreground/30">{step.number}</span>
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="bg-foreground py-20 text-background">
          <div className="mx-auto max-w-6xl px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Ready to plan smarter?</h2>
            <p className="mt-3 text-background/70">
              Join students who stopped guessing and started actually finishing their work.
            </p>
            <Button variant="secondary" size="lg" className="mt-8" asChild>
              <Link href="/signup">Get started for free</Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground sm:flex-row">
          <span className="font-medium text-foreground">AI Study Planner</span>
          <span>© {new Date().getFullYear()} All rights reserved.</span>
        </div>
      </footer>
    </div>
  )
}
