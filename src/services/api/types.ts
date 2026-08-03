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

/**
 * 공통 래퍼를 벗겨 `data`만 돌려줍니다.
 *
 * 서버는 HTTP status와 바디의 `statusCode`를 같이 내려주므로 실패는 대부분 axios 인터셉터에서
 * 이미 걸러집니다. 여기서 한 번 더 보는 것은 "HTTP 200인데 바디 statusCode는 다른" 경우 대비입니다.
 * (네이티브 AuthService도 같은 방식으로 방어합니다.)
 */
export function unwrapApiResponse<T>(
  response: ApiResponse<T>,
  expectedStatus = 200,
  fallbackMessage = '요청에 실패했습니다.',
): T {
  if (response.statusCode !== expectedStatus) {
    const error: ApiError = {
      message: response.message || fallbackMessage,
      statusCode: response.statusCode,
      data: response.data,
    }
    throw error
  }
  return response.data
}

/** 어떤 형태의 예외든 사용자에게 보여줄 문구 하나로 좁힙니다. */
export function toErrorMessage(error: unknown, fallback: string): string {
  if (isApiError(error)) return error.message || fallback
  if (error instanceof Error) return error.message || fallback
  return fallback
}
