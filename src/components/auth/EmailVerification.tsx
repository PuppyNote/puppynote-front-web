import { useEffect, useState } from 'react'

import { Spinner } from '@/components/common'
import { toErrorMessage } from '@/services/api/types'

import { AuthField, AuthInput } from './AuthField'

/** 서버 인증번호 유효시간과 같은 3분 */
const VERIFICATION_SECONDS = 180
/** 발송 버튼 연타 방지 (네이티브와 동일) */
const RESEND_COOLDOWN_MS = 2000

export interface EmailVerificationProps {
  email: string
  onEmailChange: (value: string) => void
  /**
   * 인증번호 발송 API. **서버가 인증번호 문자열을 그대로 응답으로 내려주고**, 대조는 이 컴포넌트가
   * 합니다. 서버에 검증 엔드포인트가 없어 네이티브도 같은 방식이라 우선 동일하게 맞췄습니다.
   * (웹은 개발자도구로 응답이 그대로 보이므로 서버 검증 API가 생기면 이 자리를 그쪽으로 바꿔야 합니다.)
   */
  requestCode: (email: string) => Promise<string>
  /** 인증 완료 여부. 완료되면 이메일 입력이 잠깁니다(네이티브와 동일). */
  verified: boolean
  onVerified: () => void
  /** 제출 시 미인증 상태로 걸렸을 때 이메일 칸을 빨갛게 */
  invalid?: boolean
  /** 알림 모달 띄우기 (useAlert의 showSimpleAlert) */
  notify: (title: string, message: string) => void
}

/**
 * 이메일 + 인증번호 입력 묶음.
 * 회원가입/비밀번호 재설정 두 화면이 발송 API만 다르고 나머지가 완전히 같아서 하나로 묶었습니다.
 * (네이티브는 두 화면에 같은 코드가 복사되어 있습니다.)
 */
export default function EmailVerification({
  email,
  onEmailChange,
  requestCode,
  verified,
  onVerified,
  invalid = false,
  notify,
}: EmailVerificationProps) {
  const [sent, setSent] = useState(false)
  const [code, setCode] = useState('')
  const [issuedCode, setIssuedCode] = useState('')
  /** 남은 유효시간(초). 0이면 멈춘 상태라 별도 실행 플래그를 두지 않습니다. */
  const [remaining, setRemaining] = useState(0)
  const [sending, setSending] = useState(false)
  const [cooldown, setCooldown] = useState(false)

  // 1초에 한 칸씩 내려가는 타이머. 0이 되거나 인증이 끝나면 자연히 멈춥니다.
  useEffect(() => {
    if (remaining <= 0 || verified) return
    const id = setTimeout(() => setRemaining((prev) => prev - 1), 1000)
    return () => clearTimeout(id)
  }, [remaining, verified])

  useEffect(() => {
    if (!cooldown) return
    const id = setTimeout(() => setCooldown(false), RESEND_COOLDOWN_MS)
    return () => clearTimeout(id)
  }, [cooldown])

  const handleSend = async () => {
    const trimmed = email.trim()
    if (!trimmed) {
      notify('알림', '이메일 주소를 입력해주세요.')
      return
    }
    if (sending || cooldown || verified) return

    setSending(true)
    try {
      const issued = await requestCode(trimmed)
      setIssuedCode(issued)
      setCode('')
      setSent(true)
      setRemaining(VERIFICATION_SECONDS)
      notify('알림', '인증번호가 발송되었습니다.')
    } catch (error) {
      notify('오류', toErrorMessage(error, '인증번호 발송에 실패했습니다.'))
    } finally {
      setSending(false)
      setCooldown(true)
    }
  }

  const handleVerify = () => {
    if (remaining === 0) {
      notify('오류', '인증 시간이 만료되었습니다. 다시 시도해주세요.')
      return
    }
    if (!code) {
      notify('알림', '인증번호를 입력해주세요.')
      return
    }

    if (code.trim() === issuedCode.trim()) {
      onVerified()
      return
    }

    notify('오류', '인증번호가 일치하지 않습니다.')
  }

  return (
    <AuthField label="이메일 주소">
      <div className="flex items-center gap-sm">
        <AuthInput
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="example@email.com"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          disabled={verified}
          invalid={invalid && !verified}
          className="flex-1"
        />
        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={verified || cooldown || sending}
          className={[
            'flex h-[52px] min-w-20 shrink-0 items-center justify-center rounded-lg px-lg',
            'text-caption font-bold text-white',
            verified || cooldown || sending ? 'bg-ink-200' : 'bg-ink-900',
          ].join(' ')}
        >
          {sending ? (
            <Spinner className="size-4" style={{ color: 'white' }} />
          ) : (
            <span>{verified ? '인증완료' : '인증하기'}</span>
          )}
        </button>
      </div>

      {sent && !verified && (
        <div className="mt-md">
          <div className="flex items-center gap-sm">
            <AuthInput
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="인증번호 6자리 입력"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
              className="flex-1"
            />
            <button
              type="button"
              onClick={handleVerify}
              className="shrink-0 rounded-lg bg-ink-500 px-xl py-lg text-caption font-bold text-white"
            >
              확인
            </button>
          </div>

          <div className="mt-[6px] flex items-center justify-between px-xs">
            <span className="text-[11px] text-ink-400">
              이메일로 전송된 인증번호를 입력해주세요.
            </span>
            <span className="text-caption font-semibold text-error">{formatTime(remaining)}</span>
          </div>
        </div>
      )}

      {verified && (
        <div className="mt-sm px-xs">
          <span className="text-caption font-semibold text-success-alt">
            ✓ 이메일 인증이 완료되었습니다.
          </span>
        </div>
      )}
    </AuthField>
  )
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${minutes}:${rest < 10 ? '0' : ''}${rest}`
}
