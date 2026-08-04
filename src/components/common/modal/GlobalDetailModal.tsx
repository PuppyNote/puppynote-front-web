import { type ReactNode, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { useHardwareBack } from '@/hooks/useHardwareBack'
import { cn } from '@/utils/cn'

export interface GlobalDetailModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  /** 시트 높이 (CSS 값). 기본 네이티브와 동일한 `85%` (뷰포트 기준) */
  height?: string
  backgroundColor?: string
  className?: string
}

/**
 * 고정 높이 바텀시트. 네이티브 `components/common/modal/GlobalDetailModal.tsx` 이식.
 * 산책 상세 / 알람 관리 등 "화면 대부분을 덮는 상세 시트"에 씁니다.
 *
 * {@link ./BottomSheetModal}과 달리 높이가 내용에 맞춰 늘어나지 않고 고정입니다
 * (그 안의 목록/스크롤 영역이 남은 높이를 꽉 채워야 하는 화면들이라서입니다).
 * 네이티브의 드래그해서 닫기 제스처는 옮기지 않았습니다 — 이 프로젝트의 다른 모달들도
 * 딤 클릭 / Esc / 하드웨어 뒤로가기 세 경로만 지원합니다({@link ./BottomSheetModal} 참고).
 */
export default function GlobalDetailModal({
  open,
  onClose,
  title,
  children,
  height = '85%',
  backgroundColor,
  className,
}: GlobalDetailModalProps) {
  const sheetRef = useRef<HTMLDivElement>(null)

  useBodyScrollLock(open)

  useHardwareBack(() => {
    onClose()
    return true
  }, open)

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)

    sheetRef.current?.focus()

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="animate-fade-in fixed inset-0 z-100 flex items-end justify-center bg-dim"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal
        aria-label={title}
        tabIndex={-1}
        style={{ height, backgroundColor }}
        className={cn(
          'animate-slide-up flex w-full max-w-[var(--app-max-width)] flex-col rounded-t-4xl bg-brand-bg px-2xl pt-md outline-none',
          className,
        )}
      >
        <span aria-hidden className="mx-auto mb-lg h-1 w-10 shrink-0 rounded-full bg-ink-200" />

        <div className="mb-xl flex shrink-0 items-center justify-between">
          <h2 className="text-title-sm font-bold text-ink-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-body-lg font-semibold text-ink-500"
          >
            닫기
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pb-[calc(var(--spacing-2xl)+var(--safe-bottom))]">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  )
}
