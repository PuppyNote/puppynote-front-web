import type { HTMLAttributes } from 'react'

import { cn } from '@/utils/cn'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** 기본 패딩(20px)을 빼고 직접 채우고 싶을 때 (이미지가 카드 끝까지 차는 경우 등) */
  flush?: boolean
}

/**
 * 네이티브 `components/common/card/Card.tsx` 이식.
 * white / radius 16 / padding 20 / border #f1f5f9 / shadow 0 2px 8px rgba(0,0,0,0.05)
 */
export default function Card({ flush = false, className, children, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-ink-100 bg-white shadow-card',
        flush ? 'overflow-hidden' : 'p-xl',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}
