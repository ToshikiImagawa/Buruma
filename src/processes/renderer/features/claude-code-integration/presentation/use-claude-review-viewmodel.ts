import { useCallback } from 'react'
import type { DiffTarget } from '@domain'
import { useResolve } from '@lib/di/v-container-provider'
import { useObservable } from '@lib/hooks/use-observable'
import { ClaudeReviewViewModelToken } from '../di-tokens'

export function useClaudeReviewViewModel() {
  const vm = useResolve(ClaudeReviewViewModelToken)
  const reviewComments = useObservable(vm.reviewComments$, [])
  const reviewSummary = useObservable(vm.reviewSummary$, '')
  const isReviewing = useObservable(vm.isReviewing$, false)

  return {
    reviewComments,
    reviewSummary,
    isReviewing,
    requestReview: useCallback(
      (worktreePath: string, diffTarget: DiffTarget, diffText: string) =>
        vm.requestReview(worktreePath, diffTarget, diffText),
      [vm],
    ),
  }
}
