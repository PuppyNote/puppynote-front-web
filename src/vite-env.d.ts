/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API 서버 주소 (puppynote-server) */
  readonly VITE_API_URL: string
  /** 요청 타임아웃(ms) */
  readonly VITE_API_TIMEOUT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
