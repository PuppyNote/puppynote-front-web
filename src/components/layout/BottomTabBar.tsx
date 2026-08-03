import { NavLink } from 'react-router-dom'

import { TAB_ITEMS } from '@/routes/paths'

/**
 * 하단 탭 네비게이션.
 *
 * - `pb-safe`로 iOS 홈 인디케이터 영역만큼 아래 여백을 확보합니다.
 * - 아이콘은 디자인 티켓에서 네이티브 앱 에셋(assets/bottomTab/*)을 옮겨오며 붙입니다.
 *   지금은 텍스트 라벨만 둡니다.
 */
export default function BottomTabBar() {
  return (
    <nav className="pb-safe shrink-0 border-t border-gray-200 bg-white">
      <ul className="h-tab-bar flex items-stretch">
        {TAB_ITEMS.map((tab) => (
          <li key={tab.path} className="flex-1">
            <NavLink
              to={tab.path}
              end={tab.path === '/'}
              className={({ isActive }) =>
                [
                  'flex h-full flex-col items-center justify-center gap-1 text-xs',
                  isActive ? 'font-semibold text-gray-900' : 'text-gray-400',
                ].join(' ')
              }
            >
              {/* 아이콘 자리 (후속 디자인 티켓에서 교체) */}
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
              {tab.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
