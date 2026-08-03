/**
 * 알림 모달 상태 훅. 네이티브 `src/hooks/useAlert.ts` 이식.
 *
 * 웹의 `window.alert()`는 웹뷰에서 OS 기본 다이얼로그가 떠 앱 UI와 이질감이 크므로
 * 네이티브와 동일하게 자체 모달({@link ../components/common/modal/CustomAlert})을 씁니다.
 */
import { useCallback, useState } from 'react'

export interface AlertOptions {
  title: string
  message: string
  /** 확인 버튼 문구 (기본 '확인') */
  confirmText?: string
  /** 넘기지 않으면 취소 버튼 자체가 나오지 않습니다 (네이티브와 동일) */
  cancelText?: string
  onConfirm?: () => void
  onCancel?: () => void
}

export interface AlertState extends AlertOptions {
  visible: boolean
}

const CLOSED: AlertState = { visible: false, title: '', message: '' }

export function useAlert() {
  const [alert, setAlert] = useState<AlertState>(CLOSED)

  const hideAlert = useCallback(() => {
    setAlert((prev) => ({ ...prev, visible: false }))
  }, [])

  const showAlert = useCallback((options: AlertOptions) => {
    setAlert({ ...options, visible: true })
  }, [])

  /** 확인 버튼 하나짜리 알림 */
  const showSimpleAlert = useCallback((title: string, message: string, onConfirm?: () => void) => {
    setAlert({ visible: true, title, message, onConfirm })
  }, [])

  /** 확인/취소 두 개짜리 알림 */
  const showConfirmAlert = useCallback(
    (
      title: string,
      message: string,
      onConfirm: () => void,
      onCancel?: () => void,
      confirmText = '확인',
      cancelText = '취소',
    ) => {
      setAlert({ visible: true, title, message, confirmText, cancelText, onConfirm, onCancel })
    },
    [],
  )

  return { alert, showAlert, showSimpleAlert, showConfirmAlert, hideAlert }
}
