import { Outlet } from 'react-router-dom'

import BottomTabBar from '@/components/layout/BottomTabBar'
import TopBar from '@/components/layout/TopBar'

/**
 * 하단 탭이 있는 화면들의 공통 셸.
 *
 * 세로 flex 3단 구성(상단 바 / 스크롤 영역 / 하단 탭)이라 탭 바를 fixed로 띄우지 않아도 되고,
 * 키보드가 올라와도 레이아웃이 깨지지 않습니다.
 * 본문만 스크롤되고 `overscroll-contain`으로 스크롤 체이닝을 막습니다.
 *
 * 제목이 탭마다 바뀌지 않고 'PuppyNote'로 고정인 것은 네이티브와 같습니다
 * (AppNavigator의 메인 탭 6개가 전부 같은 headerTitle을 씁니다).
 */
export default function TabLayout() {
  return (
    <div className="flex h-dvh flex-col bg-brand-bg">
      {/*
        알림 버튼은 아직 이동할 화면(AlertHistory)이 없어 동작을 붙이지 않았습니다.
        미확인 알림 여부도 알림 서비스 이식 후에 내려줍니다.
      */}
      <TopBar />

      <main className="flex-1 overflow-y-auto overscroll-contain">
        <Outlet />
      </main>

      <BottomTabBar />
    </div>
  )
}
