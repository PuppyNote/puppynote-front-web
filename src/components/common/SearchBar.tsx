import type { FormEvent } from 'react'

import { SearchIcon } from './icons'
import { cn } from '@/utils/cn'

export interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onSearch: (value: string) => void
  /** 지우기 버튼. 넘기지 않으면 버튼 자체가 나오지 않습니다 (네이티브와 동일) */
  onClear?: () => void
  placeholder?: string
  /** 오른쪽 검색 버튼 노출 여부 */
  showSearchButton?: boolean
  disabled?: boolean
  className?: string
}

/**
 * 네이티브 `components/common/item/SearchBar.tsx` 이식.
 * 입력창 h50 / radius 12 / border #f1f5f9 / shadow, 검색 버튼 50×50 브랜드 radius 12
 *
 * 네이티브는 `onSubmitEditing`에서 키보드를 내리고 검색합니다. 웹은 form submit이 그 역할을
 * 하고, 모바일 키보드는 submit 시 자동으로 내려가므로 `blur()`를 따로 호출하지 않습니다.
 */
export default function SearchBar({
  value,
  onChange,
  onSearch,
  onClear,
  placeholder = '검색어를 입력하세요.',
  showSearchButton = true,
  disabled = false,
  className,
}: SearchBarProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSearch(value)
  }

  return (
    <form role="search" onSubmit={handleSubmit} className={cn('flex items-center', className)}>
      <div className="flex h-[50px] flex-1 items-center rounded-md border border-ink-100 bg-white px-lg shadow-card">
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          enterKeyHint="search"
          className={cn(
            'min-w-0 flex-1 bg-transparent text-body-lg text-ink-800 outline-none',
            'placeholder:text-ink-400',
            // iOS Safari가 type=search에 붙이는 기본 취소 버튼 제거 (아래 자체 버튼과 중복)
            '[&::-webkit-search-cancel-button]:hidden',
          )}
        />
        {value.length > 0 && onClear && (
          <button
            type="button"
            onClick={onClear}
            aria-label="검색어 지우기"
            className="ml-sm p-xs text-body-lg font-semibold text-ink-400"
          >
            <span aria-hidden>✕</span>
          </button>
        )}
      </div>

      {showSearchButton && (
        <button
          type="submit"
          disabled={disabled}
          aria-label="검색"
          className="ml-sm flex size-[50px] shrink-0 items-center justify-center rounded-md bg-brand text-white disabled:opacity-50"
        >
          <SearchIcon />
        </button>
      )}
    </form>
  )
}
