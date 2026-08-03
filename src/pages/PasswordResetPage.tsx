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

/** 회원가입과 같은 규칙을 적용합니다 (서버 `PasswordResetRequest`에는 길이 제약이 없습니다). */
const MIN_PASSWORD_LENGTH = 8

/**
 * 비밀번호 재설정 화면. 네이티브 `src/screens/login/PasswordResetScreen.tsx` 이식.
 *
 * SNS로 가입한 계정은 인증번호 발송 단계에서 서버가 "카카오로 가입된 계정입니다." 식으로 막습니다.
 */
export default function PasswordResetPage() {
  const navigate = useNavigate()
  const { alert, showSimpleAlert, hideAlert } = useAlert()

  const [email, setEmail] = useState('')
  const [emailVerified, setEmailVerified] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [errors, setErrors] = useState({
    email: false,
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
    if (nextErrors.password || nextErrors.confirmPassword) {
      showSimpleAlert('알림', '모든 필드를 입력해주세요.')
      return
    }
    if (mismatch) return

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
      await authApi.resetPassword(email.trim(), password)
      showSimpleAlert('성공', '비밀번호가 성공적으로 재설정되었습니다.', () => {
        void navigate(ROUTES.LOGIN, { replace: true })
      })
    } catch (error) {
      showSimpleAlert('오류', toErrorMessage(error, '비밀번호 재설정에 실패했습니다.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex flex-col items-center px-3xl pt-16 pb-3xl">
        <AuthHeader
          title="비밀번호 재설정"
          subtitle="가입하신 이메일로 인증번호를 발송합니다"
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
              requestCode={authApi.sendPasswordResetCode}
              verified={emailVerified}
              onVerified={() => {
                setEmailVerified(true)
                setErrors((prev) => ({ ...prev, email: false }))
              }}
              invalid={errors.email}
              notify={showSimpleAlert}
            />

            <AuthField label="새 비밀번호">
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
              label="새 비밀번호 확인"
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

          <AuthSubmitButton label="비밀번호 변경하기" loading={submitting} />
        </form>

        <div className="mt-4xl mb-xl flex justify-center">
          <Link to={ROUTES.LOGIN} className="text-body font-bold text-brand">
            로그인 화면으로 돌아가기
          </Link>
        </div>
      </div>

      <CustomAlert alert={alert} onClose={hideAlert} />
    </div>
  )
}
