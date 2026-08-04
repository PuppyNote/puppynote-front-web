/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API 서버 주소 (puppynote-server) */
  readonly VITE_API_URL: string
  /** 요청 타임아웃(ms) */
  readonly VITE_API_TIMEOUT?: string
  /** 카카오맵 JS SDK 앱 키. 비어 있으면 산책 상세의 지도 영역만 못 뜹니다. */
  readonly VITE_KAKAO_MAP_APP_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
