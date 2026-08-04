import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import { CustomAlert, Spinner } from '@/components/common'
import { useAlert } from '@/hooks/useAlert'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { useHardwareBack } from '@/hooks/useHardwareBack'
import { storageApi } from '@/services/api/endpoints/storage'
import { toErrorMessage } from '@/services/api/types'
import type { UserProfile } from '@/services/api/endpoints/user'
import { userApi } from '@/services/api/endpoints/user'
import { pickImages, type PickedWebImage } from '@/services/image/imagePicker'
import { cn } from '@/utils/cn'

import WithdrawalModal from './WithdrawalModal'

export interface UserProfileModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  initialData: UserProfile | null
}

/**
 * 내 프로필 수정 모달. 네이티브 `components/setting/modal/UserProfileModal.tsx` 이식.
 * 가운데 뜨는 모달입니다 ({@link ../pet/PetRegistrationModal}과 같은 구조).
 */
export default function UserProfileModal({ open, onClose, onSuccess, initialData }: UserProfileModalProps) {
  useBodyScrollLock(open)
  useHardwareBack(() => {
    onClose()
    return true
  }, open)

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="animate-fade-in fixed inset-0 z-100 flex items-center justify-center bg-dim p-xl">
      <div
        role="dialog"
        aria-modal
        aria-label="내 프로필 수정"
        className="max-h-full w-full max-w-[400px] overflow-y-auto rounded-2xl bg-white p-2xl"
      >
        <ProfileForm key={initialData?.userId ?? 'me'} initialData={initialData} onClose={onClose} onSuccess={onSuccess} />
      </div>
    </div>,
    document.body,
  )
}

interface ProfileFormProps {
  initialData: UserProfile | null
  onClose: () => void
  onSuccess: () => void
}

function ProfileForm({ initialData, onClose, onSuccess }: ProfileFormProps) {
  const [nickName, setNickName] = useState(initialData?.nickName ?? '')
  const [imageSrc, setImageSrc] = useState<string | null>(initialData?.profileUrl ?? null)
  const [pickedImage, setPickedImage] = useState<PickedWebImage | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false)
  const { alert, showSimpleAlert, hideAlert } = useAlert()

  const handlePickImage = async () => {
    try {
      const [picked] = await pickImages({ max: 1 })
      if (!picked) return
      setPickedImage(picked)
      setImageSrc(picked.src)
    } catch (error) {
      showSimpleAlert('오류', toErrorMessage(error, '이미지를 불러오지 못했습니다.'))
    }
  }

  const handleSubmit = async () => {
    if (!nickName.trim()) {
      showSimpleAlert('알림', '닉네임을 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      const profileUrl = pickedImage
        ? await storageApi.uploadImage('USER_PROFILE', pickedImage)
        : imageSrc

      await userApi.updateProfile({ nickName: nickName.trim(), profileUrl })
      showSimpleAlert('성공', '프로필이 수정되었습니다.', onSuccess)
    } catch (error) {
      showSimpleAlert('오류', toErrorMessage(error, '프로필 수정 중 오류가 발생했습니다.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <h2 className="mb-sm text-center text-title font-bold text-ink-900">내 프로필 수정</h2>
      <p className="mb-2xl text-center text-body text-ink-500">
        사용하실 닉네임과 사진을 설정해주세요.
      </p>

      <button
        type="button"
        onClick={() => void handlePickImage()}
        aria-label="프로필 사진 선택"
        className="mx-auto mb-2xl flex size-[100px] items-center justify-center overflow-hidden rounded-full border border-dashed border-ink-200 bg-ink-100"
      >
        {imageSrc ? (
          <img src={imageSrc} alt="" className="size-full object-cover" />
        ) : (
          <span className="flex flex-col items-center">
            <span aria-hidden className="mb-xs text-[24px] leading-none">
              📷
            </span>
            <span className="text-caption text-ink-400">사진 추가</span>
          </span>
        )}
      </button>

      <div className="mb-2xl flex flex-col gap-md">
        <label htmlFor="profile-nickname" className="ml-xs text-body font-semibold text-ink-700">
          닉네임
        </label>
        <input
          id="profile-nickname"
          type="text"
          placeholder="닉네임을 입력하세요"
          value={nickName}
          onChange={(event) => setNickName(event.target.value)}
          maxLength={20}
          className="w-full rounded-md border border-ink-200 bg-ink-50 px-lg py-md text-body text-ink-900 placeholder:text-ink-400"
        />
        <p className="ml-xs text-caption text-ink-400">이메일: {initialData?.email}</p>
      </div>

      <div className="flex gap-md">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="flex-1 rounded-full bg-ink-100 py-3.5 font-bold text-ink-600"
        >
          취소
        </button>
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={isSubmitting || !nickName.trim()}
          className={cn(
            'flex flex-[2] items-center justify-center rounded-full py-3.5 font-bold text-ink-900',
            nickName.trim() ? 'bg-brand shadow-brand' : 'bg-ink-300',
          )}
        >
          {isSubmitting ? <Spinner className="size-6 text-ink-900" /> : <span>수정 완료</span>}
        </button>
      </div>

      <div className="mt-3xl flex justify-center border-t border-ink-100 pt-lg">
        <button
          type="button"
          onClick={() => setIsWithdrawOpen(true)}
          disabled={isSubmitting}
          className="p-sm text-caption text-ink-400 underline"
        >
          회원탈퇴
        </button>
      </div>

      <WithdrawalModal open={isWithdrawOpen} onClose={() => setIsWithdrawOpen(false)} />

      <CustomAlert alert={alert} onClose={hideAlert} />
    </>
  )
}
