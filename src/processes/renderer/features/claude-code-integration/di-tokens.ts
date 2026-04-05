import type { ClaudeCommand, ClaudeOutput, ClaudeSession, SessionStatus } from '@domain'
import type { ConsumerUseCase, ObservableStoreUseCase } from '@lib/usecase/types'
import type { ClaudeRepository } from './application/repositories/claude-repository'
import type { ClaudeService } from './application/services/claude-service-interface'
import type { ClaudeSessionViewModel } from './presentation/viewmodel-interfaces'
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

export const ClaudeSessionViewModelToken = createToken<ClaudeSessionViewModel>('ClaudeSessionViewModel')
