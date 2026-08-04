/**
 * 산책 기록 엔드포인트.
 *
 * 서버/네이티브 원본: `puppynote-front-app/src/services/walk/WalkService.ts`
 * 좌표는 상세 조회 시 지도에 마커 하나를 찍는 데만 쓰입니다 (경로/폴리라인 데이터는 없습니다).
 */
import { apiService } from '../ApiService'
import { unwrapApiResponse } from '../types'

export interface WalkHistory {
  walkId: number
  petId: number
  startTime: string
  endTime: string
  latitude: number
  longitude: number
  location: string
  memo: string
  photoUrl: string
}

export interface WalkDetail {
  walkId: number
  petId: number
  startTime: string
  endTime: string
  latitude: number
  longitude: number
  location: string
  memo: string
  photoUrls: string[]
}

export interface CalendarDayStatus {
  date: string
  hasWalk: boolean
}

export interface CreateWalkPayload {
  petId: number
  /** ISO, `YYYY-MM-DDTHH:mm:00` */
  startTime: string
  /** ISO, `YYYY-MM-DDTHH:mm:00` */
  endTime: string
  latitude: number
  longitude: number
  location: string
  memo: string
  photoKeys: string[]
}

export const walkApi = {
  /** 산책 상세 조회 */
  async getWalkDetail(walkId: number): Promise<WalkDetail> {
    const response = await apiService.get<WalkDetail>(`/api/v1/walks/${walkId}`)
    return unwrapApiResponse(response, 200, '산책 상세 정보 조회에 실패했습니다.')
  },

  /** 특정 날짜의 산책 이력 목록 */
  async getWalkHistory(petId: number, date: string): Promise<WalkHistory[]> {
    const response = await apiService.get<WalkHistory[]>('/api/v1/walks', {
      params: { petId, date },
    })
    return unwrapApiResponse(response, 200, '산책 이력 조회에 실패했습니다.')
  },

  /** 월 단위 산책 여부 캘린더 */
  async getWalkCalendar(petId: number, yearMonth: string): Promise<CalendarDayStatus[]> {
    const response = await apiService.get<CalendarDayStatus[]>('/api/v1/walks/calendar', {
      params: { petId, yearMonth },
    })
    return unwrapApiResponse(response, 200, '캘린더 조회에 실패했습니다.')
  },

  /** 산책 기록 저장. 서버가 201을 내려줍니다. */
  async createWalk(payload: CreateWalkPayload): Promise<void> {
    const response = await apiService.post<void>('/api/v1/walks', payload)
    unwrapApiResponse(response, 201, '산책 기록 저장에 실패했습니다.')
  },

  /** 산책 기록 삭제 */
  async deleteWalk(walkId: number): Promise<void> {
    const response = await apiService.delete<void>(`/api/v1/walks/${walkId}`)
    unwrapApiResponse(response, 200, '산책 기록 삭제에 실패했습니다.')
  },
}
