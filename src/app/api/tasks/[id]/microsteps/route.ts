import { NextResponse } from 'next/server'
import { getMicroStepsByTask } from '@/lib/tasks'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const steps = await getMicroStepsByTask(id)
  return NextResponse.json(steps)
}