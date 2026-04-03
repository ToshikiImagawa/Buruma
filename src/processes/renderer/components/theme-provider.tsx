import { useEffect } from 'react'
import { useSettingsViewModel } from '@renderer/features/application-foundation/presentation/use-settings-viewmodel'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettingsViewModel()

  useEffect(() => {
    const root = document.documentElement

    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }

    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      applyTheme(mediaQuery.matches)

      const listener = (e: MediaQueryListEvent) => applyTheme(e.matches)
      mediaQuery.addEventListener('change', listener)

      return () => mediaQuery.removeEventListener('change', listener)
    } else {
      applyTheme(settings.theme === 'dark')
    }
  }, [settings.theme])

  return <>{children}</>
}
