/**
 * 토큰 저장소.
 *
 * 지금은 브라우저 localStorage만 사용합니다.
 * 앱 WebView 안에서는 앱의 SecureStore(브릿지 SET_TOKEN/GET_TOKEN/CLEAR_TOKEN)를 정본으로 삼고,
 * 여기 있는 메모리 캐시에 미러링하는 방식으로 확장할 예정입니다.
 * 브릿지 호출은 비동기라 axios 요청 인터셉터에서 바로 읽을 수 없으므로,
 * 앱 진입 시 `hydrateFromBridge()`로 한 번 끌어와 캐시에 채우는 형태가 됩니다. (후속 티켓)
 */
import { BridgeAction, isInApp, requestBridge } from '@/bridge'
import type { GetTokenData } from '@/bridge'

const ACCESS_TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'

/** 인터셉터에서 동기적으로 읽기 위한 캐시 */
let accessTokenCache: string | null = null
let refreshTokenCache: string | null = null

function readLocal(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    // 시크릿 모드 등에서 접근이 막힌 경우
    return null
  }
}

function writeLocal(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // 저장 실패는 무시하고 메모리 캐시로만 동작합니다.
  }
}

export const tokenStorage = {
  getAccessToken(): string | null {
    if (accessTokenCache === null) accessTokenCache = readLocal(ACCESS_TOKEN_KEY)
    return accessTokenCache
  },

  getRefreshToken(): string | null {
    if (refreshTokenCache === null) refreshTokenCache = readLocal(REFRESH_TOKEN_KEY)
    return refreshTokenCache
  },

  setTokens(accessToken: string, refreshToken?: string | null): void {
    accessTokenCache = accessToken
    writeLocal(ACCESS_TOKEN_KEY, accessToken)

    if (refreshToken) {
      refreshTokenCache = refreshToken
      writeLocal(REFRESH_TOKEN_KEY, refreshToken)
    }

    void syncToBridge()
  },

  clear(): void {
    accessTokenCache = null
    refreshTokenCache = null
    writeLocal(ACCESS_TOKEN_KEY, null)
    writeLocal(REFRESH_TOKEN_KEY, null)

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

    if (access?.value) {
      accessTokenCache = access.value
      writeLocal(ACCESS_TOKEN_KEY, access.value)
    }
    if (refresh?.value) {
      refreshTokenCache = refresh.value
      writeLocal(REFRESH_TOKEN_KEY, refresh.value)
    }
  } catch {
    // 구버전 앱이라 액션이 없거나 저장소 접근에 실패한 경우 - 웹 저장소만으로 진행합니다.
  }
}

/** 웹에서 갱신한 토큰을 앱 SecureStore에도 반영합니다. */
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
    // 앱 저장 실패가 웹 동작을 막지는 않도록 무시합니다.
  }
}
