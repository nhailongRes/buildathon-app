import { NextResponse } from 'next/server'
import { getTaskById, updateScratchpad } from '@/lib/tasks'
import { DEMO_USER_ID } from '@/lib/demo-user'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { content } = body

  if (typeof content !== 'string') {
    return NextResponse.json({ error: 'content must be a string' }, { status: 400 })
  }

  const task = await getTaskById(id)
  if (!task || task.userId !== DEMO_USER_ID) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  await updateScratchpad(id, content)
  return NextResponse.json({ ok: true })
}
