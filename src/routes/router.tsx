import { createBrowserRouter, type RouteObject } from 'react-router-dom'

import PlainLayout from '@/layouts/PlainLayout'
import TabLayout from '@/layouts/TabLayout'
import CommunityPage from '@/pages/CommunityPage'
import DesignSystemPage from '@/pages/DesignSystemPage'
import FoodPage from '@/pages/FoodPage'
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import NotFoundPage from '@/pages/NotFoundPage'
import PasswordResetPage from '@/pages/PasswordResetPage'
import RegisterPage from '@/pages/RegisterPage'
import SettingsPage from '@/pages/SettingsPage'
import SuppliesPage from '@/pages/SuppliesPage'
import WalkPage from '@/pages/WalkPage'
import AuthLayout from './AuthLayout'
import ProtectedRoute from './ProtectedRoute'
import { ROUTES } from './paths'

/**
 * 개발 전용 라우트. 디자인 토큰/공통 컴포넌트를 눈으로 확인하는 페이지입니다.
 * 로그인 없이 보려고 보호 라우트 밖에 둡니다.
 * 프로덕션 빌드에서는 배열이 비어 트리셰이킹으로 통째로 빠집니다.
 */
const devRoutes: RouteObject[] = import.meta.env.DEV
  ? [{ element: <TabLayout />, children: [{ path: '/__design', element: <DesignSystemPage /> }] }]
  : []

/**
 * 라우터 구성.
 *
 * - AuthLayout: 전 화면 공통. 진입 시 SecureStore 토큰을 확인해 인증 상태를 만듭니다.
 * - ProtectedRoute: 로그인해야 볼 수 있는 화면들. 미로그인이면 로그인 화면으로 보냅니다.
 * - TabLayout: 하단 탭이 있는 메인 화면들
 * - PlainLayout: 탭이 없는 화면들(로그인/회원가입/비밀번호 재설정)
 *
 * 화면 수가 늘어나면 lazy 로 코드 스플리팅합니다.
 */
export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <TabLayout />,
            children: [
              { path: ROUTES.HOME, element: <HomePage /> },
              { path: ROUTES.WALK, element: <WalkPage /> },
              { path: ROUTES.SUPPLIES, element: <SuppliesPage /> },
              { path: ROUTES.COMMUNITY, element: <CommunityPage /> },
              { path: ROUTES.FOOD, element: <FoodPage /> },
              { path: ROUTES.SETTINGS, element: <SettingsPage /> },
            ],
          },
        ],
      },
      ...devRoutes,
      {
        element: <PlainLayout />,
        children: [
          { path: ROUTES.LOGIN, element: <LoginPage /> },
          { path: ROUTES.REGISTER, element: <RegisterPage /> },
          { path: ROUTES.PASSWORD_RESET, element: <PasswordResetPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
