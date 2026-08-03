/**
 * 인증 실패를 사용자에게 보여줄 한 문장으로 바꿉니다.
 *
 * 서버는 "다른 방식으로 이미 가입된 계정"일 때 `message`에 **SnsType 이름만** 내려줍니다
 * (`SnsType.checkSnsType()` → `PuppyNoteException(type.name())` → 400). 즉 `"KAKAO"` 같은
 * 코드성 문자열이 그대로 오므로 화면에 띄우기 전에 문장으로 바꿔줘야 합니다.
 * 네이티브도 `error.message === 'KAKAO'`로 같은 분기를 하고 있습니다.
 */
import { BridgeError, BridgeErrorCode } from '@/bridge'
import { toErrorMessage } from '@/services/api/types'

const SNS_CONFLICT_MESSAGES: Record<string, string> = {
  NORMAL: '일반 회원가입이 되어있는 계정입니다.',
  KAKAO: '카카오로 이미 가입된 계정입니다.',
  GOOGLE: '구글로 이미 가입된 계정입니다.',
  APPLE: '애플로 이미 가입된 계정입니다.',
}

export interface AuthErrorNotice {
  title: '알림' | '오류'
  message: string
}

/**
 * @returns 사용자에게 보여줄 알림. **null이면 아무것도 띄우면 안 되는 흐름**(사용자가 직접 취소)입니다.
 */
export function toAuthErrorNotice(error: unknown, fallback: string): AuthErrorNotice | null {
  if (error instanceof BridgeError) {
    switch (error.code) {
      case BridgeErrorCode.USER_CANCELLED:
        // 사용자가 SNS 로그인 창을 닫은 정상 흐름이라 조용히 넘어갑니다.
        return null
      case BridgeErrorCode.NO_BRIDGE:
        return { title: '알림', message: '앱에서만 이용할 수 있는 기능입니다.' }
      case BridgeErrorCode.UNSUPPORTED_ACTION:
        return { title: '알림', message: '앱을 최신 버전으로 업데이트한 뒤 다시 시도해주세요.' }
      default:
        return { title: '오류', message: fallback }
    }
  }

  const message = toErrorMessage(error, fallback)
  const conflict = SNS_CONFLICT_MESSAGES[message]
  if (conflict) return { title: '알림', message: conflict }

  return { title: '오류', message }
}
