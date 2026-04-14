/**
 * 環境に応じたロギングユーティリティ
 * 開発環境でのみログを出力し、本番環境では何も出力しない
 */
export const logger = {
  /**
   * 開発環境でのみ console.log を実行
   */
  log: (...args: unknown[]): void => {
    if (process.env.NODE_ENV === 'development') {
      console.log(...args)
    }
  },

  /**
   * 開発環境でのみ console.warn を実行
   */
  warn: (...args: unknown[]): void => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(...args)
    }
  },

  /**
   * console.error は常に出力する（エラーは本番環境でも重要）
   */
  error: (...args: unknown[]): void => {
    console.error(...args)
  },

  /**
   * 開発環境でのみ console.info を実行
   */
  info: (...args: unknown[]): void => {
    if (process.env.NODE_ENV === 'development') {
      console.info(...args)
    }
  },

  /**
   * 開発環境でのみ console.debug を実行
   */
  debug: (...args: unknown[]): void => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(...args)
    }
  },
}
