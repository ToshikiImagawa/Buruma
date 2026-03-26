/**
 * メインプロセス側の feature 初期化設定。
 * VContainerConfig のメインプロセス対応版。
 *
 * @remarks
 * 各 feature は `di-config-main.ts` でこのインターフェースを実装し、
 * infrastructure 層の初期化ロジック（IPC ハンドラー登録、サービス生成等）を閉じ込める。
 * `src/di/main-configs.ts` で全 feature の config を集約し、
 * `bootstrapMainProcess()` で priority 順に初期化する。
 */
export interface MainProcessConfig {
  /**
   * feature の初期化を実行する。
   * IPC ハンドラーの登録、サービスのインスタンス化などを行う。
   */
  initialize(): Promise<void> | void

  /**
   * feature のクリーンアップを実行する。
   * IPC ハンドラーの解除、リソースの解放などを行う。
   */
  dispose(): void

  /**
   * 初期化の実行優先度（小さい値が先に実行される）。
   * レンダラー側の VContainerConfig.priority と同じセマンティクス。
   * @default 0
   */
  priority?: number
}
