/**
 * 라우트 경로 상수.
 *
 * 경로 이름은 네이티브 앱의 탭/스크린 구성(puppynote-front-app/src/navigation/AppNavigator.tsx)에
 * 맞춰 두었습니다. 앱이 푸시 딥링크(PUSH_OPENED 이벤트)로 넘겨주는 path도 이 값들과 맞아야 합니다.
 */
export const ROUTES = {
  HOME: '/',
  WALK: '/walk',
  SUPPLIES: '/supplies',
  COMMUNITY: '/community',
  FOOD: '/food',
  SETTINGS: '/settings',
  LOGIN: '/login',
} as const

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES]

export interface TabItem {
  path: RoutePath
  label: string
}

/** 하단 탭 구성 (네이티브 앱 BottomTab과 동일한 순서) */
export const TAB_ITEMS: TabItem[] = [
  { path: ROUTES.HOME, label: '홈' },
  { path: ROUTES.WALK, label: '산책' },
  { path: ROUTES.SUPPLIES, label: '용품' },
  { path: ROUTES.COMMUNITY, label: '커뮤니티' },
  { path: ROUTES.FOOD, label: '음식' },
  { path: ROUTES.SETTINGS, label: '설정' },
]
