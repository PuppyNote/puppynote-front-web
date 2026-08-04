import { useState } from 'react'

import { Card } from '@/components/common'
import { cn } from '@/utils/cn'

export interface CalendarProps {
  onDateSelect?: (date: Date) => void
  onMonthChange?: (year: number, month: number) => void
  /** 조회 중인 달에서 산책이 있었던 날짜(일) 배열. 예: [2, 5, 10] */
  walkDates?: number[]
  selectedDate?: Date
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']
const MONTH_LABELS = [
  '1월',
  '2월',
  '3월',
  '4월',
  '5월',
  '6월',
  '7월',
  '8월',
  '9월',
  '10월',
  '11월',
  '12월',
]

/**
 * 산책 캘린더. 네이티브 `components/walk/card/Calendar.tsx` 이식.
 *
 * 원래 slate 대신 gray 계열(`#9ca3af`, `#6b7280`)을 쓰던 화면 텍스트가 있었지만, 이 컴포넌트
 * 자체는 처음부터 slate(ink)만 썼습니다 (마이그레이션 문서 §4 불일치 #2는 `WalkManagement`
 * 화면 쪽 캡션 얘기입니다).
 */
export default function Calendar({
  onDateSelect,
  onMonthChange,
  walkDates = [],
  selectedDate = new Date(),
}: CalendarProps) {
  const [viewDate, setViewDate] = useState(new Date())

  const today = new Date()
  const isTodayMonth =
    viewDate.getFullYear() === today.getFullYear() && viewDate.getMonth() === today.getMonth()

  const currentYear = viewDate.getFullYear()
  const currentMonth = viewDate.getMonth()

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

  const goToMonth = (delta: number) => {
    const newDate = new Date(currentYear, currentMonth + delta, 1)
    setViewDate(newDate)
    onMonthChange?.(newDate.getFullYear(), newDate.getMonth() + 1)
  }

  const calendarDays: (number | null)[] = [
    ...Array<null>(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ]

  return (
    <Card className="mb-2xl p-lg">
      <div className="mb-xl flex items-center justify-between">
        <span className="text-title-sm font-bold text-ink-900">
          {MONTH_LABELS[currentMonth]} {currentYear}
        </span>
        <div className="flex gap-sm">
          <button
            type="button"
            onClick={() => goToMonth(-1)}
            aria-label="이전 달"
            className="rounded-sm bg-ink-50 p-sm text-caption text-ink-500"
          >
            ◀
          </button>
          <button
            type="button"
            onClick={() => goToMonth(1)}
            aria-label="다음 달"
            className="rounded-sm bg-ink-50 p-sm text-caption text-ink-500"
          >
            ▶
          </button>
        </div>
      </div>

      <div className="mb-md flex justify-between border-b border-ink-100 pb-sm">
        {DAY_LABELS.map((day) => (
          <span key={day} className="w-[14.28%] text-center text-caption-xs font-bold text-ink-400">
            {day}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap justify-start">
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="mb-xs h-12 w-[14.28%]" />
          }

          const isToday = isTodayMonth && day === today.getDate()
          const isSelected =
            !isToday &&
            selectedDate.getDate() === day &&
            selectedDate.getMonth() === currentMonth &&
            selectedDate.getFullYear() === currentYear
          const hasWalk = walkDates.includes(day)

          return (
            <button
              key={day}
              type="button"
              onClick={() => onDateSelect?.(new Date(currentYear, currentMonth, day))}
              className="mb-xs flex h-12 w-[14.28%] items-center justify-center"
            >
              <span
                className={cn(
                  'flex size-8 items-center justify-center rounded-full border-2 border-transparent text-body font-medium text-ink-700',
                  !isToday && hasWalk && 'bg-amber-50',
                  isSelected && 'border-brand',
                  isToday && 'border-brand bg-brand text-white font-bold',
                  !isToday && hasWalk && 'font-bold text-brand',
                  isSelected && 'font-bold text-brand',
                )}
              >
                {day}
              </span>
            </button>
          )
        })}
      </div>
    </Card>
  )
}
