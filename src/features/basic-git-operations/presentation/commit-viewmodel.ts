import type { GetSettingsUseCase } from '@/features/application-foundation/di-tokens'
import type { GenerateCommitMessageRendererUseCase } from '@/features/claude-code-integration/di-tokens'
import type { GetDiffStagedUseCase } from '@/features/repository-viewer/di-tokens'
import type { CommitResult } from '@domain'
import type { Observable } from 'rxjs'
import type { CommitRendererUseCase, GetOperationLoadingUseCase } from '../di-tokens'
import type { CommitViewModel } from './viewmodel-interfaces'
import { formatDiffsAsText } from '@lib/format-diffs-as-text'
import { BehaviorSubject } from 'rxjs'

export class CommitDefaultViewModel implements CommitViewModel {
  readonly loading$: Observable<boolean>

  private readonly _generating$ = new BehaviorSubject<boolean>(false)
  readonly generating$: Observable<boolean> = this._generating$.asObservable()

  private readonly _generateError$ = new BehaviorSubject<string | null>(null)
  readonly generateError$: Observable<string | null> = this._generateError$.asObservable()

  private readonly _lastCommitResult$ = new BehaviorSubject<CommitResult | null>(null)
  readonly lastCommitResult$: Observable<CommitResult | null> = this._lastCommitResult$.asObservable()

  constructor(
    private readonly commitUseCase: CommitRendererUseCase,
    getOperationLoadingUseCase: GetOperationLoadingUseCase,
    private readonly getDiffStagedUseCase: GetDiffStagedUseCase,
    private readonly generateCommitMessageUseCase: GenerateCommitMessageRendererUseCase,
    private readonly getSettingsUseCase: GetSettingsUseCase,
  ) {
    this.loading$ = getOperationLoadingUseCase.store
  }

  async commit(worktreePath: string, message: string, amend?: boolean): Promise<CommitResult | null> {
    try {
      const result = await this.commitUseCase.invoke({ worktreePath, message, amend })
      this._lastCommitResult$.next(result)
      return result
    } catch {
      this._lastCommitResult$.next(null)
      return null
    }
  }

  async generateCommitMessage(worktreePath: string): Promise<string> {
    this._generating$.next(true)
    this._generateError$.next(null)
    try {
      const diffs = await this.getDiffStagedUseCase.invoke({ worktreePath })
      const diffText = formatDiffsAsText(diffs)
      const rules = this.getSettingsUseCase.property.value.commitMessageRules
      return await this.generateCommitMessageUseCase.invoke({ worktreePath, diffText, rules })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      this._generateError$.next(message)
      return ''
    } finally {
      this._generating$.next(false)
    }
  }
}
