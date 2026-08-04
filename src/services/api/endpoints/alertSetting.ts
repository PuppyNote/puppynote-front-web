/**
 * 알림 설정 엔드포인트.
 * 네이티브 원본: `puppynote-front-app/src/services/alertSetting/AlertSettingService.ts`
 */
import { apiService } from '../ApiService'
import { unwrapApiResponse } from '../types'

export type AlertStatus = 'ON' | 'OFF'

export interface AlertSettingData {
  all: AlertStatus
  walk: AlertStatus
  friend: AlertStatus
}

export const alertSettingApi = {
  async getAlertSetting(): Promise<AlertSettingData> {
    const response = await apiService.get<AlertSettingData>('/api/v1/alert-setting')
    return unwrapApiResponse(response, 200, '알림 설정 조회에 실패했습니다.')
  },

  async updateAlertSetting(data: AlertSettingData): Promise<AlertSettingData> {
    const response = await apiService.patch<AlertSettingData>('/api/v1/alert-setting', data)
    return unwrapApiResponse(response, 200, '알림 설정 수정에 실패했습니다.')
  },
}
