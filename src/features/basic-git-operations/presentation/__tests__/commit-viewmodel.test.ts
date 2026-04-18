import type { GetSettingsUseCase } from '@/features/application-foundation/di-tokens'
import type { GenerateCommitMessageRendererUseCase } from '@/features/claude-code-integration/di-tokens'
import type { GetDiffStagedUseCase } from '@/features/repository-viewer/di-tokens'
import type { AppSettings, CommitResult } from '@domain'
import type { ReadOnlyReactiveProperty } from '@lib/usecase'
import type { CommitRendererUseCase, GetOperationLoadingUseCase } from '../../di-tokens'
import { DEFAULT_SETTINGS } from '@domain'
import { BehaviorSubject } from 'rxjs'
import { describe, expect, it, vi } from 'vitest'
import { CommitDefaultViewModel } from '../commit-viewmodel'

function createSettingsProperty(settings: AppSettings): ReadOnlyReactiveProperty<AppSettings> {
  const subject = new BehaviorSubject<AppSettings>(settings)
  return {
    get value() {
      return subject.getValue()
    },
    asObservable: () => subject.asObservable(),
  }
}

function createDeps(settings: AppSettings = DEFAULT_SETTINGS) {
  const loadingStore = new BehaviorSubject<boolean>(false).asObservable()

  const commitUseCase: CommitRendererUseCase = {
    invoke: vi.fn().mockResolvedValue({ sha: 'abc', message: 'm' } as CommitResult),
  }
  const getOperationLoadingUseCase = {
    store: loadingStore,
  } as unknown as GetOperationLoadingUseCase
  const getDiffStagedUseCase: GetDiffStagedUseCase = {
    invoke: vi.fn().mockResolvedValue([]),
  }
  const generateCommitMessageUseCase: GenerateCommitMessageRendererUseCase = {
    invoke: vi.fn().mockResolvedValue('generated message'),
  }
  const getSettingsUseCase: GetSettingsUseCase = {
    property: createSettingsProperty(settings),
  }

  const vm = new CommitDefaultViewModel(
    commitUseCase,
    getOperationLoadingUseCase,
    getDiffStagedUseCase,
    generateCommitMessageUseCase,
    getSettingsUseCase,
  )

  return { vm, commitUseCase, getDiffStagedUseCase, generateCommitMessageUseCase, getSettingsUseCase }
}

describe('CommitDefaultViewModel.generateCommitMessage', () => {
  it('AppSettings.commitMessageRules が null の場合は null を転送する', async () => {
    const { vm, generateCommitMessageUseCase } = createDeps({
      ...DEFAULT_SETTINGS,
      commitMessageRules: null,
    })

    const result = await vm.generateCommitMessage('/repo')

    expect(result).toBe('generated message')
    expect(generateCommitMessageUseCase.invoke).toHaveBeenCalledWith({
      worktreePath: '/repo',
      diffText: '',
      rules: null,
    })
  })

  it('AppSettings.commitMessageRules が設定されている場合はその値を転送する', async () => {
    const customRules = '- Use Conventional Commits\n- Write in Japanese'
    const { vm, generateCommitMessageUseCase } = createDeps({
      ...DEFAULT_SETTINGS,
      commitMessageRules: customRules,
    })

    await vm.generateCommitMessage('/repo')

    expect(generateCommitMessageUseCase.invoke).toHaveBeenCalledWith({
      worktreePath: '/repo',
      diffText: '',
      rules: customRules,
    })
  })

  it('UseCase 呼び出し時点の最新値を読み出す（設定変更後の再生成）', async () => {
    const settingsSubject = new BehaviorSubject<AppSettings>({
      ...DEFAULT_SETTINGS,
      commitMessageRules: 'old rules',
    })
    const getSettingsUseCase: GetSettingsUseCase = {
      property: {
        get value() {
          return settingsSubject.getValue()
        },
        asObservable: () => settingsSubject.asObservable(),
      },
    }
    const generateCommitMessageUseCase: GenerateCommitMessageRendererUseCase = {
      invoke: vi.fn().mockResolvedValue('msg'),
    }
    const vm = new CommitDefaultViewModel(
      { invoke: vi.fn() } as unknown as CommitRendererUseCase,
      { store: new BehaviorSubject<boolean>(false).asObservable() } as unknown as GetOperationLoadingUseCase,
      { invoke: vi.fn().mockResolvedValue([]) } as unknown as GetDiffStagedUseCase,
      generateCommitMessageUseCase,
      getSettingsUseCase,
    )

    await vm.generateCommitMessage('/repo')
    settingsSubject.next({ ...DEFAULT_SETTINGS, commitMessageRules: 'new rules' })
    await vm.generateCommitMessage('/repo')

    expect(generateCommitMessageUseCase.invoke).toHaveBeenNthCalledWith(1, {
      worktreePath: '/repo',
      diffText: '',
      rules: 'old rules',
    })
    expect(generateCommitMessageUseCase.invoke).toHaveBeenNthCalledWith(2, {
      worktreePath: '/repo',
      diffText: '',
      rules: 'new rules',
    })
  })
})
