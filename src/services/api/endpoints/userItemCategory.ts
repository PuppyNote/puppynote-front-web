/**
 * 사용자별 카테고리 설정 엔드포인트.
 *
 * 네이티브 원본: `src/services/userCategory/UserCategoryService.ts`
 * 용품(`ITEM`)과 활동(`ACTIVITY`) 카테고리가 같은 API를 공유합니다. 활동 카테고리는 아직
 * 이식 전 화면(건강 기록)에서만 쓰여서, 이 티켓에서는 `ITEM`만 실제로 호출합니다.
 */
import { apiService } from '../ApiService'
import { unwrapApiResponse } from '../types'

export type UserCategoryType = 'ITEM' | 'ACTIVITY'

export interface UserCategoryResponse {
  userItemCategoryId: number
  categoryType: UserCategoryType
  categoryTypeDescription: string
  majorCategory: string
  majorCategoryName: string
  majorCategoryEmoji: string
  category: string
  categoryName: string
  categoryEmoji: string
  sort: number
}

export const userItemCategoryApi = {
  /** 사용자가 등록해 둔 카테고리 목록 (등록 순서 = `sort` 오름차순) */
  async getUserCategories(categoryType: UserCategoryType): Promise<UserCategoryResponse[]> {
    const response = await apiService.get<UserCategoryResponse[]>('/api/v1/user-item-categories', {
      params: { categoryType },
    })
    return unwrapApiResponse(response, 200, '카테고리 설정을 불러오는 데 실패했습니다.')
  },

  /**
   * 카테고리 구성을 통째로 저장합니다(목록 전체 교체, 순서 = 배열 순서).
   * 저장된 뒤의 최신 목록을 그대로 돌려줍니다.
   */
  async saveUserCategories(
    categoryType: UserCategoryType,
    categories: string[],
  ): Promise<UserCategoryResponse[]> {
    const response = await apiService.post<UserCategoryResponse[]>('/api/v1/user-item-categories', {
      categoryType,
      categories,
    })
    return unwrapApiResponse(response, 200, '카테고리 설정 저장에 실패했습니다.')
  },
}
