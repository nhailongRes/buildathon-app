<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# StudyTriage App Guide

## Product Intent

StudyTriage is an ANU AI Buildathon prototype for the Overwhelmed Student focus area. It helps students choose which assessment to work on next based on due dates, weights, effort already logged, and realistic study time.

Do not drift into a generic productivity app, tutor, chatbot, or assignment-writing assistant. The app should stay focused on decision support: "Given my assessment load, what should I do next and why?"

## Stack

- Framework: Next.js 16 App Router. Check local Next docs in `node_modules/next/dist/docs/` when touching framework APIs.
- UI: Tailwind v4, shadcn/ui, radix.
- Forms: react-hook-form and zod.
- Data/Auth/Storage: Supabase packages are installed; current demo flows may still use a hardcoded demo user.
- Database: Prisma 7 with generated client in `src/generated/prisma`.
- AI: Vercel AI SDK with `@ai-sdk/anthropic`; product default model is `claude-sonnet-4-6`.
- Uploads: uploadthing.
- Deploy: Vercel.

## Common Commands

Run from this directory:

```bash
npm run dev
npm run build
npm run lint
npm run test
```

## MVP Boundaries

Keep v1 centered on:

- Course outline ingest from PDFs.
- Assessment extraction with weight, due date, type, and description.
- Effort logging per assessment.
- Triage ranking with do now / soon / later / done recommendations.
- A single next study block card.
- Honest limitations on recommendation screens.

Avoid adding social features, gamification, Pomodoro timers, notes, flashcards, full calendar sync, push notifications, tutor mode, or study group features unless the core MVP is already shippable.

## AI And Data Rules

- Course outline parsing should pass PDFs directly to the model as vision input where possible; do not add OCR unless there is a clear blocker.
- Use strict zod schemas for extraction and recommendation outputs.
- If an assessment weight or date cannot be extracted confidently, mark it as unknown and let the user fix it. Do not invent values.
- Keep prompts in `src/lib/ai/prompts/`, one file per use case.
- Recommendations must surface uncertainty and practical reasoning without implying policy authority.
- Do not generate assignment answers or anything that would violate academic integrity.

## Product Safety Copy

Recommendation screens should make these limitations visible:

- The app does not know ANU policy. Students should ask their course convenor or academic skills team about extensions, special consideration, and course rules.
- The app recommends where to spend time; it does not teach course content.
- Recommendations depend on the quality of the user's inputs.
- The app will not help write assignments or generate answers.

## Engineering Style

- Prefer small, working slices over broad refactors.
- Follow existing local component and API route patterns.
- Keep demo hardcoded users clearly marked and easy to replace with auth later.
- Do not rewrite unrelated files during buildathon work.
- Add migrations with Prisma schema changes.
- Run `npm run build` before committing changes that affect routing, data access, or generated types.
