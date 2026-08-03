import { useState } from 'react'

import { Spinner } from './icons'
import { type PickedWebImage, pickImages } from '@/services/image/imagePicker'
import { cn } from '@/utils/cn'

export interface MultiImageSelectorProps {
  images: PickedWebImage[]
  onChange: (images: PickedWebImage[]) => void
  /** 총 등록 가능 장수 (기본 10) */
  maxCount?: number
  /**
   * 최대 장수 초과, 권한 거부 등 사용자에게 알려야 하는 상황.
   * 넘기지 않으면 콘솔 경고만 남깁니다. (CustomAlert 이식 후 연결하면 됩니다)
   */
  onError?: (message: string) => void
  disabled?: boolean
  className?: string
}

/**
 * 네이티브 `components/common/item/MultiImageSelector.tsx` 이식.
 *
 * 선택 경로는 {@link pickImages}가 감춥니다. 앱 안에서는 브릿지 `PICK_IMAGE`,
 * 일반 브라우저에서는 `<input type="file">`을 쓰지만 이 컴포넌트는 그 차이를 모릅니다.
 *
 * 이미지 한 장은 `PickedWebImage`이고 `src`(dataUrl 또는 URL)를 그대로 미리보기와 업로드에
 * 씁니다. 나중에 앱이 직접 업로드하는 `UPLOAD_IMAGE` 액션이 생겨도 `src`가 URL로 바뀔 뿐이라
 * 이 컴포넌트와 호출부는 그대로입니다.
 */
export default function MultiImageSelector({
  images,
  onChange,
  maxCount = 10,
  onError,
  disabled = false,
  className,
}: MultiImageSelectorProps) {
  const [isPicking, setIsPicking] = useState(false)

  const reportError = (message: string) => {
    if (onError) onError(message)
    else console.warn('[MultiImageSelector]', message)
  }

  const handlePick = async () => {
    if (isPicking || disabled) return

    const remaining = maxCount - images.length
    if (remaining <= 0) {
      reportError(`이미지는 최대 ${maxCount}개까지 등록 가능합니다.`)
      return
    }

    setIsPicking(true)
    try {
      const picked = await pickImages({ max: remaining })
      // 취소하면 빈 배열이 옵니다. 이때는 아무 일도 일어나지 않아야 합니다.
      if (picked.length > 0) onChange([...images, ...picked])
    } catch (caught) {
      reportError(
        caught instanceof Error ? caught.message : '이미지를 불러오는 중 오류가 발생했습니다.',
      )
    } finally {
      setIsPicking(false)
    }
  }

  const handleRemove = (id: string) => {
    onChange(images.filter((image) => image.id !== id))
  }

  return (
    <div className={cn('my-md', className)}>
      <div className="no-scrollbar overflow-x-auto">
        <div className="flex w-max gap-md pr-2xl">
          <button
            type="button"
            onClick={() => void handlePick()}
            disabled={disabled || isPicking}
            aria-label={`이미지 추가 (${images.length}/${maxCount})`}
            className="flex size-20 shrink-0 flex-col items-center justify-center rounded-lg border border-dashed border-ink-200 bg-white disabled:opacity-60"
          >
            {isPicking ? (
              <Spinner className="size-6" />
            ) : (
              <>
                <span aria-hidden className="text-heading leading-none font-light text-ink-400">
                  +
                </span>
                <span className="mt-0.5 text-caption-xs font-bold text-ink-400">
                  {images.length}/{maxCount}
                </span>
              </>
            )}
          </button>

          {images.map((image) => (
            <div
              key={image.id}
              className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-ink-100"
            >
              <img
                src={image.src}
                alt={image.fileName || '선택한 이미지'}
                className="size-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemove(image.id)}
                disabled={disabled}
                aria-label={`${image.fileName || '이미지'} 삭제`}
                className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/50 text-caption font-bold text-white"
              >
                <span aria-hidden>✕</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
