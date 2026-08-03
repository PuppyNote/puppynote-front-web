import { Spinner } from '@/components/common'

/**
 * 앱 진입 직후 SecureStore 토큰을 확인하는 동안 잠깐 보이는 화면.
 * 로그인 화면을 먼저 보여줬다가 홈으로 튕기는 깜빡임을 막기 위한 자리입니다.
 *
 * 높이는 부모를 그대로 채웁니다(`h-full`). 보호 라우트에서는 부모가 `#root`(height 100%),
 * 로그인 화면에서는 PlainLayout(`h-dvh` + safe-area 패딩)이라 dvh를 직접 쓰면
 * 패딩만큼 넘칩니다.
 */
export default function AuthSplash() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2xl bg-brand-bg">
      <img src="/assets/puppynote-icon.png" alt="" className="size-20 object-contain" />
      <Spinner className="size-7" />
    </div>
  )
}
