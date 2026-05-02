import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NewTaskModal } from '../src/components/new-task-modal'

test('renders task name input when open', () => {
  render(<NewTaskModal open onClose={() => {}} onCreate={() => {}} />)
  expect(screen.getByPlaceholderText(/task name/i)).toBeDefined()
})
