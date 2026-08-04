/**
 * 사용자 관련 엔드포인트.
 * 서버 원본: `user/users/controller/UserController.java`
 */
import { apiService } from '../ApiService'
import { unwrapApiResponse } from '../types'

export interface UserProfile {
  userId: number
  email: string
  nickName: string
  profileUrl: string | null
}

export interface UpdateProfilePayload {
  nickName: string
  profileUrl?: string | null
}

export const userApi = {
  /**
   * 내 프로필 조회.
   * 인증이 필요한 가장 가벼운 GET이라 앱 진입 시 저장된 토큰의 유효성 검사에도 씁니다.
   */
  async getProfile(): Promise<UserProfile> {
    const response = await apiService.get<UserProfile>('/api/v1/user/profile')
    return unwrapApiResponse(response, 200, '프로필 조회에 실패했습니다.')
  },

  /** 닉네임/프로필 이미지 수정 */
  async updateProfile(payload: UpdateProfilePayload): Promise<void> {
    const response = await apiService.patch<null>('/api/v1/user/profile', payload)
    unwrapApiResponse(response, 200, '프로필 수정에 실패했습니다.')
  },

  /** 회원 탈퇴 */
  async withdraw(): Promise<void> {
    const response = await apiService.delete<null>('/api/v1/user/withdraw')
    unwrapApiResponse(response, 200, '회원탈퇴에 실패했습니다.')
  },
}
