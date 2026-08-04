import { Outlet } from 'react-router-dom'

import AuthProvider from '@/services/auth/AuthProvider'

/**
 * 라우터 최상단에서 인증 상태를 제공하는 껍데기.
 *
 * `RouterProvider`는 자식을 받지 않으므로, 앱 전체에서 쓰는 Provider는 이렇게 루트 라우트의
 * element로 넣습니다.
 *
 * 푸시 알림 딥링크(`PUSH_OPENED` 브릿지 이벤트) 처리는 {@link ../App}이 맡습니다 — 라우터
 * 컨텍스트 안이 아니어도 `router.navigate()`로 바로 이동시킬 수 있어 여기 둘 필요가 없습니다.
 */
export default function AuthLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  )
}
