import { useState } from 'react'

import { BottomSheetModal, PickerConfirmButton, WheelPicker } from '@/components/common'
import type { UserCategoryResponse } from '@/services/api/endpoints/userItemCategory'

export interface UserCategoryPickerModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (category: UserCategoryResponse) => void
  userCategories: UserCategoryResponse[]
  initialCategory?: string
}

const toLabel = (category: UserCategoryResponse) => `${category.categoryEmoji} ${category.categoryName}`

/**
 * 용품 카테고리 선택 모달. 네이티브 `components/supply/modal/UserCategoryPickerModal.tsx` 이식.
 * 사용자가 등록해 둔 카테고리(=상단 탭에 뜨는 것들) 중에서만 고를 수 있습니다.
 */
export default function UserCategoryPickerModal({
  open,
  onClose,
  onConfirm,
  userCategories,
  initialCategory,
}: UserCategoryPickerModalProps) {
  return (
    <BottomSheetModal open={open} onClose={onClose} title="카테고리 선택">
      {open && userCategories.length > 0 && (
        <CategoryBody
          userCategories={userCategories}
          initialCategory={initialCategory}
          onConfirm={(category) => {
            onConfirm(category)
            onClose()
          }}
        />
      )}
    </BottomSheetModal>
  )
}

interface CategoryBodyProps {
  userCategories: UserCategoryResponse[]
  initialCategory?: string
  onConfirm: (category: UserCategoryResponse) => void
}

function CategoryBody({ userCategories, initialCategory, onConfirm }: CategoryBodyProps) {
  const labels = userCategories.map(toLabel)
  const [value, setValue] = useState(() => {
    const found = userCategories.find((category) => category.category === initialCategory)
    return found ? toLabel(found) : labels[0]
  })

  return (
    <>
      <div className="relative mb-2xl flex items-center justify-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-[10%] top-1/2 h-[50px] -translate-y-1/2 rounded-md bg-brand-10"
        />
        <WheelPicker items={labels} value={value} onChange={setValue} width={250} label="카테고리" />
      </div>

      <PickerConfirmButton
        onClick={() => {
          const category = userCategories[labels.indexOf(value)]
          if (category) onConfirm(category)
        }}
      />
    </>
  )
}
