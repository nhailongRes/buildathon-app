import crypto from 'node:crypto'
import dotenv from 'dotenv'
import pg from 'pg'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env' })
dotenv.config({ path: '.env.local', override: true })

const { Client } = pg

const TIME_ZONE = 'Australia/Sydney'
const DEMO_USER_EMAIL = process.env.DEMO_ACCOUNT_EMAIL ?? 'testaccount@email.com'
const DEMO_USER_NAME = process.env.DEMO_ACCOUNT_NAME ?? 'Event Demo Student'
const DEMO_USER_ID = DEMO_USER_EMAIL

function dayKey(date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function parseDateKey(key) {
  const [year, month, day] = key.split('-').map(Number)
  return { year, month, day }
}

function zonedParts(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)

  return {
    year: Number(parts.find((part) => part.type === 'year')?.value ?? 0),
    month: Number(parts.find((part) => part.type === 'month')?.value ?? 0),
    day: Number(parts.find((part) => part.type === 'day')?.value ?? 0),
    hour: Number(parts.find((part) => part.type === 'hour')?.value ?? 0),
    minute: Number(parts.find((part) => part.type === 'minute')?.value ?? 0),
  }
}

function zonedDateTime(dateKey, hour, minute = 0) {
  const { year, month, day } = parseDateKey(dateKey)
  const targetUtc = Date.UTC(year, month - 1, day, hour, minute)
  let guess = targetUtc

  for (let index = 0; index < 3; index += 1) {
    const parts = zonedParts(new Date(guess))
    const renderedUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
    )
    guess -= renderedUtc - targetUtc
  }

  return new Date(guess)
}

function addDaysToKey(key, days) {
  const { year, month, day } = parseDateKey(key)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + days)
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function id(prefix) {
  return `${prefix}_${crypto.randomUUID().replaceAll('-', '').slice(0, 18)}`
}

async function ensureAuthAccount() {
  const password = process.env.DEMO_ACCOUNT_PASSWORD
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!password || !supabaseUrl || !supabaseAnonKey) {
    console.log('Skipped Supabase auth account creation; set DEMO_ACCOUNT_PASSWORD to create it.')
    return
  }

  const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  })

  const signUp = await supabase.auth.signUp({
    email: DEMO_USER_EMAIL,
    password,
    options: {
      data: { full_name: DEMO_USER_NAME },
    },
  })

  if (signUp.error) {
    console.log(`Supabase signup returned: ${signUp.error.message}`)
  } else {
    console.log(`Supabase auth account is present for ${DEMO_USER_EMAIL}.`)
  }
}

async function seedDemoData() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required.')
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL })
  const now = new Date()
  const today = dayKey(now)
  const tomorrow = addDaysToKey(today, 1)
  const monday = addDaysToKey(today, 2)
  const tuesday = addDaysToKey(today, 3)
  const wednesday = addDaysToKey(today, 4)
  const friday = addDaysToKey(today, 6)

  const tasks = [
    {
      id: id('task'),
      key: 'lecture-notes',
      title: 'Review COMP4670 lecture notes',
      subject: 'Statistical ML',
      dueDate: null,
      scratchpadContent: 'Focus on kernel methods, SVM intuition, and the examples from the latest lecture.',
    },
    {
      id: id('task'),
      key: 'climate-outline',
      title: 'Write climate essay outline',
      subject: 'Science',
      dueDate: null,
      scratchpadContent: 'Create thesis, 3 argument sections, evidence list, and conclusion plan.',
    },
    {
      id: id('task'),
      key: 'rag-reading',
      title: 'Read RAG evaluation paper',
      subject: 'Computer Science',
      dueDate: null,
      scratchpadContent: 'Summarise retrieval metrics and note 3 points for tutorial discussion.',
    },
    {
      id: id('task'),
      key: 'groceries',
      title: 'Buy groceries for the week',
      subject: 'Errand',
      dueDate: null,
      scratchpadContent: 'Milk, fruit, quick dinners, and snacks for long study blocks.',
    },
    {
      id: id('task'),
      key: 'appointment',
      title: 'Book GP appointment',
      subject: 'Health',
      dueDate: null,
      scratchpadContent: 'Call clinic and book a time that does not clash with classes.',
    },
    {
      id: id('task'),
      key: 'pitch',
      title: 'Prepare buildathon pitch script',
      subject: 'Buildathon',
      dueDate: zonedDateTime(tomorrow, 23),
      scratchpadContent: 'Due tomorrow. Cover problem, demo flow, scheduling feature, and next steps.',
    },
    {
      id: id('task'),
      key: 'lab',
      title: 'Submit Data Mining lab',
      subject: 'COMP3425',
      dueDate: zonedDateTime(tuesday, 17),
      scratchpadContent: 'Check notebook outputs, add short interpretation, export PDF, and submit before 5pm.',
    },
    {
      id: id('task'),
      key: 'dinner',
      title: 'Dinner with event hosts',
      subject: 'Personal',
      dueDate: zonedDateTime(today, 19, 30),
      scratchpadContent: 'Meet near campus.\nScheduled time: 19:30-21:00.',
    },
    {
      id: id('task'),
      key: 'work',
      title: 'Part-time work shift',
      subject: 'Work',
      dueDate: zonedDateTime(monday, 17),
      scratchpadContent: 'Evening shift at the cafe.\nScheduled time: 17:00-21:00.',
    },
  ]

  const byKey = new Map(tasks.map((task) => [task.key, task]))
  const plannedBlocks = [
    {
      taskKey: 'groceries',
      startAt: zonedDateTime(tomorrow, 10),
      endAt: zonedDateTime(tomorrow, 10, 45),
    },
    {
      taskKey: 'lecture-notes',
      startAt: zonedDateTime(tomorrow, 14),
      endAt: zonedDateTime(tomorrow, 15),
    },
    {
      taskKey: 'climate-outline',
      startAt: zonedDateTime(monday, 9),
      endAt: zonedDateTime(monday, 10, 30),
    },
    {
      taskKey: 'rag-reading',
      startAt: zonedDateTime(monday, 13),
      endAt: zonedDateTime(monday, 14),
    },
  ]

  const timetableEvents = [
    {
      uid: 'event-demo-comp4670-lecture',
      title: 'COMP4670 Statistical Machine Learning lecture',
      startAt: zonedDateTime(tuesday, 8, 30),
      endAt: zonedDateTime(tuesday, 11),
      location: 'Lowitja O’Donoghue Cultural Centre',
      description: 'Imported timetable block for the event demo.',
    },
    {
      uid: 'event-demo-comp3425-lab',
      title: 'COMP3425 Data Mining lab',
      startAt: zonedDateTime(tuesday, 13),
      endAt: zonedDateTime(tuesday, 14, 30),
      location: 'Skaidrite Darius Building',
      description: 'Imported timetable block for the event demo.',
    },
    {
      uid: 'event-demo-study-group',
      title: 'Study group: RAG discussion',
      startAt: zonedDateTime(wednesday, 16),
      endAt: zonedDateTime(wednesday, 17),
      location: 'Library group room',
      description: 'Fixed study commitment for the event demo.',
    },
    {
      uid: 'event-demo-comp3425-lecture',
      title: 'COMP3425 Data Mining lecture',
      startAt: zonedDateTime(friday, 9),
      endAt: zonedDateTime(friday, 11),
      location: 'Cinema Room',
      description: 'Imported timetable block for the event demo.',
    },
  ]

  await client.connect()

  try {
    await client.query('BEGIN')
    await client.query('DELETE FROM "TaskScheduleBlock" WHERE "userId" = $1', [DEMO_USER_ID])
    await client.query('DELETE FROM "TimetableEvent" WHERE "userId" = $1', [DEMO_USER_ID])
    await client.query('DELETE FROM "Task" WHERE "userId" = $1', [DEMO_USER_ID])

    for (const task of tasks) {
      await client.query(
        `INSERT INTO "Task" ("id", "userId", "title", "subject", "dueDate", "scratchpadContent", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [task.id, DEMO_USER_ID, task.title, task.subject, task.dueDate, task.scratchpadContent],
      )
    }

    for (const block of plannedBlocks) {
      const task = byKey.get(block.taskKey)
      if (!task) continue

      await client.query(
        `INSERT INTO "TaskScheduleBlock" ("id", "userId", "taskId", "startAt", "endAt", "source", "status", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, 'auto', 'planned', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [id('block'), DEMO_USER_ID, task.id, block.startAt, block.endAt],
      )
    }

    const microSteps = [
      ['lecture-notes', 'Skim lecture slides and highlight unclear formulas', 25],
      ['lecture-notes', 'Rewrite SVM intuition in your own words', 25],
      ['lecture-notes', 'Solve two practice questions', 25],
      ['climate-outline', 'Draft thesis and section headings', 25],
      ['climate-outline', 'Collect evidence for each section', 25],
      ['climate-outline', 'Write conclusion bullet points', 25],
      ['pitch', 'Write 60-second problem framing', 25],
      ['pitch', 'Rehearse demo story with calendar planner', 25],
      ['pitch', 'Prepare final closing sentence', 25],
    ]

    for (let index = 0; index < microSteps.length; index += 1) {
      const [taskKey, title, estimatedMinutes] = microSteps[index]
      const task = byKey.get(taskKey)
      if (!task) continue

      await client.query(
        `INSERT INTO "MicroStep" ("id", "taskId", "title", "estimatedMinutes", "completed", "order", "archived", "createdAt")
         VALUES ($1, $2, $3, $4, false, $5, false, CURRENT_TIMESTAMP)`,
        [id('step'), task.id, title, estimatedMinutes, index + 1],
      )
    }

    for (const event of timetableEvents) {
      await client.query(
        `INSERT INTO "TimetableEvent" ("id", "userId", "uid", "title", "startAt", "endAt", "location", "description", "sourceUrl", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'event-demo-seed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          id('event'),
          DEMO_USER_ID,
          event.uid,
          event.title,
          event.startAt,
          event.endAt,
          event.location,
          event.description,
        ],
      )
    }

    await client.query('COMMIT')
    console.log(`Seeded ${tasks.length} tasks, ${plannedBlocks.length} planned blocks, and ${timetableEvents.length} timetable events for ${DEMO_USER_EMAIL}.`)
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    await client.end()
  }
}

await ensureAuthAccount()
await seedDemoData()
