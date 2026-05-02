import { describe, it, expect } from 'vitest'
import { getAdaptationConfig } from '../src/lib/adaptation'

describe('getAdaptationConfig', () => {
  it('high energy: sidebar shown, AI CTA hidden, normal typography', () => {
    const config = getAdaptationConfig('high')
    expect(config.showSidebar).toBe(true)
    expect(config.aiCTAVariant).toBe('hidden')
    expect(config.largeText).toBe(false)
  })

  it('medium energy: sidebar shown, AI CTA as hint, normal typography', () => {
    const config = getAdaptationConfig('medium')
    expect(config.showSidebar).toBe(true)
    expect(config.aiCTAVariant).toBe('hint')
    expect(config.largeText).toBe(false)
  })

  it('low energy: sidebar hidden, AI CTA prominent, larger typography', () => {
    const config = getAdaptationConfig('low')
    expect(config.showSidebar).toBe(false)
    expect(config.aiCTAVariant).toBe('prominent')
    expect(config.largeText).toBe(true)
  })
})
