/**
 * 반려동물 용품 엔드포인트.
 *
 * 서버 원본: `pet/petItems/controller/PetItemController.java` / `PetItemResponse.java`
 *
 * ⚠️ 지금은 **홈 화면의 '소진 임박 용품' 섹션에 필요한 목록 조회만** 옮겨 두었습니다.
 * 등록/수정/삭제·구매 이력은 용품 화면 이식 티켓에서 이 파일에 이어서 추가하세요
 * (네이티브 원본은 `src/services/petItem/PetItemService.ts`).
 */
import { apiService } from '../ApiService'
import { unwrapApiResponse } from '../types'

export interface PetItem {
  petItemId: number
  petId: number
  name: string
  majorCategory: string
  majorCategoryName: string
  majorCategoryEmoji: string
  category: string
  categoryName: string
  categoryEmoji: string
  purchaseCycleDays: number
  purchaseUrl: string | null
  /** CloudFront 전체 URL */
  imageUrl: string | null
  /** `YYYY-MM-DD`. 구매 이력이 없으면 null */
  lastPurchasedAt: string | null
  /** `YYYY-MM-DD`. 구매 이력이 없으면 null (= 소진 예정일을 알 수 없음) */
  nextPurchaseAt: string | null
}

export const petItemApi = {
  /** 펫의 용품 목록. `category`를 넘기면 해당 소분류만 내려옵니다. */
  async getPetItems(petId: number, category?: string): Promise<PetItem[]> {
    const params: Record<string, string | number> = { petId }
    if (category && category !== 'all') params.category = category

    const response = await apiService.get<PetItem[]>('/api/v1/pet-items', { params })
    return unwrapApiResponse(response, 200, '용품 목록을 불러오는 데 실패했습니다.')
  },
}
