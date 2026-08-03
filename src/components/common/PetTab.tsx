import ScrollableTab, { type ScrollableTabItem } from './ScrollableTab'

/**
 * 펫 요약 정보.
 *
 * 네이티브 `services/pet/PetService.ts`의 `PetSummary`와 필드명을 맞춘 것입니다.
 * 웹 쪽 PetService/PetContext는 아직 없으므로 여기서는 타입만 두고, 실제 조회·선택 상태는
 * 후속 티켓에서 컨텍스트로 올립니다.
 */
export interface PetSummary {
  petId: number
  petName: string
  petProfileUrl?: string
  /** 'OWNER'인 펫만 삭제 버튼이 노출됩니다. */
  roleType: string
}

export interface PetTabProps {
  pets: PetSummary[]
  selectedPetId: number | null | undefined
  onSelect: (petId: number) => void
  /** 펫 등록 모달을 여는 콜백. 없으면 `+` 버튼이 나오지 않습니다. */
  onAdd?: () => void
  /** 삭제 확인 흐름은 호출부(또는 후속 티켓의 CustomAlert)가 담당합니다. */
  onDelete?: (pet: PetSummary) => void
  className?: string
}

/**
 * 네이티브 `components/common/item/PetTab.tsx` 이식.
 *
 * 네이티브 원본은 PetContext에서 목록을 직접 읽고 등록 모달/확인 알럿까지 안고 있었지만,
 * 웹에서는 **표시 전용**으로 분리했습니다. 데이터·모달은 아직 이 프로젝트에 없고,
 * 이렇게 두면 화면 티켓에서 그대로 재사용할 수 있습니다.
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
