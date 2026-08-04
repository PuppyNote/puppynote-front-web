import { RouterProvider } from 'react-router-dom'

import { BridgeEvent, useBridgeEvent } from '@/bridge'
import { router } from '@/routes/router'

/**
 * 인증 상태와 세션 만료 처리는 라우터 최상단의 `AuthLayout`(→ `AuthProvider`)이 맡습니다.
 * `RouterProvider`는 자식을 받지 않아서 Provider를 여기에 둘 수 없기 때문입니다.
 *
 * 푸시 알림 탭으로 앱이 열리면(또는 포그라운드 전환) 네이티브가 `PUSH_OPENED`를 쏩니다.
 * `router.navigate`는 컴포넌트 밖에서도 쓸 수 있는 data router의 명령형 API라, 여기서
 * 바로 이동시킵니다 (로그인 여부는 `ProtectedRoute`가 그다음에 알아서 판단합니다).
 */
export default function App() {
  useBridgeEvent(BridgeEvent.PUSH_OPENED, (payload) => {
    if (payload.path) void router.navigate(payload.path)
  })

  return <RouterProvider router={router} />
}
