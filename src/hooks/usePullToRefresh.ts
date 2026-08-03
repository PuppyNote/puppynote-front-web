/**
 * 당겨서 새로고침. 네이티브 `RefreshControl`의 웹 대응입니다.
 *
 * 웹뷰에서는 브라우저 기본 pull-to-refresh가 없고(`index.css`에서 `overscroll-behavior-y: none`
 * 으로 막아 두기도 했습니다) 앱 셸도 새로고침을 제공하지 않아서, 직접 제스처를 답니다.
 *
 * 스크롤 컨테이너는 화면마다 만들지 않고 `TabLayout`의 `<main data-scroll-container>` 하나를
 * 공유하므로, 콘텐츠 쪽 ref에서 가장 가까운 컨테이너를 찾아 리스너를 겁니다.
 *
 * 마우스에는 반응하지 않습니다(터치 전용). PC에서는 브라우저 새로고침을 쓰면 됩니다.
 */
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'

/** 이 거리(px) 이상 당기면 새로고침이 실행됩니다. */
const DEFAULT_THRESHOLD = 60
/** 아무리 당겨도 콘텐츠가 내려가는 최대 거리(px) */
const DEFAULT_MAX_PULL = 80
/** 손가락 이동량 대비 콘텐츠가 따라오는 비율 (고무줄 느낌) */
const PULL_RESISTANCE = 0.5

export interface UsePullToRefreshOptions {
  onRefresh: () => Promise<unknown> | unknown
  /** false면 제스처를 받지 않습니다 (로딩 중 등) */
  enabled?: boolean
  threshold?: number
  maxPull?: number
}

export interface PullToRefreshState {
  /**
   * 스크롤 컨테이너를 찾기 위한 앵커. 스크롤되는 콘텐츠 루트에 답니다.
   *
   * 이 ref가 붙은 요소가 렌더링된 뒤에 리스너가 걸리므로, 로딩 중에 콘텐츠를 아예 그리지
   * 않는 화면이라면 `enabled`를 로딩 상태와 함께 뒤집어 주세요 (그때 다시 찾습니다).
   */
  contentRef: RefObject<HTMLDivElement | null>
  /** 콘텐츠를 내릴 거리(px) */
  pullDistance: number
  /** 손가락이 아직 화면에 있는지 (애니메이션 전환을 끄는 데 씁니다) */
  isPulling: boolean
  /** onRefresh가 진행 중인지 */
  isRefreshing: boolean
}

export function usePullToRefresh({
  onRefresh,
  enabled = true,
  threshold = DEFAULT_THRESHOLD,
  maxPull = DEFAULT_MAX_PULL,
}: UsePullToRefreshOptions): PullToRefreshState {
  const contentRef = useRef<HTMLDivElement | null>(null)
  const [pullDistance, setPullDistance] = useState(0)
  const [isPulling, setIsPulling] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // 리스너 안에서 최신 값을 읽어야 하는데 재구독은 피하고 싶어 ref로 들고 있습니다.
  const onRefreshRef = useRef(onRefresh)
  const isRefreshingRef = useRef(false)
  const startYRef = useRef<number | null>(null)
  const distanceRef = useRef(0)

  useEffect(() => {
    onRefreshRef.current = onRefresh
  })

  const setDistance = useCallback((value: number) => {
    distanceRef.current = value
    setPullDistance(value)
  }, [])

  useEffect(() => {
    if (!enabled) return

    const anchor = contentRef.current
    const scroller = anchor?.closest<HTMLElement>('[data-scroll-container]')
    if (!scroller) return

    const handleTouchStart = (event: TouchEvent) => {
      if (isRefreshingRef.current || event.touches.length !== 1) return
      // 맨 위에 있을 때만 제스처를 시작합니다. 그래야 일반 스크롤과 겹치지 않습니다.
      startYRef.current = scroller.scrollTop <= 0 ? event.touches[0].clientY : null
    }

    const handleTouchMove = (event: TouchEvent) => {
      const startY = startYRef.current
      if (startY === null || isRefreshingRef.current) return

      const delta = event.touches[0].clientY - startY

      // 위로 올리는 중이거나 그 사이 스크롤이 내려갔다면 평범한 스크롤로 되돌립니다.
      if (delta <= 0 || scroller.scrollTop > 0) {
        if (distanceRef.current !== 0) setDistance(0)
        setIsPulling(false)
        startYRef.current = scroller.scrollTop > 0 ? null : startY
        return
      }

      // 브라우저의 고무줄 스크롤을 막고 우리가 직접 그립니다.
      event.preventDefault()
      setIsPulling(true)
      setDistance(Math.min(delta * PULL_RESISTANCE, maxPull))
    }

    const handleTouchEnd = () => {
      startYRef.current = null
      setIsPulling(false)

      if (isRefreshingRef.current) return
      if (distanceRef.current < threshold) {
        setDistance(0)
        return
      }

      isRefreshingRef.current = true
      setIsRefreshing(true)
      setDistance(threshold)

      void (async () => {
        try {
          await onRefreshRef.current()
        } finally {
          isRefreshingRef.current = false
          setIsRefreshing(false)
          setDistance(0)
        }
      })()
    }

    // preventDefault를 쓰려면 touchmove는 passive가 아니어야 합니다.
    scroller.addEventListener('touchstart', handleTouchStart, { passive: true })
    scroller.addEventListener('touchmove', handleTouchMove, { passive: false })
    scroller.addEventListener('touchend', handleTouchEnd)
    scroller.addEventListener('touchcancel', handleTouchEnd)

    return () => {
      scroller.removeEventListener('touchstart', handleTouchStart)
      scroller.removeEventListener('touchmove', handleTouchMove)
      scroller.removeEventListener('touchend', handleTouchEnd)
      scroller.removeEventListener('touchcancel', handleTouchEnd)
    }
  }, [enabled, threshold, maxPull, setDistance])

  return { contentRef, pullDistance, isPulling, isRefreshing }
}
