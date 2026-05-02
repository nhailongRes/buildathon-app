import { NextResponse } from 'next/server'
import { toggleMicroStep } from '@/lib/tasks'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  const { stepId } = await params
  const { completed } = await request.json()
  
  await toggleMicroStep(stepId, completed)
  return NextResponse.json({ success: true })
}