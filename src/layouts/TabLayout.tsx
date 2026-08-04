import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

import { CustomAlert } from '@/components/common'
import BottomTabBar from '@/components/layout/BottomTabBar'
import TopBar from '@/components/layout/TopBar'
import PetTabBar from '@/components/pet/PetTabBar'
import { useAlert } from '@/hooks/useAlert'
import { alertHistoryApi } from '@/services/api/endpoints/alertHistory'
import { ROUTES, PET_TAB_ROUTES } from '@/routes/paths'
import { usePet } from '@/services/pet/PetContext'

/**
 * 로그인 이후 화면들의 공통 셸.
 *
 * 세로 flex 구성(상단 바 / 펫 탭 / 스크롤 영역 / 하단 탭)이라 탭 바를 fixed로 띄우지 않아도
 * 되고, 키보드가 올라와도 레이아웃이 깨지지 않습니다.
 * 본문만 스크롤되고 `overscroll-contain`으로 스크롤 체이닝을 막습니다.
 *
 * 네이티브는 화면마다 `Layout showPetTab`으로 펫 탭을 켜는데, 웹에서는 그 목록을
 * {@link ../routes/paths.PET_TAB_ROUTES}로 옮겨 여기서 한 번에 판단합니다.
 *
 * 제목이 탭마다 바뀌지 않고 'PuppyNote'로 고정인 것은 네이티브와 같습니다
 * (AppNavigator의 메인 탭 6개가 전부 같은 headerTitle을 씁니다).
 */
export default function TabLayout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { selectedPet } = usePet()
  const { alert, showSimpleAlert, hideAlert } = useAlert()
  const [hasNotification, setHasNotification] = useState(false)

  const showPetTab = (PET_TAB_ROUTES as readonly string[]).includes(pathname)

  // 탭을 오갈 때마다(= 네이티브의 화면 focus) 다시 확인합니다.
  useEffect(() => {
    void alertHistoryApi
      .getUncheckedAlertExists()
      .then(setHasNotification)
      .catch((error: unknown) => console.warn('알림 여부 조회 실패', error))
  }, [pathname])

  return (
    <div className="flex h-dvh flex-col bg-brand-bg">
      <TopBar
        hasNotification={hasNotification}
        onNotificationClick={() => navigate(ROUTES.ALERT_HISTORY)}
      />

      {showPetTab && <PetTabBar />}

      {/*
        `data-scroll-container`는 당겨서 새로고침({@link ../hooks/usePullToRefresh})이
        스크롤 요소를 찾는 표식이고, `relative`는 그 인디케이터의 위치 기준입니다.
      */}
      <main data-scroll-container className="relative flex-1 overflow-y-auto overscroll-contain">
        <Outlet />
      </main>

      {/* 펫이 없으면 산책/용품 탭이 잠깁니다 (네이티브 BottomTab과 같은 문구). */}
      <BottomTabBar
        hasPet={Boolean(selectedPet)}
        onDisabledTabClick={() => showSimpleAlert('알림', '먼저 우리 아이를 등록해주세요! 🐶')}
      />

      <CustomAlert alert={alert} onClose={hideAlert} />
    </div>
  )
}
