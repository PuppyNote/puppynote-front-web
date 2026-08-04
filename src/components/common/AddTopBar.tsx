import type { ReactNode } from 'react'

import { cn } from '@/utils/cn'

export interface AddTopBarProps {
  title: string
  onBack: () => void
  /** 오른쪽 끝에 저장 버튼 등을 두고 싶을 때 */
  right?: ReactNode
  className?: string
}

/**
 * 등록/추가 화면 전용 상단 바. 네이티브 `components/common/item/AddTopBar.tsx` 이식.
 *
 * {@link ./../../layouts/TopBar}와 달리 뒤로가기 버튼 고정이고 앱 아이콘이 없습니다.
 * 이 화면들은 {@link ../../layouts/PlainLayout} 아래에서 쓰이는데, 그 레이아웃이 이미
 * `pt-safe`를 주고 있어서 여기서는 네이티브의 `insets.top + 8` 중 `+8`만 더합니다.
 */
export default function AddTopBar({ title, onBack, right, className }: AddTopBarProps) {
  return (
    <header className={cn('shrink-0 bg-brand-bg px-2xl pt-sm pb-lg', className)}>
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-md">
          <button
            type="button"
            onClick={onBack}
            aria-label="뒤로 가기"
            className="-ml-1 p-xs text-[28px] leading-none font-light text-ink-900"
          >
            <span aria-hidden>←</span>
          </button>
          <h1 className="truncate text-title font-bold text-ink-900">{title}</h1>
        </div>

        {right}
      </div>
    </header>
  )
}
