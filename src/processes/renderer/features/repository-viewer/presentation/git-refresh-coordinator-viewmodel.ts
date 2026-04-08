import type { GitOperationCompletedEvent } from '@domain'
import type { ObserveAdvancedOperationCompletedUseCase } from '@renderer/features/advanced-git-operations/di-tokens'
import type { ObserveOperationCompletedUseCase as ObserveBasicOperationCompletedUseCase } from '@renderer/features/basic-git-operations/di-tokens'
import type { Observable } from 'rxjs'
import type { GitRefreshCoordinatorViewModel } from './viewmodel-interfaces'
import { merge } from 'rxjs'
import { auditTime } from 'rxjs/operators'

const REFRESH_DEBOUNCE_MS = 150

export class GitRefreshCoordinatorDefaultViewModel implements GitRefreshCoordinatorViewModel {
  readonly operationCompleted$: Observable<GitOperationCompletedEvent>

  constructor(
    observeBasic: ObserveBasicOperationCompletedUseCase,
    observeAdvanced: ObserveAdvancedOperationCompletedUseCase,
  ) {
    this.operationCompleted$ = merge(observeBasic.store, observeAdvanced.store).pipe(auditTime(REFRESH_DEBOUNCE_MS))
  }
}
