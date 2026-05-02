import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Scratchpad } from '../src/components/scratchpad'

test('renders textarea with initial content', () => {
  render(<Scratchpad taskId="task-1" initialContent="my existing notes" onSave={() => {}} />)
  const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
  expect(textarea.value).toBe('my existing notes')
})
