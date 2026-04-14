import type { IPCError } from '@lib/ipc'
import type { Observable } from 'rxjs'
import type {
  CheckoutBranchRendererUseCase,
  CreateBranchRendererUseCase,
  DeleteBranchRendererUseCase,
  GetLastErrorUseCase,
  GetOperationLoadingUseCase,
  ResetRendererUseCase,
} from '../di-tokens'
import type { BranchOpsViewModel } from './viewmodel-interfaces'

export class BranchOpsDefaultViewModel implements BranchOpsViewModel {
  readonly loading$: Observable<boolean>
  readonly lastError$: Observable<IPCError | null>

  constructor(
    private readonly createBranchUseCase: CreateBranchRendererUseCase,
    private readonly checkoutBranchUseCase: CheckoutBranchRendererUseCase,
    private readonly deleteBranchUseCase: DeleteBranchRendererUseCase,
    private readonly resetUseCase: ResetRendererUseCase,
    getOperationLoadingUseCase: GetOperationLoadingUseCase,
    getLastErrorUseCase: GetLastErrorUseCase,
  ) {
    this.loading$ = getOperationLoadingUseCase.store
    this.lastError$ = getLastErrorUseCase.store
  }

  createBranch(worktreePath: string, name: string, startPoint?: string): void {
    this.createBranchUseCase.invoke({ worktreePath, name, startPoint })
  }

  checkoutBranch(worktreePath: string, branch: string): void {
    this.checkoutBranchUseCase.invoke({ worktreePath, branch })
  }

  deleteBranch(worktreePath: string, branch: string, remote?: boolean, force?: boolean): void {
    this.deleteBranchUseCase.invoke({ worktreePath, branch, remote, force })
  }

  resetToCommit(worktreePath: string, target: string, mode: 'soft' | 'mixed' | 'hard'): void {
    this.resetUseCase.invoke({ worktreePath, mode, target })
  }
}
