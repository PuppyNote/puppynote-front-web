import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { AuthSplash } from '@/components/auth'
import { useAuth } from '@/services/auth/AuthContext'

import { ROUTES } from './paths'

/**
 * 로그인이 필요한 화면들을 감싸는 라우트.
 *
 * 세션 확인이 끝나기 전(`loading`)에는 스플래시를 띄웁니다. 로그인 화면을 먼저 그렸다가
 * 홈으로 튕기면 앱에서 깜빡임으로 보이기 때문입니다.
 * 튕겨낼 때 원래 가려던 경로를 `state.from`으로 넘겨, 로그인 후 그 자리로 돌아가게 합니다.
 */
export default function ProtectedRoute() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <AuthSplash />

  if (status === 'unauthenticated') {
    return (
      <Navigate
        to={ROUTES.LOGIN}
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
  }

  return <Outlet />
}
