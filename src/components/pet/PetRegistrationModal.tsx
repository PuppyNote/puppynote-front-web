import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import { CustomAlert, DatePickerModal, Spinner } from '@/components/common'
import { useAlert } from '@/hooks/useAlert'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { useHardwareBack } from '@/hooks/useHardwareBack'
import { homeApi } from '@/services/api/endpoints/home'
import { petApi } from '@/services/api/endpoints/pet'
import { extractImageKey, storageApi } from '@/services/api/endpoints/storage'
import { toErrorMessage } from '@/services/api/types'
import { pickImages, type PickedWebImage } from '@/services/image/imagePicker'
import { cn } from '@/utils/cn'

export interface PetRegistrationModalProps {
  open: boolean
  onClose: () => void
  /**
   * 등록/수정 성공 후. 성공 알럿의 확인을 누른 시점에 호출됩니다(네이티브와 동일).
   * 수정 모드에서는 넘어오는 값이 `editPetId`와 입력한 이름입니다.
   */
  onSuccess: (petId: number, petName: string) => void
  /** 넘기면 수정 모드가 됩니다. */
  editPetId?: number | null
}

/**
 * 반려동물 등록/수정 모달. 네이티브 `components/common/modal/PetRegistrationModal.tsx` 이식.
 *
 * 바텀시트가 아니라 화면 가운데 뜨는 모달입니다(네이티브 `Modal animationType="fade"`).
 * 그래서 {@link ../common/modal/BottomSheetModal}을 쓰지 않고 여기서 직접 딤/시트를 그립니다.
 *
 * 네이티브 RN `Modal`은 `onRequestClose`를 주지 않아 안드로이드 뒤로가기가 먹지 않지만,
 * 웹의 다른 모달들과 동작을 맞춰 Esc·하드웨어 뒤로가기로도 닫히게 했습니다.
 */
export default function PetRegistrationModal({
  open,
  onClose,
  onSuccess,
  editPetId,
}: PetRegistrationModalProps) {
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
        aria-label={editPetId ? '우리 아이 정보 수정' : '우리 아이 등록하기'}
        className="max-h-full w-full max-w-[400px] overflow-y-auto rounded-2xl bg-white p-2xl"
      >
        {/*
          열릴 때마다 새로 마운트되게 해서 이전 입력이 남지 않게 합니다.
          (네이티브는 visible 변화를 이펙트로 감지해 필드를 비웁니다)
        */}
        <PetRegistrationForm
          key={editPetId ?? 'new'}
          editPetId={editPetId ?? null}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      </div>
    </div>,
    document.body,
  )
}

interface PetRegistrationFormProps {
  editPetId: number | null
  onClose: () => void
  onSuccess: (petId: number, petName: string) => void
}

function PetRegistrationForm({ editPetId, onClose, onSuccess }: PetRegistrationFormProps) {
  const isEditMode = editPetId !== null

  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [registrationNumber, setRegistrationNumber] = useState('')
  /** 미리보기에 쓰는 값. 기존 이미지는 원격 URL, 새로 고른 이미지는 base64 dataUrl입니다. */
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  /** 이번에 새로 고른 이미지. 있으면 저장 시 업로드합니다. */
  const [pickedImage, setPickedImage] = useState<PickedWebImage | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDataLoading, setIsDataLoading] = useState(isEditMode)
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const { alert, showSimpleAlert, hideAlert } = useAlert()

  // 수정 모드 초기값. 펫 단건 조회 API가 없어 홈 정보를 재사용합니다(네이티브와 동일).
  useEffect(() => {
    if (editPetId === null) return

    let cancelled = false

    void (async () => {
      try {
        const data = await homeApi.getHomeInfo(editPetId)
        if (cancelled) return
        setName(data.petName || '')
        setBirthDate(data.birthDate || '')
        setRegistrationNumber(data.registrationNumber || '')
        setImageSrc(data.petProfileImageUrl || null)
      } catch (error) {
        console.error('펫 정보를 불러오지 못했습니다.', error)
      } finally {
        if (!cancelled) setIsDataLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [editPetId])

  const handlePickImage = async () => {
    try {
      const [picked] = await pickImages({ max: 1 })
      // 취소하면 빈 배열이 옵니다. 이때는 기존 이미지를 그대로 둡니다.
      if (!picked) return
      setPickedImage(picked)
      setImageSrc(picked.src)
    } catch (error) {
      showSimpleAlert('오류', toErrorMessage(error, '이미지를 불러오지 못했습니다.'))
    }
  }

  const handleSubmit = async () => {
    if (!name) {
      showSimpleAlert('알림', '펫 이름을 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      // 새로 고른 이미지는 업로드해서 키를 받고, 기존 이미지는 URL에서 키만 되뽑습니다.
      let imageKey = ''
      if (pickedImage) {
        imageKey = await storageApi.uploadImage('PUPPY_PROFILE', pickedImage)
      } else if (imageSrc) {
        imageKey = extractImageKey(imageSrc)
      }

      if (isEditMode) {
        await petApi.updatePet(editPetId, {
          name,
          birthDate: birthDate || null,
          profileImage: imageKey || null,
          registrationNumber: registrationNumber || null,
        })
        showSimpleAlert('성공', '정보가 수정되었습니다.', () => onSuccess(editPetId, name))
      } else {
        const created = await petApi.registerPet({
          name,
          birthDate: birthDate || undefined,
          profileImage: imageKey || undefined,
          registrationNumber: registrationNumber || undefined,
        })
        showSimpleAlert('성공', '반려동물이 등록되었습니다.', () =>
          onSuccess(created.petId, created.petName),
        )
      }
    } catch (error) {
      showSimpleAlert(
        '오류',
        toErrorMessage(error, `${isEditMode ? '수정' : '등록'} 중 오류가 발생했습니다.`),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isDataLoading) {
    return (
      <div className="flex flex-col items-center py-4xl">
        <Spinner className="size-9" />
        <p className="mt-md text-body text-ink-500">정보를 불러오는 중...</p>
      </div>
    )
  }

  return (
    <>
      <h2 className="mb-sm text-center text-title font-bold text-ink-900">
        {isEditMode ? '우리 아이 정보 수정' : '우리 아이 등록하기'}
      </h2>
      <p className="mb-2xl text-center text-body text-ink-500">
        {isEditMode
          ? '수정할 반려동물의 정보를 입력해주세요.'
          : '함께할 반려동물의 정보를 입력해주세요.'}
      </p>

      <button
        type="button"
        onClick={handlePickImage}
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
        <label htmlFor="pet-name" className="ml-xs text-body font-semibold text-ink-700">
          이름 (필수)
        </label>
        <input
          id="pet-name"
          type="text"
          placeholder="이름을 입력하세요"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-md border border-ink-200 bg-ink-50 px-lg py-md text-body text-ink-900 placeholder:text-ink-400"
        />

        <span className="ml-xs text-body font-semibold text-ink-700">생년월일</span>
        <button
          type="button"
          onClick={() => setIsDatePickerOpen(true)}
          className="flex w-full items-center justify-between rounded-md border border-ink-200 bg-ink-50 px-lg py-md"
        >
          <span className={cn('text-body', birthDate ? 'text-ink-900' : 'text-ink-400')}>
            {birthDate || 'YYYY-MM-DD'}
          </span>
          <span aria-hidden className="text-body-lg leading-none">
            📅
          </span>
        </button>

        <label
          htmlFor="pet-registration-number"
          className="ml-xs text-body font-semibold text-ink-700"
        >
          동물등록번호 (선택)
        </label>
        <input
          id="pet-registration-number"
          type="text"
          inputMode="numeric"
          placeholder="동물등록번호를 입력하세요"
          value={registrationNumber}
          onChange={(event) => setRegistrationNumber(event.target.value)}
          className="w-full rounded-md border border-ink-200 bg-ink-50 px-lg py-md text-body text-ink-900 placeholder:text-ink-400"
        />
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
          onClick={handleSubmit}
          disabled={isSubmitting || !name}
          className={cn(
            'flex flex-[2] items-center justify-center rounded-full py-3.5 font-bold text-ink-900',
            name ? 'bg-brand shadow-brand' : 'bg-ink-300',
          )}
        >
          {isSubmitting ? (
            <Spinner className="size-6 text-ink-900" />
          ) : (
            <span>{isEditMode ? '수정하기' : '등록하기'}</span>
          )}
        </button>
      </div>

      <DatePickerModal
        open={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        onConfirm={setBirthDate}
        initialDate={birthDate}
      />

      <CustomAlert alert={alert} onClose={hideAlert} />
    </>
  )
}
