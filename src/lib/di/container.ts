/**
 * 軽量で型安全なDependency Injectionコンテナの実装。
 * 手動での依存関係解決を基本とし、シンプルで理解しやすいAPIを提供します。
 */
import { logger } from '../../utils'
import {
  DependencyToken,
  Factory,
  InjectionToken,
  LazyValue,
  Provider,
  ServiceMetadata,
  Type,
  isLazyToken,
} from './types'

/**
 * 型安全なDIトークンを作成するヘルパー関数。
 * 内部的にSymbol.forを使用してグローバルシンボルレジストリから
 * 一意のシンボルを取得し、型情報を付与します。
 *
 * @template T - トークンが表すサービスの型
 * @param {string} key - トークンを識別するための一意のキー
 * @return {InjectionToken<T>} 型付きの注入トークン
 */
export function createToken<T>(key: string): InjectionToken<T> {
  return Symbol.for(key) as InjectionToken<T>
}

/**
 * 値がクラス（コンストラクタ）かファクトリー関数かを判定します。
 * 複数の条件をチェックして、より正確にクラスを識別します。
 *
 * @template T - 判定する値の型
 * @param {Type<T> | Factory<T>} value - 判定する値
 * @return {boolean} クラスの場合はtrue、ファクトリー関数の場合はfalse
 */
function isClass<T>(value: Type<T> | Factory<T>): value is Type<T> {
  if (typeof value !== 'function') return false

  // アロー関数は必ずファクトリー関数として扱う
  if (!value.prototype) return false

  // constructorプロパティのチェック
  if (value.prototype.constructor !== value) return false

  // ES6クラスの判定（toStringで"class"で始まるか）
  const str = value.toString()
  if (str.startsWith('class ')) return true

  // 従来のコンストラクタ関数の判定（PascalCaseの慣習）
  // 名前が大文字で始まる場合はクラス/コンストラクタとして扱う
  return /^[A-Z]/.test(value.name)
}

/**
 * 軽量DIコンテナクラス (VContainer = Venue Container)。
 * サービスの登録、解決、ライフサイクル管理を行います。
 * 親子関係による階層化もサポートしています。
 */
export class VContainer {
  /** 登録されたサービスのメタデータを保存するマップ */
  private services = new Map<InjectionToken, ServiceMetadata>()
  /** シングルトンインスタンスを保存するマップ */
  private singletons = new Map<InjectionToken, unknown>()
  /** シングルトンサービスのLazyValueインスタンスを保存するマップ */
  private lazyCache = new Map<InjectionToken, LazyValue<unknown>>()
  /** 循環依存を検出するための解決中トークンのセット */
  private resolving = new Set<InjectionToken>()
  /** 親コンテナ（階層化サポート用） */
  private readonly parent?: VContainer
  /** トークンの文字列表現を記録するためのMap（重複検出用） */
  private tokenKeys = new Map<InjectionToken, string>()
  /** 重複検出を有効化するフラグ（開発環境のみ） */
  private readonly enableDuplicateCheck: boolean

  /**
   * VContainerを作成します。
   *
   * @param {VContainer} [parent] - 親コンテナ（省略可能）
   */
  constructor(parent?: VContainer) {
    this.parent = parent
    this.enableDuplicateCheck = process.env.NODE_ENV !== 'production'
  }

  /**
   * サービスをコンテナに登録します。
   * クラス、ファクトリー関数、または値を直接指定できます。
   *
   * @template T - 登録するサービスの型
   * @param {Provider<T>} provider - サービス登録の設定
   * @return {this} メソッドチェーン用のコンテナインスタンス
   */
  register = <T>(provider: Provider<T>): this => {
    const { token, useClass, useFactory, useValue, deps, lifetime = 'singleton' } = provider

    // 重複検出が有効な場合のみチェック
    if (this.enableDuplicateCheck) {
      this.checkDuplicateToken(token)
    }

    // 'scoped'ライフタイムはまだ実装されていないため、エラーを投げる
    if (lifetime === 'scoped') {
      throw new Error(`'scoped' lifetime is not yet implemented for ${String(token)}`)
    }

    // useFactoryとdepsの併用は無効な設定のため、エラーを投げる
    if (useFactory && deps && deps.length > 0) {
      throw new Error(
        `Dependencies cannot be used with useFactory for ${String(token)}. ` +
          `Dependencies are only valid with useClass.`,
      )
    }

    let factory: Factory<T>

    // 登録方法に応じてファクトリー関数を作成
    if (useValue !== undefined) {
      // 値を直接返すファクトリー
      factory = () => useValue
    } else if (useFactory) {
      // 提供されたファクトリー関数を使用
      factory = useFactory
    } else if (useClass) {
      // クラスからインスタンスを作成するファクトリー（依存関係付き）
      factory = () => this.createInstance(useClass, deps)
    } else {
      throw new Error(`Provider for ${String(token)} must specify useClass, useFactory, or useValue`)
    }

    // サービスメタデータを作成してマップに保存
    const metadata: ServiceMetadata<T> = {
      token,
      factory,
      lifetime,
      dependencies: useClass ? deps : undefined,
    }

    this.services.set(token, metadata)
    return this
  }

  /**
   * サービスをシングルトンとして登録するためのショートカットメソッド。
   * クラスまたはファクトリー関数を指定できます。
   *
   * @template T - 登録するサービスの型
   * @param {InjectionToken<T>} token - サービスのトークン
   * @param {Type<T> | Factory<T>} classOrFactory - クラスまたはファクトリー関数
   * @param {InjectionToken[]} [deps] - クラスのコンストラクタ依存関係（classOrFactoryがクラスの場合のみ有効）
   * @return {this} メソッドチェーン用のコンテナインスタンス
   */
  registerSingleton = <T>(
    token: InjectionToken<T>,
    classOrFactory: Type<T> | Factory<T>,
    deps?: InjectionToken[],
  ): this => {
    const provider: Provider<T> = {
      token,
      lifetime: 'singleton',
    }

    // クラスかファクトリー関数かを判定
    if (isClass(classOrFactory)) {
      provider.useClass = classOrFactory
      provider.deps = deps
    } else {
      provider.useFactory = classOrFactory
    }

    return this.register(provider)
  }

  /**
   * サービスをトランジェントとして登録するためのショートカットメソッド。
   * 要求のたびに新しいインスタンスが作成されます。
   *
   * @template T - 登録するサービスの型
   * @param {InjectionToken<T>} token - サービスのトークン
   * @param {Type<T> | Factory<T>} classOrFactory - クラスまたはファクトリー関数
   * @param {InjectionToken[]} [deps] - クラスのコンストラクタ依存関係（classOrFactoryがクラスの場合のみ有効）
   * @return {this} メソッドチェーン用のコンテナインスタンス
   */
  registerTransient = <T>(
    token: InjectionToken<T>,
    classOrFactory: Type<T> | Factory<T>,
    deps?: InjectionToken[],
  ): this => {
    const provider: Provider<T> = {
      token,
      lifetime: 'transient',
    }

    // クラスかファクトリー関数かを判定
    if (isClass(classOrFactory)) {
      provider.useClass = classOrFactory
      provider.deps = deps
    } else {
      provider.useFactory = classOrFactory
    }

    return this.register(provider)
  }

  /**
   * 指定されたトークンに対応するサービスを解決（取得）します。
   * サービスが見つからない場合は例外を投げます。
   *
   * @template T - 解決するサービスの型
   * @param {InjectionToken<T>} token - 解決するサービスのトークン
   * @return {T} 解決されたサービスインスタンス
   * @throws {Error} サービスが登録されていない場合
   */
  resolve = <T>(token: InjectionToken<T>): T => {
    // 循環依存の検出
    if (this.resolving.has(token)) {
      const cycle = Array.from(this.resolving)
        .concat(token)
        .map((t) => String(t))
        .join(' -> ')
      throw new Error(`Circular dependency detected: ${cycle}`)
    }

    const metadata = this.services.get(token)

    // サービスが見つからない場合は親コンテナを確認
    if (!metadata) {
      if (this.parent) {
        return this.parent.resolve(token)
      }
      throw new Error(`Service ${String(token)} not registered`)
    }

    // 解決中のマーク
    this.resolving.add(token)

    try {
      // シングルトンの場合は既存インスタンスを再利用
      if (metadata.lifetime === 'singleton') {
        if (!this.singletons.has(token)) {
          this.singletons.set(token, metadata.factory())
        }
        return this.singletons.get(token) as T
      }

      // トランジェントの場合は新しいインスタンスを作成
      return metadata.factory() as T
    } finally {
      // 解決後にマークを削除
      this.resolving.delete(token)
    }
  }

  /**
   * サービスの解決を試行し、見つからない場合はundefinedを返します。
   * 例外を投げずに安全にサービスの存在をチェックできます。
   *
   * @template T - 解決するサービスの型
   * @param {InjectionToken<T>} token - 解決するサービスのトークン
   * @return {T | undefined} 解決されたサービスインスタンスまたはundefined
   */
  tryResolve = <T>(token: InjectionToken<T>): T | undefined => {
    try {
      return this.resolve(token)
    } catch {
      return undefined
    }
  }

  /**
   * 複数のサービスを一度に解決し、配列として返します。
   * 型安全性を保ちながらバッチ処理が可能です。
   *
   * @template T - 解決するトークンの配列型
   * @param {T} tokens - 解決するサービストークンの配列
   * @return 解決されたサービスインスタンスの配列
   */
  resolveAll = <T extends readonly InjectionToken[]>(
    tokens: T,
  ): { [K in keyof T]: T[K] extends InjectionToken<infer U> ? U : never } => {
    return tokens.map((token) => this.resolve(token)) as {
      [K in keyof T]: T[K] extends InjectionToken<infer U> ? U : never
    }
  }

  /**
   * 指定されたトークンのサービスが登録されているかチェックします。
   * 親コンテナも含めて検索します。
   *
   * @param {InjectionToken} token - チェックするサービスのトークン
   * @return {boolean} サービスが登録されている場合はtrue
   */
  has = (token: InjectionToken): boolean => {
    return this.services.has(token) || (this.parent?.has(token) ?? false)
  }

  /**
   * 現在のコンテナを親とする子コンテナ（スコープ）を作成します。
   * 子コンテナは親のサービスにアクセス可能ですが、
   * 子コンテナ固有のサービスを上書き登録することもできます。
   *
   * @return {VContainer} 新しい子コンテナ
   */
  createScope = (): VContainer => {
    return new VContainer(this)
  }

  /**
   * コンテナに登録されたすべてのサービスとシングルトンインスタンスをクリアします。
   * テスト時のクリーンアップなどに使用します。
   */
  clear = (): void => {
    this.services.clear()
    this.singletons.clear()
    this.lazyCache.clear()
    this.tokenKeys.clear()
  }

  /**
   * トークンの文字列表現を取得します。
   * Symbolの場合はdescriptionを使用し、その他の場合はString()で変換します。
   *
   * @param {InjectionToken} token - 文字列表現を取得するトークン
   * @return {string} トークンの文字列表現
   */
  private getTokenKey = (token: InjectionToken): string => {
    if (typeof token === 'string') return token
    // コンストラクタ（クラス型）の場合
    if (typeof token === 'function') return String(token)
    // Symbol.for()で作成されたトークンの場合、descriptionを使用（残りはsymbol）
    return token.description ?? String(token)
  }

  /**
   * 同一コンテナ内でのトークン重複登録をチェックします。
   * 親コンテナのトークンを子コンテナでオーバーライドする場合は許可されます。
   * 開発環境でのみ有効で、本番環境ではスキップされます。
   *
   * @param {InjectionToken} token - チェック対象のトークン
   * @throws {Error} 同一コンテナ内で重複登録が検出された場合
   */
  private checkDuplicateToken = (token: InjectionToken): void => {
    const tokenKey = this.getTokenKey(token)

    // 同じTokenの再登録は許可（上書き）
    if (this.services.has(token)) {
      return
    }

    // 同一コンテナ内で異なるTokenで同じKeyが既に登録されている場合はエラー
    for (const [existingToken, existingKey] of this.tokenKeys.entries()) {
      if (existingKey === tokenKey && existingToken !== token) {
        logger.error(
          `[VContainer] Token key collision detected!\n` +
            `  Key: ${tokenKey}\n` +
            `  New token: ${String(token)}\n` +
            `  Existing token: ${String(existingToken)}\n` +
            `  This indicates different tokens using the same key string.\n` +
            `  Consider using unique prefixes like 'FeatureName.ServiceName'`,
        )
        throw new Error(
          `[VContainer] Token key collision: "${tokenKey}". ` + `Different tokens are using the same key string.`,
        )
      }
    }

    // トークンのキーを記録
    this.tokenKeys.set(token, tokenKey)
  }

  /**
   * 指定されたクラスから新しいインスタンスを作成します。
   * deps引数が指定された場合は、依存関係を解決してコンストラクタに渡します。
   *
   * @template T - 作成するインスタンスの型
   * @param {Type<T>} ctor - インスタンス化するクラス
   * @param {DependencyToken[]} [deps] - コンストラクタの依存関係トークン一覧
   * @return {T} 作成されたインスタンス
   */
  private createInstance = <T>(ctor: Type<T>, deps?: DependencyToken[]): T => {
    if (!deps || deps.length === 0) {
      // 引数なしのコンストラクタ
      // コンストラクターが引数を期待している場合はエラー
      if (ctor.length > 0) {
        throw new Error(
          `Dependency count mismatch for ${ctor.name}: ` +
            `constructor expects ${ctor.length} argument(s) but no dependencies were provided`,
        )
      }
      return new ctor()
    }

    // deps の数とコンストラクターの引数数が一致しているか検証
    if (deps.length !== ctor.length) {
      throw new Error(
        `Dependency count mismatch for ${ctor.name}: ` +
          `constructor expects ${ctor.length} argument(s) but ${deps.length} dependencies were provided`,
      )
    }

    // 依存関係を解決してコンストラクタに渡す
    try {
      const resolvedDeps = deps.map((token) => {
        if (!isLazyToken(token)) {
          return this.resolve(token)
        }

        // Lazy依存関係の解決
        const targetToken = token.token
        const metadata = this.services.get(targetToken)

        // シングルトンサービスの場合はLazyValueインスタンスもキャッシュ
        if (metadata?.lifetime === 'singleton') {
          if (!this.lazyCache.has(targetToken)) {
            this.lazyCache.set(targetToken, new LazyValue(() => this.resolve(targetToken)))
          }
          return this.lazyCache.get(targetToken)
        }

        // トランジェントサービスの場合は毎回新しいLazyValueを作成
        return new LazyValue(() => this.resolve(targetToken))
      })
      return new ctor(...resolvedDeps)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      logger.error(`Failed to create instance of ${ctor.name}: ${message}`)
      throw new Error(`Failed to create instance of ${ctor.name}: ${message}`, {
        cause: error,
      })
    }
  }
}

/**
 * VContainer の新しいインスタンスを作成して返す。
 * 親 VContainer が指定された場合、新しいコンテナはその親と関連付けられる。
 *
 * @param {VContainer} [parent] - 関連付けるオプションの親コンテナ。
 * @return {VContainer} 新しい VContainer インスタンス（親が指定された場合は親と関連付けられる）。
 */
export const createContainer = (parent?: VContainer): VContainer => new VContainer(parent)

/**
 * グローバルDIコンテナインスタンス。
 * アプリケーション全体で共有される主要なDIコンテナです。
 * 必要に応じて独自のVContainerインスタンスを作成することも可能です。
 */
export const globalContainer = new VContainer()
