'use client'

import { useState } from 'react'
import type { ComponentType } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  HelpCircle,
  ListTodo,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { NewTaskModal } from '@/components/new-task-modal'
import { TaskCard } from '@/components/task-card'
import { TaskIntakeChat } from '@/components/task-intake-chat'
import type { Task } from '@/lib/tasks'

function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function MetricCard({
  label,
  value,
  icon: Icon,
  urgent = false,
}: {
  label: string
  value: number
  icon: ComponentType<{ className?: string }>
  urgent?: boolean
}) {
  return (
    <Card className={urgent ? 'border-amber-200 bg-amber-50/60' : 'bg-card'}>
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        <div className={urgent ? 'rounded-md bg-amber-100 p-2 text-amber-700' : 'rounded-md bg-muted p-2 text-muted-foreground'}>
          <Icon className="size-4" />
        </div>
      </CardContent>
    </Card>
  )
}

function TaskSection({
  title,
  tasks,
  tone,
}: {
  title: string
  tasks: Task[]
  tone: 'danger' | 'today' | 'neutral'
}) {
  if (tasks.length === 0) return null

  const titleClass =
    tone === 'danger'
      ? 'text-destructive'
      : tone === 'today'
        ? 'text-amber-700'
        : 'text-muted-foreground'

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className={`text-xs font-semibold uppercase tracking-widest ${titleClass}`}>
          {title}
        </h2>
        <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
          {tasks.length}
        </span>
      </div>
      <div className="grid gap-2">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </section>
  )
}

export function DashboardClient({ initialTasks }: { initialTasks: Task[] }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [todayStart] = useState(() => startOfDay(new Date()))
  const router = useRouter()

  async function handleCreate(data: { title: string; subject?: string; dueDate?: string }) {
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    router.refresh()
  }

  const getDay = (date: Date) => startOfDay(date)
  const overdue = initialTasks.filter((task) => task.dueDate && getDay(task.dueDate) < todayStart)
  const today = initialTasks.filter(
    (task) => task.dueDate && getDay(task.dueDate).getTime() === todayStart.getTime(),
  )
  const upcoming = initialTasks.filter(
    (task) => !task.dueDate || getDay(task.dueDate) > todayStart,
  )

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50/50">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-base font-semibold tracking-tight">
            AI Study Planner
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/guide">
                <HelpCircle />
                Guide
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/calendar">
                <CalendarDays />
                Calendar
              </Link>
            </Button>
            <Button size="sm" onClick={() => setModalOpen(true)}>
              <Plus />
              New Task
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Dashboard
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Today&apos;s plan</h1>
          </div>
          <p className="max-w-md text-sm text-muted-foreground">
            Balance life, study, deadlines, and fixed calendar blocks from one place.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
          <div className="space-y-6">
            <TaskIntakeChat />

            {initialTasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-background p-10 text-center">
                <div className="mx-auto mb-4 flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <ListTodo className="size-5" />
                </div>
                <h3 className="font-semibold text-foreground">No tasks yet</h3>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                  Capture the first thing that needs a slot in your week.
                </p>
                <Button className="mt-5" onClick={() => setModalOpen(true)}>
                  <Plus />
                  Add task
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <TaskSection title="Overdue" tasks={overdue} tone="danger" />
                <TaskSection title="Due Today" tasks={today} tone="today" />
                <TaskSection title="Upcoming" tasks={upcoming} tone="neutral" />
              </div>
            )}
          </div>

          <aside className="grid gap-3 sm:grid-cols-3 lg:sticky lg:top-20 lg:grid-cols-1">
            <MetricCard
              label="Overdue"
              value={overdue.length}
              icon={AlertTriangle}
              urgent={overdue.length > 0}
            />
            <MetricCard
              label="Due Today"
              value={today.length}
              icon={Clock3}
              urgent={today.length > 0}
            />
            <MetricCard label="Total Tasks" value={initialTasks.length} icon={CheckCircle2} />
          </aside>
        </div>
      </main>

      <NewTaskModal open={modalOpen} onClose={() => setModalOpen(false)} onCreate={handleCreate} />
    </div>
  )
}
