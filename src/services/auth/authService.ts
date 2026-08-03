/**
 * 로그인/로그아웃 흐름 조립.
 *
 * 승인된 기획서의 로그인 흐름을 그대로 옮긴 자리입니다.
 *  1. 앱 진입 → 브릿지 GET_TOKEN으로 SecureStore 확인 → 있으면 유효성 검사 후 홈
 *  2. 이메일 로그인 → `/api/v1/auth/login` → SET_TOKEN
 *  3. 카카오/애플 → 브릿지 LOGIN_KAKAO/LOGIN_APPLE로 SDK 토큰 수령 → `/api/v1/auth/oauth/login`
 *     → 서버 JWT 수령 → SET_TOKEN
 *  4. 로그아웃/세션 만료 → CLEAR_TOKEN
 *
 * 화면 상태(로그인 여부, 프로필)는 {@link ./AuthProvider}가 들고 있고, 여기서는 부수효과만 담당합니다.
 */
import { BridgeAction, requestBridge, waitForBridge } from '@/bridge'
import type { LoginAppleData, LoginKakaoData } from '@/bridge'
import { authApi } from '@/services/api/endpoints/auth'
import type { LoginData } from '@/services/api/endpoints/auth'
import { userApi } from '@/services/api/endpoints/user'
import type { UserProfile } from '@/services/api/endpoints/user'

import { getDeviceInfo } from './device'
import { hydrateFromBridge, tokenStorage } from './tokenStorage'

export const authService = {
  /** 이메일 로그인 */
  async loginWithEmail(email: string, password: string): Promise<LoginData> {
    const device = await getDeviceInfo()
    const data = await authApi.login({
      email,
      password,
      deviceId: device.deviceId,
      pushKey: device.pushKey,
    })

    await tokenStorage.setTokens(data.accessToken, data.refreshToken)
    return data
  },

  /**
   * 카카오 로그인.
   * 앱이 카카오 SDK 로그인을 대신 수행하고 accessToken을 돌려주면, 그 토큰을 서버가 검증합니다
   * (서버 `KakaoApiClient`가 카카오 API로 이메일을 조회).
   */
  async loginWithKakao(): Promise<LoginData> {
    const kakao = await requestBridge<LoginKakaoData>(BridgeAction.LOGIN_KAKAO)
    return oauthLogin(kakao.accessToken, 'KAKAO')
  },

  /**
   * 애플 로그인.
   * 서버 `AppleApiClient`가 identityToken(JWT) payload에서 이메일을 꺼내므로 identityToken을 보냅니다.
   * `authorizationCode`/`fullName`을 받는 서버 필드는 없어서 보내지 않습니다.
   */
  async loginWithApple(): Promise<LoginData> {
    const apple = await requestBridge<LoginAppleData>(BridgeAction.LOGIN_APPLE)
    return oauthLogin(apple.identityToken, 'APPLE')
  },

  /**
   * 앱 진입 시 세션 복구.
   * SecureStore에 토큰이 있으면 프로필 조회로 유효성을 확인하고, 실패하면 세션을 정리합니다.
   * (액세스 토큰만 만료된 경우는 axios 인터셉터가 refresh로 살려냅니다.)
   */
  async restoreSession(): Promise<UserProfile | null> {
    // 브릿지 주입이 늦어질 수 있으므로 GET_TOKEN 전에 잠깐 기다립니다.
    await waitForBridge()
    await hydrateFromBridge()

    if (!tokenStorage.getAccessToken()) return null

    try {
      return await userApi.getProfile()
    } catch {
      tokenStorage.clear()
      return null
    }
  },

  /** 로그인 직후 프로필 조회. 실패해도 로그인 자체는 성공으로 둡니다. */
  async fetchProfile(): Promise<UserProfile | null> {
    try {
      return await userApi.getProfile()
    } catch {
      return null
    }
  },

  /** 로그아웃. 메모리 캐시와 SecureStore를 모두 비웁니다. */
  logout(): void {
    tokenStorage.clear()
  },
}

async function oauthLogin(token: string, snsType: 'KAKAO' | 'APPLE'): Promise<LoginData> {
  const device = await getDeviceInfo()
  const data = await authApi.oauthLogin({
    token,
    snsType,
    deviceId: device.deviceId,
    pushKey: device.pushKey,
  })

  await tokenStorage.setTokens(data.accessToken, data.refreshToken)
  return data
}
