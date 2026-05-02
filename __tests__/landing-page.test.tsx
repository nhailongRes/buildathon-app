import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import LandingPage from '../src/app/page'

test('renders the landing page auth links', () => {
  render(<LandingPage />)
  expect(screen.getByRole('link', { name: /sign in/i })).toBeDefined()
  expect(screen.getAllByRole('link', { name: /get started/i }).length).toBeGreaterThan(0)
})
