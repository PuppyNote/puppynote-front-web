import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Badge, CustomAlert, GlobalDetailModal, PhotoGallery, Spinner } from '@/components/common'
import { useAlert } from '@/hooks/useAlert'
import { petItemApi, type PetItem, type PurchaseHistory } from '@/services/api/endpoints/petItem'
import { toErrorMessage } from '@/services/api/types'
import { ROUTES } from '@/routes/paths'
import { openUrl } from '@/utils/openUrl'

import { getSupplyStatus } from './supplyStatus'

export interface SuppliesDetailModalProps {
  open: boolean
  petItemId: number | null
  onClose: () => void
  /** 구매 등록/삭제, 용품 삭제 성공 시. 목록(+카테고리 소진 상태)을 다시 불러오는 데 씁니다. */
  onRefreshList?: () => void
}

/** 용품 상세 모달. 네이티브 `components/supply/modal/SuppliesDetailModal.tsx` 이식. */
export default function SuppliesDetailModal({
  open,
  petItemId,
  onClose,
  onRefreshList,
}: SuppliesDetailModalProps) {
  const navigate = useNavigate()
  const { alert, showSimpleAlert, showConfirmAlert, hideAlert } = useAlert()

  const [item, setItem] = useState<PetItem | null>(null)
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    void (async () => {
      if (!open || !petItemId) {
        setItem(null)
        setPurchaseHistory([])
        return
      }

      setIsLoading(true)
      try {
        const [detail, history] = await Promise.all([
          petItemApi.getPetItemDetail(petItemId),
          petItemApi.getPurchaseHistory(petItemId),
        ])
        setItem(detail)
        setPurchaseHistory(history)
      } catch (error) {
        showSimpleAlert('오류', toErrorMessage(error, '데이터를 불러오는데 실패했습니다.'), onClose)
      } finally {
        setIsLoading(false)
      }
    })()
  }, [open, petItemId, showSimpleAlert, onClose])

  const reload = async () => {
    if (!petItemId) return
    const [detail, history] = await Promise.all([
      petItemApi.getPetItemDetail(petItemId),
      petItemApi.getPurchaseHistory(petItemId),
    ])
    setItem(detail)
    setPurchaseHistory(history)
  }

  const handleRegisterPurchase = () => {
    if (!petItemId) return

    void (async () => {
      setIsSubmitting(true)
      try {
        await petItemApi.createPurchase(petItemId)
        showSimpleAlert('성공', '구매 기록이 등록되었습니다.')
        await reload()
        onRefreshList?.()
      } catch (error) {
        showSimpleAlert('오류', toErrorMessage(error, '구매 기록 등록에 실패했습니다.'))
      } finally {
        setIsSubmitting(false)
      }
    })()
  }

  const handleDeletePurchase = (purchaseId: number) => {
    showConfirmAlert('구매 이력 삭제', '이 구매 기록을 삭제하시겠습니까?', () => {
      void (async () => {
        setIsSubmitting(true)
        try {
          await petItemApi.deletePurchase(purchaseId)
          await reload()
          onRefreshList?.()
        } catch (error) {
          showSimpleAlert('오류', toErrorMessage(error, '구매 기록 삭제에 실패했습니다.'))
        } finally {
          setIsSubmitting(false)
        }
      })()
    })
  }

  const handleEdit = () => {
    if (!petItemId) return
    onClose()
    navigate(`${ROUTES.ADD_SUPPLY}?edit=${petItemId}`)
  }

  const handleDelete = () => {
    if (!petItemId) return

    showConfirmAlert(
      '용품 삭제',
      '정말로 이 용품을 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다.',
      () => {
        void (async () => {
          setIsSubmitting(true)
          try {
            await petItemApi.deletePetItem(petItemId)
            onRefreshList?.()
            onClose()
          } catch (error) {
            showSimpleAlert('오류', toErrorMessage(error, '용품 삭제에 실패했습니다.'))
          } finally {
            setIsSubmitting(false)
          }
        })()
      },
    )
  }

  const handleOpenLink = (url: string) => {
    if (!openUrl(url)) showSimpleAlert('알림', '구매 링크를 열 수 없습니다.')
  }

  return (
    <>
      <GlobalDetailModal open={open} onClose={onClose} title="용품 상세 정보">
        {isLoading ? (
          <div className="flex items-center justify-center py-4xl">
            <Spinner className="size-9" />
          </div>
        ) : item ? (
          <div className="pb-2xl">
            <div className="relative mb-2xl">
              <PhotoGallery photoUrls={item.imageUrl ? [item.imageUrl] : []} square className="rounded-3xl" />
              {!item.imageUrl && (
                <div className="flex aspect-square items-center justify-center rounded-3xl bg-ink-100 text-[48px]">
                  🦴
                </div>
              )}
              <div className="absolute top-md right-md flex gap-sm">
                <button
                  type="button"
                  onClick={handleEdit}
                  aria-label="용품 수정"
                  className="flex size-9 items-center justify-center rounded-full bg-white/90 text-body-lg shadow-card"
                >
                  ✏️
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  aria-label="용품 삭제"
                  className="flex size-9 items-center justify-center rounded-full bg-error-bg/90 text-body-lg shadow-card"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div className="mb-2xl flex items-start justify-between gap-md">
              <div className="min-w-0 flex-1">
                <p className="mb-xs text-heading font-bold text-ink-900">{item.name}</p>
                <p className="text-body text-ink-500">
                  {item.majorCategoryName} › {item.categoryName}
                </p>
              </div>
              <Badge {...getSupplyStatus(item.nextPurchaseAt)} />
            </div>

            <div className="mb-2xl flex flex-col gap-lg rounded-xl border border-ink-100 bg-white p-xl">
              <InfoRow label="구매 주기" value={`${item.purchaseCycleDays}일 마다`} />
              <InfoRow label="최근 구매일" value={item.lastPurchasedAt ?? '기록 없음'} />
              <InfoRow label="다음 구매 예정" value={item.nextPurchaseAt ?? '기록 없음'} />
            </div>

            <button
              type="button"
              onClick={handleRegisterPurchase}
              disabled={isSubmitting}
              className="mb-md flex w-full items-center justify-center rounded-lg bg-ink-900 py-lg font-bold text-white disabled:opacity-60"
            >
              {isSubmitting ? <Spinner className="size-6 text-white" /> : '✨ 오늘 구매 등록'}
            </button>

            {item.purchaseUrl && (
              <button
                type="button"
                onClick={() => handleOpenLink(item.purchaseUrl!)}
                className="mb-2xl flex w-full items-center justify-center rounded-lg bg-brand py-lg font-bold text-ink-900 shadow-brand"
              >
                🛒 구매 링크 열기
              </button>
            )}

            <div>
              <p className="mb-lg text-title-sm font-bold text-ink-900">구매 이력</p>
              {purchaseHistory.length > 0 ? (
                purchaseHistory.map((history) => (
                  <div
                    key={history.id}
                    className="flex items-center gap-md border-b border-ink-100 py-md"
                  >
                    <span aria-hidden className="size-2 shrink-0 rounded-full bg-brand" />
                    <span className="flex-1 text-body-lg font-medium text-ink-700">
                      {history.purchasedAt}
                    </span>
                    <span className="text-caption text-ink-500">구매 완료</span>
                    <button
                      type="button"
                      onClick={() => handleDeletePurchase(history.id)}
                      aria-label="구매 기록 삭제"
                      className="p-sm text-body-lg font-bold text-ink-300"
                    >
                      ✕
                    </button>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center py-xl">
                  <p className="text-body text-ink-400">아직 구매 이력이 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </GlobalDetailModal>

      <CustomAlert alert={alert} onClose={hideAlert} />
    </>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-body font-medium text-ink-500">{label}</span>
      <span className="text-body-lg font-semibold text-ink-900">{value}</span>
    </div>
  )
}
