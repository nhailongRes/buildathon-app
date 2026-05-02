import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getTaskById } from '@/lib/tasks'

const client = new Anthropic()

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const task = await getTaskById(id)
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

    const body = await request.json()
    const { scratchpadContent } = body

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `Estimate the total study time needed for this task.

TASK: "${task.title}"
SUBJECT: ${task.subject || 'General'}
NOTES: ${scratchpadContent || 'No notes'}

Respond with ONLY valid JSON:
{"totalEstimatedMinutes":75,"complexity":"medium","reasoning":"Brief explanation why"}`
      }]
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Estimate error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
