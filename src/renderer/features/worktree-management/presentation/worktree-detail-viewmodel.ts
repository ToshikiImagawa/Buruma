import { BehaviorSubject, type Observable } from 'rxjs'
import type { WorktreeInfo, WorktreeStatus } from '@shared/domain'
import type {
  IWorktreeDetailViewModel,
  GetSelectedWorktreeUseCase,
  GetWorktreeStatusUseCase,
} from '../di-tokens'

export class WorktreeDetailViewModel implements IWorktreeDetailViewModel {
  private readonly _worktreeStatus$ = new BehaviorSubject<WorktreeStatus | null>(null)

  constructor(
    private readonly getSelectedUseCase: GetSelectedWorktreeUseCase,
    private readonly getStatusUseCase: GetWorktreeStatusUseCase,
  ) {}

  get selectedWorktree$(): Observable<WorktreeInfo | null> {
    return this.getSelectedUseCase.store
  }

  get worktreeStatus$(): Observable<WorktreeStatus | null> {
    return this._worktreeStatus$.asObservable()
  }

  refreshStatus(): void {
    // 選択中のワークツリーの status を取得（呼び出し側で repoPath/worktreePath を渡す）
    // 現状は UI 側から直接パラメータを渡す形で実装
  }
}
