import type { ReactNode } from 'react'

interface TopBarProps {
  title: string
  /** 왼쪽 영역(뒤로가기 등). 지정하지 않으면 빈 공간으로 자리만 잡습니다. */
  left?: ReactNode
  /** 오른쪽 영역(알림 등) */
  right?: ReactNode
}

/**
 * 상단 바.
 * `pt-safe`로 상태바 영역을 피하고, 그 아래 고정 높이(`h-top-bar`)로 내용을 배치합니다.
 */
export default function TopBar({ title, left, right }: TopBarProps) {
  return (
    <header className="pt-safe shrink-0 border-b border-gray-200 bg-white">
      <div className="h-top-bar flex items-center justify-between px-4">
        <div className="flex w-12 items-center justify-start">{left}</div>
        <h1 className="truncate text-base font-semibold text-gray-900">{title}</h1>
        <div className="flex w-12 items-center justify-end">{right}</div>
      </div>
    </header>
  )
}
