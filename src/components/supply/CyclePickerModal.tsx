import { useMemo, useState } from 'react'

import { BottomSheetModal, PickerConfirmButton, WheelPicker } from '@/components/common'

export interface CyclePickerModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (days: number) => void
  initialDays?: number
}

const MAX_DAYS = 365

/**
 * 구매 주기 선택 모달. 네이티브 `components/supply/modal/CyclePickerModal.tsx` 이식.
 * 1~365일 중 하나를 고르는 휠피커 + 확인 버튼. {@link ../common/modal/TimePickerModal}과 같은 구조입니다.
 */
export default function CyclePickerModal({
  open,
  onClose,
  onConfirm,
  initialDays = 30,
}: CyclePickerModalProps) {
  return (
    <BottomSheetModal open={open} onClose={onClose} title="구매 주기 설정">
      {open && (
        <CycleBody
          initialDays={initialDays}
          onConfirm={(days) => {
            onConfirm(days)
            onClose()
          }}
        />
      )}
    </BottomSheetModal>
  )
}

interface CycleBodyProps {
  initialDays: number
  onConfirm: (days: number) => void
}

function CycleBody({ initialDays, onConfirm }: CycleBodyProps) {
  const days = useMemo(() => Array.from({ length: MAX_DAYS }, (_, index) => String(index + 1)), [])
  const [value, setValue] = useState(() => {
    const clamped = String(Math.min(Math.max(initialDays, 1), MAX_DAYS))
    return days.includes(clamped) ? clamped : '30'
  })

  return (
    <>
      <div className="relative mb-2xl flex items-center justify-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-[15%] top-1/2 h-[50px] -translate-y-1/2 rounded-md bg-brand-10"
        />
        <WheelPicker items={days} value={value} onChange={setValue} width={100} label="일" />
        <span className="ml-md text-body-lg font-medium text-ink-600">일 마다</span>
      </div>

      <PickerConfirmButton onClick={() => onConfirm(Number(value))} />
    </>
  )
}
