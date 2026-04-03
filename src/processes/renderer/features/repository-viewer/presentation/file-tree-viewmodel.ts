import type { FileTreeNode } from '@domain'
import type { Observable } from 'rxjs'
import type { RepositoryViewerService } from '../application/services/repository-viewer-service-interface'
import type { GetFileTreeUseCase } from '../di-tokens'
import type { FileTreeViewModel } from './viewmodel-interfaces'
import { BehaviorSubject } from 'rxjs'

export class FileTreeDefaultViewModel implements FileTreeViewModel {
  private readonly _tree$ = new BehaviorSubject<FileTreeNode | null>(null)
  private readonly _loading$ = new BehaviorSubject<boolean>(false)

  readonly tree$: Observable<FileTreeNode | null> = this._tree$.asObservable()
  readonly loading$: Observable<boolean> = this._loading$.asObservable()

  constructor(
    private readonly getFileTreeUseCase: GetFileTreeUseCase,
    private readonly service: RepositoryViewerService,
  ) {}

  loadTree(worktreePath: string): void {
    this._loading$.next(true)
    this.getFileTreeUseCase
      .invoke(worktreePath)
      .then((tree) => {
        this._tree$.next(tree)
      })
      .catch(() => {
        this._tree$.next(null)
      })
      .finally(() => {
        this._loading$.next(false)
      })
  }

  selectFile(filePath: string): void {
    this.service.selectFile(filePath, false)
  }
}
