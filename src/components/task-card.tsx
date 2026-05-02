import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import type { Task } from '@/lib/tasks'

function formatDueDate(date: Date): string {
  const d = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  d.setHours(0, 0, 0, 0)

  if (d.getTime() === today.getTime()) return 'Due today'
  if (d.getTime() === tomorrow.getTime()) return 'Due tomorrow'
  if (d < today) return 'Overdue'
  return `Due ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}

export function TaskCard({ task }: { task: Task }) {
  return (
    <Link
      href={`/tasks/${task.id}`}
      className="block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-zinc-900">{task.title}</h3>
        {task.subject && (
          <Badge variant="secondary" className="shrink-0 text-xs">
            {task.subject}
          </Badge>
        )}
      </div>
      {task.dueDate && (
        <p className="mt-1 text-sm text-zinc-500">{formatDueDate(task.dueDate)}</p>
      )}
    </Link>
  )
}
