/**
 * 현재 위치 조회 공통 유틸.
 *
 * 앱 WebView 안에서는 브릿지 `GET_LOCATION`을, 일반 브라우저에서는 웹 표준 Geolocation API를
 * 씁니다. 두 경로 모두 `{ latitude, longitude }`로 통일해서 돌려주므로 호출부(홈 날씨 등)는
 * 실행 환경을 신경 쓰지 않습니다.
 *
 * 네이티브 원본은 `expo-location`의 `requestForegroundPermissionsAsync` + `getCurrentPositionAsync`
 * (accuracy: Balanced)이고, 앱 브릿지의 `GET_LOCATION` 핸들러가 그 자리를 대신합니다.
 */
import { BridgeError, isActionSupported, isInApp, requestBridge } from '@/bridge/bridge'
import { BridgeAction, BridgeErrorCode, type LocationData } from '@/bridge/protocol'

export interface Coordinates {
  latitude: number
  longitude: number
}

export interface CoordinatesWithAddress extends Coordinates {
  /**
   * 역지오코딩 주소. 브릿지가 지원하고 `reverseGeocode: true`를 넘겼을 때만 채워집니다.
   * 웹 표준 Geolocation 폴백 경로는 역지오코딩 수단이 없어 항상 null입니다.
   */
  address: string | null
}

/** 브릿지 대신 웹 Geolocation으로 폴백해야 하는 에러인지 (구버전 앱 등) */
const FALLBACK_ERROR_CODES: string[] = [
  BridgeErrorCode.NO_BRIDGE,
  BridgeErrorCode.UNSUPPORTED_ACTION,
  BridgeErrorCode.NOT_AVAILABLE,
]

/** 웹 Geolocation 옵션. 네이티브 `Accuracy.Balanced`에 맞춰 고정밀은 끕니다. */
const WEB_GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 10000,
  maximumAge: 5 * 60 * 1000,
}

/**
 * 현재 좌표를 가져옵니다.
 *
 * 권한 거부·미지원 등은 예외로 던집니다. 위치는 부가 정보(날씨)에만 쓰이므로
 * 호출부에서 조용히 무시하고 해당 UI만 감추면 됩니다.
 */
export async function getCurrentCoordinates(): Promise<Coordinates> {
  const { latitude, longitude } = await getCurrentPosition()
  return { latitude, longitude }
}

/**
 * 현재 좌표 + (가능하면) 주소를 가져옵니다. 산책 기록 추가 화면처럼 장소 입력칸을
 * 자동으로 채워주고 싶을 때 씁니다. 주소가 없으면 사용자가 직접 입력하면 됩니다.
 */
export async function getCurrentPosition(): Promise<CoordinatesWithAddress> {
  if (isInApp() && isActionSupported(BridgeAction.GET_LOCATION)) {
    try {
      const data = await requestBridge<LocationData>(BridgeAction.GET_LOCATION, {
        accuracy: 'balanced',
        reverseGeocode: true,
      })
      return { latitude: data.latitude, longitude: data.longitude, address: data.address ?? null }
    } catch (error) {
      const code = error instanceof BridgeError ? error.code : null
      if (!code || !FALLBACK_ERROR_CODES.includes(code)) throw error
      // 앱이 이 액션을 모르는 경우에만 웹 표준 API로 내려갑니다.
    }
  }

  return getViaWebGeolocation()
}

function getViaWebGeolocation(): Promise<CoordinatesWithAddress> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    throw new Error('이 브라우저에서는 위치 정보를 사용할 수 없습니다.')
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          // 웹 표준 Geolocation은 역지오코딩을 제공하지 않습니다.
          address: null,
        }),
      (error) => reject(new Error(toGeolocationMessage(error))),
      WEB_GEOLOCATION_OPTIONS,
    )
  })
}

function toGeolocationMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return '위치 권한이 거부되었습니다.'
    case error.POSITION_UNAVAILABLE:
      return '현재 위치를 확인할 수 없습니다.'
    case error.TIMEOUT:
      return '위치 확인이 시간 내에 끝나지 않았습니다.'
    default:
      return error.message || '위치 정보를 가져오지 못했습니다.'
  }
}
