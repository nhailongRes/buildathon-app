import type { EnergyLevel } from '@/hooks/useEnergyDetector'

export interface AdaptationConfig {
  containerClass: string
  textareaClass: string
  showSidebar: boolean
  aiCTAVariant: 'hidden' | 'hint' | 'prominent'
  largeText: boolean
}

export function getAdaptationConfig(level: EnergyLevel): AdaptationConfig {
  switch (level) {
    case 'high':
      return {
        containerClass: 'bg-zinc-50',
        textareaClass: 'text-sm leading-normal',
        showSidebar: true,
        aiCTAVariant: 'hidden',
        largeText: false,
      }
    case 'medium':
      return {
        containerClass: 'bg-amber-50',
        textareaClass: 'text-sm leading-normal',
        showSidebar: true,
        aiCTAVariant: 'hint',
        largeText: false,
      }
    case 'low':
      return {
        containerClass: 'bg-indigo-50',
        textareaClass: 'text-lg leading-relaxed',
        showSidebar: false,
        aiCTAVariant: 'prominent',
        largeText: true,
      }
  }
}
