import type { PetSummary } from '@/services/api/endpoints/pet'

import ScrollableTab, { type ScrollableTabItem } from './ScrollableTab'

/** 펫 요약 정보의 정본은 엔드포인트 모듈에 있습니다. 편의를 위해 여기서도 다시 내보냅니다. */
export type { PetSummary }

export interface PetTabProps {
  pets: PetSummary[]
  selectedPetId: number | null | undefined
  onSelect: (petId: number) => void
  /** 펫 등록 모달을 여는 콜백. 없으면 `+` 버튼이 나오지 않습니다. */
  onAdd?: () => void
  /** 삭제 확인 흐름은 호출부가 담당합니다 ({@link ../pet/PetTabBar}의 확인 알럿). */
  onDelete?: (pet: PetSummary) => void
  className?: string
}

/**
 * 네이티브 `components/common/item/PetTab.tsx` 이식.
 *
 * 네이티브 원본은 PetContext에서 목록을 직접 읽고 등록 모달/확인 알럿까지 안고 있지만,
 * 웹에서는 **표시 전용**으로 분리했습니다. 데이터·모달을 붙인 버전은
 * {@link ../pet/PetTabBar}이고, 화면은 그쪽을 씁니다.
 */
export default function PetTab({
  pets,
  selectedPetId,
  onSelect,
  onAdd,
  onDelete,
  className,
}: PetTabProps) {
  const tabs: ScrollableTabItem[] = pets.map((pet) => ({
    id: pet.petId,
    label: pet.petName,
    onDelete: onDelete && pet.roleType === 'OWNER' ? () => onDelete(pet) : undefined,
  }))

  return (
    <ScrollableTab
      tabs={tabs}
      activeTabId={selectedPetId ?? null}
      onTabPress={(id) => onSelect(Number(id))}
      onAdd={onAdd}
      addLabel="반려동물 등록"
      className={className ?? 'border-b border-ink-100'}
    />
  )
}
