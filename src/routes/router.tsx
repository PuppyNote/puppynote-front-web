import { createBrowserRouter } from 'react-router-dom'

import PlainLayout from '@/layouts/PlainLayout'
import TabLayout from '@/layouts/TabLayout'
import CommunityPage from '@/pages/CommunityPage'
import FoodPage from '@/pages/FoodPage'
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import NotFoundPage from '@/pages/NotFoundPage'
import SettingsPage from '@/pages/SettingsPage'
import SuppliesPage from '@/pages/SuppliesPage'
import WalkPage from '@/pages/WalkPage'
import { ROUTES } from './paths'

/**
 * 라우터 구성.
 *
 * - TabLayout: 하단 탭이 있는 메인 화면들
 * - PlainLayout: 탭이 없는 화면들(로그인 등)
 *
 * 로그인 여부에 따른 보호 라우트(ProtectedRoute)는 인증 티켓에서 TabLayout 위에 추가합니다.
 * 화면 수가 늘어나면 lazy 로 코드 스플리팅합니다.
 */
export const router = createBrowserRouter([
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
  {
    element: <PlainLayout />,
    children: [
      { path: ROUTES.LOGIN, element: <LoginPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
