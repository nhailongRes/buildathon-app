import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useEnergyDetector } from '../src/hooks/useEnergyDetector'

describe('useEnergyDetector', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('isActive is false when no keystrokes have occurred', () => {
    const { result } = renderHook(() => useEnergyDetector())
    expect(result.current.isActive).toBe(false)
  })

  it('one fast-typing reading is not enough to change state (hysteresis)', async () => {
    const { result } = renderHook(() => useEnergyDetector())

    // 250 keystrokes, no backspaces → CPM=250 > 200, backspace ratio=0 < 10% → High
    act(() => {
      for (let i = 0; i < 250; i++) result.current.recordKeystroke('a')
    })

    // Reading 1: High — but consecutive count is only 1, state stays medium
    await act(async () => { vi.advanceTimersByTime(10_000) })

    expect(result.current.energyLevel).toBe('medium')
  })

  it('resolves to High after 2 consecutive fast-typing readings', async () => {
    const { result } = renderHook(() => useEnergyDetector())

    act(() => {
      for (let i = 0; i < 250; i++) result.current.recordKeystroke('a')
    })

    await act(async () => { vi.advanceTimersByTime(10_000) }) // reading 1: High
    await act(async () => { vi.advanceTimersByTime(10_000) }) // reading 2: High → state changes

    expect(result.current.energyLevel).toBe('high')
  })

  it('resolves to Low after 2 consecutive slow-typing readings with backspaces', async () => {
    const { result } = renderHook(() => useEnergyDetector())

    // 30 chars + 20 backspaces: CPM=30 < 80 AND backspace ratio=40% > 20% → Low
    act(() => {
      for (let i = 0; i < 30; i++) result.current.recordKeystroke('a')
      for (let i = 0; i < 20; i++) result.current.recordKeystroke('Backspace')
    })

    await act(async () => { vi.advanceTimersByTime(10_000) }) // reading 1: Low
    await act(async () => { vi.advanceTimersByTime(10_000) }) // reading 2: Low → state changes

    expect(result.current.energyLevel).toBe('low')
  })

  it('resolves to Low and isActive is false when the keystroke window is empty', async () => {
    const { result } = renderHook(() => useEnergyDetector())

    // No keystrokes — empty buffer means CPM=0 < 80 → Low reading each tick
    await act(async () => { vi.advanceTimersByTime(10_000) }) // reading 1: Low
    await act(async () => { vi.advanceTimersByTime(10_000) }) // reading 2: Low → state changes

    expect(result.current.energyLevel).toBe('low')
    expect(result.current.isActive).toBe(false)
  })
})
