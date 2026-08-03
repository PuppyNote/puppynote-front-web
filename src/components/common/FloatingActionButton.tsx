import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { cn } from '@/utils/cn'

export interface FloatingActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 스크린리더용 설명. 아이콘만 있는 버튼이라 필수입니다. */
  label: string
  /** 기본은 네이티브와 동일한 `+` */
  icon?: ReactNode
  /** 하단 탭이 있는 화면이면 true(기본). 탭 높이만큼 더 띄웁니다. */
  aboveTabBar?: boolean
}

/**
 * 네이티브 `components/common/item/FloatingActionButton.tsx` 이식.
 * 56×56 · radius 28 · 브랜드 배경 · shadow `#eebd2b` 0/4/10 opacity .3
 *
 * 네이티브는 화면 View 안에서 `position: absolute`지만, 웹은 `#root`가 `--app-max-width`로
 * 가운데 정렬되어 있어 `fixed` + `anchor-right`로 앱 영역 오른쪽 가장자리에 붙입니다.
 * (스크롤 컨테이너 안에서 `absolute`를 쓰면 본문과 같이 스크롤되어 버립니다.)
 */
export default function FloatingActionButton({
  label,
  icon = '+',
  aboveTabBar = true,
  className,
  ...rest
}: FloatingActionButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        'anchor-right fixed z-50 flex size-14 items-center justify-center rounded-3xl',
        'bg-brand text-[30px] leading-none font-light text-white shadow-fab',
        'transition-transform active:scale-95',
        aboveTabBar
          ? 'bottom-[calc(var(--tab-bar-total-height)+24px)]'
          : 'bottom-[calc(var(--safe-bottom)+24px)]',
        className,
      )}
      {...rest}
    >
      <span aria-hidden className="-mt-0.5">
        {icon}
      </span>
    </button>
  )
}
