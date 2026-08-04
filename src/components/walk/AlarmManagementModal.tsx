import { useEffect, useState } from 'react'

import { CustomAlert, GlobalDetailModal, Spinner } from '@/components/common'
import { useAlert } from '@/hooks/useAlert'
import {
  petWalkAlarmApi,
  type WalkAlarm,
  type WalkAlarmStatus,
} from '@/services/api/endpoints/petWalkAlarm'
import { toErrorMessage } from '@/services/api/types'
import { usePet } from '@/services/pet/PetContext'

import AlarmItem from './AlarmItem'
import WalkAlarmTimePicker, { type WalkAlarmFormValue } from './WalkAlarmTimePicker'

export interface AlarmManagementModalProps {
  open: boolean
  onClose: () => void
}

const toStatus = (enabled: boolean): WalkAlarmStatus => (enabled ? 'YES' : 'NO')

/** 산책 알람 관리 모달. 네이티브 `components/walk/modal/AlarmManagementModal.tsx` 이식. */
export default function AlarmManagementModal({ open, onClose }: AlarmManagementModalProps) {
  const { selectedPet } = usePet()
  const [isAdding, setIsAdding] = useState(false)
  const [editingAlarmId, setEditingAlarmId] = useState<number | null>(null)
  const [alarms, setAlarms] = useState<WalkAlarm[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { alert, showSimpleAlert, hideAlert } = useAlert()

  useEffect(() => {
    void (async () => {
      if (!open) {
        setIsAdding(false)
        setEditingAlarmId(null)
        return
      }
      if (!selectedPet) return

      setIsLoading(true)
      try {
        setAlarms(await petWalkAlarmApi.getWalkAlarms(selectedPet.id))
      } catch (error) {
        console.warn('알람 목록을 불러오지 못했습니다.', error)
      } finally {
        setIsLoading(false)
      }
    })()
  }, [open, selectedPet])

  const handleSaveAlarm = async (value: WalkAlarmFormValue) => {
    if (!selectedPet) return

    if (value.days.length === 0) {
      showSimpleAlert('알림', '최소 하루 이상을 선택해주세요.')
      return
    }

    setIsLoading(true)
    try {
      if (editingAlarmId) {
        await petWalkAlarmApi.updateWalkAlarm({
          alarmId: editingAlarmId,
          alarmStatus: toStatus(value.enabled),
          alarmDays: value.days,
          alarmTime: `${value.hour}:${value.minute}`,
        })
      } else {
        await petWalkAlarmApi.createWalkAlarm({
          petId: selectedPet.id,
          alarmStatus: toStatus(value.enabled),
          alarmDays: value.days,
          alarmTime: `${value.hour}:${value.minute}`,
        })
      }

      setAlarms(await petWalkAlarmApi.getWalkAlarms(selectedPet.id))
      setIsAdding(false)
      setEditingAlarmId(null)
      showSimpleAlert('성공', '알림이 저장되었습니다.')
    } catch (error) {
      showSimpleAlert('오류', toErrorMessage(error, '알람 저장에 실패했습니다.'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditPress = (id: string) => {
    setEditingAlarmId(Number(id))
    setIsAdding(true)
  }

  const toggleAlarm = async (id: string) => {
    const alarm = alarms.find((item) => item.alarmId.toString() === id)
    if (!alarm) return

    const newStatus: WalkAlarmStatus = alarm.alarmStatus === 'YES' ? 'NO' : 'YES'

    setIsLoading(true)
    try {
      await petWalkAlarmApi.updateWalkAlarmStatus(alarm.alarmId, newStatus)
      setAlarms((prev) =>
        prev.map((item) =>
          item.alarmId === alarm.alarmId ? { ...item, alarmStatus: newStatus } : item,
        ),
      )
    } catch (error) {
      showSimpleAlert('오류', toErrorMessage(error, '상태 변경에 실패했습니다.'))
    } finally {
      setIsLoading(false)
    }
  }

  const deleteAlarm = async (id: string) => {
    const alarmId = Number(id)
    setIsLoading(true)
    try {
      await petWalkAlarmApi.deleteWalkAlarm(alarmId)
      setAlarms((prev) => prev.filter((item) => item.alarmId !== alarmId))
      showSimpleAlert('성공', '알림이 삭제되었습니다.')
    } catch (error) {
      showSimpleAlert('오류', toErrorMessage(error, '알람 삭제에 실패했습니다.'))
    } finally {
      setIsLoading(false)
    }
  }

  const editingAlarm = editingAlarmId
    ? alarms.find((item) => item.alarmId === editingAlarmId)
    : null

  return (
    <GlobalDetailModal
      open={open}
      onClose={onClose}
      title="산책 관리"
      height="80%"
      backgroundColor="#f8fafc"
    >
      {isAdding ? (
        <WalkAlarmTimePicker
          initialData={
            editingAlarm
              ? {
                  hour: editingAlarm.alarmTime.split(':')[0],
                  minute: editingAlarm.alarmTime.split(':')[1],
                  days: editingAlarm.alarmDays,
                  enabled: editingAlarm.alarmStatus === 'YES',
                }
              : undefined
          }
          onSave={(value) => void handleSaveAlarm(value)}
          onCancel={() => {
            setIsAdding(false)
            setEditingAlarmId(null)
          }}
        />
      ) : (
        <>
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            disabled={isLoading}
            className="mb-2xl flex w-full items-center justify-center gap-md rounded-xl border-2 border-dashed border-brand bg-white p-xl disabled:opacity-60"
          >
            <span aria-hidden className="text-heading font-bold text-brand">
              +
            </span>
            <span className="text-body-lg font-bold text-brand">새로운 알림 추가</span>
          </button>

          {isLoading && alarms.length === 0 ? (
            <div className="mt-4xl flex justify-center">
              <Spinner className="size-9" />
            </div>
          ) : alarms.length === 0 ? (
            <div className="flex flex-col items-center pt-4xl">
              <p className="mb-sm text-body-lg font-bold text-ink-600">등록된 알림이 없습니다.</p>
              <p className="text-body text-ink-400">위의 버튼을 눌러 추가해보세요!</p>
            </div>
          ) : (
            alarms.map((alarm) => (
              <AlarmItem
                key={alarm.alarmId}
                id={alarm.alarmId.toString()}
                hour={alarm.alarmTime.split(':')[0]}
                minute={alarm.alarmTime.split(':')[1]}
                days={alarm.alarmDays}
                enabled={alarm.alarmStatus === 'YES'}
                onToggle={(id) => void toggleAlarm(id)}
                onDelete={(id) => void deleteAlarm(id)}
                onPress={handleEditPress}
              />
            ))
          )}
        </>
      )}

      <CustomAlert alert={alert} onClose={hideAlert} />
    </GlobalDetailModal>
  )
}
