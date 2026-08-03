import { cn } from '@/utils/cn'

export interface ScrollableTabItem {
  id: string | number
  label: string
  /** 넘기면 탭 우상단에 삭제(×) 버튼이 붙습니다. */
  onDelete?: () => void
}

export interface ScrollableTabProps {
  tabs: ScrollableTabItem[]
  activeTabId: string | number | null | undefined
  onTabPress: (id: string | number) => void
  /** 넘기면 목록 끝에 점선 `+` 버튼이 붙습니다. */
  onAdd?: () => void
  addLabel?: string
  className?: string
}

/**
 * 네이티브 `components/common/item/ScrollableTab.tsx` 이식.
 *
 * 가로 스크롤 pill 탭. 활성 탭은 브랜드 배경 + 흰 글씨, 비활성은 흰 배경 + `#64748b`.
 * 삭제 버튼이 탭 밖으로 6px 삐져나오므로 컨테이너에 위쪽 여백을 둡니다.
 */
export default function ScrollableTab({
  tabs,
  activeTabId,
  onTabPress,
  onAdd,
  addLabel = '추가',
  className,
}: ScrollableTabProps) {
  return (
    <div className={cn('bg-brand-bg px-2xl pb-sm', className)}>
      <div className="no-scrollbar overflow-x-auto">
        <div className="flex w-max items-center gap-md pt-sm pb-xs" role="tablist">
          {tabs.map((tab) => {
            // id 타입(문자열/숫자)이 섞여 들어와도 안전하게 비교합니다.
            const isActive = String(tab.id) === String(activeTabId ?? '')

            return (
              <div key={String(tab.id)} className="relative mr-sm">
                <button
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onTabPress(tab.id)}
                  className={cn(
                    'rounded-full px-lg py-2.5 text-body shadow-[0_2px_3px_rgba(0,0,0,0.1)]',
                    isActive
                      ? 'bg-brand font-bold text-white'
                      : 'bg-white font-medium text-ink-500',
                  )}
                >
                  {tab.label}
                </button>

                {tab.onDelete && (
                  <button
                    type="button"
                    onClick={tab.onDelete}
                    aria-label={`${tab.label} 삭제`}
                    className="absolute -top-1.5 -right-1.5 z-[2] flex size-[18px] items-center justify-center rounded-full border-[1.5px] border-white bg-error text-caption leading-none font-bold text-white"
                  >
                    <span aria-hidden>×</span>
                  </button>
                )}
              </div>
            )
          })}

          {onAdd && (
            <button
              type="button"
              onClick={onAdd}
              aria-label={addLabel}
              className="flex items-center justify-center rounded-full border border-dashed border-ink-200 bg-white px-lg py-sm text-title-sm leading-none font-bold text-ink-500"
            >
              <span aria-hidden>+</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
