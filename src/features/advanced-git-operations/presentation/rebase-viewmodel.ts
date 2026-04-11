import type { BranchList, InteractiveRebaseOptions, RebaseOptions, RebaseResult, RebaseStep } from '@domain'
import type { Observable } from 'rxjs'
import type {
  GetAdvancedOperationLoadingUseCase,
  GetBranchesRendererUseCase,
  GetRebaseCommitsRendererUseCase,
  RebaseAbortRendererUseCase,
  RebaseContinueRendererUseCase,
  RebaseInteractiveRendererUseCase,
  RebaseRendererUseCase,
} from '../di-tokens'
import type { RebaseViewModel } from './viewmodel-interfaces'
import { BehaviorSubject } from 'rxjs'

export class RebaseDefaultViewModel implements RebaseViewModel {
  readonly loading$: Observable<boolean>

  private readonly _rebaseResult$ = new BehaviorSubject<RebaseResult | null>(null)
  readonly rebaseResult$: Observable<RebaseResult | null> = this._rebaseResult$.asObservable()

  private readonly _rebaseCommits$ = new BehaviorSubject<RebaseStep[]>([])
  readonly rebaseCommits$: Observable<RebaseStep[]> = this._rebaseCommits$.asObservable()

  private readonly _branches$ = new BehaviorSubject<BranchList | null>(null)
  readonly branches$: Observable<BranchList | null> = this._branches$.asObservable()

  constructor(
    private readonly rebaseUseCase: RebaseRendererUseCase,
    private readonly rebaseInteractiveUseCase: RebaseInteractiveRendererUseCase,
    private readonly rebaseAbortUseCase: RebaseAbortRendererUseCase,
    private readonly rebaseContinueUseCase: RebaseContinueRendererUseCase,
    private readonly getRebaseCommitsUseCase: GetRebaseCommitsRendererUseCase,
    private readonly getBranchesUseCase: GetBranchesRendererUseCase,
    getOperationLoadingUseCase: GetAdvancedOperationLoadingUseCase,
  ) {
    this.loading$ = getOperationLoadingUseCase.store
  }

  rebase(options: RebaseOptions): void {
    this.rebaseUseCase
      .invoke(options)
      .then((result) => {
        this._rebaseResult$.next(result)
      })
      .catch(() => {
        this._rebaseResult$.next(null)
      })
  }

  rebaseInteractive(options: InteractiveRebaseOptions): void {
    this.rebaseInteractiveUseCase
      .invoke(options)
      .then((result) => {
        this._rebaseResult$.next(result)
      })
      .catch(() => {
        this._rebaseResult$.next(null)
      })
  }

  rebaseAbort(worktreePath: string): void {
    this.rebaseAbortUseCase.invoke(worktreePath)
  }

  rebaseContinue(worktreePath: string): void {
    this.rebaseContinueUseCase
      .invoke(worktreePath)
      .then((result) => {
        this._rebaseResult$.next(result)
      })
      .catch(() => {
        this._rebaseResult$.next(null)
      })
  }

  getRebaseCommits(worktreePath: string, onto: string): void {
    this.getRebaseCommitsUseCase
      .invoke({ worktreePath, onto })
      .then((commits) => {
        this._rebaseCommits$.next(commits)
      })
      .catch(() => {
        this._rebaseCommits$.next([])
      })
  }

  fetchBranches(worktreePath: string): void {
    this.getBranchesUseCase
      .invoke(worktreePath)
      .then((branchList) => {
        this._branches$.next(branchList)
      })
      .catch(() => {
        this._branches$.next(null)
      })
  }
}
