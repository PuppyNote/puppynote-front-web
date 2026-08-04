import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  AddTopBar,
  CustomAlert,
  MultiImageSelector,
  Spinner,
  TimePickerModal,
} from '@/components/common'
import { useAlert } from '@/hooks/useAlert'
import { type CreateWalkPayload, walkApi } from '@/services/api/endpoints/walk'
import { type BucketKind, storageApi } from '@/services/api/endpoints/storage'
import { toErrorMessage } from '@/services/api/types'
import type { PickedWebImage } from '@/services/image/imagePicker'
import { getCurrentPosition } from '@/services/location/location'
import { usePet } from '@/services/pet/PetContext'
import { ROUTES } from '@/routes/paths'
import { formatToLocalDate } from '@/utils/date'

const WALK_PHOTO_BUCKET: BucketKind = 'WALK_PHOTO'
const MAX_PHOTOS = 5
/** 서울시청. 위치 조회에 실패해도 저장 자체는 막지 않기 위한 네이티브와 동일한 기본값. */
const DEFAULT_COORDS = { latitude: 37.5665, longitude: 126.978 }

const pad2 = (value: number) => String(value).padStart(2, '0')

function formatTime(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

/** 지금 시각을 5분 단위로 반올림합니다 (네이티브와 동일). */
function roundToFiveMinutes(date: Date): Date {
  const stepMs = 5 * 60 * 1000
  return new Date(Math.round(date.getTime() / stepMs) * stepMs)
}

/**
 * 산책 기록 추가 화면. 네이티브 `src/screens/walk/AddWalkScreen.tsx` 이식.
 *
 * 위치는 {@link getCurrentPosition}으로 좌표+주소를 받아 장소 입력칸을 자동으로 채웁니다.
 * 조회에 실패해도(권한 거부 등) 저장을 막지 않고 서울시청 좌표로 대체합니다 — 네이티브도
 * 좌표 없이 저장을 막지 않았습니다.
 */
export default function AddWalkPage() {
  const navigate = useNavigate()
  const { selectedPet } = usePet()
  const { alert, showSimpleAlert, hideAlert } = useAlert()

  const today = formatToLocalDate(new Date())

  const [coords, setCoords] = useState(DEFAULT_COORDS)
  const [isLocating, setIsLocating] = useState(true)
  const [location, setLocation] = useState('')

  const [startTime, setStartTime] = useState(() => formatTime(roundToFiveMinutes(new Date())))
  const [endTime, setEndTime] = useState(() => {
    const rounded = roundToFiveMinutes(new Date())
    return formatTime(new Date(rounded.getTime() + 20 * 60 * 1000))
  })
  const [isStartPickerOpen, setIsStartPickerOpen] = useState(false)
  const [isEndPickerOpen, setIsEndPickerOpen] = useState(false)

  const [memo, setMemo] = useState('')
  const [images, setImages] = useState<PickedWebImage[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const position = await getCurrentPosition()
        if (cancelled) return
        setCoords({ latitude: position.latitude, longitude: position.longitude })
        if (position.address) setLocation(position.address)
      } catch (error) {
        // 위치는 자동입력 편의용입니다. 실패해도 사용자가 직접 입력하면 되므로 조용히 넘어갑니다.
        console.warn('현재 위치를 가져오지 못했습니다.', error)
      } finally {
        if (!cancelled) setIsLocating(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const handleBack = () => navigate(-1)

  const handleSubmit = async () => {
    if (!selectedPet) {
      showSimpleAlert('알림', '먼저 우리 아이를 등록해주세요!')
      return
    }
    if (!location.trim()) {
      showSimpleAlert('알림', '산책 장소를 입력해주세요.')
      return
    }
    if (startTime >= endTime) {
      showSimpleAlert('알림', '종료 시간은 시작 시간보다 늦어야 합니다.')
      return
    }

    setIsSubmitting(true)
    try {
      const photoKeys = await Promise.all(
        images.map((image) => storageApi.uploadImage(WALK_PHOTO_BUCKET, image)),
      )

      const payload: CreateWalkPayload = {
        petId: selectedPet.id,
        startTime: `${today}T${startTime}:00`,
        endTime: `${today}T${endTime}:00`,
        latitude: Number(coords.latitude.toFixed(6)),
        longitude: Number(coords.longitude.toFixed(6)),
        location: location.trim(),
        memo: memo.trim(),
        photoKeys,
      }

      await walkApi.createWalk(payload)
      showSimpleAlert('성공', '산책 기록이 저장되었습니다.', () => navigate(ROUTES.WALK))
    } catch (error) {
      showSimpleAlert('오류', toErrorMessage(error, '산책 기록 저장 중 오류가 발생했습니다.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <AddTopBar title="산책 기록" onBack={handleBack} />

      <div className="flex-1 overflow-y-auto px-2xl pb-3xl">
        <section className="mb-2xl">
          <p className="mb-md text-body font-semibold text-ink-700">사진</p>
          <MultiImageSelector images={images} onChange={setImages} maxCount={MAX_PHOTOS} />
        </section>

        <section className="mb-xl">
          <label
            htmlFor="walk-location"
            className="mb-md block text-body font-semibold text-ink-700"
          >
            장소
          </label>
          <div className="flex items-center gap-sm">
            <input
              id="walk-location"
              type="text"
              placeholder={isLocating ? '위치를 확인하는 중...' : '장소를 입력하세요'}
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              className="w-full min-w-0 flex-1 rounded-md border border-ink-200 bg-ink-50 px-lg py-md text-body text-ink-900 placeholder:text-ink-400"
            />
            {isLocating && <Spinner className="size-5 shrink-0" />}
          </div>
        </section>

        <section className="mb-xl">
          <span className="mb-md block text-body font-semibold text-ink-700">날짜</span>
          <div className="w-full rounded-md border border-ink-200 bg-ink-100 px-lg py-md text-body text-ink-500">
            {today}
          </div>
        </section>

        <section className="mb-xl flex gap-md">
          <div className="flex-1">
            <span className="mb-md block text-body font-semibold text-ink-700">시작 시간</span>
            <button
              type="button"
              onClick={() => setIsStartPickerOpen(true)}
              className="w-full rounded-md border border-ink-200 bg-ink-50 px-lg py-md text-left text-body text-ink-900"
            >
              {startTime}
            </button>
          </div>
          <div className="flex-1">
            <span className="mb-md block text-body font-semibold text-ink-700">종료 시간</span>
            <button
              type="button"
              onClick={() => setIsEndPickerOpen(true)}
              className="w-full rounded-md border border-ink-200 bg-ink-50 px-lg py-md text-left text-body text-ink-900"
            >
              {endTime}
            </button>
          </div>
        </section>

        <section className="mb-3xl">
          <label htmlFor="walk-memo" className="mb-md block text-body font-semibold text-ink-700">
            메모
          </label>
          <textarea
            id="walk-memo"
            rows={4}
            placeholder="산책은 어땠나요?"
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
            className="w-full resize-none rounded-md border border-ink-200 bg-ink-50 px-lg py-md text-body text-ink-900 placeholder:text-ink-400"
          />
        </section>

        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={isSubmitting}
          className="flex w-full items-center justify-center rounded-full bg-brand py-3.5 font-bold text-ink-900 shadow-brand disabled:bg-ink-300"
        >
          {isSubmitting ? <Spinner className="size-6 text-ink-900" /> : '저장하기'}
        </button>
      </div>

      <TimePickerModal
        open={isStartPickerOpen}
        onClose={() => setIsStartPickerOpen(false)}
        onConfirm={setStartTime}
        initialTime={startTime}
        title="시작 시간"
      />
      <TimePickerModal
        open={isEndPickerOpen}
        onClose={() => setIsEndPickerOpen(false)}
        onConfirm={setEndTime}
        initialTime={endTime}
        title="종료 시간"
      />

      <CustomAlert alert={alert} onClose={hideAlert} />
    </div>
  )
}
