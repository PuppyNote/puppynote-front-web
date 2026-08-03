import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import {
  AuthField,
  AuthHeader,
  AuthInput,
  AuthSubmitButton,
  EmailVerification,
} from '@/components/auth'
import { CustomAlert } from '@/components/common'
import { useAlert } from '@/hooks/useAlert'
import { ROUTES } from '@/routes/paths'
import { authApi } from '@/services/api/endpoints/auth'
import { toErrorMessage } from '@/services/api/types'

/** 서버 `SignUpRequest`의 제약과 같은 값 */
const MIN_PASSWORD_LENGTH = 8
const MAX_NICKNAME_LENGTH = 20

/**
 * 회원가입 화면. 네이티브 `src/screens/login/RegisterScreen.tsx` 이식.
 *
 * 이메일 인증은 서버가 인증번호를 응답으로 내려주고 클라이언트가 대조하는 구조입니다
 * ({@link ../components/auth/EmailVerification} 주석 참고).
 */
export default function RegisterPage() {
  const navigate = useNavigate()
  const { alert, showSimpleAlert, hideAlert } = useAlert()

  const [email, setEmail] = useState('')
  const [emailVerified, setEmailVerified] = useState(false)
  const [nickName, setNickName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [errors, setErrors] = useState({
    email: false,
    nickName: false,
    password: false,
    confirmPassword: false,
  })
  const [passwordMismatch, setPasswordMismatch] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return

    const nextErrors = {
      email: !emailVerified,
      nickName: !nickName,
      password: !password,
      confirmPassword: !confirmPassword,
    }
    setErrors(nextErrors)

    const mismatch = password !== confirmPassword
    setPasswordMismatch(mismatch)

    if (nextErrors.email) {
      showSimpleAlert('알림', '이메일 인증을 완료해주세요.')
      return
    }
    if (nextErrors.nickName || nextErrors.password || nextErrors.confirmPassword) {
      showSimpleAlert('알림', '모든 필드를 입력해주세요.')
      return
    }
    if (mismatch) return

    // 서버(SignUpRequest)도 같은 규칙을 검사하지만, 왕복 한 번을 줄이려고 여기서 먼저 봅니다.
    if (password.length < MIN_PASSWORD_LENGTH) {
      setErrors((prev) => ({ ...prev, password: true }))
      showSimpleAlert('알림', '비밀번호는 최소 8자 이상이어야 합니다.')
      return
    }

    void submit()
  }

  const submit = async () => {
    setSubmitting(true)
    try {
      await authApi.signUp({ email: email.trim(), nickName: nickName.trim(), password })
      showSimpleAlert('성공', '회원가입이 완료되었습니다.', () => {
        void navigate(ROUTES.LOGIN, { replace: true })
      })
    } catch (error) {
      showSimpleAlert('오류', toErrorMessage(error, '회원가입에 실패했습니다.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex flex-col items-center px-3xl pt-16 pb-3xl">
        <AuthHeader
          title="회원가입"
          subtitle="퍼피노트와 함께 반려견의 일상을 기록하세요"
          className="mb-12"
        />

        <form onSubmit={handleSubmit} className="w-full max-w-[384px]">
          <div className="mb-3xl flex flex-col gap-xl">
            <EmailVerification
              email={email}
              onEmailChange={(value) => {
                setEmail(value)
                if (errors.email) setErrors((prev) => ({ ...prev, email: false }))
              }}
              requestCode={authApi.sendSignUpCode}
              verified={emailVerified}
              onVerified={() => {
                setEmailVerified(true)
                setErrors((prev) => ({ ...prev, email: false }))
              }}
              invalid={errors.email}
              notify={showSimpleAlert}
            />

            <AuthField label="닉네임">
              <AuthInput
                placeholder="닉네임을 입력해주세요"
                autoComplete="nickname"
                maxLength={MAX_NICKNAME_LENGTH}
                value={nickName}
                invalid={errors.nickName}
                onChange={(event) => {
                  setNickName(event.target.value)
                  if (errors.nickName) setErrors((prev) => ({ ...prev, nickName: false }))
                }}
              />
            </AuthField>

            <AuthField label="비밀번호">
              <AuthInput
                type="password"
                autoComplete="new-password"
                placeholder="8자 이상의 비밀번호"
                value={password}
                invalid={errors.password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  if (errors.password) setErrors((prev) => ({ ...prev, password: false }))
                }}
              />
            </AuthField>

            <AuthField
              label="비밀번호 확인"
              errorMessage={passwordMismatch ? '비밀번호가 일치하지 않습니다.' : undefined}
            >
              <AuthInput
                type="password"
                autoComplete="new-password"
                placeholder="비밀번호를 다시 입력해주세요"
                value={confirmPassword}
                invalid={errors.confirmPassword || passwordMismatch}
                onChange={(event) => {
                  setConfirmPassword(event.target.value)
                  if (errors.confirmPassword) {
                    setErrors((prev) => ({ ...prev, confirmPassword: false }))
                  }
                  if (passwordMismatch) setPasswordMismatch(false)
                }}
              />
            </AuthField>
          </div>

          <AuthSubmitButton label="가입하기" loading={submitting} />
        </form>

        <div className="mt-4xl mb-xl flex gap-xs">
          <span className="text-body font-medium text-ink-500">이미 계정이 있으신가요?</span>
          <Link to={ROUTES.LOGIN} className="text-body font-bold text-brand">
            로그인
          </Link>
        </div>
      </div>

      <CustomAlert alert={alert} onClose={hideAlert} />
    </div>
  )
}
