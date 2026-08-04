import { useEffect, useState } from 'react'

import { CustomAlert, GlobalDetailModal, PhotoGallery, Spinner } from '@/components/common'
import { useAlert } from '@/hooks/useAlert'
import { walkApi, type WalkDetail } from '@/services/api/endpoints/walk'
import { toErrorMessage } from '@/services/api/types'

import WalkMap from './WalkMap'

export interface WalkDetailModalProps {
  open: boolean
  walkId: number | null
  onClose: () => void
  /** 삭제 성공 시. 캘린더/목록을 다시 불러오는 데 씁니다. */
  onDeleted?: () => void
}

const formatTime = (isoString: string) => {
  const date = new Date(isoString)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

/**
 * 산책 상세 모달. 네이티브 `components/walk/modal/WalkDetailModal.tsx` 이식.
 *
 * 지도에는 경로(폴리라인)가 없습니다 — 네이티브 원본도 좌표 하나만 저장/조회하고
 * `WalkDetail`에 경로 좌표 배열이 없어서, 실제로는 시작 위치에 마커 하나만 찍습니다.
 * `react-native-maps` 자리는 카카오맵 JS SDK로 대체했습니다({@link ../../services/map/kakaoMap}).
 */
export default function WalkDetailModal({
  open,
  walkId,
  onClose,
  onDeleted,
}: WalkDetailModalProps) {
  const [detail, setDetail] = useState<WalkDetail | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { alert, showSimpleAlert, showConfirmAlert, hideAlert } = useAlert()

  useEffect(() => {
    void (async () => {
      if (!open || !walkId) {
        setDetail(null)
        return
      }

      setIsLoading(true)
      try {
        setDetail(await walkApi.getWalkDetail(walkId))
      } catch (error) {
        showSimpleAlert('오류', toErrorMessage(error, '상세 정보를 가져오는데 실패했습니다.'))
      } finally {
        setIsLoading(false)
      }
    })()
  }, [open, walkId, showSimpleAlert])

  const handleDelete = () => {
    if (!walkId) return

    showConfirmAlert(
      '산책 기록 삭제',
      '정말로 이 산책 기록을 삭제하시겠습니까? 삭제된 기록은 복구할 수 없습니다.',
      () => {
        void (async () => {
          setIsDeleting(true)
          try {
            await walkApi.deleteWalk(walkId)
            showSimpleAlert('성공', '산책 기록이 삭제되었습니다.', () => {
              onDeleted?.()
              onClose()
            })
          } catch (error) {
            showSimpleAlert('오류', toErrorMessage(error, '삭제 중 오류가 발생했습니다.'))
          } finally {
            setIsDeleting(false)
          }
        })()
      },
    )
  }

  return (
    <GlobalDetailModal open={open} onClose={onClose} title="산책 기록 상세" height="90%">
      {isLoading ? (
        <div className="flex h-full items-center justify-center">
          <Spinner className="size-9" />
        </div>
      ) : detail ? (
        <div className="pb-4xl">
          <div className="mb-xl flex items-end justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-caption font-bold tracking-wide text-ink-400 uppercase">장소</p>
              <p className="mt-xs text-title font-bold text-ink-800">{detail.location}</p>
            </div>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="shrink-0 rounded-sm border border-error-border bg-error-bg px-md py-sm text-caption font-semibold text-error disabled:opacity-60"
            >
              {isDeleting ? '삭제 중...' : '🗑️ 삭제'}
            </button>
          </div>

          {detail.photoUrls.length > 0 && (
            <div className="mb-2xl">
              <PhotoGallery photoUrls={detail.photoUrls} />
            </div>
          )}

          <div className="mb-2xl flex flex-col gap-xl">
            <div className="flex gap-lg">
              <div className="flex-1">
                <p className="text-caption font-bold tracking-wide text-ink-400 uppercase">시작</p>
                <p className="mt-sm rounded-lg border border-ink-100 bg-white p-lg text-body-lg font-semibold text-ink-800">
                  {formatTime(detail.startTime)}
                </p>
              </div>
              <div className="flex-1">
                <p className="text-caption font-bold tracking-wide text-ink-400 uppercase">종료</p>
                <p className="mt-sm rounded-lg border border-ink-100 bg-white p-lg text-body-lg font-semibold text-ink-800">
                  {formatTime(detail.endTime)}
                </p>
              </div>
            </div>

            {detail.memo && (
              <div>
                <p className="text-caption font-bold tracking-wide text-ink-400 uppercase">메모</p>
                <div className="mt-sm min-h-20 rounded-lg border border-ink-100 bg-white p-lg">
                  <p className="text-body-lg text-ink-600">{detail.memo}</p>
                </div>
              </div>
            )}
          </div>

          {detail.latitude && detail.longitude && (
            <div>
              <p className="mb-md text-caption font-bold tracking-wide text-ink-400 uppercase">
                위치 정보
              </p>
              <WalkMap
                latitude={detail.latitude}
                longitude={detail.longitude}
                className="h-[200px] overflow-hidden rounded-2xl border border-ink-100"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="flex h-full items-center justify-center">
          <p className="text-body-lg text-ink-400">정보를 불러올 수 없습니다.</p>
        </div>
      )}

      <CustomAlert alert={alert} onClose={hideAlert} />
    </GlobalDetailModal>
  )
}
