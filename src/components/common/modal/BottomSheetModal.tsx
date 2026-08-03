import { type ReactNode, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { useHardwareBack } from '@/hooks/useHardwareBack'
import { cn } from '@/utils/cn'

export interface BottomSheetModalProps {
  open: boolean
  onClose: () => void
  title?: string
  /** 헤더 오른쪽 닫기 텍스트. null이면 숨깁니다. */
  closeLabel?: string | null
  children: ReactNode
  /** 시트 맨 아래 고정 영역 (확인 버튼 등) */
  footer?: ReactNode
  /** 딤 영역을 눌러도 닫히지 않게 하려면 false */
  closeOnBackdrop?: boolean
  className?: string
}

/**
 * 아래에서 올라오는 시트 모달의 공통 껍데기.
 *
 * 네이티브는 화면마다 RN `Modal`을 직접 열고 딤/시트 스타일을 각자 복사해 쓰고 있었습니다
 * (딤은 12곳이 전부 `rgba(0,0,0,0.5)`로 동일). 웹에서는 그 공통 부분을 여기로 모읍니다.
 *
 * 닫히는 경로 3가지: 딤 클릭 / Esc / Android 하드웨어 뒤로가기.
 * 하드웨어 뒤로가기 핸들러는 반드시 **동기적으로** true를 반환해야 앱이 자체 뒤로가기로
 * 폴백하지 않습니다. ({@link useHardwareBack} 주석 참고)
 */
export default function BottomSheetModal({
  open,
  onClose,
  title,
  closeLabel = '취소',
  children,
  footer,
  closeOnBackdrop = true,
  className,
}: BottomSheetModalProps) {
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

    // 시트가 열리면 포커스를 안으로 옮겨 키보드 조작이 뒤쪽 화면으로 새지 않게 합니다.
    sheetRef.current?.focus()

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="animate-fade-in fixed inset-0 z-100 flex items-end justify-center bg-dim"
      onClick={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal
        aria-label={title}
        tabIndex={-1}
        className={cn(
          'animate-slide-up w-full max-w-[var(--app-max-width)] rounded-t-2xl bg-white p-2xl outline-none',
          'pb-[calc(var(--spacing-4xl)+var(--safe-bottom))] shadow-modal',
          className,
        )}
      >
        {(title || closeLabel) && (
          <div className="mb-2xl flex items-center justify-between">
            <h2 className="text-title-sm font-bold text-ink-900">{title}</h2>
            {closeLabel && (
              <button type="button" onClick={onClose} className="text-body-lg text-ink-500">
                {closeLabel}
              </button>
            )}
          </div>
        )}

        {children}

        {footer}
      </div>
    </div>,
    document.body,
  )
}
