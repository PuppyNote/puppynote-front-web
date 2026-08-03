import type { ElementType, HTMLAttributes } from 'react'

import { cn } from '@/utils/cn'

/**
 * 타이포그래피 스케일. 값은 디자인 스펙 §1-6 / §2에서 뽑은 것으로,
 * `@theme`의 `--text-*` 토큰과 1:1 대응합니다.
 */
export type TextVariant =
  | 'caption-xs'
  | 'caption'
  | 'body'
  | 'body-lg'
  | 'title-sm'
  | 'title'
  | 'heading'
  | 'display-sm'
  | 'display'

export type TextWeight = 'light' | 'normal' | 'medium' | 'semibold' | 'bold'

/** Tailwind가 클래스명을 정적으로 스캔하므로 문자열을 조립하지 않고 표로 둡니다. */
const VARIANT_CLASS: Record<TextVariant, string> = {
  'caption-xs': 'text-caption-xs',
  caption: 'text-caption',
  body: 'text-body',
  'body-lg': 'text-body-lg',
  'title-sm': 'text-title-sm',
  title: 'text-title',
  heading: 'text-heading',
  'display-sm': 'text-display-sm',
  display: 'text-display',
}

const WEIGHT_CLASS: Record<TextWeight, string> = {
  light: 'font-light',
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
}

type AllowedTag =
  'span' | 'p' | 'div' | 'label' | 'strong' | 'small' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5'

export interface CustomTextProps extends HTMLAttributes<HTMLElement> {
  /** 렌더링할 태그. 문서 구조에 맞는 것을 고르세요 (기본 span) */
  as?: AllowedTag
  variant?: TextVariant
  weight?: TextWeight
}

/**
 * 네이티브 `CustomText`의 웹 대응.
 *
 * 네이티브에서는 폰트 패밀리를 강제하는 것이 주 역할이었지만(RN Text 기본 폰트가
 * 플랫폼마다 다름), 웹은 `body`에서 이미 폰트를 지정하므로 여기서는 **타이포 스케일을
 * 이름으로 고정하는 역할**만 합니다. 화면 코드에 `text-[15px]` 같은 임의값이 퍼지는 걸 막습니다.
 */
export default function CustomText({
  as: tag = 'span',
  variant = 'body',
  weight,
  className,
  children,
  ...rest
}: CustomTextProps) {
  const Component = tag as ElementType

  return (
    <Component
      className={cn(VARIANT_CLASS[variant], weight && WEIGHT_CLASS[weight], className)}
      {...rest}
    >
      {children}
    </Component>
  )
}
