import { useMemo, useState } from 'react'

import BottomSheetModal from './BottomSheetModal'
import PickerConfirmButton from './PickerConfirmButton'
import WheelPicker from '../WheelPicker'

export interface DatePickerModalProps {
  open: boolean
  onClose: () => void
  /** `YYYY-MM-DD` 형식으로 돌려줍니다. */
  onConfirm: (date: string) => void
  /** `YYYY-MM-DD` */
  initialDate?: string
  title?: string
  /** 선택 가능한 연도 개수 (기본 30 = 올해부터 29년 전까지) */
  yearRange?: number
}

const pad2 = (value: number) => String(value).padStart(2, '0')

/** 그 달의 마지막 날. `new Date(y, m, 0)`은 m월의 0일 = m-1월의 마지막 날입니다. */
function getDaysInMonth(year: string, month: string): number {
  return new Date(Number(year), Number(month), 0).getDate()
}

/**
 * 네이티브 `components/common/modal/DatePickerModal.tsx` 이식.
 *
 * OS 기본 피커(`<input type="date">`)를 쓰지 않습니다. 안드로이드/iOS/브라우저마다 생김새가
 * 전부 달라서 앱과 디자인이 어긋나기 때문입니다. 대신 {@link WheelPicker} 3개를 나란히 둡니다.
 */
export default function DatePickerModal({
  open,
  onClose,
  onConfirm,
  initialDate,
  title = '날짜 선택',
  yearRange = 30,
}: DatePickerModalProps) {
  return (
    <BottomSheetModal open={open} onClose={onClose} title={title}>
      {/*
        내용을 별도 컴포넌트로 떼어 열릴 때마다 새로 마운트되게 했습니다.
        그래야 initialDate를 useState 초기값으로 한 번만 읽으면 되고,
        닫았다 열었을 때 이전 조작이 남지 않습니다. (이펙트에서 setState 하지 않으려는 목적)
      */}
      {open && (
        <DatePickerBody
          initialDate={initialDate}
          yearRange={yearRange}
          onConfirm={(date) => {
            onConfirm(date)
            onClose()
          }}
        />
      )}
    </BottomSheetModal>
  )
}

interface DatePickerBodyProps {
  initialDate?: string
  yearRange: number
  onConfirm: (date: string) => void
}

function DatePickerBody({ initialDate, yearRange, onConfirm }: DatePickerBodyProps) {
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: yearRange }, (_, index) => String(currentYear - index))
  }, [yearRange])

  const months = useMemo(() => Array.from({ length: 12 }, (_, index) => pad2(index + 1)), [])

  const [year, setYear] = useState(() => {
    const parsed = initialDate?.split('-')[0]
    return parsed && years.includes(parsed) ? parsed : years[0]
  })
  const [month, setMonth] = useState(() => {
    const parsed = initialDate?.split('-')[1]
    return parsed && months.includes(parsed) ? parsed : '01'
  })
  const [day, setDay] = useState(() => initialDate?.split('-')[2] ?? '01')

  const daysInMonth = getDaysInMonth(year, month)
  const days = useMemo(
    () => Array.from({ length: daysInMonth }, (_, index) => pad2(index + 1)),
    [daysInMonth],
  )

  // 31일을 고른 상태에서 2월로 바꾸는 경우처럼 존재하지 않는 날이 되면 마지막 날로 당깁니다.
  // 상태를 고쳐 쓰지 않고 렌더할 때마다 계산해서, 표시와 확인 값이 항상 같게 둡니다.
  const safeDay = Number(day) > daysInMonth ? pad2(daysInMonth) : day

  return (
    <>
      <div className="relative mb-2xl flex h-[150px] items-center justify-center">
        {/* 가운데 선택 영역 강조. 피커보다 먼저 그려서 뒤에 깔립니다. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-1/2 h-[50px] -translate-y-1/2 rounded-md bg-brand-10"
        />

        <WheelPicker items={years} value={year} onChange={setYear} width={100} label="년" />
        <span className="mx-xs text-body-lg font-medium text-ink-600">년</span>
        <WheelPicker items={months} value={month} onChange={setMonth} width={60} label="월" />
        <span className="mx-xs text-body-lg font-medium text-ink-600">월</span>
        <WheelPicker items={days} value={safeDay} onChange={setDay} width={60} label="일" />
        <span className="mx-xs text-body-lg font-medium text-ink-600">일</span>
      </div>

      <PickerConfirmButton onClick={() => onConfirm(`${year}-${month}-${safeDay}`)} />
    </>
  )
}
