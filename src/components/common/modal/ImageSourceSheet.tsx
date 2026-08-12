import BottomSheetModal from './BottomSheetModal'
import { type ImageSource, type PickedWebImage, pickImagesFromSource } from '@/services/image/imagePicker'

export interface ImageSourceSheetProps {
  open: boolean
  onClose: () => void
  onPicked: (images: PickedWebImage[]) => void
  /** 넘기지 않으면 콘솔 경고만 남깁니다. */
  onError?: (message: string) => void
  /** 한 번에 고를 수 있는 최대 장수. 기본 1 */
  max?: number
}

const OPTIONS: { source: ImageSource; icon: string; label: string }[] = [
  { source: 'gallery', icon: '🖼️', label: '갤러리에서 선택' },
  { source: 'camera', icon: '📷', label: '바로 사진 찍기' },
]

/**
 * "사진 추가" 진입점 공용 액션시트. 갤러리/카메라 중 고른 쪽을 표준
 * `<input type="file">`(카메라는 `capture="environment"`)로 바로 엽니다.
 * 앱 브릿지 `PICK_IMAGE`는 거치지 않습니다 — {@link pickImagesFromSource} 참고.
 */
export default function ImageSourceSheet({
  open,
  onClose,
  onPicked,
  onError,
  max = 1,
}: ImageSourceSheetProps) {
  const handlePick = async (source: ImageSource) => {
    onClose()
    try {
      const picked = await pickImagesFromSource(source, { max })
      if (picked.length > 0) onPicked(picked)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '이미지를 불러오는 중 오류가 발생했습니다.'
      if (onError) onError(message)
      else console.warn('[ImageSourceSheet]', message)
    }
  }

  return (
    <BottomSheetModal open={open} onClose={onClose} title="사진 추가">
      <div className="flex flex-col gap-sm">
        {OPTIONS.map(({ source, icon, label }) => (
          <button
            key={source}
            type="button"
            onClick={() => void handlePick(source)}
            className="flex items-center gap-md rounded-xl bg-ink-50 px-lg py-lg text-left"
          >
            <span aria-hidden className="text-title-sm leading-none">
              {icon}
            </span>
            <span className="text-body-lg font-semibold text-ink-900">{label}</span>
          </button>
        ))}
      </div>
    </BottomSheetModal>
  )
}
