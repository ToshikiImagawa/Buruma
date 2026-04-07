import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import * as useSettingsViewModelModule from '../use-settings-viewmodel'
import { SettingsDialog } from './SettingsDialog'

vi.mock('../use-settings-viewmodel')
vi.mock('@renderer/features/claude-code-integration/presentation/use-claude-auth', () => ({
  useClaudeAuth: () => ({
    authStatus: { authenticated: true, accountEmail: 'test@example.com' },
    isAuthChecking: false,
    isLoggingIn: false,
    checkAuth: vi.fn(),
    login: vi.fn(),
  }),
}))

describe('SettingsDialog', () => {
  const mockUpdateSettings = vi.fn()
  const mockSetTheme = vi.fn()
  const mockOnOpenChange = vi.fn()

  const defaultSettings = {
    theme: 'light' as const,
    gitPath: null as string | null,
    defaultWorkDir: null as string | null,
    commitMessageRules: null as string | null,
  }

  it('ダイアログが開いているとき、タイトルと説明が表示される', () => {
    vi.spyOn(useSettingsViewModelModule, 'useSettingsViewModel').mockReturnValue({
      settings: defaultSettings,
      updateSettings: mockUpdateSettings,
      setTheme: mockSetTheme,
    })

    render(<SettingsDialog open={true} onOpenChange={mockOnOpenChange} />)

    expect(screen.getByText('設定')).toBeInTheDocument()
    expect(screen.getByText('アプリケーションの動作をカスタマイズします')).toBeInTheDocument()
  })

  it('テーマ選択が表示される', () => {
    vi.spyOn(useSettingsViewModelModule, 'useSettingsViewModel').mockReturnValue({
      settings: defaultSettings,
      updateSettings: mockUpdateSettings,
      setTheme: mockSetTheme,
    })

    render(<SettingsDialog open={true} onOpenChange={mockOnOpenChange} />)

    expect(screen.getByLabelText('テーマ')).toBeInTheDocument()
  })

  it('Git 実行パス入力が表示される', () => {
    vi.spyOn(useSettingsViewModelModule, 'useSettingsViewModel').mockReturnValue({
      settings: defaultSettings,
      updateSettings: mockUpdateSettings,
      setTheme: mockSetTheme,
    })

    render(<SettingsDialog open={true} onOpenChange={mockOnOpenChange} />)

    expect(screen.getByLabelText('Git 実行パス')).toBeInTheDocument()
  })

  it('デフォルト作業ディレクトリ入力が表示される', () => {
    vi.spyOn(useSettingsViewModelModule, 'useSettingsViewModel').mockReturnValue({
      settings: defaultSettings,
      updateSettings: mockUpdateSettings,
      setTheme: mockSetTheme,
    })

    render(<SettingsDialog open={true} onOpenChange={mockOnOpenChange} />)

    expect(screen.getByLabelText('デフォルト作業ディレクトリ')).toBeInTheDocument()
  })

  it('Git パスを変更すると updateSettings が呼ばれる', () => {
    vi.spyOn(useSettingsViewModelModule, 'useSettingsViewModel').mockReturnValue({
      settings: defaultSettings,
      updateSettings: mockUpdateSettings,
      setTheme: mockSetTheme,
    })

    render(<SettingsDialog open={true} onOpenChange={mockOnOpenChange} />)

    const input = screen.getByLabelText('Git 実行パス')
    fireEvent.change(input, { target: { value: '/usr/local/bin/git' } })

    expect(mockUpdateSettings).toHaveBeenCalled()
  })

  it('デフォルト作業ディレクトリを変更すると updateSettings が呼ばれる', () => {
    vi.spyOn(useSettingsViewModelModule, 'useSettingsViewModel').mockReturnValue({
      settings: defaultSettings,
      updateSettings: mockUpdateSettings,
      setTheme: mockSetTheme,
    })

    render(<SettingsDialog open={true} onOpenChange={mockOnOpenChange} />)

    const input = screen.getByLabelText('デフォルト作業ディレクトリ')
    fireEvent.change(input, { target: { value: '/home/user/projects' } })

    expect(mockUpdateSettings).toHaveBeenCalled()
  })
})
