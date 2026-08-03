/**
 * 모달/바텀시트가 열려 있는 동안 뒤쪽 본문 스크롤을 막습니다.
 *
 * 여러 모달이 겹칠 수 있으므로 참조 카운트로 관리하고, 마지막 하나가 닫힐 때만 복원합니다.
 */
import { useEffect } from 'react'

let lockCount = 0
let previousOverflow = ''

export function useBodyScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return

    if (lockCount === 0) {
      previousOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    }
    lockCount += 1

    return () => {
      lockCount -= 1
      if (lockCount === 0) {
        document.body.style.overflow = previousOverflow
      }
    }
  }, [active])
}
