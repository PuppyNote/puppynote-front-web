import { Outlet } from 'react-router-dom'

/**
 * 하단 탭이 없는 화면(로그인, 온보딩 등)용 셸.
 * safe-area만 확보하고 나머지는 화면이 알아서 채웁니다.
 */
export default function PlainLayout() {
  return (
    <div className="pt-safe pb-safe px-safe flex h-dvh flex-col bg-brand-bg">
      <Outlet />
    </div>
  )
}
