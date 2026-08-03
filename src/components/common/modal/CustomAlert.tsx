import { createPortal } from 'react-dom'
import { useEffect } from 'react'

import type { AlertState } from '@/hooks/useAlert'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { useHardwareBack } from '@/hooks/useHardwareBack'

export interface CustomAlertProps {
  /** {@link useAlert}가 돌려주는 상태를 그대로 넘기세요. */
  alert: AlertState
  /** 모달을 닫는 함수 (useAlert의 hideAlert) */
  onClose: () => void
}

/**
 * 가운데에 뜨는 알림 모달. 네이티브 `components/common/modal/CustomAlert.tsx` 이식.
 *
 * 딤은 네이티브 그대로 `rgba(0,0,0,0.4)`입니다. 다른 모달(BottomSheetModal 등)이 쓰는
 * `--color-dim`은 0.5라 토큰을 쓰지 않고 여기서만 직접 지정합니다.
 *
 * 네이티브 CustomAlert에는 `type: 'success' | 'error' | 'info'` prop이 있지만 렌더링에
 * 전혀 쓰이지 않는 죽은 값이라 웹으로 옮기지 않았습니다.
 */
export default function CustomAlert({ alert, onClose }: CustomAlertProps) {
  const { visible, title, message, confirmText = '확인', cancelText, onConfirm, onCancel } = alert

  useBodyScrollLock(visible)

  // 하드웨어 뒤로가기는 취소와 같게 취급합니다 (취소 버튼이 없으면 그냥 닫기).
  useHardwareBack(() => {
    onCancel?.()
    onClose()
    return true
  }, visible)

  useEffect(() => {
    if (!visible) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      onCancel?.()
      onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [visible, onCancel, onClose])

  if (!visible) return null

  const handleConfirm = () => {
    onConfirm?.()
    onClose()
  }

  const handleCancel = () => {
    onCancel?.()
    onClose()
  }

  return createPortal(
    <div className="animate-fade-in fixed inset-0 z-100 flex items-center justify-center bg-black/40">
      <div
        role="alertdialog"
        aria-modal
        aria-label={title}
        className="w-[min(80vw,calc(var(--app-max-width)*0.8))] overflow-hidden rounded-2xl bg-white shadow-modal"
      >
        <div className="flex flex-col items-center p-2xl">
          <h2 className="mb-md text-center text-title-sm font-bold text-ink-900">{title}</h2>
          <p className="text-center text-body text-ink-500">{message}</p>
        </div>

        <div className="flex border-t border-ink-100">
          {cancelText && (
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 bg-white py-lg text-[15px] font-semibold text-ink-500"
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            onClick={handleConfirm}
            autoFocus
            className="flex-1 bg-brand py-lg text-[15px] font-bold text-ink-900"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
