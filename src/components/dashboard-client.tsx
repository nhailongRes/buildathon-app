'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { NewTaskModal } from '@/components/new-task-modal'
import { TaskCard } from '@/components/task-card'
import type { Task } from '@/lib/tasks'

export function DashboardClient({ initialTasks }: { initialTasks: Task[] }) {
  const [modalOpen, setModalOpen] = useState(false)
  const router = useRouter()

  async function handleCreate(data: { title: string; subject?: string; dueDate?: string }) {
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    router.refresh()
  }

  const now = new Date(); now.setHours(0,0,0,0)
  const getDay = (d: Date) => new Date(new Date(d).setHours(0,0,0,0))
  const overdue = initialTasks.filter(t => t.dueDate && getDay(t.dueDate) < now)
  const today = initialTasks.filter(t => t.dueDate && getDay(t.dueDate).getTime() === now.getTime())
  const upcoming = initialTasks.filter(t => !t.dueDate || getDay(t.dueDate) > now)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-6">
          <Link href="/" className="text-base font-semibold tracking-tight">AI Study Planner</Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/calendar">📅 Calendar</Link>
            </Button>
            <Button size="sm" onClick={() => setModalOpen(true)}>+ New Task</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-6 py-10 flex-1">
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: 'Overdue', value: overdue.length, urgent: overdue.length > 0 },
            { label: 'Due Today', value: today.length, urgent: today.length > 0 },
            { label: 'Total Tasks', value: initialTasks.length, urgent: false },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-6 text-center">
                <p className={`text-4xl font-bold ${s.urgent ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {s.value}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {initialTasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-16 text-center">
            <p className="text-4xl mb-4">📚</p>
            <h3 className="font-semibold text-foreground">No tasks yet</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-6">Add a task and let AI break it into Pomodoro sessions</p>
            <Button onClick={() => setModalOpen(true)}>Add your first task</Button>
          </div>
        ) : (
          <div className="space-y-8">
            {overdue.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-destructive uppercase tracking-widest mb-3">Overdue</h2>
                <div className="space-y-2">{overdue.map(t => <TaskCard key={t.id} task={t} />)}</div>
              </section>
            )}
            {today.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-amber-600 uppercase tracking-widest mb-3">Due Today</h2>
                <div className="space-y-2">{today.map(t => <TaskCard key={t.id} task={t} />)}</div>
              </section>
            )}
            {upcoming.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Upcoming</h2>
                <div className="space-y-2">{upcoming.map(t => <TaskCard key={t.id} task={t} />)}</div>
              </section>
            )}
          </div>
        )}
      </main>

      <NewTaskModal open={modalOpen} onClose={() => setModalOpen(false)} onCreate={handleCreate} />
    </div>
  )
}
