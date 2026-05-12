import type { Observable } from 'rxjs'
import type { ObservableStoreUseCase } from './types'

/**
 * Service の Observable プロパティを ObservableStoreUseCase として公開する汎用 UseCase。
 *
 * 読み取り専用のリアクティブストリームを ViewModel に提供する UseCase が同一構造の薄い
 * ラッパーになりがちな問題を解消するため、本クラスを DI ファクトリー経由で再利用する。
 * ViewModel は従来通り `useCase.store` 経由で参照するため、依存方向は維持される。
 */
export class ObservableQueryUseCase<T> implements ObservableStoreUseCase<T> {
  constructor(public readonly store: Observable<T>) {}
}
