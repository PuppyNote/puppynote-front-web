/**
 * 토큰 저장소.
 *
 * **정본은 앱의 SecureStore(브릿지 SET_TOKEN/GET_TOKEN/CLEAR_TOKEN)이고, 웹은 메모리에만 들고
 * 있습니다.** localStorage에는 토큰을 남기지 않습니다 - 웹뷰의 저장소는 XSS 한 방으로 통째로
 * 새는 자리라서, 승인된 기획서도 "localStorage 영구 저장 금지"를 조건으로 걸고 있습니다.
 *
 * 그래서 새로고침하면 메모리 캐시는 비고, 앱 진입 시 {@link hydrateFromBridge}가 SecureStore에서
 * 다시 끌어옵니다. 일반 브라우저(개발용)에서는 끌어올 곳이 없으므로 새로고침하면 재로그인해야
 * 합니다. 의도된 동작입니다.
 *
 * 브릿지 호출은 비동기라 axios 요청 인터셉터에서 바로 읽을 수 없어서, 읽기는 메모리 캐시가
 * 담당하고 쓰기만 SecureStore로 흘려보내는 구조입니다.
 */
import { BridgeAction, isInApp, requestBridge } from '@/bridge'
import type { GetTokenData } from '@/bridge'

const ACCESS_TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'

/** 인터셉터에서 동기적으로 읽기 위한 캐시 */
let accessTokenCache: string | null = null
let refreshTokenCache: string | null = null

export const tokenStorage = {
  getAccessToken(): string | null {
    return accessTokenCache
  },

  getRefreshToken(): string | null {
    return refreshTokenCache
  },

  /**
   * 토큰을 메모리에 넣고 앱 SecureStore에도 반영합니다.
   * 저장이 끝난 뒤 화면을 넘겨야 하는 로그인 흐름에서는 반환된 Promise를 await 하세요.
   */
  setTokens(accessToken: string, refreshToken?: string | null): Promise<void> {
    accessTokenCache = accessToken
    if (refreshToken) refreshTokenCache = refreshToken

    return syncToBridge()
  },

  clear(): void {
    accessTokenCache = null
    refreshTokenCache = null

    if (isInApp()) {
      void requestBridge(BridgeAction.CLEAR_TOKEN).catch(() => {})
    }
  },
}

/**
 * 앱 SecureStore에 있는 토큰을 웹 캐시로 끌어옵니다.
 * 앱에서 이미 로그인한 사용자가 웹뷰로 진입했을 때 재로그인 없이 이어가기 위한 진입점입니다.
 * 일반 브라우저에서는 아무 일도 하지 않습니다.
 */
export async function hydrateFromBridge(): Promise<void> {
  if (!isInApp()) return

  try {
    const [access, refresh] = await Promise.all([
      requestBridge<GetTokenData>(BridgeAction.GET_TOKEN, { key: ACCESS_TOKEN_KEY }),
      requestBridge<GetTokenData>(BridgeAction.GET_TOKEN, { key: REFRESH_TOKEN_KEY }),
    ])

    if (access?.value) accessTokenCache = access.value
    if (refresh?.value) refreshTokenCache = refresh.value
  } catch {
    // 구버전 앱이라 액션이 없거나 저장소 접근에 실패한 경우 - 로그인 화면으로 진행합니다.
  }
}

/** 웹에서 발급/갱신한 토큰을 앱 SecureStore에 반영합니다. */
async function syncToBridge(): Promise<void> {
  if (!isInApp()) return

  try {
    if (accessTokenCache) {
      await requestBridge(BridgeAction.SET_TOKEN, {
        key: ACCESS_TOKEN_KEY,
        value: accessTokenCache,
      })
    }
    if (refreshTokenCache) {
      await requestBridge(BridgeAction.SET_TOKEN, {
        key: REFRESH_TOKEN_KEY,
        value: refreshTokenCache,
      })
    }
  } catch {
    // 앱 저장 실패가 웹 동작을 막지는 않도록 무시합니다. 이 세션은 메모리 캐시로 계속 돕니다.
  }
}
