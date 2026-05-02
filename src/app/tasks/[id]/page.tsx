import { notFound } from 'next/navigation'
import { getTaskById } from '@/lib/tasks'
import { TaskClient } from '@/components/task-client'

export default async function TaskPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const task = await getTaskById(id)

  if (!task) notFound()

  return <TaskClient task={task} />
}
