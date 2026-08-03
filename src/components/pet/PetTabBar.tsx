import { useState } from 'react'

import { CustomAlert, PetTab } from '@/components/common'
import { useAlert } from '@/hooks/useAlert'
import { petApi, type PetSummary } from '@/services/api/endpoints/pet'
import { toErrorMessage } from '@/services/api/types'
import { usePet } from '@/services/pet/PetContext'

import PetRegistrationModal from './PetRegistrationModal'

/**
 * 상단 펫 탭(연결 버전). 네이티브 `components/common/item/PetTab.tsx` 이식.
 *
 * 표시는 {@link ../common/PetTab}(순수 컴포넌트)이 하고, 여기서 펫 컨텍스트·등록 모달·
 * 삭제 확인 알럿을 붙입니다. 네이티브에서 `Layout showPetTab`이 하던 역할이라
 * 웹에서는 {@link ../../layouts/TabLayout}이 이 컴포넌트를 렌더링합니다.
 */
export default function PetTabBar() {
  const { pets, selectedPet, updateSelectedPet, refreshPets } = usePet()
  const { alert, showSimpleAlert, showConfirmAlert, hideAlert } = useAlert()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleSelect = (petId: number) => {
    if (selectedPet?.id === petId) return

    const selected = pets.find((pet) => pet.petId === petId)
    if (selected) void updateSelectedPet(selected)
  }

  const handleDelete = (pet: PetSummary) => {
    showConfirmAlert(
      '반려동물 삭제',
      `정말로 ${pet.petName}의 정보를 삭제하시겠습니까?\n삭제 시 모든 연관 데이터(산책, 용품 등)가 함께 삭제됩니다.`,
      () => {
        void (async () => {
          try {
            await petApi.deletePet(pet.petId)
            const updatedPets = await refreshPets()

            // 지운 펫이 보고 있던 펫이면 다른 펫으로 옮겨줍니다 (없으면 선택 해제).
            if (selectedPet?.id === pet.petId) {
              await updateSelectedPet(updatedPets[0] ?? null)
            }
            showSimpleAlert('성공', '반려동물 정보가 삭제되었습니다.')
          } catch (error) {
            showSimpleAlert('오류', toErrorMessage(error, '삭제 중 오류가 발생했습니다.'))
          }
        })()
      },
    )
  }

  const handleRegistered = (petId: number, petName: string) => {
    setIsModalOpen(false)

    void (async () => {
      const updatedPets = await refreshPets()
      const registered = updatedPets.find((pet) => pet.petId === petId)
      // 목록 재조회가 실패한 경우에도 방금 등록한 펫은 선택되도록 최소 정보로 채웁니다.
      await updateSelectedPet(
        registered ?? { petId, petName, petProfileUrl: '', roleType: 'OWNER' },
      )
    })()
  }

  return (
    <>
      <PetTab
        pets={pets}
        selectedPetId={selectedPet?.id ?? null}
        onSelect={handleSelect}
        onAdd={() => setIsModalOpen(true)}
        onDelete={handleDelete}
      />

      <PetRegistrationModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleRegistered}
      />

      <CustomAlert alert={alert} onClose={hideAlert} />
    </>
  )
}
