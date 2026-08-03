/**
 * 홈 화면 엔드포인트.
 *
 * 서버 원본: `home/controller/HomeController.java` / `home/service/response/HomeResponse.java`
 * 네이티브 앱 `src/services/home/HomeService.ts`와 동일합니다.
 */
import { apiService } from '../ApiService'
import { unwrapApiResponse } from '../types'

export interface HomeInfo {
  petName: string
  /** CloudFront 전체 URL */
  petProfileImageUrl: string | null
  /** `YYYY-MM-DD` */
  birthDate: string | null
  registrationNumber: string | null
  /** 서버가 문자열로 조립해서 내려줍니다 (예: '3살 2개월') */
  petAge: string | null
  /** 생일까지 남은 일수. 0이면 오늘이 생일 */
  birthdayDday: number | null
  walkedToday: boolean
  daysSinceLastWalk: number | null
  monthlyWalkMinutes: number
  recentWalkCount: number
  petItemCount: number
  /** `HH:mm:ss` 형식 (서버 `LocalTime`) */
  todayWalkAlarmTimes: string[]
}

export const homeApi = {
  /**
   * 홈 기본 정보.
   * 펫 수정 모달의 초기값(이름/생일/등록번호/프로필 이미지)도 여기서 가져옵니다
   * (펫 단건 조회 API가 따로 없어서 네이티브도 같은 방식입니다).
   */
  async getHomeInfo(petId: number): Promise<HomeInfo> {
    const response = await apiService.get<HomeInfo>('/api/v1/home', { params: { petId } })
    return unwrapApiResponse(response, 200, '홈 정보를 불러오는 데 실패했습니다.')
  },
}
