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
}): Promise<Task> {
  return prisma.task.create({ data })
}

export async function getTaskById(id: string): Promise<Task | null> {
  return prisma.task.findUnique({ where: { id } })
}

export async function updateScratchpad(id: string, content: string): Promise<void> {
  await prisma.task.update({ where: { id }, data: { scratchpadContent: content } })
}
export async function getMicroStepsByTask(taskId: string) {
  return prisma.microStep.findMany({
    where: { taskId, archived: false },
    orderBy: { order: 'asc' },
  })
}

export async function toggleMicroStep(stepId: string, completed: boolean) {
  return prisma.microStep.update({
    where: { id: stepId },
    data: { completed, completedAt: completed ? new Date() : null },
  })
}

export async function archiveMicroSteps(taskId: string) {
  await prisma.microStep.updateMany({
    where: { taskId, archived: false },
    data: { archived: true },
  })
}

export async function createMicroSteps(taskId: string, steps: Array<{ title: string; estimatedMinutes: number }>) {
  for (let i = 0; i < steps.length; i++) {
    await prisma.microStep.create({
      data: {
        taskId,
        title: steps[i].title,
        estimatedMinutes: steps[i].estimatedMinutes,
        order: i + 1,
      },
    })
  }
}
