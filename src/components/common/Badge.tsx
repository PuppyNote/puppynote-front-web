import type { HTMLAttributes } from 'react'

import { cn } from '@/utils/cn'

export type BadgeVariant = 'success' | 'warning' | 'error' | 'neutral'

const VARIANT_CLASS: Record<BadgeVariant, string> = {
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  error: 'bg-error-bg text-error',
  neutral: 'bg-ink-100 text-ink-500',
}

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  label: string
  variant?: BadgeVariant
}

/**
 * 네이티브 `components/common/item/Badge.tsx` 이식.
 * padding 12/4 · radius 9999 · 12px bold
 */
export default function Badge({ label, variant = 'neutral', className, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-md py-xs text-caption font-bold',
        VARIANT_CLASS[variant],
        className,
      )}
      {...rest}
    >
      {label}
    </span>
  )
}
