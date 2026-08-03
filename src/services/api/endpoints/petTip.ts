/**
 * 반려견 팁 엔드포인트.
 * 서버 원본: `petTip/controller/PetTipController.java`
 */
import { apiService } from '../ApiService'
import { unwrapApiResponse } from '../types'

export interface PetTip {
  id: number
  content: string
}

export const petTipApi = {
  /** 랜덤 팁 1건. 펫이 없어도 호출합니다(홈 하단 팁 카드는 항상 노출). */
  async getRandomPetTip(): Promise<PetTip> {
    const response = await apiService.get<PetTip>('/api/v1/pet-tips/random')
    return unwrapApiResponse(response, 200, '팁을 불러오는 데 실패했습니다.')
  },
}
