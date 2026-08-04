import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'

import { CustomAlert, Spinner } from '@/components/common'
import { useAlert } from '@/hooks/useAlert'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { useHardwareBack } from '@/hooks/useHardwareBack'
import { userApi } from '@/services/api/endpoints/user'
import { toErrorMessage } from '@/services/api/types'
import { useAuth } from '@/services/auth/AuthContext'
import { ROUTES } from '@/routes/paths'
import { cn } from '@/utils/cn'

export interface WithdrawalModalProps {
  open: boolean
  onClose: () => void
}

const COUNTDOWN_SECONDS = 5

/**
 * 회원탈퇴 확인 모달. 네이티브 `components/setting/modal/WithdrawalModal.tsx` 이식.
 * 실수 방지용으로 {@link COUNTDOWN_SECONDS}초 동안 탈퇴 버튼이 비활성화됩니다.
 */
export default function WithdrawalModal({ open, onClose }: WithdrawalModalProps) {
  useBodyScrollLock(open)
  useHardwareBack(() => {
    onClose()
    return true
  }, open)

  if (!open) return null

  return createPortal(
    <div className="animate-fade-in fixed inset-0 z-100 flex items-center justify-center bg-dim p-xl">
      {/* 열릴 때마다 새로 마운트해서 카운트다운을 초기값으로만 읽습니다 (DatePickerModal과 동일 트릭). */}
      <WithdrawalDialog onClose={onClose} />
    </div>,
    document.body,
  )
}

interface WithdrawalDialogProps {
  onClose: () => void
}

function WithdrawalDialog({ onClose }: WithdrawalDialogProps) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { alert, showSimpleAlert, hideAlert } = useAlert()
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [])

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await userApi.withdraw()
      logout()
      navigate(ROUTES.LOGIN, { replace: true })
    } catch (error) {
      showSimpleAlert('오류', toErrorMessage(error, '회원탈퇴 중 오류가 발생했습니다.'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      role="alertdialog"
      aria-modal
      aria-label="회원 탈퇴"
      className="w-full max-w-[400px] rounded-2xl bg-white p-2xl"
    >
      <h2 className="mb-lg text-center text-title font-bold text-ink-900">회원 탈퇴</h2>
      <p className="mb-sm text-center text-body-lg font-bold text-error">
        회원탈퇴할 경우 복구할 수 없습니다.
      </p>
      <p className="mb-2xl text-center text-body text-ink-500">
        정말 탈퇴하시겠습니까? 모든 정보가 영구적으로 삭제됩니다.
      </p>

      <div className="flex gap-md">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="flex-1 rounded-full bg-ink-100 py-3.5 font-bold text-ink-600"
        >
          취소
        </button>
        <button
          type="button"
          onClick={() => void handleConfirm()}
          disabled={countdown > 0 || isLoading}
          className={cn(
            'flex flex-1 items-center justify-center rounded-full py-3.5 font-bold text-white',
            countdown > 0 || isLoading ? 'bg-ink-300' : 'bg-error shadow-[0_4px_8px_rgba(239,68,68,0.2)]',
          )}
        >
          {isLoading ? (
            <Spinner className="size-6 text-white" />
          ) : (
            <span>탈퇴하기{countdown > 0 ? ` (${countdown})` : ''}</span>
          )}
        </button>
      </div>

      <CustomAlert alert={alert} onClose={hideAlert} />
    </div>
  )
}
