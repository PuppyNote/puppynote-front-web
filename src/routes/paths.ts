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
  REGISTER: '/register',
  PASSWORD_RESET: '/password-reset',
} as const

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES]

export interface TabItem {
  path: RoutePath
  label: string
  /**
   * `public/assets/bottomTab/{icon}.png` / `{icon}-click.png`의 앞부분.
   * 네이티브 앱 `assets/bottomTab/`에서 그대로 옮겨온 파일이라 이름도 같습니다.
   */
  icon: string
  /** 펫이 한 마리도 없으면 비활성화되는 탭 (네이티브 BottomTab과 동일) */
  requiresPet?: boolean
}

/**
 * 상단 펫 탭이 보이는 화면들.
 *
 * 네이티브에서 `Layout showPetTab={true}`를 켜는 화면과 같습니다
 * (HomeScreen / WalkManagement / SuppliesScreen, 그리고 설정의 FamilyManagementScreen).
 * 가족 관리 화면은 아직 이식 전이라 이식 티켓에서 이 배열에 추가하세요.
 */
export const PET_TAB_ROUTES: RoutePath[] = [ROUTES.HOME, ROUTES.WALK, ROUTES.SUPPLIES]

/** 하단 탭 구성 (네이티브 앱 BottomTab과 동일한 순서) */
export const TAB_ITEMS: TabItem[] = [
  { path: ROUTES.HOME, label: '홈', icon: 'home' },
  { path: ROUTES.WALK, label: '산책', icon: 'walk', requiresPet: true },
  { path: ROUTES.SUPPLIES, label: '용품', icon: 'supply', requiresPet: true },
  { path: ROUTES.COMMUNITY, label: '커뮤니티', icon: 'community' },
  { path: ROUTES.FOOD, label: '음식', icon: 'food' },
  { path: ROUTES.SETTINGS, label: '설정', icon: 'setting' },
]
