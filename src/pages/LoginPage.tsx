import { type FormEvent, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'

import { useBridge } from '@/bridge'
import { AuthHeader, AuthInput, AuthSplash, AuthSubmitButton } from '@/components/auth'
import { CustomAlert } from '@/components/common'
import { useAlert } from '@/hooks/useAlert'
import { ROUTES } from '@/routes/paths'
import { toAuthErrorNotice } from '@/services/auth/authErrors'
import { useAuth } from '@/services/auth/AuthContext'

/**
 * 로그인 화면. 네이티브 `src/screens/login/LoginScreen.tsx` 이식.
 *
 * 카카오/애플은 앱이 SDK 로그인을 대신 수행합니다(브릿지 LOGIN_KAKAO / LOGIN_APPLE).
 * 일반 브라우저에는 브릿지가 없어 NO_BRIDGE로 떨어지고, "앱에서만 이용할 수 있는 기능"으로 안내됩니다.
 *
 * 네이티브 LoginScreen에 있던 펫 등록/초대코드 모달(EntryOptionModal 등)은 펫 관련 티켓에서
 * 다루므로 여기에는 넣지 않았습니다.
 */
export default function LoginPage() {
  const { status, loginWithEmail, loginWithKakao, loginWithApple } = useAuth()
  const location = useLocation()
  const { alert, showSimpleAlert, hideAlert } = useAlert()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // 애플 로그인은 네이티브와 동일하게 iOS에서만 노출합니다.
  const bridge = useBridge()
  const isIos = bridge?.platform === 'ios'

  const notifyError = (error: unknown, fallback: string) => {
    const notice = toAuthErrorNotice(error, fallback)
    if (notice) showSimpleAlert(notice.title, notice.message)
  }

  const runLogin = async (login: () => Promise<void>, fallbackMessage: string) => {
    if (loading) return
    setLoading(true)
    try {
      await login()
      // 성공하면 status가 authenticated로 바뀌어 아래 Navigate가 화면을 넘깁니다.
    } catch (error) {
      notifyError(error, fallbackMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!email || !password) {
      showSimpleAlert('알림', '이메일과 비밀번호를 모두 입력해주세요.')
      return
    }

    void runLogin(() => loginWithEmail(email.trim(), password), '로그인에 실패했습니다.')
  }

  if (status === 'loading') return <AuthSplash />

  if (status === 'authenticated') {
    // 보호 라우트에서 튕겨온 경우 원래 가려던 곳으로 되돌려 보냅니다.
    const from = (location.state as { from?: string } | null)?.from
    return <Navigate to={from ?? ROUTES.HOME} replace />
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-3xl py-2xl">
      <AuthHeader title="PuppyNote" size="lg" className="mb-16" />

      <form onSubmit={handleSubmit} className="w-full max-w-[384px]">
        <div className="mb-lg flex flex-col gap-md">
          <AuthInput
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="이메일 주소"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <AuthInput
            type="password"
            autoComplete="current-password"
            placeholder="비밀번호"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        <AuthSubmitButton label="로그인" loading={loading} textSize="body" className="mt-sm" />

        <div className="flex items-center justify-center gap-lg py-lg">
          <span className="h-px flex-1 bg-ink-200" />
          <span className="text-caption font-bold tracking-[2px] text-ink-400 uppercase">
            또는 다음으로 계속
          </span>
          <span className="h-px flex-1 bg-ink-200" />
        </div>

        <div className="flex justify-center gap-lg">
          <button
            type="button"
            aria-label="카카오로 로그인"
            disabled={loading}
            onClick={() => void runLogin(loginWithKakao, '카카오 로그인에 실패했습니다.')}
            className="size-14 overflow-hidden rounded-full disabled:opacity-60"
          >
            <img src="/assets/loginButton/kakao.png" alt="" className="size-full object-contain" />
          </button>

          {isIos && (
            <button
              type="button"
              aria-label="Apple로 로그인"
              disabled={loading}
              onClick={() => void runLogin(loginWithApple, '애플 로그인에 실패했습니다.')}
              className="size-14 overflow-hidden rounded-full disabled:opacity-60"
            >
              <img
                src="/assets/loginButton/apple.png"
                alt=""
                className="size-full object-contain"
              />
            </button>
          )}
        </div>
      </form>

      <div className="mt-12 flex gap-xs">
        <span className="text-body font-medium text-ink-500">계정이 없으신가요?</span>
        <Link to={ROUTES.REGISTER} className="text-body font-bold text-brand">
          회원가입
        </Link>
      </div>

      <Link
        to={ROUTES.PASSWORD_RESET}
        className="mt-lg text-[13px] font-medium text-ink-400 underline"
      >
        비밀번호를 잊으셨나요?
      </Link>

      <CustomAlert alert={alert} onClose={hideAlert} />
    </div>
  )
}
