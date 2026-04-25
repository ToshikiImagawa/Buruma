import type { PullResult, PushArgs, PushResult } from '@domain'
import type { IPCError } from '@lib/ipc'
import type { Observable } from 'rxjs'
import type {
  FetchRendererUseCase,
  GetLastErrorUseCase,
  GetOperationLoadingUseCase,
  PullRendererUseCase,
  PushRendererUseCase,
} from '../di-tokens'
import type { RemoteOpsViewModel } from './viewmodel-interfaces'
import { BehaviorSubject } from 'rxjs'

export class RemoteOpsDefaultViewModel implements RemoteOpsViewModel {
  readonly loading$: Observable<boolean>
  readonly lastError$: Observable<IPCError | null>

  private readonly _lastPushResult$ = new BehaviorSubject<PushResult | null>(null)
  private readonly _lastPullResult$ = new BehaviorSubject<PullResult | null>(null)
  readonly lastPushResult$: Observable<PushResult | null> = this._lastPushResult$.asObservable()
  readonly lastPullResult$: Observable<PullResult | null> = this._lastPullResult$.asObservable()

  constructor(
    private readonly pushUseCase: PushRendererUseCase,
    private readonly pullUseCase: PullRendererUseCase,
    private readonly fetchUseCase: FetchRendererUseCase,
    getOperationLoadingUseCase: GetOperationLoadingUseCase,
    getLastErrorUseCase: GetLastErrorUseCase,
  ) {
    this.loading$ = getOperationLoadingUseCase.store
    this.lastError$ = getLastErrorUseCase.store
  }

  async push(args: PushArgs): Promise<PushResult | null> {
    try {
      const result = await this.pushUseCase.invoke(args)
      this._lastPushResult$.next(result)
      return result
    } catch {
      this._lastPushResult$.next(null)
      return null
    }
  }

  pull(worktreePath: string, remote?: string, branch?: string): void {
    this.pullUseCase
      .invoke({ worktreePath, remote, branch })
      .then((result) => {
        this._lastPullResult$.next(result)
      })
      .catch(() => {
        this._lastPullResult$.next(null)
      })
  }

  fetch(worktreePath: string, remote?: string): void {
    this.fetchUseCase.invoke({ worktreePath, remote }).catch(() => {})
  }
}
