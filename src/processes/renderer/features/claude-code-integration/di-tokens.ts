import type {
  ClaudeAuthStatus,
  ClaudeCommand,
  ClaudeOutput,
  ClaudeSession,
  ReviewComment,
  SessionStatus,
} from '@domain'
import type { ConsumerUseCase, ObservableStoreUseCase, SupplierUseCase } from '@lib/usecase/types'
import type { ClaudeRepository } from './application/repositories/claude-repository'
import type { ClaudeService } from './application/services/claude-service-interface'
import type { ExplainDiffInput } from './application/usecases/explain-diff-usecase'
import type { ReviewDiffInput } from './application/usecases/review-diff-usecase'
import type {
  ClaudeExplainViewModel,
  ClaudeReviewViewModel,
  ClaudeSessionViewModel,
} from './presentation/viewmodel-interfaces'
import { createToken } from '@lib/di'

export type { ClaudeRepository } from './application/repositories/claude-repository'
export type { ClaudeService } from './application/services/claude-service-interface'
export type { ClaudeSessionViewModel } from './presentation/viewmodel-interfaces'

// UseCase types
export type StartSessionRendererUseCase = ConsumerUseCase<string>
export type StopSessionRendererUseCase = ConsumerUseCase<string>
export type SendCommandRendererUseCase = ConsumerUseCase<ClaudeCommand>
export type GetSessionStatusRendererUseCase = ObservableStoreUseCase<SessionStatus>
export type GetCurrentSessionRendererUseCase = ObservableStoreUseCase<ClaudeSession | null>
export type GetOutputsRendererUseCase = ObservableStoreUseCase<ClaudeOutput[]>
export type CheckAuthRendererUseCase = SupplierUseCase<Promise<ClaudeAuthStatus>>
export type LoginRendererUseCase = SupplierUseCase<Promise<void>>
export type LogoutRendererUseCase = SupplierUseCase<Promise<void>>
export type ReviewDiffRendererUseCase = ConsumerUseCase<ReviewDiffInput>
export type ExplainDiffRendererUseCase = ConsumerUseCase<ExplainDiffInput>
export type GetReviewCommentsRendererUseCase = ObservableStoreUseCase<ReviewComment[]>
export type GetReviewSummaryRendererUseCase = ObservableStoreUseCase<string>
export type GetIsReviewingRendererUseCase = ObservableStoreUseCase<boolean>
export type GetExplanationRendererUseCase = ObservableStoreUseCase<string>
export type GetIsExplainingRendererUseCase = ObservableStoreUseCase<boolean>

// Tokens
export const ClaudeRepositoryToken = createToken<ClaudeRepository>('ClaudeRepository')
export const ClaudeServiceToken = createToken<ClaudeService>('ClaudeService')

export const StartSessionRendererUseCaseToken = createToken<StartSessionRendererUseCase>('StartSessionRendererUseCase')
export const StopSessionRendererUseCaseToken = createToken<StopSessionRendererUseCase>('StopSessionRendererUseCase')
export const SendCommandRendererUseCaseToken = createToken<SendCommandRendererUseCase>('SendCommandRendererUseCase')
export const GetSessionStatusRendererUseCaseToken = createToken<GetSessionStatusRendererUseCase>(
  'GetSessionStatusRendererUseCase',
)
export const GetCurrentSessionRendererUseCaseToken = createToken<GetCurrentSessionRendererUseCase>(
  'GetCurrentSessionRendererUseCase',
)
export const GetOutputsRendererUseCaseToken = createToken<GetOutputsRendererUseCase>('GetOutputsRendererUseCase')

export const CheckAuthRendererUseCaseToken = createToken<CheckAuthRendererUseCase>('CheckAuthRendererUseCase')
export const LoginRendererUseCaseToken = createToken<LoginRendererUseCase>('LoginRendererUseCase')
export const LogoutRendererUseCaseToken = createToken<LogoutRendererUseCase>('LogoutRendererUseCase')

export const ReviewDiffRendererUseCaseToken = createToken<ReviewDiffRendererUseCase>('ReviewDiffRendererUseCase')
export const ExplainDiffRendererUseCaseToken = createToken<ExplainDiffRendererUseCase>('ExplainDiffRendererUseCase')
export const GetReviewCommentsRendererUseCaseToken = createToken<GetReviewCommentsRendererUseCase>(
  'GetReviewCommentsRendererUseCase',
)
export const GetReviewSummaryRendererUseCaseToken = createToken<GetReviewSummaryRendererUseCase>(
  'GetReviewSummaryRendererUseCase',
)
export const GetIsReviewingRendererUseCaseToken = createToken<GetIsReviewingRendererUseCase>(
  'GetIsReviewingRendererUseCase',
)
export const GetExplanationRendererUseCaseToken = createToken<GetExplanationRendererUseCase>(
  'GetExplanationRendererUseCase',
)
export const GetIsExplainingRendererUseCaseToken = createToken<GetIsExplainingRendererUseCase>(
  'GetIsExplainingRendererUseCase',
)

export const ClaudeSessionViewModelToken = createToken<ClaudeSessionViewModel>('ClaudeSessionViewModel')
export const ClaudeReviewViewModelToken = createToken<ClaudeReviewViewModel>('ClaudeReviewViewModel')
export const ClaudeExplainViewModelToken = createToken<ClaudeExplainViewModel>('ClaudeExplainViewModel')
