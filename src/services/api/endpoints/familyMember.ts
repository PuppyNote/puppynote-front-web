/**
 * 가족 구성원 엔드포인트.
 * 네이티브 원본: `puppynote-front-app/src/services/family/FamilyService.ts`
 */
import { apiService } from '../ApiService'
import { unwrapApiResponse } from '../types'

export interface FamilyMember {
  userId: number
  nickName: string
  profileUrl: string | null
  role: 'OWNER' | 'FAMILY'
  status: 'DONE' | 'PENDING'
}

export interface SearchedUser {
  userId: number
  email: string
  nickName: string
  profileUrl: string | null
}

export const familyMemberApi = {
  /** 펫의 가족 목록 */
  async getFamilyMembers(petId: number): Promise<FamilyMember[]> {
    const response = await apiService.get<FamilyMember[]>('/api/v1/family-members', {
      params: { petId },
    })
    return unwrapApiResponse(response, 200, '가족 목록을 불러오지 못했습니다.')
  },

  /** 이메일로 유저 검색 (LIKE) */
  async searchUsers(email: string): Promise<SearchedUser[]> {
    const response = await apiService.get<SearchedUser[]>('/api/v1/family-members/search', {
      params: { email },
    })
    return unwrapApiResponse(response, 200, '유저 검색에 실패했습니다.')
  },

  /** 가족 초대 */
  async inviteFamilyMember(inviteeUserId: number, petId: number): Promise<void> {
    const response = await apiService.post<null>('/api/v1/family-members/invite', {
      inviteeUserId,
      petId,
    })
    unwrapApiResponse(response, 200, '초대 발송에 실패했습니다.')
  },

  /** 가족 등록 (초대 수락) */
  async registerFamily(userId: number, petId: number): Promise<void> {
    const response = await apiService.post<null>('/api/v1/family-members/register', {
      userId,
      petId,
    })
    unwrapApiResponse(response, 200, '가족 등록에 실패했습니다.')
  },

  /** 가족 삭제 */
  async deleteFamilyMember(targetUserId: number, petId: number): Promise<void> {
    const response = await apiService.delete<null>(`/api/v1/family-members/${targetUserId}`, {
      params: { petId },
    })
    unwrapApiResponse(response, 200, '가족 삭제에 실패했습니다.')
  },
}
