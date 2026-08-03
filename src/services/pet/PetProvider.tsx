import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'

import { petApi, type PetSummary } from '@/services/api/endpoints/pet'
import { useAuth } from '@/services/auth/AuthContext'

import { PetContext, type SelectedPet } from './PetContext'
import { loadSelectedPet, saveSelectedPet, clearSelectedPet } from './selectedPetStorage'

export interface PetProviderProps {
  children: ReactNode
}

/**
 * 펫 목록과 선택 상태를 들고 있는 Provider. 네이티브 `PetProvider` 이식.
 *
 * 진입 시 목록을 조회하고, 저장소에 남아 있던 펫이 아직 목록에 있으면 그 펫을,
 * 없으면 첫 번째 펫을 선택합니다. 펫이 하나도 없으면 선택 없이 둡니다
 * (홈은 '아직 등록된 아이가 없어요' 카드를, 하단 탭은 산책/용품 비활성을 그리게 됩니다).
 *
 * 네이티브는 SecureStore 토큰 유무로 로그인 여부를 확인하지만, 웹에서는 이 Provider가
 * `ProtectedRoute` 안에 있으므로 {@link useAuth}의 상태를 그대로 씁니다.
 */
export default function PetProvider({ children }: PetProviderProps) {
  const { status } = useAuth()
  const [pets, setPets] = useState<PetSummary[]>([])
  const [selectedPet, setSelectedPet] = useState<SelectedPet | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // 로그인 확인 중이거나 첫 조회가 아직인 동안이 '로딩'입니다.
  // 비로그인 상태에서는 조회할 것이 없으므로 곧바로 false가 됩니다.
  const isLoadingPet = status === 'loading' || (status === 'authenticated' && !isLoaded)

  const fetchPets = useCallback(async (): Promise<PetSummary[]> => {
    try {
      const data = await petApi.getPets()
      setPets(data)
      return data
    } catch {
      // 목록 조회 실패는 화면을 막지 않습니다 (펫 없음과 같게 취급).
      return []
    }
  }, [])

  const updateSelectedPet = useCallback(async (pet: PetSummary | null) => {
    if (!pet) {
      setSelectedPet(null)
      await clearSelectedPet()
      return
    }
    setSelectedPet({ id: pet.petId, name: pet.petName })
    await saveSelectedPet(pet.petId, pet.petName)
  }, [])

  // 진입 시 1회: 목록 조회 + 저장된 선택 복원
  useEffect(() => {
    // 아직 세션 확인 중이거나 로그인 상태가 아니면 조회할 것이 없습니다.
    if (status !== 'authenticated') return

    let cancelled = false

    void (async () => {
      try {
        const [fetchedPets, savedPet] = await Promise.all([fetchPets(), loadSelectedPet()])
        if (cancelled) return

        if (savedPet && fetchedPets.some((pet) => pet.petId === savedPet.id)) {
          setSelectedPet(savedPet)
        } else if (fetchedPets.length > 0) {
          await updateSelectedPet(fetchedPets[0])
        }
      } finally {
        if (!cancelled) setIsLoaded(true)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [status, fetchPets, updateSelectedPet])

  const refreshPets = useCallback(async () => {
    const fetchedPets = await fetchPets()

    // 선택된 펫이 없는데 목록이 생겼다면(첫 등록 직후 등) 첫 번째를 자동으로 선택합니다.
    if (fetchedPets.length > 0 && !selectedPet) {
      await updateSelectedPet(fetchedPets[0])
    }

    return fetchedPets
  }, [fetchPets, selectedPet, updateSelectedPet])

  const value = useMemo(
    () => ({ pets, selectedPet, isLoadingPet, updateSelectedPet, refreshPets }),
    [pets, selectedPet, isLoadingPet, updateSelectedPet, refreshPets],
  )

  return <PetContext.Provider value={value}>{children}</PetContext.Provider>
}
