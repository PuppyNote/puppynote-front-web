/**
 * 음식 안전정보 엔드포인트.
 *
 * 네이티브 원본: `puppynote-front-app/src/services/food/FoodService.ts`,
 * `puppynote-front-app/src/types/Food.ts`
 *
 * `/api/v1/foods/ai`는 일반 POST-JSON 응답입니다 (네이티브 원본에 스트리밍 코드 없음 — SSE나
 * 청크 처리 없이 `apiService.post`로 한 번에 받습니다).
 */
import { apiService } from '../ApiService'
import { unwrapApiResponse } from '../types'

export interface FoodItem {
  id: number
  question: string
  answer: string
  safetyLevel: 'GOOD' | 'NOTION' | 'BAD'
}

export interface FoodSearchResponse {
  content: FoodItem[]
  page: number
  totalCount: number
}

export const foodApi = {
  /** ES 검색. `question`을 비우면 전체 목록입니다. */
  async searchFoods(question: string | undefined, page: number, size = 10): Promise<FoodSearchResponse> {
    const params: Record<string, string | number> = { page, size }
    if (question) params.question = question

    const response = await apiService.get<FoodSearchResponse>('/api/v1/foods', { params })
    return unwrapApiResponse(response, 200, '음식 정보를 불러오지 못했습니다.')
  },

  /** AI 문답. 검색 결과가 없을 때 사용자가 확인하면 부릅니다. */
  async askAi(question: string): Promise<FoodItem> {
    const response = await apiService.post<FoodItem>('/api/v1/foods/ai', { question })
    return unwrapApiResponse(response, 200, 'AI 검색 중 오류가 발생했습니다.')
  },

  /**
   * AI 지식베이스 문서 삭제.
   * 네이티브 화면에는 이 API를 부르는 UI가 없습니다(관리자 전용으로 추정). 화면 없이 호출만 열어둡니다.
   */
  async deleteDocument(id: number): Promise<void> {
    const response = await apiService.delete<void>(`/api/v1/foods/documents/${id}`)
    unwrapApiResponse(response, 200, '문서 삭제에 실패했습니다.')
  },
}
