import { useEffect, useRef, useState } from 'react'

import { loadKakaoMaps } from '@/services/map/kakaoMap'
import { cn } from '@/utils/cn'

export interface WalkMapProps {
  latitude: number
  longitude: number
  className?: string
}

/**
 * 산책 상세의 위치 지도. 네이티브 `WalkDetailModal`의 `react-native-maps` 영역 이식.
 *
 * ⚠️ 네이티브도 좌표 하나(`WalkDetail.latitude/longitude`)로 마커 하나만 찍습니다.
 * 산책 경로(폴리라인)를 이루는 좌표 배열은 애초에 서버 응답에 없어서, 여기서도 마커
 * 하나만 그립니다. 카카오맵 CustomOverlay로 네이티브의 흰 배경 + 브랜드 테두리 + 발자국
 * 이모지 마커를 그대로 재현했습니다.
 *
 * 앱 키(`VITE_KAKAO_MAP_APP_KEY`)가 비어 있으면 SDK 로드를 시도조차 하지 않고 바로
 * 안내 문구를 보여줍니다 — 로드는 실패해도 내부적으로 몇 초 걸리는 시도라, 키가 없는 게
 * 뻔한 상황(발급 전 로컬/스테이징)에서 그 대기를 사용자에게 보여줄 이유가 없습니다.
 * (env 값은 실행 중 바뀌지 않으므로 state 초기값으로만 반영하고, effect 안에서는 이 분기에서
 * setState를 부르지 않습니다 — 렌더 중 이미 알 수 있는 값이라 effect가 필요 없는 경우입니다.)
 */
const MAP_KEY_MISSING_MESSAGE = '지도를 표시할 수 없습니다.'
const hasMapKey = Boolean(import.meta.env.VITE_KAKAO_MAP_APP_KEY)

export default function WalkMap({ latitude, longitude, className }: WalkMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(hasMapKey ? null : MAP_KEY_MISSING_MESSAGE)

  useEffect(() => {
    if (!hasMapKey) return

    let cancelled = false

    void (async () => {
      try {
        const kakaoMaps = await loadKakaoMaps()
        if (cancelled || !containerRef.current) return

        const position = new kakaoMaps.LatLng(latitude, longitude)
        const map = new kakaoMaps.Map(containerRef.current, {
          center: position,
          level: 3,
          draggable: false,
          zoomable: false,
        })

        const content = document.createElement('div')
        content.className =
          'flex size-9 items-center justify-center rounded-full border-2 border-brand bg-white text-body-lg shadow-[0_2px_4px_rgba(0,0,0,0.1)]'
        content.textContent = '🐾'

        new kakaoMaps.CustomOverlay({ position, content, map, yAnchor: 0.5 })
      } catch (caught) {
        console.warn('카카오맵 로드에 실패했습니다.', caught)
        if (!cancelled) setError('지도를 불러오지 못했습니다.')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [latitude, longitude])

  if (error) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-ink-100 px-lg text-center text-caption text-ink-400',
          className,
        )}
      >
        {error}
      </div>
    )
  }

  return <div ref={containerRef} className={cn('bg-ink-100', className)} />
}
