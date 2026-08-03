/**
 * 펫 목록 / 선택된 펫 컨텍스트. 네이티브 `src/context/PetContext.tsx` 이식.
 *
 * 선택된 펫은 홈뿐 아니라 산책·용품·가족 관리 등 여러 화면이 함께 보는 값이라 전역에 둡니다.
 * Provider는 {@link ./PetProvider}에 있습니다 (Fast Refresh를 위해 파일을 나눠 둡니다).
 *
 * 네이티브에 있는 `resetPetContext`(로그아웃 시 초기화)는 옮기지 않았습니다.
 * 웹에서는 Provider가 `ProtectedRoute` 안에 있어서, 로그아웃하면 언마운트되며 상태가 사라집니다.
 */
import { createContext, useContext } from 'react'

import type { PetSummary } from '@/services/api/endpoints/pet'

/** 화면에서 쓰는 최소 형태. 저장소에 넣는 값도 이것입니다. */
export interface SelectedPet {
  id: number
  name: string
}

export interface PetContextValue {
  /** 내가 볼 수 있는 펫 전체 (상단 펫 탭의 원본) */
  pets: PetSummary[]
  selectedPet: SelectedPet | null
  /** 첫 조회가 끝나기 전이면 true. 화면은 이 값이 false가 된 뒤에 데이터를 부릅니다. */
  isLoadingPet: boolean
  /** 선택 변경 + 저장소 반영. null이면 선택 해제 */
  updateSelectedPet: (pet: PetSummary | null) => Promise<void>
  /** 목록 재조회. 선택된 펫이 없고 목록이 있으면 첫 번째를 자동 선택합니다. */
  refreshPets: () => Promise<PetSummary[]>
}

export const PetContext = createContext<PetContextValue | null>(null)

export function usePet(): PetContextValue {
  const context = useContext(PetContext)
  if (!context) {
    throw new Error('usePet은 PetProvider 안에서만 쓸 수 있습니다.')
  }
  return context
}
