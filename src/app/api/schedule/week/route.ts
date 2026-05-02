import { NextResponse } from 'next/server'
import { planWeekForUser } from '@/lib/task-schedule'
import { DEMO_USER_ID } from '@/lib/demo-user'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const result = await planWeekForUser(DEMO_USER_ID)

    return NextResponse.json({
      plannedCount: result.createdBlocks.length,
      replacedBlockCount: result.replacedBlockCount,
      skippedTasks: result.skippedTasks,
      blocks: result.createdBlocks.map((block) => ({
        id: block.id,
        taskId: block.taskId,
        title: block.task.title,
        subject: block.task.subject,
        startAt: block.startAt.toISOString(),
        endAt: block.endAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Week planning error:', error)
    return NextResponse.json({ error: 'Failed to plan the week.' }, { status: 500 })
  }
}
