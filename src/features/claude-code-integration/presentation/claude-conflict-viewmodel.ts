import type { ConflictResolveResult, ThreeWayContent } from '@domain'
import type { Observable, Subscription } from 'rxjs'
import type { ClaudeService, ConflictResolvingProgress } from '../application/services/claude-service-interface'
import type { ResolveConflictRendererUseCase } from '../di-tokens'
import type { ClaudeConflictViewModel } from './viewmodel-interfaces'
import { filter, skip } from 'rxjs'

const MAX_CONCURRENT = 3

export class ClaudeConflictDefaultViewModel implements ClaudeConflictViewModel {
  readonly isResolvingConflict$: Observable<boolean>
  readonly conflictResult$: Observable<ConflictResolveResult | null>
  readonly resolvingProgress$: Observable<ConflictResolvingProgress | null>

  constructor(
    private readonly resolveConflictUseCase: ResolveConflictRendererUseCase,
    private readonly service: ClaudeService,
  ) {
    this.isResolvingConflict$ = service.isResolvingConflict$
    this.conflictResult$ = service.conflictResult$
    this.resolvingProgress$ = service.resolvingProgress$
  }

  resolveConflict(worktreePath: string, filePath: string, threeWayContent: ThreeWayContent): void {
    this.service.setResolvingConflict(true)
    this.service.setResolvingProgress(null)
    this.service.setConflictResult(null)

    const sub = this.service.conflictResult$
      .pipe(
        skip(1),
        filter((r): r is ConflictResolveResult => r !== null),
      )
      .subscribe(() => {
        this.service.setResolvingConflict(false)
        sub.unsubscribe()
      })

    this.resolveConflictUseCase.invoke({ worktreePath, filePath, threeWayContent })
  }

  resolveAll(worktreePath: string, files: Array<{ filePath: string; threeWayContent: ThreeWayContent }>): void {
    const total = files.length
    if (total === 0) return

    this.service.setResolvingConflict(true)
    this.service.setResolvingProgress({ total, completed: 0, failed: 0 })
    this.service.setConflictResult(null)

    const queue = [...files]
    let completed = 0
    let failed = 0
    let inFlight = 0

    let sub: Subscription | null = null

    const checkDone = () => {
      if (completed + failed >= total) {
        sub?.unsubscribe()
        this.service.setResolvingConflict(false)
      }
    }

    const launchNext = () => {
      while (inFlight < MAX_CONCURRENT && queue.length > 0) {
        const file = queue.shift()!
        inFlight++
        this.resolveConflictUseCase.invoke({
          worktreePath,
          filePath: file.filePath,
          threeWayContent: file.threeWayContent,
        })
      }
    }

    sub = this.service.conflictResult$
      .pipe(
        skip(1),
        filter((r): r is ConflictResolveResult => r !== null),
      )
      .subscribe((result) => {
        inFlight--
        if (result.status === 'resolved') completed++
        else failed++
        this.service.setResolvingProgress({ total, completed, failed })
        launchNext()
        checkDone()
      })

    launchNext()
  }
}
