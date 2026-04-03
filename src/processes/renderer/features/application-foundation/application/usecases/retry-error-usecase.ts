import type { ConsumerUseCase } from '@lib/usecase'
import type { ErrorNotificationService } from '../services/error-notification-service-interface'

export class RetryErrorDefaultUseCase implements ConsumerUseCase<string> {
  constructor(private readonly service: ErrorNotificationService) {}

  invoke(errorId: string): void {
    // リトライ対象のエラーを削除（リトライアクションの実行は呼び出し元に委譲）
    this.service.removeNotification(errorId)
  }
}
