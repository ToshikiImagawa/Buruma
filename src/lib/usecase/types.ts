import type { Observable } from 'rxjs'

// --- 基本ユースケースインターフェース ---

/**
 * 値を受け取って処理を実行するユースケース（副作用あり、戻り値なし）
 */
export interface ConsumerUseCase<T> {
  invoke(arg: T): void
}

/**
 * 値を受け取って別の値を返すユースケース（変換処理）
 */
export interface FunctionUseCase<T, R> {
  invoke(arg: T): R
}

/**
 * 同じ型の値を受け取って変換後の値を返すユースケース
 */
export interface OperatorUseCase<T> {
  invoke(arg: T): T
}

/**
 * 値を受け取って真偽値を返すユースケース（条件判定）
 */
export interface PredicateUseCase<T> {
  invoke(arg: T): boolean
}

/**
 * 引数なしで処理を実行するユースケース
 */
export interface RunnableUseCase {
  invoke(): void
}

/**
 * 引数なしで値を提供するユースケース（値の生成・取得）
 */
export interface SupplierUseCase<T> {
  invoke(): T
}

// --- リアクティブユースケースインターフェース ---

/**
 * 読み取り専用のリアクティブプロパティ
 *
 * BehaviorSubject の読み取り専用ラッパーとして使用。
 * 現在値への同期アクセスと Observable ストリームの両方を提供する。
 */
export interface ReadOnlyReactiveProperty<T> {
  readonly value: T
  asObservable(): Observable<T>
}

/**
 * Observable ストリームを提供するユースケース
 */
export interface ObservableStoreUseCase<T> {
  readonly store: Observable<T>
}

/**
 * 現在値付きリアクティブプロパティを提供するユースケース
 */
export interface ReactivePropertyUseCase<T> {
  readonly property: ReadOnlyReactiveProperty<T>
}

