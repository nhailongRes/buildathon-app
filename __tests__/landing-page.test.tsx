import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import LandingPage from '../src/app/page'

test('renders a Sign in with Google button', () => {
  render(<LandingPage />)
  expect(screen.getByRole('button', { name: /sign in with google/i })).toBeDefined()
})
