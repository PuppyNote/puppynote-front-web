import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'

import { apiService } from '@/services/api/ApiService'

import { AuthContext, toAuthUser } from './AuthContext'
import type { AuthStatus, AuthUser } from './AuthContext'
import { authService } from './authService'

export interface AuthProviderProps {
  children: ReactNode
}

/**
 * 인증 상태를 들고 있는 Provider.
 *
 * 앱이 처음 뜰 때 SecureStore 토큰을 확인하는 동안에는 `loading`이고, 그 사이에는
 * {@link ../../routes/ProtectedRoute}가 스플래시를 띄웁니다. 토큰이 없거나 죽어 있으면
 * `unauthenticated`가 되어 로그인 화면으로 보내집니다.
 */
export default function AuthProvider({ children }: AuthProviderProps) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<AuthUser | null>(null)

  // 앱 진입 시 1회: SecureStore 토큰 확인 → 유효성 검사
  useEffect(() => {
    let cancelled = false

    void authService.restoreSession().then((profile) => {
      if (cancelled) return
      setUser(profile ? toAuthUser(profile, profile.email) : null)
      setStatus(profile ? 'authenticated' : 'unauthenticated')
    })

    return () => {
      cancelled = true
    }
  }, [])

  // 리프레시까지 실패해 세션이 끊긴 경우. 토큰 정리는 ApiService가 이미 했습니다.
  // 상태만 내리면 ProtectedRoute가 로그인 화면으로 보냅니다.
  useEffect(() => {
    apiService.setLogoutListener(() => {
      setUser(null)
      setStatus('unauthenticated')
    })

    return () => apiService.setLogoutListener(null)
  }, [])

  const finishLogin = useCallback(async (email: string) => {
    const profile = await authService.fetchProfile()
    setUser(toAuthUser(profile, email))
    setStatus('authenticated')
  }, [])

  const loginWithEmail = useCallback(
    async (email: string, password: string) => {
      const data = await authService.loginWithEmail(email, password)
      await finishLogin(data.email)
    },
    [finishLogin],
  )

  const loginWithKakao = useCallback(async () => {
    const data = await authService.loginWithKakao()
    await finishLogin(data.email)
  }, [finishLogin])

  const loginWithApple = useCallback(async () => {
    const data = await authService.loginWithApple()
    await finishLogin(data.email)
  }, [finishLogin])

  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
    setStatus('unauthenticated')
  }, [])

  const refreshProfile = useCallback(async () => {
    const profile = await authService.fetchProfile()
    if (profile) setUser((prev) => toAuthUser(profile, prev?.email ?? profile.email))
  }, [])

  const value = useMemo(
    () => ({ status, user, loginWithEmail, loginWithKakao, loginWithApple, logout, refreshProfile }),
    [status, user, loginWithEmail, loginWithKakao, loginWithApple, logout, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
