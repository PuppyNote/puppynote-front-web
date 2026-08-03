export type ClassValue = string | number | false | null | undefined

/**
 * 조건부 className 합치기.
 *
 * clsx/tailwind-merge를 넣지 않고 최소 구현만 둡니다. 충돌 해소(merge) 기능은 없으므로
 * 호출부에서 오버라이드용 `className`을 **항상 마지막 인자**로 넘기세요.
 */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ')
}
