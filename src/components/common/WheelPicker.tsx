import { useCallback, useEffect, useRef, useState } from 'react'

import { cn } from '@/utils/cn'

export interface WheelPickerProps {
  items: string[]
  value: string
  onChange: (value: string) => void
  /** 보이는 영역 높이 (기본 150 = 항목 3개) */
  height?: number
  /** 항목 하나의 높이 (기본 50) */
  itemHeight?: number
  /** 열 너비 (기본 80) */
  width?: number
  /** 스크린리더용 이름 (예: '년', '시') */
  label?: string
  className?: string
}

/** 스크롤이 멎었다고 판단하기까지의 대기 시간. 너무 짧으면 관성 스크롤 도중에 값이 확정됩니다. */
const SETTLE_DELAY_MS = 120

/**
 * 네이티브 `components/common/item/WheelPicker.tsx` 이식 (프로토타입).
 *
 * RN은 `snapToInterval` + `onMomentumScrollEnd`로 휠을 만들지만 웹에는 관성 스크롤 종료
 * 이벤트가 없습니다(`scrollend`는 지원 범위가 아직 고르지 않습니다). 그래서
 *   - 스냅: CSS `scroll-snap-type: y mandatory` + 항목 `snap-center`
 *   - 확정: 스크롤이 {@link SETTLE_DELAY_MS} 동안 멈추면 그 위치의 항목을 선택
 * 로 구현했습니다.
 *
 * 미완성인 부분(기획서상 "난이도 높음"):
 *   - 위아래 항목이 원근감 있게 기울어지는 3D 효과가 없습니다 (평면 목록).
 *   - 무한 순환(위/아래로 계속 도는) 동작이 없습니다. 네이티브도 순환하지 않아 동작은 같습니다.
 */
export default function WheelPicker({
  items,
  value,
  onChange,
  height = 150,
  itemHeight = 50,
  width = 80,
  label,
  className,
}: WheelPickerProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const settleTimerRef = useRef<number | null>(null)
  /** 코드가 일으킨 스크롤이면 그 결과로 onChange를 다시 부르지 않기 위한 표시 */
  const programmaticRef = useRef(false)
  const hasScrolledOnceRef = useRef(false)

  const selectedIndex = items.indexOf(value)
  const [activeIndex, setActiveIndex] = useState(() => Math.max(selectedIndex, 0))

  const clampIndex = useCallback(
    (index: number) => Math.min(Math.max(index, 0), Math.max(items.length - 1, 0)),
    [items.length],
  )

  // 바깥에서 value가 바뀌면 그 위치로 스크롤을 맞춥니다.
  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller || selectedIndex < 0) return

    const targetTop = selectedIndex * itemHeight
    setActiveIndex(selectedIndex)
    if (Math.abs(scroller.scrollTop - targetTop) < 1) return

    programmaticRef.current = true
    scroller.scrollTo({
      top: targetTop,
      // 첫 배치는 튀지 않게 즉시, 이후 외부 변경은 부드럽게
      behavior: hasScrolledOnceRef.current ? 'smooth' : 'auto',
    })
    hasScrolledOnceRef.current = true
  }, [selectedIndex, itemHeight])

  useEffect(() => {
    return () => {
      if (settleTimerRef.current !== null) window.clearTimeout(settleTimerRef.current)
    }
  }, [])

  const handleScroll = () => {
    const scroller = scrollerRef.current
    if (!scroller) return

    hasScrolledOnceRef.current = true
    setActiveIndex(clampIndex(Math.round(scroller.scrollTop / itemHeight)))

    if (settleTimerRef.current !== null) window.clearTimeout(settleTimerRef.current)
    settleTimerRef.current = window.setTimeout(() => {
      settleTimerRef.current = null

      // 코드가 일으킨 스크롤이면 값 확정 없이 표시만 해제합니다.
      if (programmaticRef.current) {
        programmaticRef.current = false
        return
      }

      const settledIndex = clampIndex(Math.round(scroller.scrollTop / itemHeight))
      const settledValue = items[settledIndex]
      if (settledValue !== undefined && settledValue !== value) onChange(settledValue)
    }, SETTLE_DELAY_MS)
  }

  const move = (delta: number) => {
    const next = items[clampIndex(activeIndex + delta)]
    if (next !== undefined && next !== value) onChange(next)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      move(1)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      move(-1)
    }
  }

  const padding = Math.max((height - itemHeight) / 2, 0)

  return (
    <div className={cn('overflow-hidden', className)} style={{ height, width }}>
      <div
        ref={scrollerRef}
        role="listbox"
        aria-label={label}
        tabIndex={0}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        className="no-scrollbar snap-wheel h-full overflow-y-auto outline-none"
        style={{ paddingTop: padding, paddingBottom: padding }}
      >
        {items.map((item, index) => {
          const isActive = index === activeIndex

          return (
            <div
              key={item}
              role="option"
              aria-selected={item === value}
              onClick={() => onChange(item)}
              className={cn(
                'flex snap-center items-center justify-center transition-colors',
                isActive ? 'text-[22px] font-bold text-ink-900' : 'text-title text-ink-300',
              )}
              style={{ height: itemHeight }}
            >
              {item}
            </div>
          )
        })}
      </div>
    </div>
  )
}
