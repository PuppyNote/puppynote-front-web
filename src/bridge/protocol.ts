/**
 * PuppyNote JS Bridge - 웹 쪽 프로토콜 정의.
 *
 * 네이티브 앱(puppynote-front-app)의 `src/bridge/BridgeProtocol.ts`와 1:1로 대응하는 사본입니다.
 * 앱이 WebView에 주입하는 `window.PuppyNoteBridge` 구현이 이 규약을 따릅니다.
 *
 * 앱 쪽 원본: puppynote-front-app/src/bridge/BridgeProtocol.ts
 *             puppynote-front-app/src/bridge/injectedBridge.ts
 *
 * ⚠️ 앱 쪽 규약이 바뀌면 이 파일도 함께 갱신해야 합니다.
 */

/** 메시지 봉투(envelope) 스키마 버전 */
export const BRIDGE_ENVELOPE_VERSION = 1

/** 웹이 접근하는 전역 객체 이름 */
export const BRIDGE_GLOBAL_NAME = 'PuppyNoteBridge'

/** 브릿지 주입 완료 시 앱이 window에 쏘는 이벤트 이름 */
export const BRIDGE_READY_EVENT = 'puppynotebridgeready'

/** UserAgent에 덧붙는 앱 식별자 접두사 (`PuppyNoteApp/1.0.2`) */
export const BRIDGE_UA_TAG = 'PuppyNoteApp'

/** 응답이 오지 않을 때 브릿지가 reject 하는 기본 시간 (ms) */
export const BRIDGE_DEFAULT_TIMEOUT = 15000

// ---------------------------------------------------------------------------
// 액션 / 이벤트
// ---------------------------------------------------------------------------

/** 웹 -> 앱 요청 액션 */
export const BridgeAction = {
  LOGIN_KAKAO: 'LOGIN_KAKAO',
  LOGIN_APPLE: 'LOGIN_APPLE',
  GET_DEVICE_TOKEN: 'GET_DEVICE_TOKEN',
  GET_LOCATION: 'GET_LOCATION',
  PICK_IMAGE: 'PICK_IMAGE',
  SET_TOKEN: 'SET_TOKEN',
  GET_TOKEN: 'GET_TOKEN',
  CLEAR_TOKEN: 'CLEAR_TOKEN',
  OPEN_EXTERNAL: 'OPEN_EXTERNAL',
  HAPTIC: 'HAPTIC',
  EXIT_APP: 'EXIT_APP',
  GET_APP_INFO: 'GET_APP_INFO',
  GET_NETWORK_STATE: 'GET_NETWORK_STATE',
} as const

export type BridgeActionType = (typeof BridgeAction)[keyof typeof BridgeAction]

/** 앱 -> 웹 이벤트 */
export const BridgeEvent = {
  /** Android 하드웨어 뒤로가기. 핸들러가 true를 반환하면 "웹이 처리했다"는 뜻입니다. */
  HARDWARE_BACK: 'HARDWARE_BACK',
  /** 푸시 알림 탭으로 앱이 열림 */
  PUSH_OPENED: 'PUSH_OPENED',
  /** 앱 포그라운드/백그라운드 전환 */
  APP_STATE: 'APP_STATE',
  /** 네트워크 연결 상태 변화 */
  NETWORK_STATE: 'NETWORK_STATE',
} as const

export type BridgeEventType = (typeof BridgeEvent)[keyof typeof BridgeEvent]

/** 에러 코드 */
export const BridgeErrorCode = {
  /** 이 앱 버전이 모르는 액션 (웹이 폴백 UI로 전환해야 함) */
  UNSUPPORTED_ACTION: 'UNSUPPORTED_ACTION',
  INVALID_PAYLOAD: 'INVALID_PAYLOAD',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  /** 사용자가 취소함 (에러 토스트를 띄우면 안 되는 정상 흐름) */
  USER_CANCELLED: 'USER_CANCELLED',
  NOT_AVAILABLE: 'NOT_AVAILABLE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  /** 웹 쪽에서 타임아웃으로 스스로 만든 코드 */
  TIMEOUT: 'TIMEOUT',
  /** 브릿지 자체가 없음 (일반 브라우저). 웹 전용 코드 */
  NO_BRIDGE: 'NO_BRIDGE',
} as const

export type BridgeErrorCodeType = (typeof BridgeErrorCode)[keyof typeof BridgeErrorCode]

// ---------------------------------------------------------------------------
// 액션별 payload / data 타입
// ---------------------------------------------------------------------------

export interface LoginKakaoData {
  accessToken: string
  refreshToken?: string
  idToken?: string
  snsType: 'KAKAO'
}

export interface LoginAppleData {
  identityToken: string
  authorizationCode: string | null
  email: string | null
  fullName: string | null
  user: string
  snsType: 'APPLE'
}

export interface DeviceTokenData {
  deviceId: string
  pushToken: string | null
  platform: 'ios' | 'android'
  appVersion: string
  permission: 'granted' | 'denied' | 'undetermined'
}

export interface GetLocationPayload {
  accuracy?: 'low' | 'balanced' | 'high'
  reverseGeocode?: boolean
}

export interface LocationData {
  latitude: number
  longitude: number
  accuracy: number | null
  timestamp: number
  address?: string | null
}

export interface PickImagePayload {
  multiple?: boolean
  max?: number
  allowsEditing?: boolean
  aspect?: [number, number]
  quality?: number
  returnAs?: 'base64' | 'uri'
}

export interface PickedImage {
  uri: string
  dataUrl?: string
  width: number
  height: number
  fileName: string
  mimeType: string
  fileSize: number | null
}

export interface PickImageData {
  images: PickedImage[]
}

/** 앱 SecureStore에 쓸 수 있는 키 화이트리스트 */
export const SECURE_STORE_KEYS = [
  'accessToken',
  'refreshToken',
  'selectedPetId',
  'selectedPetName',
] as const

export type SecureStoreKey = (typeof SECURE_STORE_KEYS)[number]

export interface SetTokenPayload {
  key: SecureStoreKey
  value: string
}

export interface GetTokenPayload {
  key: SecureStoreKey
}

export interface GetTokenData {
  key: SecureStoreKey
  value: string | null
}

export interface ClearTokenPayload {
  /** 생략하면 화이트리스트 전체 삭제 (로그아웃) */
  keys?: SecureStoreKey[]
}

export interface OpenExternalPayload {
  url: string
}

export type HapticStyle =
  'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection'

export interface HapticPayload {
  style?: HapticStyle
}

export interface AppInfoData {
  bridgeVersion: string
  envelopeVersion: number
  platform: 'ios' | 'android'
  appVersion: string
  supportedActions: string[]
  supportedEvents: string[]
}

export interface NetworkStateData {
  isConnected: boolean
  isInternetReachable: boolean | null
  type: string
}

export interface AppStateEventPayload {
  state: 'active' | 'background' | 'inactive'
}

export interface PushOpenedEventPayload {
  /** 웹이 이동해야 할 경로 (예: '/walk/123'). 없으면 null */
  path: string | null
  params: Record<string, string>
  raw: Record<string, unknown>
}

/** 이벤트 이름 -> payload 타입 매핑 */
export interface BridgeEventPayloadMap {
  [BridgeEvent.HARDWARE_BACK]: undefined
  [BridgeEvent.PUSH_OPENED]: PushOpenedEventPayload
  [BridgeEvent.APP_STATE]: AppStateEventPayload
  [BridgeEvent.NETWORK_STATE]: NetworkStateData
}

// ---------------------------------------------------------------------------
// 주입된 전역 객체
// ---------------------------------------------------------------------------

export interface BridgeRequestOptions {
  /** ms. 0 이하면 타임아웃 없음. 기본값은 BRIDGE_DEFAULT_TIMEOUT */
  timeout?: number
}

/** 앱이 `window.PuppyNoteBridge`로 주입하는 객체의 형태 */
export interface PuppyNoteBridge {
  version: string
  envelopeVersion: number
  platform: 'ios' | 'android'
  appVersion: string
  supportedActions: string[]
  supportedEvents: string[]
  isSupported(action: string): boolean
  request<D = unknown>(
    action: string,
    payload?: unknown,
    options?: BridgeRequestOptions,
  ): Promise<D>
  /** 반환값은 구독 해제 함수 */
  on<P = unknown>(event: string, handler: (payload: P) => boolean | void): () => void
  off<P = unknown>(event: string, handler: (payload: P) => boolean | void): void
}

declare global {
  interface Window {
    PuppyNoteBridge?: PuppyNoteBridge
    /** react-native-webview가 주입하는 저수준 채널 (직접 쓰지 말 것) */
    ReactNativeWebView?: { postMessage(message: string): void }
  }
}
