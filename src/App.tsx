import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'

import { router } from '@/routes/router'
import { ROUTES } from '@/routes/paths'
import { apiService } from '@/services/api/ApiService'

export default function App() {
  useEffect(() => {
    // 토큰 갱신까지 실패해 세션이 끊긴 경우의 후처리.
    // (전역 상태 초기화 등은 인증 티켓에서 이 콜백에 붙입니다.)
    apiService.setLogoutListener(() => {
      void router.navigate(ROUTES.LOGIN, { replace: true })
    })

    return () => apiService.setLogoutListener(null)
  }, [])

  return <RouterProvider router={router} />
}
