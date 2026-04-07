import { useCallback } from 'react'
import { useResolve } from '@lib/di/v-container-provider'
import { useObservable } from '@lib/hooks/use-observable'
import {
  CheckAuthRendererUseCaseToken,
  ClaudeServiceToken,
  LoginRendererUseCaseToken,
  LogoutRendererUseCaseToken,
} from '../di-tokens'

export function useClaudeAuth() {
  const service = useResolve(ClaudeServiceToken)
  const checkAuthUseCase = useResolve(CheckAuthRendererUseCaseToken)
  const loginUseCase = useResolve(LoginRendererUseCaseToken)
  const logoutUseCase = useResolve(LogoutRendererUseCaseToken)

  const authStatus = useObservable(service.authStatus$, null)
  const isAuthChecking = useObservable(service.isAuthChecking$, false)
  const isLoggingIn = useObservable(service.isLoggingIn$, false)

  const checkAuth = useCallback(() => {
    service.setAuthChecking(true)
    checkAuthUseCase
      .invoke()
      .then((status) => {
        service.setAuthStatus(status)
      })
      .catch(() => {
        service.setAuthStatus({ authenticated: false })
      })
      .finally(() => {
        service.setAuthChecking(false)
      })
  }, [service, checkAuthUseCase])

  const login = useCallback(() => {
    service.setLoggingIn(true)
    loginUseCase
      .invoke()
      .then(() => {
        service.setAuthChecking(true)
        return checkAuthUseCase.invoke()
      })
      .then((status) => {
        service.setAuthStatus(status)
      })
      .catch(() => {
        service.setAuthStatus({ authenticated: false })
      })
      .finally(() => {
        service.setLoggingIn(false)
        service.setAuthChecking(false)
      })
  }, [service, loginUseCase, checkAuthUseCase])

  const logout = useCallback(() => {
    logoutUseCase
      .invoke()
      .then(() => {
        service.setAuthStatus({ authenticated: false })
      })
      .catch(() => {
        // ログアウト失敗時も認証状態を再確認
        service.setAuthChecking(true)
        return checkAuthUseCase.invoke()
          .then((status) => service.setAuthStatus(status))
          .catch(() => service.setAuthStatus({ authenticated: false }))
          .finally(() => service.setAuthChecking(false))
      })
  }, [service, logoutUseCase, checkAuthUseCase])

  return {
    authStatus,
    isAuthChecking,
    isLoggingIn,
    checkAuth,
    login,
    logout,
  }
}
