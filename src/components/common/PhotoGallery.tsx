import { createPortal } from 'react-dom'
import { useEffect, useRef, useState } from 'react'

import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { useHardwareBack } from '@/hooks/useHardwareBack'
import { cn } from '@/utils/cn'

export interface PhotoGalleryProps {
  photoUrls: string[]
  /** 카드 높이 (기본 240 = 네이티브 산책 상세와 동일). `square`가 true면 무시됩니다. */
  height?: number
  /** true면 높이를 폭에 맞춰 1:1 정사각형으로 늘립니다 (네이티브 커뮤니티 카드/상세 이미지). */
  square?: boolean
  /** 기본 true. false면 모서리를 둥글리지 않습니다 (커뮤니티 상세의 풀블리드 이미지). */
  rounded?: boolean
  /** 넘기면 탭했을 때 라이트박스 대신 이 함수를 부릅니다 (커뮤니티 카드 → 상세 이동 등). */
  onImageClick?: () => void
  className?: string
}

/**
 * 사진 여러 장을 가로로 넘겨보는 갤러리. 네이티브 `components/common/item/PhotoGallery.tsx` 이식.
 *
 * 미완성인 부분(기획서상 "난이도 높음"):
 *   - **핀치/더블탭 확대가 없습니다.** 앱 웹뷰 전체가 `user-scalable=no`라 브라우저 기본 확대도
 *     막혀 있어서, 네이티브의 `react-native-gesture-handler` 핀치 줌과 같은 조작감을 웹
 *     표준만으로 재현하려면 별도 제스처 구현이 필요합니다. 이 화면(산책 상세)에서는 우선순위가
 *     아니라고 판단해 확대 없는 라이트박스(원본 크기 표시 + 스와이프)로 대체했습니다.
 *   - 카드 자체는 `scroll-snap`으로 가로 스와이프만 지원합니다 (탭하면 전체화면 라이트박스).
 */
export default function PhotoGallery({
  photoUrls,
  height = 240,
  square = false,
  rounded = true,
  onImageClick,
  className,
}: PhotoGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)

  if (photoUrls.length === 0) return null

  const hasMultiple = photoUrls.length > 1

  const handleScroll = () => {
    const scroller = scrollerRef.current
    if (!scroller) return
    setActiveIndex(Math.round(scroller.scrollLeft / scroller.clientWidth))
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-ink-100',
        rounded && 'rounded-2xl',
        square && 'aspect-square',
        className,
      )}
    >
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="no-scrollbar flex overflow-x-auto overscroll-x-contain"
        style={{ scrollSnapType: 'x mandatory', height: square ? undefined : height }}
      >
        {photoUrls.map((url, index) => (
          <button
            key={url + index}
            type="button"
            onClick={() => (onImageClick ? onImageClick() : setLightboxIndex(index))}
            aria-label={
              onImageClick ? '게시물 상세 보기' : `사진 ${index + 1}/${photoUrls.length} 크게 보기`
            }
            className="h-full w-full shrink-0 snap-center"
          >
            <img src={url} alt="" className="size-full object-cover" />
          </button>
        ))}
      </div>

      {hasMultiple && (
        <span className="absolute right-md bottom-md rounded-md bg-black/50 px-sm py-xs text-caption-xs font-bold text-white">
          {activeIndex + 1}/{photoUrls.length}
        </span>
      )}

      {lightboxIndex !== null && (
        <Lightbox
          photoUrls={photoUrls}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  )
}

interface LightboxProps {
  photoUrls: string[]
  initialIndex: number
  onClose: () => void
}

function Lightbox({ photoUrls, initialIndex, onClose }: LightboxProps) {
  const [index, setIndex] = useState(initialIndex)
  const scrollerRef = useRef<HTMLDivElement>(null)

  useBodyScrollLock(true)
  useHardwareBack(() => {
    onClose()
    return true
  }, true)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // 처음 열릴 때 initialIndex 위치로 즉시 이동 (스크롤 애니메이션 없이)
  useEffect(() => {
    scrollerRef.current?.scrollTo({ left: scrollerRef.current.clientWidth * initialIndex })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleScroll = () => {
    const scroller = scrollerRef.current
    if (!scroller) return
    setIndex(Math.round(scroller.scrollLeft / scroller.clientWidth))
  }

  return createPortal(
    <div className="animate-fade-in fixed inset-0 z-100 bg-black">
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-lg pt-[calc(var(--safe-top)+16px)]">
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="flex size-11 items-center justify-center rounded-full bg-white/20 text-body-lg text-white"
        >
          ✕
        </button>
        {photoUrls.length > 1 && (
          <span className="rounded-2xl bg-white/20 px-lg py-xs text-body font-semibold text-white">
            {index + 1} / {photoUrls.length}
          </span>
        )}
        <span className="size-11" aria-hidden />
      </div>

      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="no-scrollbar flex h-full overflow-x-auto"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {photoUrls.map((url, photoIndex) => (
          <div
            key={url + photoIndex}
            className="flex h-full w-full shrink-0 snap-center items-center justify-center"
          >
            <img src={url} alt="" className="max-h-full max-w-full object-contain" />
          </div>
        ))}
      </div>
    </div>,
    document.body,
  )
}
