import { Outlet, useLocation } from 'react-router-dom'

import BottomTabBar from '@/components/layout/BottomTabBar'
import TopBar from '@/components/layout/TopBar'
import { TAB_ITEMS } from '@/routes/paths'

/**
 * 하단 탭이 있는 화면들의 공통 셸.
 *
 * 세로 flex 3단 구성(상단 바 / 스크롤 영역 / 하단 탭)이라 탭 바를 fixed로 띄우지 않아도 되고,
 * 키보드가 올라와도 레이아웃이 깨지지 않습니다.
 * 본문만 스크롤되고 `overscroll-contain`으로 스크롤 체이닝을 막습니다.
 */
export default function TabLayout() {
  const { pathname } = useLocation()
  const currentTab = TAB_ITEMS.find((tab) => tab.path === pathname)

  return (
    <div className="flex h-dvh flex-col bg-white">
      <TopBar title={currentTab?.label ?? 'PuppyNote'} />

      <main className="flex-1 overflow-y-auto overscroll-contain">
        <Outlet />
      </main>

      <BottomTabBar />
    </div>
  )
}
