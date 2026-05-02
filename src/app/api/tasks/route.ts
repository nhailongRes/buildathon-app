import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createTask, getTasksByUser } from '@/lib/tasks'
import { DEMO_USER_ID } from '@/lib/demo-user'

const CreateTaskBody = z.object({
  title: z.string().trim().min(1, 'title is required'),
  subject: z.string().trim().optional(),
  dueDate: z.string().trim().optional(),
  scratchpadContent: z.string().trim().optional(),
})

export async function GET() {
  const tasks = await getTasksByUser(DEMO_USER_ID)
  return NextResponse.json(tasks)
}

export async function POST(request: Request) {
  const parsed = CreateTaskBody.safeParse(await request.json().catch(() => null))

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Invalid task.'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const { title, subject, dueDate, scratchpadContent } = parsed.data
  const parsedDueDate = dueDate ? new Date(dueDate) : undefined

  if (parsedDueDate && Number.isNaN(parsedDueDate.getTime())) {
    return NextResponse.json({ error: 'dueDate is invalid' }, { status: 400 })
  }

  const task = await createTask({
    userId: DEMO_USER_ID,
    title,
    subject: subject || undefined,
    dueDate: parsedDueDate,
    scratchpadContent: scratchpadContent || undefined,
  })

  return NextResponse.json(task, { status: 201 })
}
