import { useEffect, useRef, useState } from 'react'
import Markdown from 'markdown-to-jsx'

import { Card, CustomAlert, SearchBar, Spinner } from '@/components/common'
import { useAlert } from '@/hooks/useAlert'
import { foodApi, type FoodItem } from '@/services/api/endpoints/food'
import { isApiError } from '@/services/api/types'
import { cn } from '@/utils/cn'

const SAFETY_INFO: Record<
  FoodItem['safetyLevel'],
  { borderColor: string; bg: string; icon: string; label: string }
> = {
  GOOD: { borderColor: 'var(--color-success)', bg: 'bg-success-bg', icon: '🐾', label: '안전' },
  NOTION: { borderColor: 'var(--color-warning)', bg: 'bg-warning-bg', icon: '⚠️', label: '주의' },
  BAD: { borderColor: 'var(--color-error)', bg: 'bg-error-bg', icon: '🚨', label: '위험' },
}

/** 마크다운 태그를 네이티브 `markdownStyles`와 같은 톤으로. */
const MARKDOWN_OVERRIDES = {
  p: { props: { className: 'mb-sm' } },
  strong: { props: { className: 'font-bold text-ink-800' } },
  h1: { props: { className: 'mb-sm text-title-sm font-bold text-ink-800' } },
  h2: { props: { className: 'mb-sm text-body-lg font-bold text-ink-800' } },
  ul: { props: { className: 'mb-sm list-disc pl-lg' } },
  ol: { props: { className: 'mb-sm list-decimal pl-lg' } },
  code: { props: { className: 'rounded-sm bg-ink-100 px-xs text-error' } },
}

function FoodCard({ item, initialExpanded = false }: { item: FoodItem; initialExpanded?: boolean }) {
  const [expanded, setExpanded] = useState(initialExpanded)
  const status = SAFETY_INFO[item.safetyLevel]
  const plainAnswer = item.answer.replace(/[#*`]/g, '')

  return (
    <button
      type="button"
      onClick={() => setExpanded((prev) => !prev)}
      className="block w-full text-left"
    >
      {/*
        border 색은 Tailwind 클래스(예: border-error) 대신 style로 직접 줍니다.
        Card 기본 클래스에 이미 border-ink-100이 있어서, cn()은 병합(merge) 없이 그냥
        이어붙이기만 하다 보니 두 border-color 클래스가 동시에 붙고 최종 색은 클래스
        선언 순서가 아니라 컴파일된 CSS의 등장 순서로 정해집니다. success/warning은
        우연히 순서가 맞아 보였지만 error는 반대로 밀려 항상 회색 테두리로 덮였습니다.
      */}
      <Card
        className="mb-lg rounded-3xl border-2 p-xl"
        style={{ borderColor: status.borderColor }}
      >
        <div className="flex items-center justify-between">
          <div className="mr-md min-w-0 flex-1">
            <p className="mb-xs text-caption font-bold text-ink-500">{status.label}</p>
            <p className="text-title-sm font-bold text-ink-900">{item.question}</p>
          </div>
          <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-full', status.bg)}>
            <span aria-hidden className="text-[22px] leading-none">
              {status.icon}
            </span>
          </span>
        </div>

        {(expanded || item.answer.length > 0) && (
          <div className="mt-md border-t border-ink-100 pt-md">
            {expanded ? (
              <>
                <div className="text-body text-ink-600">
                  <Markdown options={{ overrides: MARKDOWN_OVERRIDES }}>{item.answer}</Markdown>
                </div>
                <div className="mt-lg flex justify-center">
                  <span aria-hidden className="text-ink-400">
                    ▲
                  </span>
                </div>
              </>
            ) : (
              <>
                <p className="line-clamp-2 text-body text-ink-600">{plainAnswer}</p>
                {item.answer.length > 60 && (
                  <div className="mt-md flex justify-center">
                    <span aria-hidden className="text-ink-400">
                      ▼
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </Card>
    </button>
  )
}

/**
 * 음식 안전정보 화면. 네이티브 `src/screens/food/FoodScreen.tsx` 이식.
 *
 * "AI 채팅"이라는 티켓 이름과 달리 실제로는 대화 스레드가 아니라, 검색 결과가 없을 때
 * 한 번 확인받고 단건 AI 답변으로 대체하는 검색 화면입니다(네이티브 원본에 메시지 목록/스트리밍
 * 코드가 없습니다 — `foodService.searchFoodAi`도 평범한 POST-JSON 한 번 호출입니다).
 */
export default function FoodPage() {
  const [keyword, setKeyword] = useState('')
  const [foods, setFoods] = useState<FoodItem[]>([])
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isAiSearching, setIsAiSearching] = useState(false)
  const [isAiResult, setIsAiResult] = useState(false)
  const [showAiConfirm, setShowAiConfirm] = useState(false)
  const { alert, showSimpleAlert, hideAlert } = useAlert()

  const search = async (isInitial: boolean) => {
    const currentPage = isInitial ? 0 : page + 1
    setIsLoading(true)
    try {
      const response = await foodApi.searchFoods(keyword.trim() || undefined, currentPage)
      if (isInitial) {
        setIsAiResult(false)
        setFoods(response.content)
        setShowAiConfirm(response.content.length === 0)
      } else {
        setFoods((prev) => [...prev, ...response.content])
      }
      setTotalCount(response.totalCount)
      setPage(currentPage)
    } catch (error) {
      console.error('음식 검색 실패', error)
      showSimpleAlert('오류', '검색 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 검색어가 바뀌면 500ms 후 처음부터 다시 검색합니다 (네이티브와 동일한 디바운스).
  useEffect(() => {
    const timer = window.setTimeout(() => void search(true), 500)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword])

  const handleAiSearch = async () => {
    setShowAiConfirm(false)
    setIsAiSearching(true)
    try {
      const result = await foodApi.askAi(keyword)
      setIsAiResult(true)
      setFoods([result])
      setTotalCount(1)
    } catch (error) {
      console.error('AI 검색 실패', error)
      if (isApiError(error) && error.statusCode === 400) {
        showSimpleAlert('알림', '음식과 관련 없는 질문이거나 AI가 답변할 수 없습니다.')
      } else {
        showSimpleAlert('오류', 'AI 검색 중 오류가 발생했습니다.')
      }
    } finally {
      setIsAiSearching(false)
    }
  }

  const hasMore = foods.length < totalCount
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore || isLoading) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void search(false)
      },
      { rootMargin: '200px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, isLoading])

  return (
    <div className="flex h-full flex-col px-lg pt-lg">
      <SearchBar
        placeholder="음식이름을 입력하세요."
        value={keyword}
        onChange={setKeyword}
        onSearch={() => void search(true)}
        onClear={() => setKeyword('')}
        className="mb-2xl shrink-0"
      />

      {isAiSearching ? (
        <div className="flex flex-1 flex-col items-center justify-center">
          <Spinner className="size-9" />
          <p className="mt-lg text-body-lg text-ink-600">AI가 최적의 답변을 생성 중입니다...</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pb-4xl">
          {foods.map((item) => (
            <FoodCard key={item.id} item={item} initialExpanded={isAiResult} />
          ))}

          {foods.length === 0 && !isLoading && (
            <>
              {keyword.trim() && showAiConfirm ? (
                <div className="mt-3xl flex flex-col items-center px-xl text-center">
                  <span aria-hidden className="text-[48px] leading-none">
                    ✨
                  </span>
                  <p className="mt-lg text-title-sm font-bold text-ink-800">검색 결과가 없습니다.</p>
                  <p className="mt-sm text-body-lg text-ink-500">
                    AI에게 물어보면 더 정확한 정보를 얻을 수 있어요!
                    <br />
                    &apos;{keyword}&apos;에 대해 물어볼까요?
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleAiSearch()}
                    className="mt-2xl w-full rounded-md bg-brand py-lg font-bold text-white"
                  >
                    AI에게 물어보기
                  </button>
                </div>
              ) : (
                <div className="mt-4xl flex justify-center">
                  <p className="text-body-lg text-ink-400">궁금한 음식을 검색해보세요!</p>
                </div>
              )}
            </>
          )}

          {isLoading && (
            <div className="flex justify-center py-xl">
              <Spinner />
            </div>
          )}

          <div ref={sentinelRef} aria-hidden />
        </div>
      )}

      <CustomAlert alert={alert} onClose={hideAlert} />
    </div>
  )
}
