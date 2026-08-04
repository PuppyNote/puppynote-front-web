import { useEffect, useState } from 'react'

import { GlobalDetailModal, Spinner } from '@/components/common'
import { useAlert } from '@/hooks/useAlert'
import { alertSettingApi, type AlertSettingData } from '@/services/api/endpoints/alertSetting'
import { toErrorMessage } from '@/services/api/types'
import { cn } from '@/utils/cn'

export interface AlertSettingModalProps {
  open: boolean
  onClose: () => void
}

const ITEMS: { key: keyof AlertSettingData; title: string; description: string }[] = [
  { key: 'all', title: '전체 알림', description: '모든 푸시 알림을 켜거나 끕니다.' },
  { key: 'walk', title: '산책 알림', description: '산책 시간 및 활동 관련 알림을 받습니다.' },
  { key: 'friend', title: '친구 알림', description: '친구 요청 및 커뮤니티 관련 알림을 받습니다.' },
]

/** 알림 설정 모달. 네이티브 `components/setting/modal/AlertSettingModal.tsx` 이식. */
export default function AlertSettingModal({ open, onClose }: AlertSettingModalProps) {
  const [settings, setSettings] = useState<AlertSettingData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { showSimpleAlert } = useAlert()

  useEffect(() => {
    if (!open) return

    void (async () => {
      setIsLoading(true)
      try {
        setSettings(await alertSettingApi.getAlertSetting())
      } catch (error) {
        showSimpleAlert('오류', toErrorMessage(error, '알림 설정을 불러오지 못했습니다.'))
      } finally {
        setIsLoading(false)
      }
    })()
  }, [open, showSimpleAlert])

  const handleToggle = async (key: keyof AlertSettingData) => {
    if (!settings) return

    const previous = settings
    const next: AlertSettingData = { ...settings, [key]: settings[key] === 'ON' ? 'OFF' : 'ON' }
    setSettings(next) // 낙관적 업데이트

    try {
      setSettings(await alertSettingApi.updateAlertSetting(next))
    } catch (error) {
      setSettings(previous)
      showSimpleAlert('오류', toErrorMessage(error, '알림 설정 변경에 실패했습니다.'))
    }
  }

  return (
    <GlobalDetailModal open={open} onClose={onClose} title="알림 설정" height="60%">
      {isLoading && !settings ? (
        <div className="mt-4xl flex justify-center">
          <Spinner className="size-9" />
        </div>
      ) : (
        <div className="divide-y divide-ink-100 rounded-2xl bg-white shadow-card">
          {ITEMS.map(({ key, title, description }) => {
            const enabled = settings?.[key] === 'ON'
            return (
              <div key={key} className="flex items-center justify-between px-xl py-xl">
                <div className="mr-lg min-w-0 flex-1">
                  <p className="mb-xs text-body-lg font-bold text-ink-900">{title}</p>
                  <p className="text-caption text-ink-500">{description}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  aria-label={title}
                  disabled={isLoading || !settings}
                  onClick={() => void handleToggle(key)}
                  className={cn(
                    'relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors',
                    enabled ? 'bg-brand' : 'bg-switch-off-track',
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 left-0.5 size-[27px] rounded-full bg-white shadow-input transition-transform',
                      enabled && 'translate-x-5',
                    )}
                  />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </GlobalDetailModal>
  )
}
