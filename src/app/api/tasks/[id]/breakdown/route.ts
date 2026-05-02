import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getTaskById, archiveMicroSteps, createMicroSteps } from '@/lib/tasks'

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
    const { scratchpadContent, energyLevel } = body

    const dueDate = task.dueDate ? new Date(task.dueDate) : null
    const daysUntilDue = dueDate ? Math.ceil((dueDate.getTime() - Date.now()) / 86400000) : null
    const urgency = daysUntilDue === null ? 'no deadline'
      : daysUntilDue < 0 ? 'OVERDUE'
      : daysUntilDue === 0 ? 'due TODAY'
      : `due in ${daysUntilDue} days`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: 'You are an expert study coach. Break tasks into exactly 3 Pomodoro sessions. Be specific and actionable.',
      messages: [{
        role: 'user',
        content: `Break this task into exactly 3 focused study sessions.

TASK: "${task.title}"
SUBJECT: ${task.subject || 'General'}
DEADLINE: ${urgency}
NOTES: ${scratchpadContent || 'No notes'}
ENERGY: ${energyLevel || 'medium'}

Respond with ONLY valid JSON:
{"totalEstimatedMinutes":75,"complexity":"medium","steps":[{"title":"step 1","estimatedMinutes":25},{"title":"step 2","estimatedMinutes":25},{"title":"step 3","estimatedMinutes":25}]}`
      }]
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    const steps = parsed.steps.slice(0, 3)

    await archiveMicroSteps(task.id)
    await createMicroSteps(task.id, steps)

    return NextResponse.json({
      steps,
      totalEstimatedMinutes: parsed.totalEstimatedMinutes,
      complexity: parsed.complexity,
    })
  } catch (error) {
    console.error('Breakdown error:', error)
    return NextResponse.json({ error: 'Failed to generate steps' }, { status: 500 })
  }
}
