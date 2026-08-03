import { NavLink } from 'react-router-dom'

import { TAB_ITEMS, type TabItem } from '@/routes/paths'
import { cn } from '@/utils/cn'

export interface BottomTabBarProps {
  /**
   * 등록된 펫이 있는지. false면 `requiresPet` 탭(산책/용품)이 비활성화됩니다.
   * 펫 컨텍스트는 아직 없으므로 기본값은 true이고, 후속 티켓에서 실제 상태를 내려줍니다.
   */
  hasPet?: boolean
  /** 비활성 탭을 눌렀을 때. 네이티브는 "먼저 우리 아이를 등록해주세요! 🐶" 알럿을 띄웁니다. */
  onDisabledTabClick?: (tab: TabItem) => void
}

/**
 * 하단 탭 네비게이션. 네이티브 `components/common/item/BottomTab.tsx` 이식.
 *
 * 스펙(디자인 스펙 §5): 배경 `rgba(255,255,255,0.95)`, `border-top 1px #e2e8f0`,
 * 아이콘 30×30, 활성 시 `scale(1.4)`, 펫 미등록 탭은 `opacity 0.3`.
 * 네이티브와 마찬가지로 **글자 라벨 없이 아이콘만** 둡니다 (라벨은 aria-label로만 남깁니다).
 *
 * 네이티브는 `position: absolute`로 화면 위에 띄우지만, 웹은 `TabLayout`의 세로 flex
 * 3단 구성에서 마지막 칸을 차지합니다. 키보드가 올라와도 레이아웃이 깨지지 않기 때문입니다.
 */
export default function BottomTabBar({ hasPet = true, onDisabledTabClick }: BottomTabBarProps) {
  return (
    <nav className="pb-tab-inset shrink-0 border-t border-ink-200 bg-white/95 backdrop-blur">
      <ul className="h-tab-bar flex items-stretch">
        {TAB_ITEMS.map((tab) => {
          const isDisabled = Boolean(tab.requiresPet) && !hasPet

          return (
            <li key={tab.path} className="flex-1">
              <NavLink
                to={tab.path}
                end={tab.path === '/'}
                aria-label={tab.label}
                aria-disabled={isDisabled || undefined}
                onClick={(event) => {
                  if (!isDisabled) return
                  event.preventDefault()
                  onDisabledTabClick?.(tab)
                }}
                className="flex h-full items-center justify-center"
              >
                {({ isActive }) => (
                  <img
                    src={`/assets/bottomTab/${tab.icon}${isActive && !isDisabled ? '-click' : ''}.png`}
                    alt=""
                    width={30}
                    height={30}
                    className={cn(
                      'block size-[30px] object-contain transition-transform',
                      isActive && !isDisabled && 'scale-[1.4]',
                      isDisabled && 'opacity-30',
                    )}
                  />
                )}
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
