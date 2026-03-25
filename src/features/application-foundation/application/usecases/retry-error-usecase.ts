import type { ConsumerUseCase } from '@/lib/usecase'
import type { IErrorNotificationService } from '../../di-tokens'

export class RetryErrorUseCaseImpl implements ConsumerUseCase<string> {
  constructor(private readonly service: IErrorNotificationService) {}

  invoke(errorId: string): void {
    // リトライ対象のエラーを削除（リトライアクションの実行は呼び出し元に委譲）
    this.service.removeNotification(errorId)
  }
}
