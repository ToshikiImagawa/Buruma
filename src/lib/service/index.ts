import type { TearDownable } from '@lib/di/disposable-stack'

/**
 * 引数なしで同期的に初期化するサービス
 */
export interface BaseService extends TearDownable {
  setUp(): void
}

/**
 * 引数なしで非同期に初期化するサービス
 */
export interface AsyncBaseService extends TearDownable {
  setUp(): Promise<void>
}

/**
 * パラメータを受け取って同期的に初期化するサービス
 */
export interface ParameterizedService<T> extends TearDownable {
  setUp(params: T): void
}

/**
 * パラメータを受け取って非同期に初期化するサービス
 */
export interface AsyncParameterizedService<T> extends TearDownable {
  setUp(params: T): Promise<void>
}
