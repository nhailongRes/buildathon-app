'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Scratchpad } from '@/components/scratchpad'
import type { Task } from '@/lib/tasks'

export function TaskClient({ task }: { task: Task }) {
  async function handleSave(content: string) {
    await fetch(`/api/tasks/${task.id}/scratchpad`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6">
        <Link href="/dashboard" className="mb-4 block text-sm text-zinc-400 hover:text-zinc-600">
          ← Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-zinc-900">{task.title}</h1>
          {task.subject && (
            <Badge variant="secondary">{task.subject}</Badge>
          )}
        </div>
        {task.dueDate && (
          <p className="mt-1 text-sm text-zinc-500">
            Due {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        )}
      </div>

      <Scratchpad
        taskId={task.id}
        initialContent={task.scratchpadContent}
        onSave={handleSave}
      />
    </div>
  )
}
