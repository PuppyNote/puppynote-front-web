import { RouterProvider } from 'react-router-dom'

import { router } from '@/routes/router'

/**
 * 인증 상태와 세션 만료 처리는 라우터 최상단의 `AuthLayout`(→ `AuthProvider`)이 맡습니다.
 * `RouterProvider`는 자식을 받지 않아서 Provider를 여기에 둘 수 없기 때문입니다.
 */
export default function App() {
  return <RouterProvider router={router} />
}
