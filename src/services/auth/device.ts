/**
 * 기기 식별자 조회.
 *
 * 서버의 로그인 API는 `deviceId`가 **필수**입니다(`LoginRequest`/`LoginOauthRequest`의 `@NotNull`).
 * 리프레시 토큰이 기기 단위 행으로 저장되므로(`User.checkRefreshToken`) 같은 기기는 항상 같은
 * 값을 보내야 로그인할 때마다 토큰 행이 늘어나지 않습니다.
 *
 * - 앱 안: 브릿지 `GET_DEVICE_TOKEN`이 정본입니다. 네이티브가 기기별로 만들어 보관하는 값이라
 *   웹뷰를 다시 띄워도 유지되고, 네이티브 화면에서 로그인했을 때와도 같은 값이 됩니다.
 * - 일반 브라우저(개발/폴백): 브릿지가 없으므로 UUID를 만들어 localStorage에 보관합니다.
 *   토큰이 아니라 기기 이름표라서 저장해도 되는 값입니다.
 */
import { BridgeAction, isInApp, requestBridge } from '@/bridge'
import type { DeviceTokenData } from '@/bridge'

const WEB_DEVICE_ID_KEY = 'puppynote.deviceId'

export interface DeviceInfo {
  deviceId: string
  /** 푸시 토큰. 권한 거부/일반 브라우저면 null */
  pushKey: string | null
}

let cached: DeviceInfo | null = null

/**
 * 기기 정보를 가져옵니다. 한 번 성공하면 메모리에 캐시해 재사용합니다.
 * 브릿지 호출이 실패해도(구버전 앱 등) 로그인 자체는 되어야 하므로 웹 폴백 값으로 내려갑니다.
 */
export async function getDeviceInfo(): Promise<DeviceInfo> {
  if (cached) return cached

  if (isInApp()) {
    try {
      const data = await requestBridge<DeviceTokenData>(BridgeAction.GET_DEVICE_TOKEN)
      if (data?.deviceId) {
        cached = { deviceId: data.deviceId, pushKey: data.pushToken ?? null }
        return cached
      }
    } catch {
      // 액션 미지원/권한 거부. 아래 웹 폴백으로 진행합니다.
    }
  }

  cached = { deviceId: readOrCreateWebDeviceId(), pushKey: null }
  return cached
}

/** 테스트/계정 전환 등으로 캐시를 비워야 할 때 */
export function resetDeviceInfoCache(): void {
  cached = null
}

function readOrCreateWebDeviceId(): string {
  try {
    const stored = localStorage.getItem(WEB_DEVICE_ID_KEY)
    if (stored) return stored

    const created = createUuid()
    localStorage.setItem(WEB_DEVICE_ID_KEY, created)
    return created
  } catch {
    // 시크릿 모드 등 저장소 접근이 막힌 경우. 이 세션에서만 쓰는 값으로 진행합니다.
    return createUuid()
  }
}

function createUuid(): string {
  // randomUUID는 보안 컨텍스트(https/localhost)에서만 있습니다.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return 'web-xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16)
    const value = char === 'x' ? random : (random & 0x3) | 0x8
    return value.toString(16)
  })
}
