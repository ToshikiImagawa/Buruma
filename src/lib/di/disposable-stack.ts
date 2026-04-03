/**
 * tearDown()メソッドを持つオブジェクトのインターフェース
 *
 * @remarks
 * サービスなどのリソース管理対象オブジェクトが実装するインターフェース。
 * DisposableStackで使用する際は、このインターフェースまたはDisposableを実装してください。
 */
export interface TearDownable {
  tearDown(): void
}

/**
 * TearDownableインターフェースを実装しているかの型ガード
 */
function isTearDownable(value: TearDownable | Disposable): value is TearDownable {
  return 'tearDown' in value && typeof value.tearDown === 'function'
}

/**
 * リソース管理用のDisposableStack
 *
 * @remarks
 * UniRxのCompositeDisposableパターンを参考にした実装。
 *
 * **特徴**:
 * - `use()`: TearDownableまたはDisposableオブジェクトを登録
 * - `defer()`: クリーンアップ関数を登録
 * - `dispose()`: 登録されたリソースをLIFO順で解放
 *
 * **UniRxとの主な違い**:
 * - Add → use（TypeScript/TC39の命名に合わせる）
 * - スレッドセーフ機構なし（JSはシングルスレッド）
 * - LIFO順で解放（スタックとして動作）
 */
export class DisposableStack {
  private _tearDowns: (() => void)[] = []
  private _disposed = false

  get disposed(): boolean {
    return this._disposed
  }

  /**
   * TearDownableまたはDisposableオブジェクトをスタックに登録
   *
   * @remarks
   * - TearDownable: tearDown()メソッドを呼び出し
   * - Disposable: [Symbol.dispose]()メソッドを呼び出し
   * - 既にdisposedの場合は即座に解放される（UniRxパターン）
   */
  use = <T extends TearDownable | Disposable>(value: T): T => {
    const cleanup = isTearDownable(value) ? () => value.tearDown() : () => value[Symbol.dispose]()
    if (this._disposed) {
      cleanup()
      return value
    }
    this._tearDowns.push(cleanup)
    return value
  }

  /**
   * クリーンアップ関数をスタックに登録
   *
   * @remarks
   * 既にdisposedの場合は即座に実行される（UniRxパターン）
   */
  defer = (onDispose: () => void): void => {
    if (this._disposed) {
      onDispose()
      return
    }
    this._tearDowns.push(onDispose)
  }

  /**
   * 登録されたリソースをLIFO順で解放
   *
   * @remarks
   * 複数回呼び出しても安全（2回目以降は何もしない）
   */
  dispose = (): DisposableStackResult => {
    if (this._disposed) {
      return { success: true, errors: [] }
    }
    this._disposed = true

    // スナップショットを取得してからクリア（UniRxパターン）
    // splice(0)で全要素を取得しつつ配列をクリア
    const tearDowns = this._tearDowns.splice(0)

    const errors: Error[] = []
    for (let i = tearDowns.length - 1; i >= 0; i--) {
      try {
        tearDowns[i]()
      } catch (error) {
        errors.push(error instanceof Error ? error : new Error(String(error)))
      }
    }

    return { success: errors.length === 0, errors }
  }
}

export interface DisposableStackResult {
  success: boolean
  errors: Error[]
}

/**
 * クリーンアップハンドル
 *
 * @remarks
 * DIの`setUp`関数が返すオブジェクトの型。
 * 関数として呼び出すか、`dispose()`メソッドでリソースを解放します。
 *
 * **後方互換性**:
 * - `handle()` - 関数として呼び出し（既存コード向け）
 * - `handle.dispose()` - メソッドとして呼び出し（新規コード向け）
 */
export interface CleanupHandle {
  /** 関数として呼び出し可能 */
  (): DisposableStackResult
  /** メソッドとして呼び出し可能 */
  dispose(): DisposableStackResult
}

/**
 * DisposableStackからCleanupHandleを作成
 *
 * @remarks
 * エラーハンドリング付きのCleanupHandleを生成します。
 * 関数としても、`dispose()`メソッドとしても呼び出せます。
 *
 * @param stack - DisposableStack
 * @param onError - エラー時のコールバック（オプション）
 * @return CleanupHandle
 */
export function createCleanupHandle(stack: DisposableStack, onError?: (errors: Error[]) => void): CleanupHandle {
  const dispose = (): DisposableStackResult => {
    const result = stack.dispose()
    if (!result.success && onError) {
      onError(result.errors)
    }
    return result
  }

  // 関数としても呼び出せるようにする
  const handle = dispose as CleanupHandle
  handle.dispose = dispose

  return handle
}

export const createDisposableStack = (): DisposableStack => new DisposableStack()
