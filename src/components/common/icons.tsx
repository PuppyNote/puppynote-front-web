import type { SVGProps } from 'react'

import { cn } from '@/utils/cn'

/**
 * 인라인 SVG 아이콘.
 *
 * 네이티브는 `@expo/vector-icons`(Ionicons)와 PNG 에셋을 섞어 씁니다. PNG는
 * `public/assets/`로 옮겨왔고, 벡터 아이콘은 의존성을 늘리지 않기 위해 여기에 직접 둡니다.
 * `currentColor`를 쓰므로 `text-*` 클래스로 색을 바꿉니다.
 */

/** Ionicons `search` 대응 (SearchBar 검색 버튼) */
export function SearchIcon({ className, ...rest }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      aria-hidden
      className={cn('size-6', className)}
      {...rest}
    >
      <circle cx={11} cy={11} r={7} />
      <path d="m20 20-3.8-3.8" />
    </svg>
  )
}

/** 로딩 인디케이터 (네이티브 ActivityIndicator 대응, 브랜드 색) */
export function Spinner({ className, ...rest }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      role="status"
      aria-label="불러오는 중"
      className={cn('size-6 animate-spin text-brand', className)}
      {...rest}
    >
      <circle cx={12} cy={12} r={9} stroke="currentColor" strokeWidth={2.5} opacity={0.2} />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </svg>
  )
}
