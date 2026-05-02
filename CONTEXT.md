# Cognitive Load Balancer

A study workspace that adapts its UI and task complexity based on a student's real-time energy level, detected from typing behavior.

## Language

**Task**:
A named student assignment with an optional due date and subject (e.g., "Write essay on WW2", subject: History, due: tomorrow).
_Avoid_: todo, item, assignment (outside domain expert speech)

**Scratchpad**:
A per-Task notes area inside the app where a student plans, outlines, and takes notes. The primary surface for keystroke-based energy detection.
_Avoid_: editor, workspace, notes (too generic)

**Micro-Step**:
One of exactly 3 AI-generated sub-tasks produced when a student requests a breakdown of a Task. Stored in DB, checkable, ordered 1–3, with an estimated completion time in minutes and an optional `completedAt` timestamp. Generated via `generateObject()` using `claude-sonnet-4-6`, from task name, subject, due date, scratchpad content, and current energy level. Completed sets are archived (not deleted) when a new breakdown is requested.
_Avoid_: subtask, step, action item

**Energy Level**:
A three-state signal — High, Medium, or Low — derived from the student's typing behavior that drives UI and complexity adaptation. Computed over a 60-second rolling window, recalculated every 10 seconds, with hysteresis requiring 2 consecutive readings to confirm a state change.
_Avoid_: stress level, mood, focus score

**Detection Signal**:
The two raw inputs to Energy Level: keystroke velocity (characters per minute) and backspace ratio (backspaces ÷ total keystrokes). Thresholds: High = CPM > 200 and backspace < 10%; Low = CPM < 80 or backspace > 20%; Medium = everything in between.
_Avoid_: typing speed, error rate

**Energy Snapshot**:
A timestamped record of a student's Energy Level, written every 60 seconds while active in the Scratchpad. Powers the energy timeline chart.
_Avoid_: log entry, event, data point

**Adaptation**:
The set of UI changes applied when Energy Level changes state. Each level maps to a distinct visual and structural configuration (color scheme, task list visibility, scratchpad layout, AI suggestion prominence, typography). Low energy also triggers a "Take a break?" nudge after 10 continuous minutes with no improvement.
_Avoid_: theme, mode, UI state

## Relationships

- A **Student** authenticates via Supabase Google OAuth and owns all their data
- A **Task** belongs to one student
- A **Task** has one **Scratchpad**
- A **Task** has zero or exactly 3 *active* **Micro-Steps** at any time (created together, never partially). Completed sets are archived, not deleted — preserved for progress tracking.
- "Break this down?" CTA is only visible when a Task has no active Micro-Steps or all 3 active ones are checked off
- A **Task** has an **Energy Level** context at the time it is worked on
- **Energy Snapshots** are recorded every 60 seconds per student while active in any Scratchpad, linked to both the student and the active Task

## Routes

- `/` — landing page with Google sign-in CTA
- `/dashboard` — stat cards, energy timeline chart, task list, New Task modal
- `/tasks/[id]` — scratchpad, micro-steps progress, live energy indicator

## Flagged ambiguities

_(none yet)_
