/**
 * 반려동물 용품 엔드포인트.
 *
 * 서버 원본: `pet/petItems/controller/PetItemController.java` / `PetItemResponse.java`
 * 네이티브 원본: `src/services/petItem/PetItemService.ts`
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

export interface ItemCategory {
  category: string
  categoryName: string
  emoji: string
}

export interface MajorCategory {
  majorCategory: string
  majorCategoryName: string
  majorCategoryEmoji: string
  categories: ItemCategory[]
}

export interface CreatePetItemPayload {
  petId: number
  name: string
  category: string
  purchaseCycleDays: number
  purchaseUrl?: string
  /** {@link storageApi.uploadImage}가 돌려준 오브젝트 키. URL이 아닙니다. */
  imageKey?: string
}

export interface UpdatePetItemPayload {
  name: string
  category: string
  purchaseCycleDays: number
  purchaseUrl?: string
  imageKey?: string
}

export interface PurchaseHistory {
  id: number
  petItemId: number
  /** `YYYY-MM-DD` */
  purchasedAt: string
}

export const petItemApi = {
  /** 펫의 용품 목록. `category`를 넘기면 해당 소분류만 내려옵니다. */
  async getPetItems(petId: number, category?: string): Promise<PetItem[]> {
    const params: Record<string, string | number> = { petId }
    if (category && category !== 'all') params.category = category

    const response = await apiService.get<PetItem[]>('/api/v1/pet-items', { params })
    return unwrapApiResponse(response, 200, '용품 목록을 불러오는 데 실패했습니다.')
  },

  /** 대분류 > 소분류 전체 목록. 카테고리 관리 화면에서 "추가할 수 있는 카테고리"에 씁니다. */
  async getCategories(): Promise<MajorCategory[]> {
    const response = await apiService.get<MajorCategory[]>('/api/v1/pet-items/categories')
    return unwrapApiResponse(response, 200, '카테고리 목록을 불러오는 데 실패했습니다.')
  },

  /** 용품 상세 조회 */
  async getPetItemDetail(petItemId: number): Promise<PetItem> {
    const response = await apiService.get<PetItem>(`/api/v1/pet-items/${petItemId}`)
    return unwrapApiResponse(response, 200, '용품 상세 정보를 불러오는 데 실패했습니다.')
  },

  /** 용품 등록. 서버가 201을 내려줍니다. */
  async createPetItem(payload: CreatePetItemPayload): Promise<PetItem> {
    const response = await apiService.post<PetItem>('/api/v1/pet-items', payload)
    return unwrapApiResponse(response, 201, '용품 등록에 실패했습니다.')
  },

  /** 용품 수정 */
  async updatePetItem(petItemId: number, payload: UpdatePetItemPayload): Promise<PetItem> {
    const response = await apiService.patch<PetItem>(`/api/v1/pet-items/${petItemId}`, payload)
    return unwrapApiResponse(response, 200, '용품 수정에 실패했습니다.')
  },

  /** 용품 삭제 */
  async deletePetItem(petItemId: number): Promise<void> {
    const response = await apiService.delete<void>(`/api/v1/pet-items/${petItemId}`)
    unwrapApiResponse(response, 200, '용품 삭제에 실패했습니다.')
  },

  /** 용품 구매 이력 조회 */
  async getPurchaseHistory(petItemId: number): Promise<PurchaseHistory[]> {
    const response = await apiService.get<PurchaseHistory[]>(
      `/api/v1/pet-items/${petItemId}/purchases`,
    )
    return unwrapApiResponse(response, 200, '구매 이력을 불러오는 데 실패했습니다.')
  },

  /** 구매 이력 등록. `purchasedAt`을 생략하면 서버가 오늘 날짜로 기록합니다. */
  async createPurchase(petItemId: number, purchasedAt?: string): Promise<PurchaseHistory> {
    const response = await apiService.post<PurchaseHistory>(
      `/api/v1/pet-items/${petItemId}/purchases`,
      { purchasedAt: purchasedAt ?? null },
    )
    return unwrapApiResponse(response, 201, '구매 기록 등록에 실패했습니다.')
  },

  /** 구매 이력 삭제 */
  async deletePurchase(purchaseId: number): Promise<void> {
    const response = await apiService.delete<void>(`/api/v1/pet-items/purchases/${purchaseId}`)
    unwrapApiResponse(response, 200, '구매 기록 삭제에 실패했습니다.')
  },
}
