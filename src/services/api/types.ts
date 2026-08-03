/** puppynote-server 공통 응답 래퍼 */
export interface ApiResponse<T> {
  statusCode: number
  httpStatus: string
  message: string
  data: T
}

/** 인터셉터가 reject 할 때 넘기는 정규화된 에러 */
export interface ApiError {
  /** 사용자에게 보여줄 수 있는 메시지 */
  message: string
  /** 서버가 내려준 statusCode 또는 HTTP status. 네트워크 오류면 0 */
  statusCode: number
  /** 원본 응답 바디 (있으면) */
  data?: unknown
}

export function isApiError(error: unknown): error is ApiError {
  return typeof error === 'object' && error !== null && 'message' in error && 'statusCode' in error
}
