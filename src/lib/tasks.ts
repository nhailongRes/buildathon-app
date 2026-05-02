import { prisma } from '@/lib/prisma'
import type { Task } from '@/generated/prisma/client'

export type { Task }

export async function getTasksByUser(userId: string): Promise<Task[]> {
  return prisma.task.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function createTask(data: {
  userId: string
  title: string
  subject?: string
  dueDate?: Date
  scratchpadContent?: string
}): Promise<Task> {
  return prisma.task.create({ data })
}

export async function getTaskById(id: string): Promise<Task | null> {
  return prisma.task.findUnique({ where: { id } })
}

export async function updateScratchpad(id: string, content: string): Promise<void> {
  await prisma.task.update({ where: { id }, data: { scratchpadContent: content } })
}
