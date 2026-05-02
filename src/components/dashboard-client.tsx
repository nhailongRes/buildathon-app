'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { NewTaskModal } from '@/components/new-task-modal'
import { TaskCard } from '@/components/task-card'
import type { Task } from '@/lib/tasks'

export function DashboardClient({ initialTasks }: { initialTasks: Task[] }) {
  const [modalOpen, setModalOpen] = useState(false)
  const router = useRouter()

  async function handleCreate(data: {
    title: string
    subject?: string
    dueDate?: string
  }) {
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">My Tasks</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/timetable">Timetable</Link>
          </Button>
          <Button onClick={() => setModalOpen(true)}>New Task</Button>
        </div>
      </div>

      {initialTasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center">
          <p className="text-zinc-500">No tasks yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {initialTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}

      <NewTaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  )
}
