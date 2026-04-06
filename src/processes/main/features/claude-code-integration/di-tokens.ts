import type { ClaudeCommand, ClaudeOutput, ClaudeSession, GenerateCommitMessageArgs } from '@domain'
import type { FunctionUseCase, SupplierUseCase } from '@lib/usecase/types'
import type { ClaudeProcessRepository } from './application/repositories/claude-process-repository'
import type { ClaudeSessionStore } from './application/services/claude-session-store-interface'
import { createToken } from '@lib/di'

// Infrastructure IF
export const ClaudeSessionStoreToken = createToken<ClaudeSessionStore>('ClaudeSessionStore')
export const ClaudeProcessRepositoryToken = createToken<ClaudeProcessRepository>('ClaudeProcessRepository')

// Application UseCase types
export type StartSessionMainUseCase = FunctionUseCase<string, Promise<ClaudeSession>>
export type StopSessionMainUseCase = FunctionUseCase<string, Promise<void>>
export type GetSessionMainUseCase = FunctionUseCase<string, ClaudeSession | null>
export type GetAllSessionsMainUseCase = SupplierUseCase<ClaudeSession[]>
export type SendCommandMainUseCase = FunctionUseCase<ClaudeCommand, Promise<void>>
export type GetOutputMainUseCase = FunctionUseCase<string, ClaudeOutput[]>
export type GenerateCommitMessageMainUseCase = FunctionUseCase<GenerateCommitMessageArgs, Promise<string>>

// Application UseCase Tokens
export const StartSessionMainUseCaseToken = createToken<StartSessionMainUseCase>('StartSessionMainUseCase')
export const StopSessionMainUseCaseToken = createToken<StopSessionMainUseCase>('StopSessionMainUseCase')
export const GetSessionMainUseCaseToken = createToken<GetSessionMainUseCase>('GetSessionMainUseCase')
export const GetAllSessionsMainUseCaseToken = createToken<GetAllSessionsMainUseCase>('GetAllSessionsMainUseCase')
export const SendCommandMainUseCaseToken = createToken<SendCommandMainUseCase>('SendCommandMainUseCase')
export const GetOutputMainUseCaseToken = createToken<GetOutputMainUseCase>('GetOutputMainUseCase')
export const GenerateCommitMessageMainUseCaseToken = createToken<GenerateCommitMessageMainUseCase>(
  'GenerateCommitMessageMainUseCase',
)
