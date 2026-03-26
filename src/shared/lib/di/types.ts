/**
 * DIコンテナ用の型定義
 */

/**
 * 遅延評価される値
 */
export interface Lazy<T> {
  /**
   * 現在の値を取得する
   *
   * @return 指定された型の値
   */
  getValue(): T
}

/**
 * 遅延評価される値のラッパークラス。
 * 初回のgetValue()呼び出し時にfactory関数を実行し、結果をキャッシュします。
 * DIコンテナでLazy依存関係を解決する際に使用されます。
 *
 * @template T - 遅延評価される値の型
 *
 * @example
 * const lazy = new LazyValue(() => expensiveComputation())
 * const value = lazy.getValue() // 初回のみ計算される
 * const cached = lazy.getValue() // キャッシュから取得
 */
export class LazyValue<T> implements Lazy<T> {
  /** factory関数（遅延実行される） */
  private readonly factory: () => T
  /** 評価済みの値（未初期化時はundefined） */
  private value: T | undefined = undefined
  /** 初期化済みフラグ */
  private initialized = false
  constructor(factory: () => T) {
    this.factory = factory
  }
  getValue = (): T => {
    if (!this.initialized) {
      try {
        this.value = this.factory()
        this.initialized = true
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        throw new Error(`Failed to initialize lazy value: ${message}`, {
          cause: error,
        })
      }
    }
    return this.value as T
  }
}

/**
 * サービスを識別するためのトークン型。
 * 文字列、シンボル、またはクラスコンストラクタを使用できます。
 *
 * @template T - サービスの型
 */
export type InjectionToken<T = unknown> = string | symbol | { new (...args: unknown[]): T }

/**
 * Lazy評価される依存関係を示すマーカー型。
 * asLazy()ヘルパー関数で作成され、DIコンテナが自動的にLazyValueでラップします。
 *
 * @template T - 遅延評価される依存関係の型
 */
export interface LazyToken<T = unknown> {
  /** Lazy依存関係であることを示すマーカー */
  readonly __lazy: true
  /** 遅延解決される実際のトークン */
  readonly token: InjectionToken<T>
}

/**
 * 依存関係トークンまたはLazy依存関係トークン。
 * deps配列で使用される統一型。
 */
export type DependencyToken<T = unknown> = InjectionToken<T> | LazyToken<T>

/**
 * 型ガード: LazyToken型かどうかを判定します。
 *
 * @param dep - 判定する依存関係トークン
 * @return {boolean} LazyTokenの場合はtrue
 */
export function isLazyToken<T = unknown>(dep: DependencyToken<T>): dep is LazyToken<T> {
  return typeof dep === 'object' && dep !== null && '__lazy' in dep && dep.__lazy
}

/**
 * 依存関係をLazy評価としてマークするヘルパー関数。
 * DIコンテナはこのマーカーを検出し、自動的にLazyValueでラップします。
 *
 * @template T - 遅延評価される依存関係の型
 * @param {InjectionToken<T>} token - 遅延解決するトークン
 * @return {LazyToken<T>} Lazy依存関係マーカー
 */
export function asLazy<T>(token: InjectionToken<T>): LazyToken<T> {
  return { __lazy: true, token } as const
}

/**
 * サービスのライフサイクル管理方式。
 *
 * - `singleton`: 一度作成されたインスタンスを再利用
 * - `transient`: 要求のたびに新しいインスタンスを作成
 * - `scoped`: スコープ内で同じインスタンスを共有（現在未実装）
 */
export type ServiceLifetime = 'singleton' | 'transient' | 'scoped'

/**
 * DIコンテナ内でサービスを管理するためのメタデータ。
 * 各サービスの作成方法とライフサイクルを定義します。
 *
 * @template T - サービスの型
 */
export interface ServiceMetadata<T = unknown> {
  /** サービスを識別するトークン */
  token: InjectionToken<T>
  /** サービスインスタンスを作成するファクトリー関数 */
  factory: () => T
  /** サービスのライフサイクル管理方式 */
  lifetime: ServiceLifetime
  /** 依存するサービスのトークン一覧（将来の機能拡張用） */
  dependencies?: DependencyToken[]
}

/**
 * TypeScriptのクラスコンストラクタ型。
 * DIコンテナでクラスからインスタンスを作成する際に使用されます。
 *
 * @template T - 作成されるインスタンスの型
 */
export interface Type<T = unknown> {
  new (...args: unknown[]): T
}

/**
 * サービスインスタンスを作成するファクトリー関数型。
 * 依存関係の手動解決や複雑な初期化ロジックに使用されます。
 *
 * @template T - 作成されるサービスの型
 */
export type Factory<T = unknown> = () => T

/**
 * サービス登録時の設定オプション。
 * サービスの作成方法とライフサイクルを指定します。
 *
 * @template T - 登録するサービスの型
 */
export interface Provider<T = unknown> {
  /** サービスを識別するトークン */
  token: InjectionToken<T>
  /** サービス作成に使用するクラス */
  useClass?: Type<T>
  /** サービス作成に使用するファクトリー関数 */
  useFactory?: Factory<T>
  /** 直接使用する値 */
  useValue?: T
  /** useClassのコンストラクタ引数として注入する依存関係のトークン一覧 */
  deps?: DependencyToken[]
  /** サービスのライフサイクル（デフォルト: 'singleton'） */
  lifetime?: ServiceLifetime
}
