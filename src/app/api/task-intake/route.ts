import { anthropic } from '@ai-sdk/anthropic'
import { openai } from '@ai-sdk/openai'
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

const DEFAULT_OPENAI_MODEL = 'gpt-5.4-mini'
const DEFAULT_ANTHROPIC_MODEL = 'claude-sonnet-4-6'

function currentSydneyDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Australia/Sydney',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function getTaskIntakeModel() {
  if (process.env.OPENAI_API_KEY) {
    return openai(process.env.OPENAI_MODEL ?? DEFAULT_OPENAI_MODEL)
  }

  if (process.env.ANTHROPIC_API_KEY) {
    return anthropic(process.env.ANTHROPIC_MODEL ?? DEFAULT_ANTHROPIC_MODEL)
  }

  return null
}

export async function POST(request: Request) {
  const parsed = taskIntakeRequestSchema.safeParse(await request.json().catch(() => null))

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid chat messages.' }, { status: 400 })
  }

  const model = getTaskIntakeModel()

  if (!model) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY or ANTHROPIC_API_KEY is required.' },
      { status: 503 },
    )
  }

  try {
    const result = await generateObject({
      model,
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
