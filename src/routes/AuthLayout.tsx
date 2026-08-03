import { Outlet } from 'react-router-dom'

import AuthProvider from '@/services/auth/AuthProvider'

/**
 * 라우터 최상단에서 인증 상태를 제공하는 껍데기.
 *
 * `RouterProvider`는 자식을 받지 않으므로, 앱 전체에서 쓰는 Provider는 이렇게 루트 라우트의
 * element로 넣습니다.
 */
export default function AuthLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  )
}
