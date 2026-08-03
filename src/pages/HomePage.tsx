import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import { Badge, CustomAlert, Spinner } from '@/components/common'
import PetRegistrationModal from '@/components/pet/PetRegistrationModal'
import { useAlert } from '@/hooks/useAlert'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { homeApi, type HomeInfo } from '@/services/api/endpoints/home'
import { petItemApi, type PetItem } from '@/services/api/endpoints/petItem'
import { petTipApi } from '@/services/api/endpoints/petTip'
import { getWeatherEmoji, weatherApi, type WeatherInfo } from '@/services/api/endpoints/weather'
import { getCurrentCoordinates } from '@/services/location/location'
import { usePet } from '@/services/pet/PetContext'
import { ROUTES } from '@/routes/paths'
import { copyToClipboard } from '@/utils/clipboard'
import { cn } from '@/utils/cn'
import { calculateDaysDifference } from '@/utils/date'

/** 소진까지 이 일수 이하로 남은 용품만 홈에 올립니다. */
const URGENT_SUPPLY_DAYS = 7
/** 홈에 노출할 소진 임박 용품 개수 */
const URGENT_SUPPLY_LIMIT = 3
/** 선택된 펫이 없는 상태를 나타내는 키 (펫 id는 1부터라 겹치지 않습니다) */
const NO_PET = 0

/**
 * 홈 화면. 네이티브 `src/screens/home/HomeScreen.tsx` 이식.
 *
 * 상단 펫 탭과 하단 탭은 {@link ../layouts/TabLayout}이 그리고, 이 페이지는 본문만 담당합니다.
 *
 * 카드마다 radius/그림자가 제각각이라(32 / 28 / 24 …) 공통 `Card`를 쓰지 않고 직접 그렸습니다.
 * `cn()`은 Tailwind 클래스 충돌을 정리해 주지 않아서, `Card`의 기본 `rounded-lg`·`shadow-card`
 * 위에 다른 값을 덧씌우면 어느 쪽이 이길지가 CSS 출력 순서에 달리기 때문입니다.
 *
 * 네이티브에는 스크롤 맨 아래 120px 여백(`footerSpacer`)이 있습니다. 하단 탭이 화면 위에
 * 떠 있어서 마지막 카드가 가리는 걸 막으려는 것인데, 웹은 탭 바가 레이아웃 안에 자리를
 * 차지하므로 그만큼이 필요 없어 `pb-3xl`만 둡니다.
 */
export default function HomePage() {
  const navigate = useNavigate()
  const { selectedPet, isLoadingPet, refreshPets } = usePet()
  const { alert, showSimpleAlert, hideAlert } = useAlert()

  const [homeInfo, setHomeInfo] = useState<HomeInfo | null>(null)
  const [urgentSupplies, setUrgentSupplies] = useState<PetItem[]>([])
  const [currentTip, setCurrentTip] = useState('')
  const [weather, setWeather] = useState<WeatherInfo | null>(null)
  const [isPetModalOpen, setIsPetModalOpen] = useState(false)

  /**
   * 지금 화면이 어느 펫의 데이터를 그려야 하는지. 펫이 없으면 `NO_PET`,
   * 펫 목록을 아직 확인하는 중이면 null입니다(그 사이에 부르면 '펫 없음'으로 잘못 그려집니다).
   */
  const targetPetKey = isLoadingPet ? null : (selectedPet?.id ?? NO_PET)
  /** 실제로 다 불러온 대상. 목표와 다르면 로딩 중입니다. */
  const [loadedPetKey, setLoadedPetKey] = useState<number | null>(null)

  // 로딩 여부를 따로 저장하지 않고 "목표 ≠ 완료"로 계산합니다.
  // 상태를 하나 덜 들고, 펫을 바꾼 직후에도 항상 스피너가 먼저 보이게 됩니다.
  const isLoading = targetPetKey === null || loadedPetKey !== targetPetKey

  const loadWeather = useCallback(async () => {
    try {
      const { latitude, longitude } = await getCurrentCoordinates()
      setWeather(await weatherApi.getWeather(latitude, longitude))
    } catch (error) {
      // 위치 권한 거부 등. 날씨는 부가 정보라 위젯만 감추고 넘어갑니다.
      console.warn('날씨 정보를 불러오지 못했습니다.', error)
    }
  }, [])

  const loadHomeData = useCallback(async (petId: number) => {
    try {
      setHomeInfo(await homeApi.getHomeInfo(petId))

      const items = await petItemApi.getPetItems(petId)
      const urgent = items.filter(
        (item) =>
          item.nextPurchaseAt !== null &&
          calculateDaysDifference(item.nextPurchaseAt) <= URGENT_SUPPLY_DAYS,
      )
      setUrgentSupplies(urgent.slice(0, URGENT_SUPPLY_LIMIT))
    } catch (error) {
      console.error('홈 데이터를 불러오지 못했습니다.', error)
    }
  }, [])

  /** 팁은 펫이 없어도 항상 보여줍니다. */
  const loadTip = useCallback(async () => {
    try {
      setCurrentTip((await petTipApi.getRandomPetTip()).content)
    } catch (error) {
      console.warn('팁을 불러오지 못했습니다.', error)
    }
  }, [])

  useEffect(() => {
    if (targetPetKey === null) return

    let cancelled = false

    void (async () => {
      try {
        await loadTip()

        // 날씨는 위치 확인까지 걸리는 시간이 있어 기다리지 않습니다(네이티브와 동일).
        void loadWeather()

        if (targetPetKey !== NO_PET) {
          await loadHomeData(targetPetKey)
        } else {
          // 마지막 펫을 지운 직후. 비우지 않으면 지워진 펫의 산책 알람이 그대로 남습니다.
          setHomeInfo(null)
          setUrgentSupplies([])
        }
      } finally {
        if (!cancelled) setLoadedPetKey(targetPetKey)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [targetPetKey, loadTip, loadHomeData, loadWeather])

  const handleRefresh = useCallback(async () => {
    void loadWeather()
    // 펫이 없으면 다시 부를 것이 팁뿐입니다.
    if (selectedPet) await loadHomeData(selectedPet.id)
    else await loadTip()
  }, [selectedPet, loadHomeData, loadWeather, loadTip])

  const { contentRef, pullDistance, isPulling } = usePullToRefresh({
    onRefresh: handleRefresh,
    enabled: !isLoading,
  })

  const handlePetUpdated = async () => {
    setIsPetModalOpen(false)
    await refreshPets() // 상단 펫 탭 이름 등 갱신
    if (selectedPet) void loadHomeData(selectedPet.id)
  }

  const handleCopyRegistrationNumber = async (registrationNumber: string) => {
    const copied = await copyToClipboard(registrationNumber)
    showSimpleAlert(
      '알림',
      copied ? '동물등록번호가 복사되었습니다.' : '동물등록번호를 복사하지 못했습니다.',
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="size-9" />
      </div>
    )
  }

  const walkCondition = weather?.walkCondition
  const isGoodToWalk = walkCondition === 'GREAT' || walkCondition === 'GOOD'
  const isModerateToWalk = walkCondition === 'MODERATE'
  const daysSinceLastWalk = homeInfo?.daysSinceLastWalk ?? null

  return (
    <>
      {/* 당겨서 새로고침 인디케이터. 콘텐츠가 내려온 자리에 드러납니다. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 flex justify-center overflow-hidden"
        style={{ height: pullDistance }}
      >
        {pullDistance > 0 && <Spinner className="mt-md size-6" />}
      </div>

      <div
        ref={contentRef}
        className={cn('px-2xl pb-3xl', !isPulling && 'transition-transform duration-200')}
        style={{ transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined }}
      >
        {/* --- 인사말 + 날씨 --------------------------------------------- */}
        <section className="mt-2xl mb-2xl flex items-center justify-between gap-md">
          <div className="min-w-0 flex-1">
            <h2 className="mb-xs text-heading font-bold text-ink-900">안녕하세요, 집사님! 👋</h2>
            <p className="text-body font-medium text-ink-500">
              {buildGreeting(Boolean(selectedPet), homeInfo)}
            </p>
          </div>

          {weather && (
            <div className="flex shrink-0 items-center gap-sm rounded-2xl border border-ink-100 bg-white px-3.5 py-2.5 shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
              <span aria-hidden className="text-[28px] leading-none">
                {getWeatherEmoji(weather.weatherCode)}
              </span>
              <div className="flex flex-col items-start">
                <span className="text-body-lg leading-5 font-bold text-ink-900">
                  {weather.temperature.toFixed(1)}°C
                </span>
                <span className="text-[11px] font-semibold text-ink-500">
                  {weather.weatherDescription}
                </span>
              </div>
            </div>
          )}
        </section>

        {!selectedPet ? (
          /* --- 펫 미등록 안내 ------------------------------------------- */
          <div className="mb-3xl rounded-4xl border-2 border-dashed border-brand bg-white p-2xl shadow-[0_8px_16px_rgba(238,189,43,0.1)]">
            <div className="flex items-center gap-lg">
              <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-amber-50">
                <span aria-hidden className="text-[32px] leading-none">
                  🐶
                </span>
              </span>
              <div className="min-w-0 flex-1">
                <p className="mb-xs text-title-sm font-bold text-ink-900">
                  아직 등록된 아이가 없어요
                </p>
                <p className="text-[13px] font-medium text-ink-500">
                  상단 탭의 + 버튼을 눌러 우리 아이를 등록해주세요!
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* --- 펫 요약 카드 (누르면 수정 모달) ------------------------ */}
            <div className="relative mb-3xl">
              <button
                type="button"
                onClick={() => setIsPetModalOpen(true)}
                aria-label="우리 아이 정보 수정"
                className="block w-full rounded-4xl bg-white p-xl text-left shadow-[0_10px_20px_rgba(238,189,43,0.1)]"
              >
                <div className="mb-xl flex items-center gap-lg">
                  {/* 네이티브 그대로 가로 72 / 세로 64입니다 (정사각형이 아닙니다). */}
                  <div className="h-16 w-[72px] shrink-0 rounded-4xl border-[3px] border-brand p-0.5">
                    <div className="flex size-full items-center justify-center overflow-hidden rounded-[30px] bg-yellow-50">
                      {homeInfo?.petProfileImageUrl ? (
                        <img
                          src={homeInfo.petProfileImageUrl}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        <span aria-hidden className="text-[32px] leading-none">
                          🐶
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex items-baseline gap-sm">
                      <span className="text-title font-bold text-ink-900">
                        {homeInfo?.petName || selectedPet.name}
                      </span>
                      {homeInfo?.petAge && (
                        <span className="text-body font-semibold text-ink-500">
                          {homeInfo.petAge}
                        </span>
                      )}
                      <span aria-hidden className="ml-xs text-caption opacity-50">
                        ✏️
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {/*
                        네이티브는 `birthdayDday !== null`만 봐서, 홈 조회가 실패해 homeInfo가
                        비어 있으면 'D-undefined'가 찍힙니다. 여기서는 undefined도 함께 거릅니다.
                      */}
                      {homeInfo?.birthdayDday != null && (
                        <Badge
                          label={
                            homeInfo.birthdayDday === 0
                              ? '🎂 오늘 생일!'
                              : `🎂 D-${homeInfo.birthdayDday}`
                          }
                          variant="warning"
                        />
                      )}
                      <Badge
                        label={homeInfo?.walkedToday ? '오늘 산책 완료' : '산책 대기 중'}
                        variant={homeInfo?.walkedToday ? 'success' : 'neutral'}
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-xl h-px bg-ink-100" />

                <div className="flex items-center justify-between px-xs">
                  <StatItem
                    value={homeInfo?.recentWalkCount ?? 0}
                    label="최근 7일"
                    onSelect={() => navigate(ROUTES.WALK)}
                  />
                  <span className="h-6 w-px bg-ink-200" />
                  <StatItem
                    value={homeInfo?.monthlyWalkMinutes ?? 0}
                    label="이달의 산책(분)"
                    onSelect={() => navigate(ROUTES.WALK)}
                  />
                  <span className="h-6 w-px bg-ink-200" />
                  <StatItem
                    value={homeInfo?.petItemCount ?? 0}
                    label="관리 용품"
                    onSelect={() => navigate(ROUTES.SUPPLIES)}
                  />
                </div>
              </button>

              {/* 등록번호는 카드 클릭(수정 모달)과 겹치지 않게 카드 밖 버튼으로 띄웁니다. */}
              {homeInfo?.registrationNumber && (
                <button
                  type="button"
                  onClick={() => void handleCopyRegistrationNumber(homeInfo.registrationNumber!)}
                  className="absolute top-lg right-xl z-10 rounded-sm border border-ink-200 bg-ink-50 px-sm py-xs text-caption-xs font-bold text-ink-400"
                >
                  No. {homeInfo.registrationNumber}
                </button>
              )}
            </div>

            {/* --- 오늘의 산책 추천 (날씨 기반) --------------------------- */}
            {weather && (
              <StatusCard
                className="mb-lg"
                borderClassName={
                  isGoodToWalk
                    ? 'border-success'
                    : isModerateToWalk
                      ? 'border-warning'
                      : 'border-error'
                }
                indicatorClassName={
                  isGoodToWalk
                    ? 'bg-success-bg'
                    : isModerateToWalk
                      ? 'bg-warning-bg'
                      : 'bg-error-bg'
                }
                icon={isGoodToWalk ? '🐕' : isModerateToWalk ? '🌤️' : '🚫'}
                label="오늘의 산책 추천"
                value={weather.walkMessage}
              />
            )}

            {/* --- 마지막 산책 경과 --------------------------------------- */}
            {daysSinceLastWalk !== null && (
              <StatusCard
                className="mb-3xl"
                borderClassName={
                  daysSinceLastWalk <= 1
                    ? 'border-success'
                    : daysSinceLastWalk === 2
                      ? 'border-warning'
                      : 'border-error'
                }
                indicatorClassName={
                  daysSinceLastWalk <= 1
                    ? 'bg-success-bg'
                    : daysSinceLastWalk === 2
                      ? 'bg-warning-bg'
                      : 'bg-error-bg'
                }
                icon={daysSinceLastWalk <= 1 ? '🐾' : daysSinceLastWalk === 2 ? '⚠️' : '🚨'}
                label="마지막 산책으로부터"
                value={
                  daysSinceLastWalk === 0
                    ? '오늘 산책했어요! ✨'
                    : `${daysSinceLastWalk}일 지났어요`
                }
              />
            )}
          </>
        )}

        {/* --- 오늘의 산책 알람 ------------------------------------------ */}
        {homeInfo && homeInfo.todayWalkAlarmTimes.length > 0 && (
          <section className="mb-3xl">
            <SectionHeader title="오늘의 산책" />
            <div className="flex flex-wrap gap-2.5">
              {homeInfo.todayWalkAlarmTimes.map((time) => (
                <span
                  key={time}
                  className="rounded-lg border border-ink-200 bg-white px-lg py-2.5 text-[15px] font-bold text-ink-700 shadow-input"
                >
                  {/* 서버가 'HH:mm:ss'로 내려주므로 초는 잘라냅니다. */}
                  {time.substring(0, 5)}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* --- 소진 임박 용품 -------------------------------------------- */}
        {urgentSupplies.length > 0 && (
          <section className="mb-3xl">
            <SectionHeader
              title="소진 임박 용품 🦴"
              action={
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.SUPPLIES)}
                  className="text-body font-bold text-brand"
                >
                  전체보기
                </button>
              }
            />
            {urgentSupplies.map((item) => {
              // 위 필터에서 nextPurchaseAt이 있는 항목만 남겼습니다.
              const daysLeft = calculateDaysDifference(item.nextPurchaseAt!)

              return (
                <button
                  key={item.petItemId}
                  type="button"
                  onClick={() => navigate(ROUTES.SUPPLIES)}
                  className="mb-md flex w-full items-center justify-between rounded-xl border border-ink-100 bg-white p-lg text-left"
                >
                  <span className="min-w-0 flex-1">
                    <span className="mb-0.5 block text-[15px] font-bold text-ink-700">
                      {item.name}
                    </span>
                    <span className="block text-caption font-medium text-error">
                      {daysLeft < 0 ? '이미 소진되었습니다' : `${daysLeft}일 후 소진 예정`}
                    </span>
                  </span>
                  <Badge
                    label={daysLeft < 0 ? '소진' : `D-${daysLeft}`}
                    variant={daysLeft <= 3 ? 'error' : 'warning'}
                  />
                </button>
              )
            })}
          </section>
        )}

        {/* --- 팁 -------------------------------------------------------- */}
        <section className="mb-3xl">
          <SectionHeader title="팁 💡" />
          <div className="flex gap-lg rounded-2xl border border-amber-100 bg-amber-50 p-xl">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-white shadow-[0_2px_4px_rgba(245,158,11,0.1)]">
              <span aria-hidden className="text-[24px] leading-none">
                💡
              </span>
            </span>
            <p className="flex-1 self-center text-body font-medium text-amber-700">{currentTip}</p>
          </div>
        </section>
      </div>

      {/* 펫 정보 수정 모달 */}
      <PetRegistrationModal
        open={isPetModalOpen}
        editPetId={selectedPet?.id}
        onClose={() => setIsPetModalOpen(false)}
        onSuccess={() => void handlePetUpdated()}
      />

      <CustomAlert alert={alert} onClose={hideAlert} />
    </>
  )
}

/** 인사말 아래 한 줄. 펫 유무와 산책 기록에 따라 문구가 달라집니다. */
function buildGreeting(hasPet: boolean, homeInfo: HomeInfo | null): string {
  if (!hasPet) return '반려동물을 등록하고 PuppyNote를 시작해보세요!'
  if (!homeInfo) return '오늘도 즐거운 하루 되세요!'
  if (homeInfo.walkedToday) return '오늘 산책을 완료했어요! 정말 멋져요. ✨'
  if (homeInfo.daysSinceLastWalk !== null) {
    return `마지막 산책으로부터 ${homeInfo.daysSinceLastWalk}일이 지났어요.`
  }
  return '오늘도 즐거운 하루 되세요!'
}

interface StatItemProps {
  value: number
  label: string
  onSelect: () => void
}

/**
 * 펫 카드 하단의 통계 3종.
 *
 * 카드 전체가 이미 버튼이라 안에 `<button>`을 중첩할 수 없어서(HTML 위반),
 * `role="button"`을 쓰고 클릭을 여기서 멈춰 카드의 수정 모달이 함께 열리지 않게 합니다.
 */
function StatItem({ value, label, onSelect }: StatItemProps) {
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={(event) => {
        event.stopPropagation()
        onSelect()
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return
        event.preventDefault()
        event.stopPropagation()
        onSelect()
      }}
      className="flex flex-1 flex-col items-center"
    >
      <span className="mb-xs text-title-sm font-bold text-ink-900">{value}</span>
      <span className="text-[11px] font-bold text-ink-400">{label}</span>
    </span>
  )
}

interface SectionHeaderProps {
  title: string
  action?: ReactNode
}

function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <div className="mb-lg flex items-center justify-between px-xs">
      <h3 className="text-title-sm font-bold text-ink-900">{title}</h3>
      {action}
    </div>
  )
}

interface StatusCardProps {
  label: string
  value: string
  icon: string
  borderClassName: string
  indicatorClassName: string
  className?: string
}

/** '오늘의 산책 추천' / '마지막 산책으로부터' 카드. 테두리와 아이콘 배경만 상태에 따라 바뀝니다. */
function StatusCard({
  label,
  value,
  icon,
  borderClassName,
  indicatorClassName,
  className,
}: StatusCardProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-3xl border-2 bg-white px-xl py-[18px] shadow-[0_4px_12px_rgba(0,0,0,0.05)]',
        borderClassName,
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="mb-xs text-[13px] font-bold text-ink-500">{label}</p>
        <p className="text-title-sm font-bold text-ink-900">{value}</p>
      </div>
      <span
        className={cn(
          'ml-md flex size-11 shrink-0 items-center justify-center rounded-full',
          indicatorClassName,
        )}
      >
        <span aria-hidden className="text-[22px] leading-none">
          {icon}
        </span>
      </span>
    </div>
  )
}
