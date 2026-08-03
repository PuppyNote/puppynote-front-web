import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'

import { Spinner } from './icons'
import { cn } from '@/utils/cn'

/** 서버 페이지 응답. 네이티브 `PagedFlatList`가 쓰는 형태와 동일합니다. */
export interface PageResult<T> {
  content: T[]
  totalPage: number
}

export interface PagedListProps<T> {
  /**
   * 페이지를 불러옵니다. **1부터** 시작합니다 (네이티브와 동일).
   *
   * 매 렌더마다 새 함수를 넘겨도 재요청이 일어나지 않도록 ref로 붙잡아 둡니다.
   * 조건이 바뀌어 처음부터 다시 받아야 하면 `reloadKey`를 바꾸세요.
   */
  fetchPage: (page: number) => Promise<PageResult<T>>
  renderItem: (item: T, index: number) => ReactNode
  keyExtractor: (item: T, index: number) => string | number
  /** 값이 바뀌면 1페이지부터 다시 불러옵니다 (탭 전환, 검색어 변경 등) */
  reloadKey?: string | number
  emptyText?: string
  /** 목록 위에 붙는 영역 (검색바 등). 스크롤과 같이 움직입니다. */
  header?: ReactNode
  className?: string
  listClassName?: string
  onError?: (error: unknown) => void
}

/**
 * 네이티브 `components/common/item/PagedFlatList.tsx` 이식 (프로토타입).
 *
 * RN `FlatList`의 `onEndReached` 대신 목록 끝의 감시용 요소를 `IntersectionObserver`로
 * 지켜보다가 화면에 들어오면 다음 페이지를 부릅니다. `rootMargin`을 줘서 바닥에 닿기 전에
 * 미리 받습니다.
 *
 * 미완성인 부분(기획서상 "난이도 높음"):
 *   - **가상 스크롤이 아닙니다.** 받은 항목을 전부 DOM에 그리므로 수천 건이 쌓이면 무거워집니다.
 *     실제 화면에 붙인 뒤 필요하면 windowing을 얹습니다.
 *   - 당겨서 새로고침(RefreshControl)은 없습니다. 웹뷰에서 body pull-to-refresh를 이미
 *     막아둔 상태라 별도 제스처 구현이 필요해서, 지금은 `reloadKey`로 대신합니다.
 */
export default function PagedList<T>(props: PagedListProps<T>) {
  /*
   * `reloadKey`가 바뀌면 목록·페이지·에러를 전부 처음 상태로 돌려야 합니다.
   * 이펙트에서 하나씩 setState 하는 대신 key로 통째로 다시 마운트시킵니다
   * ("상태를 전부 초기화하려면 key를 바꾼다"는 React 권장 방식).
   */
  return <PagedListInner {...props} key={String(props.reloadKey ?? '')} />
}

function PagedListInner<T>({
  fetchPage,
  renderItem,
  keyExtractor,
  emptyText = '데이터가 없습니다.',
  header,
  className,
  listClassName,
  onError,
}: PagedListProps<T>) {
  const fetchPageRef = useRef(fetchPage)
  const keyExtractorRef = useRef(keyExtractor)
  const onErrorRef = useRef(onError)

  // 렌더 중 ref 쓰기는 금지되어 있어 이펙트에서 갱신합니다.
  // 아래 로드 이펙트들보다 먼저 선언되어 있어야 최신 콜백이 반영됩니다.
  useEffect(() => {
    fetchPageRef.current = fetchPage
    keyExtractorRef.current = keyExtractor
    onErrorRef.current = onError
  })

  const [items, setItems] = useState<T[]>([])
  const [page, setPage] = useState(0)
  const [totalPage, setTotalPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const inFlightRef = useRef(false)
  /** 늦게 도착한 지난 요청이 최신 결과를 덮어쓰지 않도록 하는 토큰 */
  const requestIdRef = useRef(0)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async (targetPage: number, replace: boolean) => {
    // 이어붙이기(스크롤로 인한 다음 페이지)는 진행 중이면 무시하고,
    // 처음부터 다시 받기(replace)는 진행 중인 요청을 무효화하고 새로 시작합니다.
    if (!replace && inFlightRef.current) return

    const requestId = (requestIdRef.current += 1)
    inFlightRef.current = true
    setIsLoading(true)
    setError(null)

    try {
      const result = await fetchPageRef.current(targetPage)
      if (requestId !== requestIdRef.current) return

      setItems((previous) =>
        replace
          ? dedupe(result.content, keyExtractorRef.current)
          : dedupe([...previous, ...result.content], keyExtractorRef.current),
      )
      setTotalPage(result.totalPage)
      setPage(targetPage)
    } catch (caught) {
      if (requestId !== requestIdRef.current) return
      setError(caught)
      onErrorRef.current?.(caught)
    } finally {
      if (requestId === requestIdRef.current) {
        inFlightRef.current = false
        setIsLoading(false)
      }
    }
  }, [])

  // 마운트 시 1페이지. reloadKey가 바뀌면 이 컴포넌트 자체가 새로 마운트됩니다.
  useEffect(() => {
    void load(1, true)
  }, [load])

  // 첫 페이지를 받기 전(page === 0)에는 감시하지 않습니다. 초기 로드와 겹치기 때문입니다.
  const hasMore = page > 0 && page < totalPage

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore || error) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void load(page + 1, false)
      },
      // 바닥에 닿기 전에 미리 받아서 끊김을 줄입니다.
      { rootMargin: '200px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, page, error, load])

  const isEmpty = items.length === 0 && !isLoading && !error

  return (
    <div className={className}>
      {header}

      <ul className={cn('list-none', listClassName)}>
        {items.map((item, index) => (
          <li key={keyExtractor(item, index)}>{renderItem(item, index)}</li>
        ))}
      </ul>

      {isEmpty && <p className="mt-16 text-center text-body-lg text-ink-400">{emptyText}</p>}

      {isLoading && (
        <div className="flex justify-center py-xl">
          <Spinner />
        </div>
      )}

      {error !== null && (
        <div className="flex flex-col items-center gap-md py-xl">
          <p className="text-body text-ink-500">목록을 불러오지 못했습니다.</p>
          <button
            type="button"
            onClick={() => void load(page === 0 ? 1 : page + 1, page === 0)}
            className="rounded-full bg-brand px-xl py-sm text-body font-bold text-ink-900"
          >
            다시 시도
          </button>
        </div>
      )}

      <div ref={sentinelRef} aria-hidden />
    </div>
  )
}

/**
 * 같은 key를 가진 항목을 앞선 것만 남기고 걷어냅니다.
 * 페이지를 넘기는 사이에 새 글이 추가되면 경계에서 중복이 생기기 때문입니다.
 */
function dedupe<T>(items: T[], keyExtractor: (item: T, index: number) => string | number): T[] {
  const seen = new Set<string | number>()
  return items.filter((item, index) => {
    const key = keyExtractor(item, index)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
