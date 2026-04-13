import type { SymlinkConfig } from '@domain'
import type { Observable } from 'rxjs'
import type { GetSymlinkConfigUseCase, SetSymlinkConfigUseCase } from '../di-tokens'
import type { SymlinkSettingsViewModel } from './viewmodel-interfaces'
import { BehaviorSubject } from 'rxjs'

export class SymlinkSettingsDefaultViewModel implements SymlinkSettingsViewModel {
  private readonly configSubject = new BehaviorSubject<SymlinkConfig | null>(null)
  readonly config$: Observable<SymlinkConfig | null> = this.configSubject.asObservable()

  constructor(
    private readonly getConfigUseCase: GetSymlinkConfigUseCase,
    private readonly setConfigUseCase: SetSymlinkConfigUseCase,
  ) {}

  loadConfig(repoPath: string): void {
    this.getConfigUseCase
      .invoke(repoPath)
      .then((config) => this.configSubject.next(config))
      .catch(() => {})
  }

  addPattern(repoPath: string, pattern: string): void {
    const current = this.configSubject.getValue()
    if (!current) return
    const trimmed = pattern.trim()
    if (!trimmed || current.patterns.includes(trimmed)) return

    const updated: SymlinkConfig = {
      ...current,
      patterns: [...current.patterns, trimmed],
    }
    this.configSubject.next(updated)
    this.persistConfig(repoPath, updated, current)
  }

  removePattern(repoPath: string, index: number): void {
    const current = this.configSubject.getValue()
    if (!current) return
    const updated: SymlinkConfig = {
      ...current,
      patterns: current.patterns.filter((_, i) => i !== index),
    }
    this.configSubject.next(updated)
    this.persistConfig(repoPath, updated, current)
  }

  private persistConfig(repoPath: string, updated: SymlinkConfig, rollback: SymlinkConfig): void {
    this.setConfigUseCase.invoke({ repoPath, config: updated }).catch(() => {
      this.configSubject.next(rollback)
    })
  }
}
