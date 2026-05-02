import { z } from 'zod'

export const taskIntakeMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(3000),
})

export const taskDraftSchema = z.object({
  title: z.string().trim().min(1).max(120),
  subject: z.string().trim().max(80).nullable(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable(),
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable(),
  scratchpadContent: z.string().trim().max(1200).nullable(),
})

export const taskIntakeResponseSchema = z.object({
  mode: z.enum(['drafts', 'question', 'refusal']),
  assistantMessage: z.string().trim().min(1).max(600),
  tasks: z.array(taskDraftSchema).max(3),
  missingFields: z.array(z.enum(['title', 'subject', 'dueDate', 'scope'])).max(4),
})

export const taskIntakeRequestSchema = z.object({
  messages: z.array(taskIntakeMessageSchema).min(1).max(12),
})

export type TaskIntakeMessage = z.infer<typeof taskIntakeMessageSchema>
export type TaskDraft = z.infer<typeof taskDraftSchema>
export type TaskIntakeResponse = z.infer<typeof taskIntakeResponseSchema>
