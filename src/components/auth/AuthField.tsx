import type { InputHTMLAttributes, ReactNode } from 'react'

import { cn } from '@/utils/cn'

export interface AuthFieldProps {
  label?: string
  /** 필드 아래 빨간 안내 문구 */
  errorMessage?: string
  children: ReactNode
  className?: string
}

/**
 * 라벨 + 입력 + 에러 문구 묶음.
 * 네이티브 `RegisterScreen`의 `label` / `errorMessage` 스타일을 그대로 옮겼습니다.
 */
export function AuthField({ label, errorMessage, children, className }: AuthFieldProps) {
  return (
    <div className={className}>
      {label && (
        <label className="mb-sm ml-xs block text-body font-semibold text-ink-600">{label}</label>
      )}
      {children}
      {errorMessage && (
        <p className="mt-[6px] ml-xs text-caption font-medium text-error">{errorMessage}</p>
      )}
    </div>
  )
}

export interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** true면 빨간 테두리 */
  invalid?: boolean
}

/**
 * 인증 화면 공통 입력창.
 * px20 py16 / 흰 배경 / radius 16 / shadow-input / 기본은 투명 테두리, 에러일 때만 빨간 테두리.
 *
 * 네이티브는 안드로이드에서 입력 폰트를 monospace로 지정하고 있는데(플랫폼별 폰트 통일 목적으로
 * 보이지만 결과적으로 고정폭 글꼴), 웹은 body에서 정한 폰트를 그대로 씁니다.
 * 포커스 링은 네이티브에 없지만 키보드 조작이 가능한 웹에서는 필요해 브랜드 테두리로 넣었습니다.
 */
export function AuthInput({ invalid = false, className, ...rest }: AuthInputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(
        'w-full min-w-0 rounded-lg border bg-white px-xl py-lg text-body text-ink-900 shadow-input outline-none',
        'placeholder:text-ink-400 disabled:bg-ink-50 disabled:text-ink-500',
        invalid ? 'border-error' : 'border-transparent focus:border-brand',
        className,
      )}
      {...rest}
    />
  )
}
