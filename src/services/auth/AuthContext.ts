/**
 * 인증 상태 컨텍스트.
 * Provider는 {@link ./AuthProvider}에 있습니다 (Fast Refresh를 위해 파일을 나눠 둡니다).
 */
import { createContext, useContext } from 'react'

import type { UserProfile } from '@/services/api/endpoints/user'

/**
 * - `loading`: 앱 진입 직후 SecureStore 토큰을 확인하는 중. 아직 아무 화면도 확정할 수 없습니다.
 * - `authenticated` / `unauthenticated`: 확인이 끝난 상태.
 */
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

/**
 * 화면에서 쓰는 사용자 정보.
 * 로그인 응답에는 이메일만 있어서, 프로필 조회가 실패하면 나머지가 null일 수 있습니다.
 */
export interface AuthUser {
  userId: number | null
  email: string
  nickName: string | null
  profileUrl: string | null
}

export interface AuthContextValue {
  status: AuthStatus
  user: AuthUser | null
  loginWithEmail: (email: string, password: string) => Promise<void>
  loginWithKakao: () => Promise<void>
  loginWithApple: () => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth는 AuthProvider 안에서만 쓸 수 있습니다.')
  }
  return context
}

/** 프로필 응답을 화면용 사용자 정보로 정규화합니다. */
export function toAuthUser(profile: UserProfile | null, fallbackEmail: string): AuthUser {
  if (!profile) {
    return { userId: null, email: fallbackEmail, nickName: null, profileUrl: null }
  }
  return {
    userId: profile.userId,
    email: profile.email,
    nickName: profile.nickName,
    profileUrl: profile.profileUrl,
  }
}
