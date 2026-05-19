import type { ConflictResolveResult, ConflictResolvingProgress, ThreeWayContent } from '@domain'
import type { Observable, Subscription } from 'rxjs'
import type { ClaudeStateService } from '../application/services/claude-state-service-interface'
import type { ResolveConflictRendererUseCase } from '../di-tokens'
import type { ClaudeConflictViewModel } from './viewmodel-interfaces'
import { filter, skip, take } from 'rxjs'

const MAX_CONCURRENT = 3

export class ClaudeConflictDefaultViewModel implements ClaudeConflictViewModel {
  readonly isResolvingConflict$: Observable<boolean>
  readonly conflictResult$: Observable<ConflictResolveResult | null>
  readonly resolvingProgress$: Observable<ConflictResolvingProgress | null>

  constructor(
    private readonly resolveConflictUseCase: ResolveConflictRendererUseCase,
    private readonly state: ClaudeStateService,
  ) {
    this.isResolvingConflict$ = state.isResolvingConflict$
    this.conflictResult$ = state.conflictResult$
    this.resolvingProgress$ = state.resolvingProgress$
  }

  resolveConflict(worktreePath: string, filePath: string, threeWayContent: ThreeWayContent): void {
    this.state.setResolvingConflict(true)
    this.state.setResolvingProgress(null)
    this.state.setConflictResult(null)

    const sub = this.state.conflictResult$
      .pipe(
        skip(1),
        filter((r): r is ConflictResolveResult => r !== null),
        take(1),
      )
      .subscribe(() => {
        this.state.setResolvingConflict(false)
      })

    this.resolveConflictUseCase.invoke({ worktreePath, filePath, threeWayContent }).catch(() => {
      sub.unsubscribe()
      this.state.setResolvingConflict(false)
    })
  }

  resolveAll(worktreePath: string, files: Array<{ filePath: string; threeWayContent: ThreeWayContent }>): void {
    const total = files.length
    if (total === 0) return

    this.state.setResolvingConflict(true)
    this.state.setResolvingProgress({ total, completed: 0, failed: 0 })
    this.state.setConflictResult(null)

    const queue = [...files]
    let completed = 0
    let failed = 0
    const inFlightPaths = new Set<string>()

    let sub: Subscription | null = null

    const onTaskComplete = (filePath: string, success: boolean) => {
      inFlightPaths.delete(filePath)
      if (success) completed++
      else failed++
      this.state.setResolvingProgress({ total, completed, failed })
      launchNext()
      if (completed + failed >= total) {
        sub?.unsubscribe()
        this.state.setResolvingConflict(false)
      }
    }

    const launchNext = () => {
      while (inFlightPaths.size < MAX_CONCURRENT && queue.length > 0) {
        const file = queue.shift()!
        inFlightPaths.add(file.filePath)
        this.resolveConflictUseCase
          .invoke({
            worktreePath,
            filePath: file.filePath,
            threeWayContent: file.threeWayContent,
          })
          .catch(() => {
            onTaskComplete(file.filePath, false)
          })
      }
    }

    sub = this.state.conflictResult$
      .pipe(
        skip(1),
        filter((r): r is ConflictResolveResult => r !== null),
        filter((r) => inFlightPaths.has(r.filePath)),
      )
      .subscribe((result) => {
        onTaskComplete(result.filePath, result.status === 'resolved')
      })

    launchNext()
  }
}
