import { useState } from 'react'

import { Card, WheelPicker } from '@/components/common'
import { cn } from '@/utils/cn'

export interface WalkAlarmFormValue {
  hour: string
  minute: string
  days: string[]
  enabled: boolean
}

export interface WalkAlarmTimePickerProps {
  onSave: (value: WalkAlarmFormValue) => void
  onCancel: () => void
  initialData?: WalkAlarmFormValue
}

const DAYS = [
  { id: 'MON', label: '월' },
  { id: 'TUE', label: '화' },
  { id: 'WED', label: '수' },
  { id: 'THU', label: '목' },
  { id: 'FRI', label: '금' },
  { id: 'SAT', label: '토' },
  { id: 'SUN', label: '일' },
]

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
/** 5분 단위: 00, 05, 10 ... 55 (네이티브와 동일) */
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))

/** `initialData.minute`이 5분 눈금 사이 값이면 가장 가까운 눈금으로 맞춥니다. */
function roundToNearestMinuteStep(minute: string | undefined): string {
  if (!minute) return '30'
  const rounded = Math.round(Number(minute) / 5) * 5
  return String(rounded >= 60 ? 55 : rounded).padStart(2, '0')
}

/**
 * 산책 알람 등록/수정 폼. 네이티브 `components/common/card/TimePickerCard.tsx` 이식.
 * (네이티브는 공용 위치지만 실제 사용처가 산책 알람 하나뿐이라 `components/walk` 아래에 둡니다.)
 */
export default function WalkAlarmTimePicker({
  onSave,
  onCancel,
  initialData,
}: WalkAlarmTimePickerProps) {
  const [enabled, setEnabled] = useState(initialData?.enabled ?? true)
  const [hour, setHour] = useState(initialData?.hour ?? '09')
  const [minute, setMinute] = useState(roundToNearestMinuteStep(initialData?.minute))
  const [days, setDays] = useState<string[]>(initialData?.days ?? [])

  const toggleDay = (dayId: string) => {
    setDays((prev) => (prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]))
  }

  return (
    <Card className="rounded-4xl p-2xl">
      <div className="mb-2xl flex items-center justify-between">
        <span className="text-title font-bold text-ink-900">알림 설정</span>
        <div className="flex gap-sm">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full bg-ink-100 px-lg py-sm font-bold text-ink-600"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => onSave({ hour, minute, days, enabled })}
            className="rounded-full bg-brand px-lg py-sm font-bold text-ink-900"
          >
            저장
          </button>
        </div>
      </div>

      <div className="mb-2xl flex justify-between">
        {DAYS.map((day) => (
          <button
            key={day.id}
            type="button"
            onClick={() => toggleDay(day.id)}
            aria-pressed={days.includes(day.id)}
            className={cn(
              'flex size-9 items-center justify-center rounded-full border text-caption font-semibold',
              days.includes(day.id)
                ? 'border-brand bg-brand text-ink-900'
                : 'border-ink-100 bg-ink-50 text-ink-500',
            )}
          >
            {day.label}
          </button>
        ))}
      </div>

      <div className="relative mb-2xl flex items-center justify-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-[10%] top-1/2 h-[50px] -translate-y-1/2 rounded-md bg-brand-10"
        />
        <WheelPicker items={HOURS} value={hour} onChange={setHour} width={80} label="시" />
        <span className="mx-lg text-display-sm font-bold text-ink-900">:</span>
        <WheelPicker items={MINUTES} value={minute} onChange={setMinute} width={80} label="분" />
      </div>

      <div className="flex items-center justify-between border-t border-ink-100 pt-lg">
        <div>
          <p className="text-body-lg font-bold text-ink-800">알림 허용</p>
          <p className="text-body text-ink-500">설정된 시간에 알림이 전송됩니다.</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="알림 허용 여부"
          onClick={() => setEnabled((prev) => !prev)}
          className={cn(
            'relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors',
            enabled ? 'bg-brand' : 'bg-switch-off-track',
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 left-0.5 size-[27px] rounded-full bg-white shadow-input transition-transform',
              enabled && 'translate-x-5',
            )}
          />
        </button>
      </div>
    </Card>
  )
}
