/**
 * 날짜 유틸. 네이티브 `src/utils/DateUtil.ts` 이식.
 */

/** `Date`를 `YYYY-MM-DD`(로컬 기준)로. `toISOString()`의 UTC 변환 문제를 피합니다. */
export function formatToLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** `YYYY-MM` (산책 캘린더 월 단위 조회에 씁니다). `month`는 1~12입니다. */
export function formatToLocalYearMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

/**
 * 두 날짜의 일수 차이 (target - base). 미래면 양수, 과거면 음수입니다.
 * 시각은 버리고 날짜만 비교합니다.
 */
export function calculateDaysDifference(targetDate: string, baseDate: Date = new Date()): number {
  const target = new Date(targetDate)
  target.setHours(0, 0, 0, 0)

  const base = new Date(baseDate)
  base.setHours(0, 0, 0, 0)

  return Math.ceil((target.getTime() - base.getTime()) / (1000 * 60 * 60 * 24))
}
