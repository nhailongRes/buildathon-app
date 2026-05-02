import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { Task } from '@/lib/tasks'

function formatDue(date: Date): { label: string; className: string } {
  const d = new Date(new Date(date).setHours(0,0,0,0))
  const now = new Date(); now.setHours(0,0,0,0)
  const diff = Math.round((d.getTime() - now.getTime()) / 86400000)
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, className: 'text-destructive bg-destructive/10' }
  if (diff === 0) return { label: 'Due today', className: 'text-amber-600 bg-amber-50' }
  if (diff === 1) return { label: 'Due tomorrow', className: 'text-orange-600 bg-orange-50' }
  return { label: `Due ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`, className: 'text-muted-foreground bg-muted' }
}

export function TaskCard({ task }: { task: Task }) {
  const due = task.dueDate ? formatDue(task.dueDate) : null

  return (
    <Link href={`/tasks/${task.id}`}>
      <Card className="cursor-pointer bg-background transition-all hover:border-foreground/20 hover:shadow-sm">
        <CardContent className="flex min-h-20 items-center gap-4 p-4">
          <div className="flex-1 min-w-0">
            <p className="truncate font-medium text-foreground">{task.title}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {task.subject && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                  {task.subject}
                </span>
              )}
              {due && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${due.className}`}>
                  {due.label}
                </span>
              )}
            </div>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  )
}
