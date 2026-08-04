import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { AddTopBar, CustomAlert, PagedList, Spinner } from '@/components/common'
import { useAlert } from '@/hooks/useAlert'
import { alertHistoryApi, type AlertHistory } from '@/services/api/endpoints/alertHistory'
import { familyMemberApi } from '@/services/api/endpoints/familyMember'
import { toErrorMessage } from '@/services/api/types'
import { usePet } from '@/services/pet/PetContext'
import { ROUTES } from '@/routes/paths'
import { cn } from '@/utils/cn'

/** 알림 내역 화면. 네이티브 `src/screens/notification/AlertHistoryScreen.tsx` 이식. */
export default function AlertHistoryPage() {
  const navigate = useNavigate()
  const { refreshPets } = usePet()
  const { alert, showAlert, showSimpleAlert, hideAlert } = useAlert()
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set())
  const [isProcessing, setIsProcessing] = useState(false)

  const fetchPage = async (page: number) => {
    const response = await alertHistoryApi.getAlertHistories(page, 12)
    return { content: response.content, totalPage: response.pageInfo.totalPage }
  }

  const handleFamilyInvite = (item: AlertHistory) => {
    let inviteInfo: { userId?: number; petId?: number }
    try {
      inviteInfo = JSON.parse(item.alertDestinationInfo) as typeof inviteInfo
    } catch {
      showSimpleAlert('오류', '초대 정보를 읽어오는데 실패했습니다.')
      return
    }

    const { userId, petId } = inviteInfo
    if (!userId || !petId) {
      showSimpleAlert('오류', '잘못된 초대 정보입니다.')
      return
    }

    showAlert({
      title: '가족 초대 수락',
      message: '가족 초대를 수락하시겠습니까?\n수락하면 해당 반려동물을 함께 관리할 수 있습니다.',
      confirmText: '수락하기',
      cancelText: '취소',
      onConfirm: () => {
        hideAlert()
        void (async () => {
          setIsProcessing(true)
          try {
            await familyMemberApi.registerFamily(userId, petId)
            await refreshPets()
            showSimpleAlert('성공', '가족 등록이 완료되었습니다! 🐾', () => navigate(ROUTES.HOME))
          } catch (error) {
            showSimpleAlert('오류', toErrorMessage(error, '가족 등록에 실패했습니다.'))
          } finally {
            setIsProcessing(false)
          }
        })()
      },
      onCancel: hideAlert,
    })
  }

  const handleItemClick = (item: AlertHistory) => {
    if (item.alertHistoryStatus === 'UNCHECKED' && !checkedIds.has(item.id)) {
      setCheckedIds((prev) => new Set(prev).add(item.id))
      void alertHistoryApi.checkAlert(item.id).catch((error: unknown) => {
        console.error('알림 확인 처리 실패', error)
      })
    }

    if (item.alertDestinationType === 'FAMILY_INVITE') handleFamilyInvite(item)
  }

  return (
    <div className="flex h-full flex-col">
      <AddTopBar title="알림 내역" onBack={() => navigate(-1)} />

      <PagedList
        fetchPage={fetchPage}
        renderItem={(item) => {
          const isUnchecked = item.alertHistoryStatus === 'UNCHECKED' && !checkedIds.has(item.id)
          return (
            <button
              type="button"
              onClick={() => handleItemClick(item)}
              className={cn(
                'mb-md block w-full rounded-lg border-l-4 bg-white p-lg text-left shadow-card',
                isUnchecked ? 'border-l-brand' : 'border-l-transparent',
              )}
            >
              <div className="mb-sm flex items-center gap-sm">
                <span
                  aria-hidden
                  className={cn('size-2 rounded-full', isUnchecked ? 'bg-brand' : 'bg-ink-300')}
                />
                <span className="text-caption text-ink-400">
                  {new Date(item.createdDate).toLocaleString()}
                </span>
              </div>
              <p className="text-body-lg text-ink-700">{item.alertDescription}</p>
            </button>
          )
        }}
        keyExtractor={(item) => item.id}
        emptyText="알림 내역이 없습니다."
        className="flex-1 overflow-y-auto"
        listClassName="px-2xl pt-sm pb-3xl"
      />

      {isProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70">
          <Spinner className="size-9" />
        </div>
      )}

      <CustomAlert alert={alert} onClose={hideAlert} />
    </div>
  )
}
