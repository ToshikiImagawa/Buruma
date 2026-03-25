import type { InjectionToken, Type } from '../types'
import { beforeEach, describe, expect, it } from 'vitest'
import { VContainer, createToken } from '../container'

/**
 * DIコンテナのテストケース
 */

// テスト用のサービスクラス
class TestService {
  constructor(public value = 'test') {}
  getValue() {
    return this.value
  }
}

class CounterService {
  private count = 0
  increment() {
    return ++this.count
  }
}

// 依存関係のあるサービスクラス
interface ILogger {
  log(message: string): void
}

interface IDatabase {
  query(sql: string): string
}

class Logger implements ILogger {
  private logs: string[] = []

  log(message: string): void {
    this.logs.push(message)
  }

  getLogs(): string[] {
    return [...this.logs]
  }
}

class Database implements IDatabase {
  constructor(private logger: ILogger) {}

  query(sql: string): string {
    this.logger.log(`Executing query: ${sql}`)
    return 'query result'
  }
}

class UserService {
  constructor(
    private database: IDatabase,
    private logger: ILogger,
  ) {}

  getUser(id: string): string {
    this.logger.log(`Getting user ${id}`)
    return this.database.query(`SELECT * FROM users WHERE id = ${id}`)
  }
}

// テスト用トークン
const TestServiceToken = createToken<TestService>('TestService')
const CounterToken = createToken<CounterService>('CounterService')
const ValueToken = createToken<string>('ValueToken')
const LoggerToken = createToken<ILogger>('Logger')
const DatabaseToken = createToken<IDatabase>('Database')
const UserServiceToken = createToken<UserService>('UserService')

describe('VContainer', () => {
  let container: VContainer

  beforeEach(() => {
    container = new VContainer()
  })

  describe('基本的な登録と解決', () => {
    it('useClassでサービスを登録・解決できる', () => {
      container.register({
        token: TestServiceToken,
        useClass: TestService as Type<TestService>,
      })

      const instance = container.resolve(TestServiceToken)
      expect(instance).toBeInstanceOf(TestService)
      expect(instance.getValue()).toBe('test')
    })

    it('useFactoryでサービスを登録・解決できる', () => {
      container.register({
        token: TestServiceToken,
        useFactory: () => new TestService('factory'),
      })

      const instance = container.resolve(TestServiceToken)
      expect(instance.getValue()).toBe('factory')
    })

    it('useValueで値を登録・解決できる', () => {
      container.register({
        token: ValueToken,
        useValue: 'direct value',
      })

      const value = container.resolve(ValueToken)
      expect(value).toBe('direct value')
    })

    it('登録されていないサービスを解決しようとするとエラー', () => {
      expect(() => container.resolve(TestServiceToken)).toThrow(
        'Service Symbol(TestService) not registered',
      )
    })
  })

  describe('ライフサイクル管理', () => {
    it('singletonは同じインスタンスを返す', () => {
      container.registerSingleton(CounterToken, CounterService)

      const instance1 = container.resolve(CounterToken)
      const instance2 = container.resolve(CounterToken)

      expect(instance1).toBe(instance2)
      expect(instance1.increment()).toBe(1)
      expect(instance2.increment()).toBe(2)
    })

    it('transientは毎回新しいインスタンスを返す', () => {
      container.registerTransient(CounterToken, CounterService)

      const instance1 = container.resolve(CounterToken)
      const instance2 = container.resolve(CounterToken)

      expect(instance1).not.toBe(instance2)
      expect(instance1.increment()).toBe(1)
      expect(instance2.increment()).toBe(1)
    })
  })

  describe('スコープと親子関係', () => {
    it('子コンテナは親のサービスを解決できる', () => {
      container.register({
        token: TestServiceToken,
        useValue: new TestService('parent'),
      })

      const childContainer = container.createScope()
      const instance = childContainer.resolve(TestServiceToken)

      expect(instance.getValue()).toBe('parent')
    })

    it('子コンテナで上書き登録できる', () => {
      container.register({
        token: TestServiceToken,
        useValue: new TestService('parent'),
      })

      const childContainer = container.createScope()
      childContainer.register({
        token: TestServiceToken,
        useValue: new TestService('child'),
      })

      expect(container.resolve(TestServiceToken).getValue()).toBe('parent')
      expect(childContainer.resolve(TestServiceToken).getValue()).toBe('child')
    })
  })

  describe('ユーティリティメソッド', () => {
    it('tryResolveは登録されていない場合undefinedを返す', () => {
      const result = container.tryResolve(TestServiceToken)
      expect(result).toBeUndefined()
    })

    it('hasでサービスの登録を確認できる', () => {
      expect(container.has(TestServiceToken)).toBe(false)

      container.register({
        token: TestServiceToken,
        useClass: TestService as Type<TestService>,
      })

      expect(container.has(TestServiceToken)).toBe(true)
    })

    it('resolveAllで複数のサービスを解決できる', () => {
      container.register({
        token: TestServiceToken,
        useValue: new TestService('test'),
      })
      container.register({
        token: ValueToken,
        useValue: 'value',
      })

      // resolveAllが配列を返すことを確認
      const results = container.resolveAll([TestServiceToken, ValueToken])
      expect(Array.isArray(results)).toBe(true)
      expect(results).toHaveLength(2)

      // 個別に型安全に解決して値を検証
      const testService = container.resolve(TestServiceToken)
      const value = container.resolve(ValueToken)
      expect(testService.getValue()).toBe('test')
      expect(value).toBe('value')
    })

    it('clearでコンテナをクリアできる', () => {
      container.register({
        token: TestServiceToken,
        useClass: TestService as Type<TestService>,
      })

      expect(container.has(TestServiceToken)).toBe(true)

      container.clear()

      expect(container.has(TestServiceToken)).toBe(false)
    })
  })

  describe('エッジケース', () => {
    it('プロバイダーが不完全な場合エラー', () => {
      const incompleteProvider = {
        token: TestServiceToken,
      } as Parameters<typeof container.register>[0]

      expect(() => container.register(incompleteProvider)).toThrow(
        'Provider for Symbol(TestService) must specify useClass, useFactory, or useValue',
      )
    })

    it('文字列トークンも使用できる', () => {
      const stringToken: InjectionToken<string> = 'StringService'

      container.register({
        token: stringToken,
        useValue: 'string value',
      })

      expect(container.resolve(stringToken)).toBe('string value')
    })
  })

  describe('手動での依存関係解決', () => {
    it('useFactoryで依存関係を手動解決できる', () => {
      // 依存関係を順番に登録
      container.register({
        token: LoggerToken,
        useClass: Logger,
        lifetime: 'singleton',
      })

      container.register({
        token: DatabaseToken,
        useFactory: () => new Database(container.resolve(LoggerToken)),
        lifetime: 'singleton',
      })

      container.register({
        token: UserServiceToken,
        useFactory: () =>
          new UserService(container.resolve(DatabaseToken), container.resolve(LoggerToken)),
      })

      // サービスを解決して動作確認
      const userService = container.resolve(UserServiceToken)
      const result = userService.getUser('123')

      expect(result).toBe('query result')

      // ログが記録されていることを確認
      const logger = container.resolve(LoggerToken) as Logger
      const logs = logger.getLogs()
      expect(logs).toContain('Getting user 123')
      expect(logs).toContain('Executing query: SELECT * FROM users WHERE id = 123')
    })

    it('複雑な依存関係グラフを解決できる', () => {
      // 設定サービス
      const configToken = createToken<{ apiUrl: string }>('Config')
      container.register({
        token: configToken,
        useValue: { apiUrl: 'https://api.example.com' },
      })

      // HTTPクライアント（設定に依存）
      interface IHttpClient {
        get(path: string): string
      }
      const httpClientToken = createToken<IHttpClient>('HttpClient')

      class HttpClient implements IHttpClient {
        constructor(private config: { apiUrl: string }) {}
        get(path: string): string {
          return `${this.config.apiUrl}${path}`
        }
      }

      container.register({
        token: httpClientToken,
        useFactory: () => new HttpClient(container.resolve(configToken)),
        lifetime: 'singleton',
      })

      // APIサービス（HTTPクライアントとロガーに依存）
      const apiServiceToken = createToken<{
        fetchUser(id: string): string
      }>('ApiService')

      container.register({
        token: LoggerToken,
        useClass: Logger,
        lifetime: 'singleton',
      })

      container.register({
        token: apiServiceToken,
        useFactory: () => ({
          fetchUser: (id: string) => {
            const logger = container.resolve(LoggerToken)
            const httpClient = container.resolve(httpClientToken)
            logger.log(`Fetching user ${id}`)
            return httpClient.get(`/users/${id}`)
          },
        }),
      })

      // 動作確認
      const apiService = container.resolve(apiServiceToken)
      const result = apiService.fetchUser('456')

      expect(result).toBe('https://api.example.com/users/456')

      const logger = container.resolve(LoggerToken) as Logger
      expect(logger.getLogs()).toContain('Fetching user 456')
    })

    it('循環依存を避けるパターン', () => {
      // EventBusパターンで循環依存を避ける
      interface IEventBus {
        emit(event: string, data: unknown): void
        on(event: string, handler: (data: unknown) => void): void
      }

      class EventBus implements IEventBus {
        private handlers = new Map<string, ((data: unknown) => void)[]>()

        emit(event: string, data: unknown): void {
          const eventHandlers = this.handlers.get(event) || []
          eventHandlers.forEach((handler) => handler(data))
        }

        on(event: string, handler: (data: unknown) => void): void {
          if (!this.handlers.has(event)) {
            this.handlers.set(event, [])
          }
          this.handlers.get(event)!.push(handler)
        }
      }

      const eventBusToken = createToken<IEventBus>('EventBus')

      container.register({
        token: eventBusToken,
        useClass: EventBus,
        lifetime: 'singleton',
      })

      // OrderServiceとNotificationServiceが互いに通信する場合
      const orderServiceToken = createToken<{ createOrder(id: string): void }>('OrderService')
      const notificationServiceToken = createToken<{ sendNotification(message: string): void }>(
        'NotificationService',
      )

      container.register({
        token: orderServiceToken,
        useFactory: () => {
          const eventBus = container.resolve(eventBusToken)
          return {
            createOrder: (id: string) => {
              // 注文作成処理
              eventBus.emit('order:created', { orderId: id })
            },
          }
        },
      })

      container.register({
        token: notificationServiceToken,
        useFactory: () => {
          const eventBus = container.resolve(eventBusToken)
          const notifications: string[] = []

          const service = {
            sendNotification: (message: string) => {
              notifications.push(message)
            },
            getNotifications: () => [...notifications],
          }

          // イベントリスナー登録
          eventBus.on('order:created', (data: unknown) => {
            const { orderId } = data as { orderId: string }
            service.sendNotification(`Order ${orderId} has been created`)
          })

          return service
        },
        lifetime: 'singleton',
      })

      // 動作確認
      const orderService = container.resolve(orderServiceToken)
      const notificationService = container.resolve(notificationServiceToken) as {
        sendNotification: (message: string) => void
        getNotifications: () => string[]
      }

      orderService.createOrder('order-123')

      const notifications = notificationService.getNotifications()
      expect(notifications).toContain('Order order-123 has been created')
    })
  })

  describe('depsサポート（コンストラクタ依存注入）', () => {
    // テスト用のサービスクラス
    class DatabaseService {
      constructor() {}

      query(sql: string): string {
        return `DB Result: ${sql}`
      }
    }

    class LoggingService {
      private logs: string[] = []

      log(message: string): void {
        this.logs.push(message)
      }

      getLogs(): string[] {
        return [...this.logs]
      }
    }

    class UserRepository {
      constructor(
        private db: DatabaseService,
        private logger: LoggingService,
      ) {}

      findUser(id: string): string {
        this.logger.log(`Finding user ${id}`)
        return this.db.query(`SELECT * FROM users WHERE id = ${id}`)
      }
    }

    // 3つの依存関係を持つサービス
    class OrderService {
      constructor(
        private userRepo: UserRepository,
        private db: DatabaseService,
        private logger: LoggingService,
      ) {}

      createOrder(userId: string, productId: string): string {
        this.logger.log(`Creating order for user ${userId}`)
        const user = this.userRepo.findUser(userId)
        const orderResult = this.db.query(
          `INSERT INTO orders (user_id, product_id) VALUES (${userId}, ${productId})`,
        )
        return `Order created: ${user}, ${orderResult}`
      }
    }

    const DatabaseToken = createToken<DatabaseService>('DatabaseService')
    const LoggingToken = createToken<LoggingService>('LoggingService')
    const UserRepoToken = createToken<UserRepository>('UserRepository')
    const OrderServiceToken = createToken<OrderService>('OrderService')

    beforeEach(() => {
      // 依存関係を順番に登録
      container.register({
        token: DatabaseToken,
        useClass: DatabaseService,
      })

      container.register({
        token: LoggingToken,
        useClass: LoggingService,
      })
    })

    it('register + depsで依存関係付きサービスを登録・解決できる', () => {
      container.register({
        token: UserRepoToken,
        useClass: UserRepository as Type<UserRepository>,
        deps: [DatabaseToken, LoggingToken],
      })

      const userRepo = container.resolve(UserRepoToken)
      const result = userRepo.findUser('123')

      expect(result).toBe('DB Result: SELECT * FROM users WHERE id = 123')

      // ログが記録されているか確認
      const logger = container.resolve(LoggingToken)
      expect(logger.getLogs()).toContain('Finding user 123')
    })

    it('registerSingleton + depsでシングルトンとして依存関係付きサービスを登録できる', () => {
      container.registerSingleton(UserRepoToken, UserRepository as Type<UserRepository>, [
        DatabaseToken,
        LoggingToken,
      ])

      const userRepo1 = container.resolve(UserRepoToken)
      const userRepo2 = container.resolve(UserRepoToken)

      // 同じインスタンスであることを確認
      expect(userRepo1).toBe(userRepo2)

      // 機能確認
      const result = userRepo1.findUser('456')
      expect(result).toBe('DB Result: SELECT * FROM users WHERE id = 456')
    })

    it('registerTransient + depsでトランジェントとして依存関係付きサービスを登録できる', () => {
      container.registerTransient(UserRepoToken, UserRepository as Type<UserRepository>, [
        DatabaseToken,
        LoggingToken,
      ])

      const userRepo1 = container.resolve(UserRepoToken)
      const userRepo2 = container.resolve(UserRepoToken)

      // 異なるインスタンスであることを確認
      expect(userRepo1).not.toBe(userRepo2)

      // 両方のインスタンスが正常に動作することを確認
      const result1 = userRepo1.findUser('789')
      const result2 = userRepo2.findUser('101')

      expect(result1).toBe('DB Result: SELECT * FROM users WHERE id = 789')
      expect(result2).toBe('DB Result: SELECT * FROM users WHERE id = 101')
    })

    it('複数レベルの依存関係を解決できる', () => {
      // 第1レベル: UserRepository (DatabaseService, LoggingService に依存)
      container.register({
        token: UserRepoToken,
        useClass: UserRepository as Type<UserRepository>,
        deps: [DatabaseToken, LoggingToken],
      })

      // 第2レベル: OrderService (UserRepository, DatabaseService, LoggingService に依存)
      container.register({
        token: OrderServiceToken,
        useClass: OrderService as Type<OrderService>,
        deps: [UserRepoToken, DatabaseToken, LoggingToken],
      })

      const orderService = container.resolve(OrderServiceToken)
      const result = orderService.createOrder('user123', 'product456')

      expect(result).toContain('DB Result: SELECT * FROM users WHERE id = user123')
      expect(result).toContain(
        'DB Result: INSERT INTO orders (user_id, product_id) VALUES (user123, product456)',
      )

      // ログが両方のサービスから記録されているか確認
      const logger = container.resolve(LoggingToken)
      const logs = logger.getLogs()
      expect(logs).toContain('Creating order for user user123')
      expect(logs).toContain('Finding user user123')
    })

    it('useFactoryとdepsの併用はエラーになる', () => {
      // ファクトリー関数とdepsの併用はエラーになることを確認
      expect(() => {
        container.register({
          token: UserRepoToken,
          useFactory: () => new UserRepository(new DatabaseService(), new LoggingService()),
          deps: [DatabaseToken, LoggingToken], // これはエラーになる
        })
      }).toThrow('Dependencies cannot be used with useFactory')
    })

    it('depsなしの場合は引数なしコンストラクタが呼ばれる', () => {
      // depsを指定しない場合、既存の動作と同じ
      // 注: beforeEachで既にDatabaseTokenが登録されているため、別のコンテナで検証
      const freshContainer = new VContainer()
      const FreshDatabaseToken = createToken<DatabaseService>('FreshDatabaseService')

      freshContainer.register({
        token: FreshDatabaseToken,
        useClass: DatabaseService,
        // deps は指定しない
      })

      const dbService = freshContainer.resolve(FreshDatabaseToken)
      const result = dbService.query('SELECT 1')

      expect(result).toBe('DB Result: SELECT 1')
    })
  })

  describe('depsサポート - エラーケース', () => {
    class ServiceWithDeps {
      constructor(public dep: string) {}
    }

    const ServiceToken = createToken<ServiceWithDeps>('ServiceWithDeps')
    const NonExistentToken = createToken<string>('NonExistent')

    it('存在しない依存関係を指定するとエラー', () => {
      container.register({
        token: ServiceToken,
        useClass: ServiceWithDeps as Type<ServiceWithDeps>,
        deps: [NonExistentToken],
      })

      expect(() => container.resolve(ServiceToken)).toThrow(
        'Service Symbol(NonExistent) not registered',
      )
    })

    it('依存関係の解決に失敗した場合、詳細なエラーメッセージを表示', () => {
      container.register({
        token: ServiceToken,
        useClass: ServiceWithDeps as Type<ServiceWithDeps>,
        deps: [NonExistentToken],
      })

      expect(() => container.resolve(ServiceToken)).toThrow(
        'Failed to create instance of ServiceWithDeps: Service Symbol(NonExistent) not registered',
      )
    })

    it('空のdeps配列は引数なしコンストラクタと同じ動作', () => {
      class NoArgsService {
        getValue() {
          return 'no-args'
        }
      }

      const NoArgsToken = createToken<NoArgsService>('NoArgsService')

      container.register({
        token: NoArgsToken,
        useClass: NoArgsService,
        deps: [], // 空配列
      })

      const service = container.resolve(NoArgsToken)
      expect(service.getValue()).toBe('no-args')
    })

    it('コンストラクターが引数を期待しているのにdepsが提供されていない場合はエラー', () => {
      class ServiceWithRequiredDeps {
        constructor(public dep1: string) {}
      }

      const ServiceToken = createToken<ServiceWithRequiredDeps>('ServiceWithRequiredDeps')

      container.register({
        token: ServiceToken,
        useClass: ServiceWithRequiredDeps as Type<ServiceWithRequiredDeps>,
        // deps を指定しない
      })

      expect(() => container.resolve(ServiceToken)).toThrow(
        'Dependency count mismatch for ServiceWithRequiredDeps: constructor expects 1 argument(s) but no dependencies were provided',
      )
    })

    it('depsの数がコンストラクターの引数数より多い場合はエラー', () => {
      class ServiceWithOneDep {
        constructor(public dep1: string) {}
      }

      const ServiceToken = createToken<ServiceWithOneDep>('ServiceWithOneDep')
      const Dep1Token = createToken<string>('Dep1')
      const Dep2Token = createToken<string>('Dep2')

      container.register({
        token: Dep1Token,
        useValue: 'dep1',
      })
      container.register({
        token: Dep2Token,
        useValue: 'dep2',
      })

      container.register({
        token: ServiceToken,
        useClass: ServiceWithOneDep as Type<ServiceWithOneDep>,
        deps: [Dep1Token, Dep2Token], // 2つ指定しているがコンストラクタは1つしか受け取らない
      })

      expect(() => container.resolve(ServiceToken)).toThrow(
        'Dependency count mismatch for ServiceWithOneDep: constructor expects 1 argument(s) but 2 dependencies were provided',
      )
    })

    it('depsの数がコンストラクターの引数数より少ない場合はエラー', () => {
      class ServiceWithTwoDeps {
        constructor(
          public dep1: string,
          public dep2: string,
        ) {}
      }

      const ServiceToken = createToken<ServiceWithTwoDeps>('ServiceWithTwoDeps')
      const Dep1Token = createToken<string>('Dep1')

      container.register({
        token: Dep1Token,
        useValue: 'dep1',
      })

      container.register({
        token: ServiceToken,
        useClass: ServiceWithTwoDeps as Type<ServiceWithTwoDeps>,
        deps: [Dep1Token], // 1つしか指定していないがコンストラクタは2つ必要
      })

      expect(() => container.resolve(ServiceToken)).toThrow(
        'Dependency count mismatch for ServiceWithTwoDeps: constructor expects 2 argument(s) but 1 dependencies were provided',
      )
    })
  })

  describe('分割代入でのメソッド利用', () => {
    interface SimpleService {
      getName(): string
    }

    class SimpleServiceImpl implements SimpleService {
      getName() {
        return 'simple-service'
      }
    }

    const SimpleToken = createToken<SimpleService>('SimpleService')

    beforeEach(() => {
      container.register({
        token: SimpleToken,
        useClass: SimpleServiceImpl,
      })
    })

    it('分割代入したresolveメソッドが正しく動作する', () => {
      const { resolve } = container
      const service = resolve(SimpleToken)

      expect(service.getName()).toBe('simple-service')
    })

    it('分割代入したregisterメソッドが正しく動作する', () => {
      const { register, resolve } = container

      const NewToken = createToken<SimpleService>('NewService')
      register({
        token: NewToken,
        useClass: SimpleServiceImpl,
      })

      const service = resolve(NewToken)
      expect(service.getName()).toBe('simple-service')
    })

    it('分割代入したregisterSingletonメソッドが正しく動作する', () => {
      const { registerSingleton, resolve } = container

      const NewToken = createToken<SimpleService>('SingletonService')
      registerSingleton(NewToken, SimpleServiceImpl)

      const service1 = resolve(NewToken)
      const service2 = resolve(NewToken)

      expect(service1).toBe(service2)
    })

    it('分割代入したregisterTransientメソッドが正しく動作する', () => {
      const { registerTransient, resolve } = container

      const NewToken = createToken<SimpleService>('TransientService')
      registerTransient(NewToken, SimpleServiceImpl)

      const service1 = resolve(NewToken)
      const service2 = resolve(NewToken)

      expect(service1).not.toBe(service2)
    })

    it('分割代入したtryResolveメソッドが正しく動作する', () => {
      const { tryResolve } = container

      const service = tryResolve(SimpleToken)
      expect(service?.getName()).toBe('simple-service')

      const NonExistentToken = createToken<SimpleService>('NonExistent')
      const nonExistent = tryResolve(NonExistentToken)
      expect(nonExistent).toBeUndefined()
    })

    it('分割代入したresolveAllメソッドが正しく動作する', () => {
      const { resolveAll } = container

      const Token1 = createToken<SimpleService>('Service1')
      const Token2 = createToken<SimpleService>('Service2')

      container.register({ token: Token1, useClass: SimpleServiceImpl })
      container.register({ token: Token2, useClass: SimpleServiceImpl })

      const [service1, service2] = resolveAll([Token1, Token2])

      expect(service1.getName()).toBe('simple-service')
      expect(service2.getName()).toBe('simple-service')
    })

    it('分割代入したhasメソッドが正しく動作する', () => {
      const { has } = container

      expect(has(SimpleToken)).toBe(true)

      const NonExistentToken = createToken<SimpleService>('NonExistent')
      expect(has(NonExistentToken)).toBe(false)
    })

    it('分割代入したcreateScopeメソッドが正しく動作する', () => {
      const { createScope } = container

      const childContainer = createScope()

      expect(childContainer).toBeInstanceOf(VContainer)
      expect(childContainer.has(SimpleToken)).toBe(true)
    })

    it('分割代入したclearメソッドが正しく動作する', () => {
      const { clear, has } = container

      expect(has(SimpleToken)).toBe(true)

      clear()

      expect(has(SimpleToken)).toBe(false)
    })

    it('複数のメソッドを同時に分割代入しても正しく動作する', () => {
      const { register, resolve, has, tryResolve } = container

      const MultiToken = createToken<SimpleService>('MultiService')

      expect(has(MultiToken)).toBe(false)

      register({
        token: MultiToken,
        useClass: SimpleServiceImpl,
      })

      expect(has(MultiToken)).toBe(true)

      const service1 = resolve(MultiToken)
      const service2 = tryResolve(MultiToken)

      expect(service1.getName()).toBe('simple-service')
      expect(service2?.getName()).toBe('simple-service')
    })
  })
})
