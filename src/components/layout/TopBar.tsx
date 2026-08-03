import type { ReactNode } from 'react'

import { cn } from '@/utils/cn'

export interface TopBarProps {
  /** 네이티브 메인 탭은 전부 'PuppyNote'입니다. */
  title?: string
  /**
   * 넘기면 왼쪽 앱 아이콘 대신 뒤로가기 버튼이 나옵니다.
   * (네이티브는 `navigation.canGoBack()`으로 스스로 판단하지만, 웹은 화면이 결정합니다)
   */
  onBack?: () => void
  /** 알림 버튼 노출 여부. 알림 내역 화면에서는 false (네이티브와 동일) */
  showNotification?: boolean
  /** 확인하지 않은 알림이 있으면 빨간 점이 붙습니다. */
  hasNotification?: boolean
  onNotificationClick?: () => void
  /** 알림 버튼 자리를 다른 것으로 바꾸고 싶을 때 */
  right?: ReactNode
  className?: string
}

/**
 * 상단 바. 네이티브 `components/common/item/TopBar.tsx` 이식.
 *
 * 스펙(디자인 스펙 §5): 배경 `#fcfaf2`, padding `(safe-top + 8px) 24px 4px`,
 * 제목 24px/700/`#0f172a`/letter-spacing -0.5, 알림 아이콘 36×36 + 미확인 시 11px 빨간 점.
 *
 * 높이를 고정하지 않고 네이티브처럼 내용에 맞춰 늘어나게 두었습니다.
 * 레이아웃 계산이 필요하면 `--top-bar-height`(68px, safe-area 제외)를 쓰세요.
 */
export default function TopBar({
  title = 'PuppyNote',
  onBack,
  showNotification = true,
  hasNotification = false,
  onNotificationClick,
  right,
  className,
}: TopBarProps) {
  return (
    <header
      className={cn('shrink-0 bg-brand-bg px-2xl pt-[calc(var(--safe-top)+8px)] pb-xs', className)}
    >
      <div className="flex items-center justify-between py-xs">
        <div className="flex min-w-0 items-center gap-md">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label="뒤로 가기"
              className="mr-xs p-sm text-heading font-bold text-ink-900"
            >
              <span aria-hidden>←</span>
            </button>
          ) : (
            <span className="rounded-full border border-brand-10 bg-brand-bg p-sm shadow-input">
              <img
                src="/assets/puppynote-icon.png"
                alt=""
                width={32}
                height={32}
                className="block size-8 object-contain"
              />
            </span>
          )}
          <h1 className="truncate text-heading font-bold text-ink-900">{title}</h1>
        </div>

        {right ??
          (showNotification && (
            <button
              type="button"
              onClick={onNotificationClick}
              aria-label={hasNotification ? '알림 내역 (읽지 않은 알림 있음)' : '알림 내역'}
              className="relative shrink-0 rounded-full p-sm"
            >
              <img
                src="/assets/alarm/alarm.png"
                alt=""
                width={36}
                height={36}
                className="block size-9"
              />
              {hasNotification && (
                <span
                  aria-hidden
                  className="absolute top-2.5 right-2.5 size-[11px] rounded-full border-2 border-brand-bg bg-error"
                />
              )}
            </button>
          ))}
      </div>
    </header>
  )
}
