/**
 * 반려동물(펫) 엔드포인트.
 *
 * 서버 원본: `pet/pets/controller/PetController.java`
 *   - `PetResponse`(목록) / `PetCreateResponse`(등록) / `PetCreateRequest` / `PetUpdateRequest`
 * 네이티브 앱(`puppynote-front-app/src/services/pet/PetService.ts`)과 같은 요청 형태를 씁니다.
 */
import { apiService } from '../ApiService'
import { unwrapApiResponse } from '../types'

/** 서버 `RoleType` enum. OWNER만 펫을 삭제할 수 있습니다. */
export type PetRoleType = 'OWNER' | 'MEMBER'

/** `GET /api/v1/pets` 항목. `petProfileUrl`은 CloudFront 전체 URL입니다. */
export interface PetSummary {
  petId: number
  petName: string
  petProfileUrl: string
  roleType: PetRoleType
}

/** `POST /api/v1/pets` 응답 */
export interface PetCreated {
  petId: number
  petName: string
}

export interface PetPayload {
  name: string
  /** `YYYY-MM-DD` */
  birthDate?: string | null
  /**
   * 업로드로 받은 **이미지 키**입니다 (전체 URL이 아닙니다).
   * {@link ../../../services/api/endpoints/storage.storageApi.uploadImage} 참고.
   */
  profileImage?: string | null
  registrationNumber?: string | null
}

export const petApi = {
  /** 내 펫 목록 */
  async getPets(): Promise<PetSummary[]> {
    const response = await apiService.get<PetSummary[]>('/api/v1/pets')
    return unwrapApiResponse(response, 200, '펫 목록 조회에 실패했습니다.')
  },

  /** 펫 등록. 서버가 201을 내려줍니다(200이 아님). */
  async registerPet(payload: PetPayload): Promise<PetCreated> {
    const response = await apiService.post<PetCreated>('/api/v1/pets', payload)
    return unwrapApiResponse(response, 201, '펫 등록에 실패했습니다.')
  },

  /** 펫 프로필 수정 */
  async updatePet(petId: number, payload: PetPayload): Promise<void> {
    const response = await apiService.patch<null>(`/api/v1/pets/${petId}`, payload)
    unwrapApiResponse(response, 200, '펫 프로필 수정에 실패했습니다.')
  },

  /** 펫 삭제 (OWNER만 가능). 산책·용품 등 연관 데이터가 함께 지워집니다. */
  async deletePet(petId: number): Promise<void> {
    const response = await apiService.delete<null>(`/api/v1/pets/${petId}`)
    unwrapApiResponse(response, 200, '펫 삭제에 실패했습니다.')
  },
}
