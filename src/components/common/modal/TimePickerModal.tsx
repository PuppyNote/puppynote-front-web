import { useMemo, useState } from 'react'

import BottomSheetModal from './BottomSheetModal'
import PickerConfirmButton from './PickerConfirmButton'
import WheelPicker from '../WheelPicker'

export interface TimePickerModalProps {
  open: boolean
  onClose: () => void
  /** `HH:mm` 형식으로 돌려줍니다. */
  onConfirm: (time: string) => void
  /** `HH:mm` */
  initialTime?: string
  title?: string
  /** 분 단위 간격 (기본 5분). 네이티브와 동일합니다. */
  minuteStep?: number
}

const pad2 = (value: number) => String(value).padStart(2, '0')

/**
 * 네이티브 `components/common/modal/TimePickerModal.tsx` 이식.
 *
 * `<input type="time">` 대신 {@link WheelPicker}를 씁니다 (OS 기본 피커는 디자인이 어긋남).
 * 분은 5분 단위만 고를 수 있어서, 넘겨받은 시간이 그 사이 값이면 가장 가까운 눈금으로 맞춥니다.
 */
export default function TimePickerModal({
  open,
  onClose,
  onConfirm,
  initialTime,
  title = '시간 선택',
  minuteStep = 5,
}: TimePickerModalProps) {
  return (
    <BottomSheetModal open={open} onClose={onClose} title={title}>
      {/* 열릴 때마다 새로 마운트해서 initialTime을 초기값으로만 읽습니다 (DatePickerModal과 동일) */}
      {open && (
        <TimePickerBody
          initialTime={initialTime}
          minuteStep={minuteStep}
          onConfirm={(time) => {
            onConfirm(time)
            onClose()
          }}
        />
      )}
    </BottomSheetModal>
  )
}

interface TimePickerBodyProps {
  initialTime?: string
  minuteStep: number
  onConfirm: (time: string) => void
}

function TimePickerBody({ initialTime, minuteStep, onConfirm }: TimePickerBodyProps) {
  const hours = useMemo(() => Array.from({ length: 24 }, (_, index) => pad2(index)), [])
  const minutes = useMemo(
    () =>
      Array.from({ length: Math.ceil(60 / minuteStep) }, (_, index) => pad2(index * minuteStep)),
    [minuteStep],
  )

  const [hour, setHour] = useState(() => {
    const parsed = initialTime?.split(':')[0]
    return parsed && hours.includes(parsed) ? parsed : '09'
  })

  const [minute, setMinute] = useState(() => {
    const parsed = initialTime?.split(':')[1]
    if (parsed === undefined || Number.isNaN(Number(parsed))) return minutes[0]

    // 가장 가까운 눈금으로 맞추되, 반올림이 60이 되면 마지막 눈금으로 내립니다.
    const rounded = Math.round(Number(parsed) / minuteStep) * minuteStep
    const normalized = pad2(rounded >= 60 ? 60 - minuteStep : rounded)
    return minutes.includes(normalized) ? normalized : minutes[0]
  })

  return (
    <>
      <div className="relative mb-2xl flex h-[150px] items-center justify-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-[10%] top-1/2 h-[50px] -translate-y-1/2 rounded-md bg-brand-10"
        />

        <WheelPicker items={hours} value={hour} onChange={setHour} width={100} label="시" />
        <span className="mx-md text-heading font-bold text-ink-900">:</span>
        <WheelPicker items={minutes} value={minute} onChange={setMinute} width={100} label="분" />
      </div>

      <PickerConfirmButton onClick={() => onConfirm(`${hour}:${minute}`)} />
    </>
  )
}
