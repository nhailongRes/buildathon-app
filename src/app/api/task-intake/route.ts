import { anthropic } from '@ai-sdk/anthropic'
import { generateObject } from 'ai'
import { NextResponse } from 'next/server'
import {
  taskIntakeRequestSchema,
  taskIntakeResponseSchema,
} from '@/lib/task-intake'
import {
  buildTaskIntakePrompt,
  TASK_INTAKE_SYSTEM_PROMPT,
} from '@/lib/ai/prompts/task-intake'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function currentSydneyDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Australia/Sydney',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export async function POST(request: Request) {
  const parsed = taskIntakeRequestSchema.safeParse(await request.json().catch(() => null))

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid chat messages.' }, { status: 400 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not configured.' },
      { status: 503 },
    )
  }

  try {
    const result = await generateObject({
      model: anthropic('claude-sonnet-4-6'),
      system: TASK_INTAKE_SYSTEM_PROMPT,
      prompt: buildTaskIntakePrompt({
        messages: parsed.data.messages,
        currentDate: currentSydneyDate(),
      }),
      schema: taskIntakeResponseSchema,
      schemaName: 'task_intake_response',
    })

    return NextResponse.json(result.object)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Task intake failed.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
