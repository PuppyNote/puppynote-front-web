/**
 * 알림 내역 엔드포인트.
 * 네이티브 원본: `puppynote-front-app/src/services/alertHistory/AlertHistoryService.ts`
 *
 * ⚠️ 다른 목록 API와 달리 `page`가 **1부터** 시작합니다 (네이티브 `getAlertHistories(page = 1, ...)`).
 */
import { apiService } from '../ApiService'
import { unwrapApiResponse } from '../types'

export type AlertHistoryStatus = 'CHECKED' | 'UNCHECKED'
export type AlertDestinationType = 'DAILY_REPORT' | 'FRIEND' | 'FRIEND_CODE' | 'FAMILY_INVITE'

export interface AlertHistory {
  id: number
  alertDescription: string
  alertHistoryStatus: AlertHistoryStatus
  alertDestinationType: AlertDestinationType
  /** `alertDestinationType`이 `FAMILY_INVITE`면 `{ userId, petId }` JSON 문자열입니다. */
  alertDestinationInfo: string
  createdDate: string
}

export interface PageInfo {
  currentPage: number
  totalPage: number
  totalElement: number
}

export interface AlertHistoryResponse {
  content: AlertHistory[]
  pageInfo: PageInfo
}

export const alertHistoryApi = {
  /** 알림 내역 목록. `page`는 1부터 시작합니다. */
  async getAlertHistories(page: number, size = 12): Promise<AlertHistoryResponse> {
    const response = await apiService.get<AlertHistoryResponse>('/api/v1/alertHistories', {
      params: { page, size },
    })
    return unwrapApiResponse(response, 200, '알림 내역 조회에 실패했습니다.')
  },

  /** 읽지 않은 알림 존재 여부 */
  async getUncheckedAlertExists(): Promise<boolean> {
    const response = await apiService.get<boolean>('/api/v1/alertHistories/unchecked')
    return unwrapApiResponse(response, 200, '알림 존재 여부 조회에 실패했습니다.')
  },

  /** 알림 확인 처리 */
  async checkAlert(id: number): Promise<{ alertHistoryStatus: AlertHistoryStatus }> {
    const response = await apiService.patch<{ alertHistoryStatus: AlertHistoryStatus }>(
      `/api/v1/alertHistories/${id}`,
    )
    return unwrapApiResponse(response, 200, '알림 확인 처리에 실패했습니다.')
  },
}
