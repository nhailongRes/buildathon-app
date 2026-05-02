'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Scratchpad } from '@/components/scratchpad'
import { MicroStepList } from '@/components/micro-step-list'
import type { Task } from '@/lib/tasks'

type Estimation = {
  totalEstimatedMinutes: number
  complexity: 'low' | 'medium' | 'high'
  reasoning: string
}

const complexityConfig = {
  low: { label: 'Low', color: 'text-green-600 bg-green-50 border-green-200' },
  medium: { label: 'Medium', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  high: { label: 'High', color: 'text-red-600 bg-red-50 border-red-200' },
}

function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

export function TaskClient({ task }: { task: Task }) {
  const [isBreakingDown, setIsBreakingDown] = useState(false)
  const [isEstimating, setIsEstimating] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [estimation, setEstimation] = useState<Estimation | null>(null)

  const dueDate = task.dueDate ? new Date(task.dueDate) : null
  const isOverdue = dueDate && new Date(dueDate).setHours(0,0,0,0) < new Date().setHours(0,0,0,0)
  const daysLeft = dueDate ? Math.ceil((dueDate.getTime() - Date.now()) / 86400000) : null

  async function handleEstimate() {
    setIsEstimating(true)
    setError('')
    try {
      const el = document.querySelector('textarea') as HTMLTextAreaElement
      const res = await fetch(`/api/tasks/${task.id}/estimate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scratchpadContent: el?.value || '' }),
      })
      if (res.ok) {
        const data = await res.json()
        setEstimation(data)
      } else {
        setError('Failed to estimate — please try again.')
      }
    } catch {
      setError('Network error.')
    } finally {
      setIsEstimating(false)
    }
  }

  async function handleBreakdown() {
    setIsBreakingDown(true)
    setError('')
    setSuccess(false)
    try {
      const el = document.querySelector('textarea') as HTMLTextAreaElement
      const res = await fetch(`/api/tasks/${task.id}/breakdown`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scratchpadContent: el?.value || '', energyLevel: 'medium' }),
      })
      if (res.ok) {
        const data = await res.json()
        setRefreshKey(prev => prev + 1)
        setSuccess(true)
        if (data.totalEstimatedMinutes) {
          setEstimation(prev => prev ? prev : {
            totalEstimatedMinutes: data.totalEstimatedMinutes,
            complexity: data.complexity,
            reasoning: '',
          })
        }
        setTimeout(() => setSuccess(false), 4000)
      } else {
        setError('Failed to generate — please try again.')
      }
    } catch {
      setError('Network error.')
    } finally {
      setIsBreakingDown(false)
    }
  }

  async function handleSave(content: string) {
    await fetch(`/api/tasks/${task.id}/scratchpad`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-6">
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Dashboard
          </Link>
          <div className="flex items-center gap-2">
            {task.subject && <Badge variant="secondary">{task.subject}</Badge>}
            {dueDate && (
              <Badge variant={isOverdue ? 'destructive' : 'outline'}>
                {isOverdue ? '⚠ Overdue' : `Due ${dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
              </Badge>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-6 py-10 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{task.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">Plan your work, then let AI break it into focused sessions</p>
        </div>

        {/* Estimation Card */}
        {estimation ? (
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-3xl font-bold">{formatMinutes(estimation.totalEstimatedMinutes)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Total time needed</p>
                  </div>
                  <div className="h-10 w-px bg-border" />
                  <div>
                    <p className="text-3xl font-bold">3</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Pomodoro sessions</p>
                  </div>
                  {daysLeft && daysLeft > 0 && (
                    <>
                      <div className="h-10 w-px bg-border" />
                      <div>
                        <p className="text-3xl font-bold">{Math.ceil(estimation.totalEstimatedMinutes / daysLeft)} min</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Per day until deadline</p>
                      </div>
                    </>
                  )}
                </div>
                <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${complexityConfig[estimation.complexity]?.color}`}>
                  {complexityConfig[estimation.complexity]?.label} complexity
                </span>
              </div>
              {estimation.reasoning && (
                <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
                  💡 {estimation.reasoning}
                </p>
              )}
              {!estimation.reasoning && daysLeft && daysLeft > 0 && (
                <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
                  💡 Study <strong>{Math.ceil(estimation.totalEstimatedMinutes / daysLeft)} min/day</strong> to finish before your deadline.
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Want to know how long this will take?</p>
                <p className="text-xs text-muted-foreground mt-0.5">AI estimates total study time and complexity</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleEstimate} disabled={isEstimating}>
                {isEstimating ? 'Estimating...' : '⏱ Estimate Time'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Scratchpad */}
        <Card>
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Planning Notes</span>
            <span className="text-xs text-muted-foreground">autosaved</span>
          </div>
          <CardContent className="p-0">
            <Scratchpad taskId={task.id} initialContent={task.scratchpadContent} onSave={handleSave} />
          </CardContent>
        </Card>

        {/* Buttons */}
        <div className="space-y-2">
          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-green-600">✓ Plan generated successfully</p>}
          <Button onClick={handleBreakdown} disabled={isBreakingDown} className="w-full" size="lg">
            {isBreakingDown ? 'Generating your plan...' : '✦ Generate Pomodoro Plan with AI'}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Creates 3 focused 25-minute study sessions tailored to your task
          </p>
        </div>

        <MicroStepList key={refreshKey} taskId={task.id} />
      </main>
    </div>
  )
}
