import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { FloatingActionButton, Spinner } from '@/components/common'
import { AlarmManagementModal, Calendar, WalkDetailModal } from '@/components/walk'
import { walkApi, type WalkHistory } from '@/services/api/endpoints/walk'
import { usePet } from '@/services/pet/PetContext'
import { ROUTES } from '@/routes/paths'
import { formatToLocalDate, formatToLocalYearMonth } from '@/utils/date'

/**
 * 산책 관리 화면. 네이티브 `src/screens/walk/WalkManagement.tsx` 이식.
 *
 * 상단 펫 탭은 {@link ../layouts/TabLayout}이 그립니다(`ROUTES.WALK`가 이미
 * `PET_TAB_ROUTES`에 있습니다). 네이티브는 `useIsFocused`로 화면에 돌아올 때마다 다시
 * 불러오지만, 여기서는 산책 기록 추가 화면이 별도 라우트라 이 페이지가 언마운트됐다가
 * 다시 마운트되므로 평범한 마운트 이펙트로 같은 효과를 냅니다.
 */
export default function WalkPage() {
  const navigate = useNavigate()
  const { selectedPet, isLoadingPet } = usePet()

  const [isAlarmModalOpen, setIsAlarmModalOpen] = useState(false)
  const [selectedWalkId, setSelectedWalkId] = useState<number | null>(null)
  const [walkDates, setWalkDates] = useState<number[]>([])
  const [walkHistory, setWalkHistory] = useState<WalkHistory[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isLoading, setIsLoading] = useState(false)

  const fetchCalendarData = useCallback(async (petId: number, year: number, month: number) => {
    try {
      const data = await walkApi.getWalkCalendar(petId, formatToLocalYearMonth(year, month))
      setWalkDates(
        data.filter((item) => item.hasWalk).map((item) => Number(item.date.split('-')[2])),
      )
    } catch (error) {
      console.warn('캘린더 정보를 불러오지 못했습니다.', error)
    }
  }, [])

  const fetchWalkHistory = useCallback(async (petId: number, date: Date) => {
    setIsLoading(true)
    try {
      setWalkHistory(await walkApi.getWalkHistory(petId, formatToLocalDate(date)))
    } catch (error) {
      console.warn('산책 이력을 불러오지 못했습니다.', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isLoadingPet || !selectedPet) return
    void (async () => {
      await Promise.all([
        fetchCalendarData(selectedPet.id, selectedDate.getFullYear(), selectedDate.getMonth() + 1),
        fetchWalkHistory(selectedPet.id, selectedDate),
      ])
    })()
    // 최초 진입 + 펫 변경 시에만 다시 불러옵니다. 날짜 이동은 아래 handleDateSelect가 담당합니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingPet, selectedPet?.id, fetchCalendarData, fetchWalkHistory])

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    if (selectedPet) void fetchWalkHistory(selectedPet.id, date)
  }

  const refreshAfterChange = () => {
    if (!selectedPet) return
    void fetchCalendarData(selectedPet.id, selectedDate.getFullYear(), selectedDate.getMonth() + 1)
    void fetchWalkHistory(selectedPet.id, selectedDate)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="px-2xl pt-lg pb-sm">
        <button
          type="button"
          onClick={() => setIsAlarmModalOpen(true)}
          className="flex w-full items-center gap-lg rounded-xl bg-white p-lg text-left shadow-card"
        >
          <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-amber-100">
            <span aria-hidden className="text-heading leading-none">
              ⏰
            </span>
          </span>
          <span>
            <span className="block text-body-lg font-bold text-ink-900">산책 관리</span>
            <span className="mt-0.5 block text-caption text-ink-400">
              산책 및 알림을 관리하세요
            </span>
          </span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2xl pt-md pb-[120px]">
        <Calendar
          walkDates={walkDates}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          onMonthChange={(year, month) =>
            selectedPet && void fetchCalendarData(selectedPet.id, year, month)
          }
        />

        {isLoading ? (
          <div className="mt-xl flex justify-center">
            <Spinner className="size-9" />
          </div>
        ) : !selectedPet ? (
          <EmptyMessage text="반려동물을 등록해주세요 🐶" />
        ) : walkHistory.length === 0 ? (
          <EmptyMessage text="이 날은 산책 기록이 없어요 🐾" />
        ) : (
          walkHistory.map((walk) => (
            <WalkCard key={walk.walkId} walk={walk} onPress={setSelectedWalkId} />
          ))
        )}
      </div>

      <FloatingActionButton label="산책 기록 추가" onClick={() => navigate(ROUTES.ADD_WALK)} />

      <AlarmManagementModal open={isAlarmModalOpen} onClose={() => setIsAlarmModalOpen(false)} />

      <WalkDetailModal
        open={selectedWalkId !== null}
        walkId={selectedWalkId}
        onClose={() => setSelectedWalkId(null)}
        onDeleted={refreshAfterChange}
      />
    </div>
  )
}

function EmptyMessage({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center py-4xl">
      <p className="text-body text-ink-400">{text}</p>
    </div>
  )
}

interface WalkCardProps {
  walk: WalkHistory
  onPress: (walkId: number) => void
}

function WalkCard({ walk, onPress }: WalkCardProps) {
  const startTime = new Date(walk.startTime)
  const endTime = new Date(walk.endTime)
  const pad2 = (value: number) => String(value).padStart(2, '0')
  const timeRange = `${pad2(startTime.getHours())}:${pad2(startTime.getMinutes())} - ${pad2(endTime.getHours())}:${pad2(endTime.getMinutes())}`

  return (
    <button
      type="button"
      onClick={() => onPress(walk.walkId)}
      className="mb-2xl flex w-full gap-lg rounded-lg bg-white p-lg text-left shadow-card"
    >
      {walk.photoUrl ? (
        <img
          src={walk.photoUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="size-16 shrink-0 rounded-sm object-cover"
        />
      ) : (
        <span className="flex size-16 shrink-0 items-center justify-center rounded-sm bg-ink-100 text-heading">
          🐕
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-title-sm font-bold text-ink-900">{walk.location}</p>
        <p className="mt-0.5 text-body text-ink-500">{timeRange}</p>
        {walk.memo && <p className="mt-xs line-clamp-2 text-caption text-ink-400">{walk.memo}</p>}
      </div>
    </button>
  )
}
