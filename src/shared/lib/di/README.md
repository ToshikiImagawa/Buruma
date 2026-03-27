# DI (Dependency Injection)

軽量で型安全な Dependency Injection コンテナライブラリです。

## 特徴

- **型安全**: TypeScript の型システムを活用した依存関係の管理
- **シンプルな API**: 手動での依存関係解決を基本とした理解しやすい設計
- **ライフサイクル管理**: Singleton と Transient のライフサイクルをサポート
- **遅延評価 (Lazy)**: 循環依存を解決するための `Lazy<T>` パターン
- **階層化サポート**: 親子関係によるスコープの階層化
- **React 統合**: Provider と Hooks による React コンポーネントとの連携
- **リソース管理**: `DisposableStack` と `TearDownable` によるサービスのクリーンアップ管理

## インストール

このライブラリは `@anthony-dena/ticketvc-venue-common` に含まれています。

```typescript
import { VContainer, createToken, asLazy } from '@anthony-dena/ticketvc-venue-common/lib/di'
```

## 基本的な使い方

### トークンの作成

サービスを識別するためのトークンを作成します。

```typescript
import { createToken } from './lib/di'

// インターフェースを定義
interface UserService {
  getUser(id: string): Promise<User>
}

interface AuthService {
  login(credentials: Credentials): Promise<void>
}

// トークンを作成
const UserServiceToken = createToken<UserService>('UserService')
const AuthServiceToken = createToken<AuthService>('AuthService')
```

### サービスの登録

```typescript
import { VContainer } from './lib/di'

const container = new VContainer()

// クラスを登録（シングルトン）
container.registerSingleton(UserServiceToken, DefaultUserService)

// ファクトリー関数を登録
container.registerSingleton(AuthServiceToken, () => new DefaultAuthService())

// 値を直接登録
container.register({
  token: ConfigToken,
  useValue: { apiUrl: 'https://api.example.com' },
})

// トランジェント（毎回新しいインスタンス）
container.registerTransient(LoggerToken, ConsoleLogger)
```

### 依存関係の解決

``` typescript
// サービスを取得
const userService = container.resolve(UserServiceToken)

// サービスの存在確認
if (container.has(UserServiceToken)) {
  // ...
}

// 安全な解決（例外を投げない）
const maybeService = container.tryResolve(OptionalServiceToken)

// 複数のサービスを一度に解決
const [userService, authService] = container.resolveAll([
  UserServiceToken,
  AuthServiceToken,
])
```

### 依存関係の注入

クラスのコンストラクタに依存関係を注入します。

```typescript
class DefaultUserService implements UserService {
  constructor(
    private readonly api: ApiClient,
    private readonly cache: CacheService,
  ) {
  }

  async getUser(id: string): Promise<User> {
    // ...
  }
}

// 依存関係を指定して登録
container.registerSingleton(
  UserServiceToken,
  DefaultUserService,
  [ApiClientToken, CacheServiceToken]  // deps: コンストラクタ引数の順序で指定
)
```

### 遅延評価 (Lazy) による循環依存の解決

サービス間に循環依存がある場合、`asLazy()` を使用して解決します。

```typescript
import { asLazy, type Lazy } from './lib/di'

class ServiceA {
  constructor(private readonly serviceB: Lazy<ServiceB>) {
  }

  doSomething() {
    // 実際に必要になった時点で解決
    const b = this.serviceB.getValue()
    b.doOther()
  }
}

class ServiceB {
  constructor(private readonly serviceA: Lazy<ServiceA>) {
  }

  doOther() {
    const a = this.serviceA.getValue()
    // ...
  }
}

// asLazy() で Lazy 依存として登録
container.registerSingleton(ServiceAToken, ServiceA, [asLazy(ServiceBToken)])
container.registerSingleton(ServiceBToken, ServiceB, [asLazy(ServiceAToken)])
```

### スコープ（子コンテナ）の作成

```typescript
const parentContainer = new VContainer()
parentContainer.registerSingleton(ConfigToken, () => globalConfig)

// 子コンテナを作成
const childContainer = parentContainer.createScope()

// 子コンテナは親のサービスにアクセス可能
const config = childContainer.resolve(ConfigToken)

// 子コンテナでサービスをオーバーライド
childContainer.registerSingleton(ConfigToken, () => localConfig)
```

## React との統合

### VContainerProvider

```tsx
import { VContainerProvider, useVContainer } from './lib/di'

// 設定を定義
const containerConfigs = [
  {
    // サービスの登録
    register: (container) => {
      container.registerSingleton(UserServiceToken, DefaultUserService)
      container.registerSingleton(AuthServiceToken, DefaultAuthService)
    },
    // 非同期セットアップ（オプション）
    setUp: async (container) => {
      const authService = container.resolve(AuthServiceToken)
      await authService.initialize()

      // クリーンアップ関数を返す
      return () => {
        authService.dispose()
      }
    },
  },
]

// アプリケーションのルート
function App() {
  return (
    <VContainerProvider
      configs={containerConfigs}
      fallback={<LoadingSpinner />}
      errorFallback={(error) => <ErrorDisplay error={error} />}
    >
      <MainContent />
    </VContainerProvider>
  )
}

// コンポーネント内でコンテナを使用
function MainContent() {
  const container = useVContainer()
  const userService = container.resolve(UserServiceToken)

  // ...
}
```

### Hooks

``` typescript
import { useVContainer, useVContainerReady, useVContainerError } from './lib/di'

function MyComponent() {
  // コンテナを取得（準備完了前に呼ぶとエラー）
  const container = useVContainer()

  // 準備完了状態を確認
  const isReady = useVContainerReady()

  // エラー状態を確認
  const error = useVContainerError()

  if (!isReady) {
    return <Loading />
  }

  if (error) {
    return <Error message={error.message} />
  }

  // ...
}
```

### Render Props パターン

```tsx
<VContainerProvider configs={configs}>
  {({ isReady, error }) => {
    if (error) return <ErrorDisplay error={error} />
    if (!isReady) return <LoadingSpinner />
    return <MainContent />
  }}
</VContainerProvider>
```

## API リファレンス

### createToken

``` typescript
function createToken<T>(key: string): InjectionToken<T>
```

型安全な DI トークンを作成します。

### VContainer

| メソッド                                              | 説明                           |
|---------------------------------------------------|------------------------------|
| `register(provider)`                              | サービスを登録                      |
| `registerSingleton(token, classOrFactory, deps?)` | シングルトンとして登録                  |
| `registerTransient(token, classOrFactory, deps?)` | トランジェントとして登録                 |
| `resolve(token)`                                  | サービスを解決                      |
| `tryResolve(token)`                               | サービスを解決（見つからない場合は undefined） |
| `resolveAll(tokens)`                              | 複数のサービスを一度に解決                |
| `has(token)`                                      | サービスが登録されているか確認              |
| `createScope()`                                   | 子コンテナを作成                     |
| `clear()`                                         | 全てのサービスをクリア                  |

### Provider オプション

```typescript
interface Provider<T> {
  token: InjectionToken<T>      // 必須: サービストークン
  useClass?: Type<T>            // クラスを使用
  useFactory?: Factory<T>       // ファクトリー関数を使用
  useValue?: T                  // 値を直接使用
  deps?: DependencyToken[]      // useClass 使用時の依存関係
  lifetime?: ServiceLifetime    // 'singleton' | 'transient'（デフォルト: 'singleton'）
}
```

### asLazy

``` typescript
function asLazy<T>(token: InjectionToken<T>): LazyToken<T>
```

依存関係を遅延評価としてマークします。

### Lazy<T>

```typescript
interface Lazy<T> {
  getValue(): T  // 値を取得（初回呼び出し時に解決）
}
```

### VContainerProvider

| Props           | 型                             | 説明                     |
|-----------------|-------------------------------|------------------------|
| `configs`       | `VContainerConfig[]`          | コンテナの設定配列              |
| `children`      | `ReactNode \| Function`       | 子要素または render props 関数 |
| `parent`        | `VContainer`                  | 親コンテナ（オプション）           |
| `fallback`      | `ReactNode`                   | ローディング時の表示（オプション）      |
| `errorFallback` | `(error: Error) => ReactNode` | エラー時の表示（オプション）         |

### Hooks

| Hook                   | 戻り値             | 説明        |
|------------------------|-----------------|-----------|
| `useVContainer()`      | `VContainer`    | DIコンテナを取得 |
| `useVContainerReady()` | `boolean`       | 準備完了状態    |
| `useVContainerError()` | `Error \| null` | エラー状態     |

## ライフサイクル

| ライフサイクル     | 説明                       |
|-------------|--------------------------|
| `singleton` | 一度作成されたインスタンスを再利用（デフォルト） |
| `transient` | 要求のたびに新しいインスタンスを作成       |
| `scoped`    | スコープ内で同じインスタンスを共有（未実装）   |

## リソース管理（DisposableStack）

サービスのライフサイクル管理のための `DisposableStack` を提供しています。
UniRx の CompositeDisposable パターンを参考に、TC39 Explicit Resource Management 提案に準拠した実装です。

### TearDownable インターフェース

サービスが実装するクリーンアップ用インターフェースです。

```typescript
import type { TearDownable } from './lib/di'

interface MyService extends TearDownable {
  setUp(id: string): void

  tearDown(): void  // TearDownable で定義
  // その他のメソッド...
}

class DefaultMyService implements MyService {
  private canvasId: string | null = null

  setUp(id: string): void {
    this.canvasId = id
    // 初期化処理
  }

  tearDown = (): void => {
    // クリーンアップ処理
    this.canvasId = null
  }
}
```

### DisposableStack

複数の `TearDownable` オブジェクトをまとめて管理し、LIFO（後入れ先出し）順で解放します。

```typescript
import { DisposableStack } from './lib/di'

const stack = new DisposableStack()

// TearDownable オブジェクトを登録
stack.use(serviceA)  // serviceA.tearDown() が呼ばれる
stack.use(serviceB)  // serviceB.tearDown() が呼ばれる

// クリーンアップ関数を直接登録
stack.defer(() => {
  console.log('クリーンアップ処理')
})

// 全てを解放（LIFO順: defer → serviceB → serviceA）
const result = stack.dispose()
// result: { success: boolean, errors: Error[] }
```

### CleanupHandle

DI の `setUp` 関数が返すクリーンアップハンドルです。
関数としても、`dispose()` メソッドとしても呼び出せます。

```typescript
import { DisposableStack, createCleanupHandle, type CleanupHandle } from './lib/di'

export async function setUp(container: VContainer, options: SetupOptions): Promise<CleanupHandle> {
  const stack = new DisposableStack()

  const myService = container.resolve(MyServiceToken)
  myService.setUp(options.canvasId)
  stack.use(myService)

  // エラーハンドリング付きの CleanupHandle を作成
  return createCleanupHandle(stack, (errors) => {
    console.error('tearDown中にエラーが発生:', errors)
  })
}

// 使用例
const cleanup = await setUp(container, { canvasId: 'canvas-1' })

// 方法1: 関数として呼び出し
cleanup()

// 方法2: メソッドとして呼び出し
cleanup.dispose()
```

### UniRx パターン

DisposableStack は UniRx の CompositeDisposable と同様の動作をします：

```typescript
const stack = new DisposableStack()

// すでに disposed の場合、use() は即座に tearDown を実行
stack.dispose()
stack.use(serviceA)  // 即座に serviceA.tearDown() が呼ばれる
stack.defer(() => {
}) // 即座に実行される
```

### API リファレンス（リソース管理）

#### DisposableStack

| メソッド/プロパティ           | 説明                              |
|----------------------|---------------------------------|
| `disposed`           | 解放済みかどうか（readonly）              |
| `use(value)`         | TearDownable または Disposable を登録 |
| `defer(fn)`          | クリーンアップ関数を登録                    |
| `dispose()`          | 全てを LIFO 順で解放                   |
| `[Symbol.dispose]()` | dispose() のエイリアス（TC39準拠）        |

#### createCleanupHandle

```typescript
function createCleanupHandle(
  stack: DisposableStack,
  onError?: (errors: Error[]) => void
): CleanupHandle {
}
```

#### TearDownable

```typescript
interface TearDownable {
  tearDown(): void
}
```

#### CleanupHandle

```typescript
interface CleanupHandle {
  (): DisposableStackResult           // 関数として呼び出し
  dispose(): DisposableStackResult    // メソッドとして呼び出し
}

interface DisposableStackResult {
  success: boolean
  errors: Error[]
}
```

## 設計上の注意

- **重複検出**: 開発環境では同じキーで異なるトークンを登録しようとするとエラー
- **循環依存検出**: 解決時に循環依存を検出してエラーをスロー
- **親子コンテナ**: 子コンテナは親のサービスにアクセス可能、オーバーライドも可能
- **コンストラクタ引数検証**: deps の数とコンストラクタ引数数の不一致を検出
- **LIFO解放**: DisposableStack は登録の逆順でリソースを解放（依存関係の安全な解放）
- **エラー継続**: tearDown 中にエラーが発生しても、残りの解放処理は継続される
