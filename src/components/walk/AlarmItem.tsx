import { cn } from '@/utils/cn'

export interface AlarmItemProps {
  id: string
  hour: string
  minute: string
  days: string[]
  enabled: boolean
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onPress: (id: string) => void
}

const DAY_LABELS: Record<string, string> = {
  MON: '월',
  TUE: '화',
  WED: '수',
  THU: '목',
  FRI: '금',
  SAT: '토',
  SUN: '일',
}
const DAY_ORDER = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

/** 네이티브 `components/walk/item/AlarmItem.tsx` 이식. */
export default function AlarmItem({
  id,
  hour,
  minute,
  days,
  enabled,
  onToggle,
  onDelete,
  onPress,
}: AlarmItemProps) {
  return (
    <div className="mb-lg flex items-center justify-between rounded-xl bg-white p-xl shadow-card">
      <button type="button" onClick={() => onPress(id)} className="min-w-0 flex-1 text-left">
        <p className="mb-sm text-heading font-bold text-ink-900">
          {hour}:{minute}
        </p>
        <div className="flex gap-1.5">
          {DAY_ORDER.map((day) => (
            <span
              key={day}
              className={cn(
                'text-caption font-semibold text-ink-300',
                days.includes(day) && 'text-brand',
              )}
            >
              {DAY_LABELS[day]}
            </span>
          ))}
        </div>
      </button>

      <div className="flex flex-col items-end gap-md">
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="알람 켜기/끄기"
          onClick={() => onToggle(id)}
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
        <button
          type="button"
          onClick={() => onDelete(id)}
          className="px-sm py-xs text-caption font-semibold text-error"
        >
          삭제
        </button>
      </div>
    </div>
  )
}
