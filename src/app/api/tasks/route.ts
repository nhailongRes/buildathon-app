import { NextResponse } from 'next/server'
import { createTask, getTasksByUser } from '@/lib/tasks'

// Hardcoded for demo — replaced with real auth in a later slice
const DEMO_USER_ID = 'demo-user-1'

export async function GET() {
  const tasks = await getTasksByUser(DEMO_USER_ID)
  return NextResponse.json(tasks)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { title, subject, dueDate } = body

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }

  const task = await createTask({
    userId: DEMO_USER_ID,
    title: title.trim(),
    subject: subject?.trim() || undefined,
    dueDate: dueDate ? new Date(dueDate) : undefined,
  })

  return NextResponse.json(task, { status: 201 })
}
