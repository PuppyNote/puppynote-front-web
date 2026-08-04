/**
 * 카카오맵 JS SDK 로더.
 *
 * 네이티브는 `react-native-maps`로 지도를 그리지만 웹에는 대응하는 표준이 없어, 팀의
 * 다른 웹 프로젝트(`puppymap-front-web`)와 동일하게 카카오맵 JS SDK를 씁니다.
 *
 * SDK는 `index.html`에 `autoload=false`로 미리 넣어둔 `<script>` 태그가 불러옵니다
 * (앱키는 `VITE_KAKAO_MAP_APP_KEY` 환경변수, 빌드 시 Vite가 `%VITE_..%` 자리에 치환합니다).
 * `autoload=false`인 이유: 지도를 쓰지 않는 화면(로그인 등)에서도 SDK 초기화 비용을
 * 물지 않기 위해서이고, 그래서 실제 지도 클래스들은 `kakao.maps.load(callback)`이
 * 끝난 뒤에만 접근할 수 있습니다.
 *
 * 이 앱에서 지도를 쓰는 곳은 {@link ../../components/walk/WalkDetailModal} 한 곳뿐입니다.
 */

interface KakaoLatLng {
  getLat(): number
  getLng(): number
}

interface KakaoMap {
  setDraggable(draggable: boolean): void
  setZoomable(zoomable: boolean): void
  relayout(): void
  setCenter(latlng: KakaoLatLng): void
}

interface KakaoMarker {
  setMap(map: KakaoMap | null): void
}

interface KakaoCustomOverlay {
  setMap(map: KakaoMap | null): void
}

interface KakaoMapOptions {
  center: KakaoLatLng
  level?: number
  draggable?: boolean
  zoomable?: boolean
}

interface KakaoMarkerOptions {
  map?: KakaoMap
  position: KakaoLatLng
}

interface KakaoCustomOverlayOptions {
  map?: KakaoMap
  position: KakaoLatLng
  content: string | HTMLElement
  yAnchor?: number
}

interface KakaoMapsNamespace {
  load(callback: () => void): void
  LatLng: new (lat: number, lng: number) => KakaoLatLng
  Map: new (container: HTMLElement, options: KakaoMapOptions) => KakaoMap
  Marker: new (options: KakaoMarkerOptions) => KakaoMarker
  CustomOverlay: new (options: KakaoCustomOverlayOptions) => KakaoCustomOverlay
}

declare global {
  interface Window {
    kakao?: { maps: KakaoMapsNamespace }
  }
}

export type { KakaoLatLng, KakaoMap, KakaoMapsNamespace, KakaoMarker, KakaoCustomOverlay }

let loadPromise: Promise<KakaoMapsNamespace> | null = null

/**
 * `<script>` 태그가 실제로 SDK를 다 받아올 때까지 기다린 뒤 `kakao.maps.load`로 초기화합니다.
 * 이미 초기화됐으면 즉시 resolve 됩니다. 앱키가 비어 있으면(`.env` 미설정) 에러로 reject합니다.
 */
export function loadKakaoMaps(): Promise<KakaoMapsNamespace> {
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve, reject) => {
    const start = Date.now()
    const timeoutMs = 10000

    const tryInit = () => {
      if (!window.kakao?.maps) {
        if (Date.now() - start > timeoutMs) {
          reject(
            new Error(
              '카카오맵 SDK를 불러오지 못했습니다. VITE_KAKAO_MAP_APP_KEY 설정을 확인해주세요.',
            ),
          )
          return
        }
        window.setTimeout(tryInit, 100)
        return
      }

      window.kakao.maps.load(() => resolve(window.kakao!.maps))
    }

    tryInit()
  })

  return loadPromise
}
