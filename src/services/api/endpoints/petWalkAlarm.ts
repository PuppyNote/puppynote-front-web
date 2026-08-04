/**
 * 산책 알람 엔드포인트.
 *
 * 네이티브 원본: `puppynote-front-app/src/services/petWalkAlarm/PetWalkAlarmService.ts`
 * `AlarmStatus` enum은 다른 웹 엔드포인트 모듈의 관례(`PetRoleType` 등)에 맞춰 문자열 유니언으로 옮겼습니다.
 */
import { apiService } from '../ApiService'
import { unwrapApiResponse } from '../types'

export type WalkAlarmStatus = 'YES' | 'NO'

export interface WalkAlarm {
  alarmId: number
  alarmStatus: WalkAlarmStatus
  alarmDays: string[]
  alarmTime: string
}

export interface CreateWalkAlarmPayload {
  petId: number
  alarmStatus: WalkAlarmStatus
  alarmDays: string[]
  /** `HH:mm` */
  alarmTime: string
}

export interface UpdateWalkAlarmPayload {
  alarmId: number
  alarmStatus: WalkAlarmStatus
  alarmDays: string[]
  /** `HH:mm` */
  alarmTime: string
}

export const petWalkAlarmApi = {
  /** 펫의 산책 알람 목록 */
  async getWalkAlarms(petId: number): Promise<WalkAlarm[]> {
    const response = await apiService.get<WalkAlarm[]>('/api/v1/pet-walk-alarms', {
      params: { petId },
    })
    return unwrapApiResponse(response, 200, '알람 목록 조회에 실패했습니다.')
  },

  /** 산책 알람 등록 */
  async createWalkAlarm(payload: CreateWalkAlarmPayload): Promise<WalkAlarm> {
    const response = await apiService.post<WalkAlarm>('/api/v1/pet-walk-alarms', payload)
    return unwrapApiResponse(response, 201, '알람 등록에 실패했습니다.')
  },

  /** 산책 알람 수정 */
  async updateWalkAlarm(payload: UpdateWalkAlarmPayload): Promise<WalkAlarm> {
    const response = await apiService.put<WalkAlarm>('/api/v1/pet-walk-alarms', payload)
    return unwrapApiResponse(response, 200, '알람 수정에 실패했습니다.')
  },

  /** 산책 알람 활성화 여부만 변경 */
  async updateWalkAlarmStatus(alarmId: number, alarmStatus: WalkAlarmStatus): Promise<WalkAlarm> {
    const response = await apiService.patch<WalkAlarm>('/api/v1/pet-walk-alarms/status', {
      alarmId,
      alarmStatus,
    })
    return unwrapApiResponse(response, 200, '알람 상태 변경에 실패했습니다.')
  },

  /** 산책 알람 삭제 */
  async deleteWalkAlarm(alarmId: number): Promise<void> {
    const response = await apiService.delete<void>(`/api/v1/pet-walk-alarms/${alarmId}`)
    unwrapApiResponse(response, 200, '알람 삭제에 실패했습니다.')
  },
}
