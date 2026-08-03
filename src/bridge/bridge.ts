/**
 * 브릿지 접근 유틸.
 *
 * 앱은 `injectedJavaScriptBeforeContentLoaded`로 브릿지를 주입하므로, 정상적인 경우
 * 웹의 첫 렌더 시점에는 이미 `window.PuppyNoteBridge`가 존재합니다.
 * 다만 주입 실패/지연을 대비해 `waitForBridge()`도 함께 제공합니다.
 *
 * 실제 액션 호출(로그인, 이미지 선택 등)은 후속 티켓에서 이 파일의 `requestBridge()`를
 * 감싼 기능별 모듈로 추가합니다. 여기서는 "앱 안인지 아닌지" 판별과 요청/구독 골격만 둡니다.
 */
import {
  BRIDGE_READY_EVENT,
  BRIDGE_UA_TAG,
  BridgeErrorCode,
  type BridgeErrorCodeType,
  type BridgeEventPayloadMap,
  type BridgeEventType,
  type BridgeRequestOptions,
  type PuppyNoteBridge,
} from './protocol'

/** 브릿지 호출 실패를 나타내는 에러. `code`로 분기하세요. */
export class BridgeError extends Error {
  readonly code: BridgeErrorCodeType

  constructor(code: BridgeErrorCodeType, message: string) {
    super(message)
    this.name = 'PuppyNoteBridgeError'
    this.code = code
  }
}

/** 주입된 브릿지 객체. 일반 브라우저에서는 null */
export function getBridge(): PuppyNoteBridge | null {
  if (typeof window === 'undefined') return null
  return window.PuppyNoteBridge ?? null
}

/**
 * 앱 WebView 안에서 실행 중인지 여부.
 * 브릿지 존재 여부가 유일한 기준입니다. (UA 스니핑은 보조 수단으로만 사용)
 */
export function isInApp(): boolean {
  return getBridge() !== null
}

/**
 * UA 문자열로 앱 여부를 추정합니다.
 * 브릿지 주입 전(아주 이른 시점)이나 로그 수집용 보조 판별에만 쓰세요.
 * 판별의 기준은 항상 `isInApp()`입니다.
 */
export function looksLikeAppUserAgent(): boolean {
  if (typeof navigator === 'undefined') return false
  return navigator.userAgent.includes(BRIDGE_UA_TAG)
}

/** 앱 플랫폼. 일반 브라우저면 'web' */
export function getPlatform(): 'ios' | 'android' | 'web' {
  return getBridge()?.platform ?? 'web'
}

/** 앱 버전. 일반 브라우저면 null */
export function getAppVersion(): string | null {
  return getBridge()?.appVersion ?? null
}

/**
 * 현재 앱 버전이 해당 액션을 지원하는지.
 * 구버전 앱에서는 신규 액션이 없을 수 있으므로, 앱 전용 기능을 노출하기 전에 확인하세요.
 */
export function isActionSupported(action: string): boolean {
  return getBridge()?.isSupported(action) ?? false
}

/**
 * 브릿지가 준비될 때까지 기다립니다.
 * 이미 주입되어 있으면 즉시 반환하고, 타임아웃까지 안 오면 null을 반환합니다.
 * (= 일반 브라우저로 간주)
 */
export function waitForBridge(timeoutMs = 1000): Promise<PuppyNoteBridge | null> {
  const existing = getBridge()
  if (existing) return Promise.resolve(existing)

  return new Promise((resolve) => {
    let timer: ReturnType<typeof setTimeout> | null = null

    const finish = (bridge: PuppyNoteBridge | null) => {
      window.removeEventListener(BRIDGE_READY_EVENT, onReady)
      if (timer !== null) clearTimeout(timer)
      resolve(bridge)
    }

    const onReady = () => finish(getBridge())

    window.addEventListener(BRIDGE_READY_EVENT, onReady)
    timer = setTimeout(() => finish(getBridge()), timeoutMs)
  })
}

/**
 * 앱에 요청을 보내고 응답을 기다립니다.
 * 일반 브라우저에서는 `NO_BRIDGE` 코드의 BridgeError로 reject 되므로,
 * 호출부에서 웹 폴백을 구현하세요.
 */
export async function requestBridge<D = unknown>(
  action: string,
  payload?: unknown,
  options?: BridgeRequestOptions,
): Promise<D> {
  const bridge = getBridge()
  if (!bridge) {
    throw new BridgeError(BridgeErrorCode.NO_BRIDGE, `브릿지가 없습니다 (action: ${action})`)
  }

  try {
    return await bridge.request<D>(action, payload, options)
  } catch (error) {
    throw toBridgeError(error)
  }
}

/**
 * 앱 이벤트를 구독합니다. 반환값은 구독 해제 함수입니다.
 * 브릿지가 없으면 아무것도 하지 않는 해제 함수를 돌려주므로 호출부에서 분기할 필요가 없습니다.
 *
 * HARDWARE_BACK 처럼 ack가 필요한 이벤트는 핸들러가 `true`를 반환해야
 * "웹이 처리했다"로 간주됩니다. (false/undefined면 앱이 기본 동작을 수행)
 */
export function onBridgeEvent<E extends BridgeEventType>(
  event: E,
  handler: (payload: BridgeEventPayloadMap[E]) => boolean | void,
): () => void {
  const bridge = getBridge()
  if (!bridge) return () => {}
  return bridge.on<BridgeEventPayloadMap[E]>(event, handler)
}

/** 알 수 없는 예외를 BridgeError로 정규화합니다. */
export function toBridgeError(error: unknown): BridgeError {
  if (error instanceof BridgeError) return error

  if (error instanceof Error) {
    const code = (error as Error & { code?: string }).code
    if (isBridgeErrorCode(code)) return new BridgeError(code, error.message)
    return new BridgeError(BridgeErrorCode.INTERNAL_ERROR, error.message)
  }

  return new BridgeError(BridgeErrorCode.INTERNAL_ERROR, String(error))
}

/** 사용자가 스스로 취소한 흐름인지 (에러 토스트를 띄우면 안 되는 경우) */
export function isUserCancelled(error: unknown): boolean {
  return toBridgeError(error).code === BridgeErrorCode.USER_CANCELLED
}

function isBridgeErrorCode(value: unknown): value is BridgeErrorCodeType {
  return typeof value === 'string' && (Object.values(BridgeErrorCode) as string[]).includes(value)
}
