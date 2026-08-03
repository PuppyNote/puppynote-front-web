import { Spinner } from '@/components/common'

/**
 * 앱 진입 직후 SecureStore 토큰을 확인하는 동안 잠깐 보이는 화면.
 * 로그인 화면을 먼저 보여줬다가 홈으로 튕기는 깜빡임을 막기 위한 자리입니다.
 */
export default function AuthSplash() {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-2xl bg-brand-bg">
      <img src="/assets/puppynote-icon.png" alt="" className="size-20 object-contain" />
      <Spinner className="size-7" />
    </div>
  )
}
