/**
 * axios 기반 HTTP 클라이언트 골격.
 *
 * - 요청 인터셉터: 저장된 accessToken을 Authorization 헤더에 부착
 * - 응답 인터셉터: 공통 래퍼(ApiResponse)를 벗겨서 반환, 401이면 토큰 갱신 후 원요청 1회 재시도
 * - 갱신이 진행 중이면 뒤따르는 401 요청들은 큐에 넣었다가 새 토큰으로 한 번에 재시도 (single-flight)
 * - 갱신마저 실패하면 토큰을 지우고 logout 리스너를 호출 (라우팅은 App 레이어가 담당)
 *
 * 실제 엔드포인트 모듈(services/api/endpoints/*)은 후속 티켓에서 추가합니다.
 */
import axios, { AxiosError, AxiosHeaders } from 'axios'
import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios'

import { tokenStorage } from '@/services/auth/tokenStorage'
import type { ApiError, ApiResponse } from './types'

const BASE_URL: string = import.meta.env.VITE_API_URL ?? ''
const TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT ?? 10000)

/**
 * 토큰 갱신 엔드포인트.
 * 네이티브 앱(puppynote-front-app/src/services/ApiService.ts)이 쓰는 경로와 동일하게 맞췄습니다.
 * 실제 연동 티켓에서 백엔드와 최종 확인 예정입니다.
 */
const REFRESH_PATH = '/api/v1/auth/refresh'

interface RetriableRequestConfig extends AxiosRequestConfig {
  _retry?: boolean
}

interface RefreshTokenData {
  accessToken: string
  refreshToken: string
}

class ApiService {
  private readonly instance: AxiosInstance
  private isRefreshing = false
  private refreshSubscribers: ((token: string) => void)[] = []
  private logoutListener: (() => void) | null = null

  constructor() {
    this.instance = axios.create({
      baseURL: BASE_URL,
      timeout: TIMEOUT,
      headers: { 'Content-Type': 'application/json' },
    })

    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = tokenStorage.getAccessToken()
        if (token) {
          config.headers.set('Authorization', `Bearer ${token}`)
        }
        return config
      },
      (error) => Promise.reject(error),
    )

    this.instance.interceptors.response.use(
      // 공통 래퍼를 벗겨 호출부가 ApiResponse<T>를 그대로 받게 합니다.
      (response: AxiosResponse) => response.data,
      (error: AxiosError) => this.handleResponseError(error),
    )
  }

  /**
   * 세션이 완전히 끊겼을 때(리프레시 실패) 호출될 콜백을 등록합니다.
   * 라우팅/상태 초기화는 App 레이어에서 처리합니다.
   */
  public setLogoutListener(listener: (() => void) | null): void {
    this.logoutListener = listener
  }

  public get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.instance.get(url, config)
  }

  public post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    return this.instance.post(url, data, config)
  }

  public put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.instance.put(url, data, config)
  }

  public patch<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    return this.instance.patch(url, data, config)
  }

  public delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.instance.delete(url, config)
  }

  private async handleResponseError(error: AxiosError): Promise<never | AxiosResponse> {
    const { config, response } = error
    const originalRequest = config as
      (InternalAxiosRequestConfig & RetriableRequestConfig) | undefined

    // 갱신 요청 자체가 401이면 더 시도할 것이 없습니다.
    const isRefreshCall = originalRequest?.url?.includes(REFRESH_PATH) ?? false

    if (response?.status === 401 && originalRequest && !originalRequest._retry && !isRefreshCall) {
      // 이미 갱신 중이면 새 토큰이 나올 때까지 대기했다가 재시도합니다.
      if (this.isRefreshing) {
        return new Promise((resolve, reject) => {
          this.refreshSubscribers.push((token: string) => {
            if (!token) {
              reject(this.toApiError(error))
              return
            }
            this.setAuthHeader(originalRequest, token)
            resolve(this.instance(originalRequest))
          })
        })
      }

      originalRequest._retry = true
      this.isRefreshing = true

      try {
        const accessToken = await this.refreshAccessToken()
        this.isRefreshing = false
        this.notifySubscribers(accessToken)
        this.setAuthHeader(originalRequest, accessToken)
        return this.instance(originalRequest)
      } catch (refreshError) {
        this.isRefreshing = false
        this.notifySubscribers('')
        tokenStorage.clear()
        this.logoutListener?.()
        return Promise.reject(this.toApiError(refreshError))
      }
    }

    return Promise.reject(this.toApiError(error))
  }

  /** 리프레시 토큰으로 새 액세스 토큰을 받아옵니다. */
  private async refreshAccessToken(): Promise<string> {
    const refreshToken = tokenStorage.getRefreshToken()
    if (!refreshToken) throw new Error('저장된 리프레시 토큰이 없습니다.')

    // 인터셉터를 타지 않는 별도 인스턴스로 호출해 재귀 갱신을 막습니다.
    const { data: body } = await axios.post<ApiResponse<RefreshTokenData>>(
      `${BASE_URL}${REFRESH_PATH}`,
      { refreshToken },
      { timeout: TIMEOUT },
    )

    if (body.statusCode !== 200 || !body.data?.accessToken) {
      throw new Error(body.message || '토큰 갱신에 실패했습니다.')
    }

    // SecureStore 반영(비동기)을 기다리지 않고 새 토큰을 바로 돌려줍니다.
    // 대기 중인 요청들을 먼저 깨워야 하고, 메모리 캐시는 이 시점에 이미 갱신돼 있습니다.
    void tokenStorage.setTokens(body.data.accessToken, body.data.refreshToken)
    return body.data.accessToken
  }

  /** 대기 중이던 요청들을 깨웁니다. 빈 문자열이면 갱신 실패를 의미합니다. */
  private notifySubscribers(token: string): void {
    const subscribers = this.refreshSubscribers
    this.refreshSubscribers = []
    subscribers.forEach((callback) => callback(token))
  }

  private setAuthHeader(config: InternalAxiosRequestConfig, token: string): void {
    const headers = AxiosHeaders.from(config.headers)
    headers.set('Authorization', `Bearer ${token}`)
    config.headers = headers
  }

  /** 호출부가 다루기 쉽도록 에러 형태를 하나로 통일합니다. */
  private toApiError(error: unknown): ApiError {
    if (axios.isAxiosError(error)) {
      const body = error.response?.data as Partial<ApiResponse<unknown>> | undefined
      if (error.response) {
        return {
          message: body?.message || '서버 오류가 발생했습니다.',
          statusCode: body?.statusCode ?? error.response.status,
          data: error.response.data,
        }
      }
      return { message: '네트워크 연결을 확인해주세요.', statusCode: 0 }
    }

    if (error instanceof Error) {
      return { message: error.message, statusCode: 0 }
    }

    return { message: '알 수 없는 오류가 발생했습니다.', statusCode: 0 }
  }
}

export const apiService = new ApiService()
