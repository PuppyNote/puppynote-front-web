import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { AddTopBar, CustomAlert, Spinner } from '@/components/common'
import CyclePickerModal from '@/components/supply/CyclePickerModal'
import UserCategoryPickerModal from '@/components/supply/UserCategoryPickerModal'
import { useAlert } from '@/hooks/useAlert'
import { petItemApi } from '@/services/api/endpoints/petItem'
import { extractImageKey, storageApi } from '@/services/api/endpoints/storage'
import { toErrorMessage } from '@/services/api/types'
import {
  userItemCategoryApi,
  type UserCategoryResponse,
} from '@/services/api/endpoints/userItemCategory'
import { pickImages, type PickedWebImage } from '@/services/image/imagePicker'
import { usePet } from '@/services/pet/PetContext'
import { cn } from '@/utils/cn'

/** 용품 등록/수정 화면. 네이티브 `src/screens/supply/AddSupplyScreen.tsx` 이식. */
export default function AddSupplyPage() {
  const navigate = useNavigate()
  const { selectedPet } = usePet()
  const [searchParams] = useSearchParams()
  const editItemId = searchParams.get('edit')
  const isEditMode = editItemId !== null
  const { alert, showSimpleAlert, hideAlert } = useAlert()

  const [name, setName] = useState('')
  const [purchaseUrl, setPurchaseUrl] = useState('')
  const [purchaseCycleDays, setPurchaseCycleDays] = useState(30)
  const [userCategories, setUserCategories] = useState<UserCategoryResponse[]>([])
  const [selectedCategory, setSelectedCategory] = useState<UserCategoryResponse | null>(null)
  /** 기존 이미지는 원격 URL, 새로 고른 이미지는 base64 dataUrl입니다. */
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [pickedImage, setPickedImage] = useState<PickedWebImage | null>(null)

  const [isDataLoading, setIsDataLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)

  useEffect(() => {
    void (async () => {
      try {
        const [categories, item] = await Promise.all([
          userItemCategoryApi.getUserCategories('ITEM'),
          isEditMode ? petItemApi.getPetItemDetail(Number(editItemId)) : Promise.resolve(null),
        ])
        setUserCategories(categories)

        if (item) {
          setName(item.name)
          setPurchaseUrl(item.purchaseUrl ?? '')
          setPurchaseCycleDays(item.purchaseCycleDays)
          setImageSrc(item.imageUrl)
          setSelectedCategory(categories.find((c) => c.category === item.category) ?? null)
        } else if (categories.length > 0) {
          setSelectedCategory(categories[0])
        }
      } catch (error) {
        showSimpleAlert('오류', toErrorMessage(error, '데이터를 불러오지 못했습니다.'))
      } finally {
        setIsDataLoading(false)
      }
    })()
  }, [isEditMode, editItemId, showSimpleAlert])

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

  const handleSave = async () => {
    if (!name.trim()) {
      showSimpleAlert('알림', '용품 이름을 입력해주세요.')
      return
    }
    if (!selectedCategory) {
      showSimpleAlert('알림', '카테고리를 선택해주세요.')
      return
    }
    if (!isEditMode && !selectedPet) {
      showSimpleAlert('오류', '선택된 반려동물이 없습니다.')
      return
    }

    setIsSubmitting(true)
    try {
      let imageKey: string | undefined
      if (pickedImage) {
        imageKey = await storageApi.uploadImage('PET_ITEM_PHOTO', pickedImage)
      } else if (imageSrc) {
        imageKey = extractImageKey(imageSrc)
      }

      if (isEditMode) {
        await petItemApi.updatePetItem(Number(editItemId), {
          name,
          category: selectedCategory.category,
          purchaseCycleDays,
          purchaseUrl: purchaseUrl.trim() || undefined,
          imageKey,
        })
        showSimpleAlert('성공', '용품 정보가 수정되었습니다.', () => navigate(-1))
      } else {
        await petItemApi.createPetItem({
          petId: selectedPet!.id,
          name,
          category: selectedCategory.category,
          purchaseCycleDays,
          purchaseUrl: purchaseUrl.trim() || undefined,
          imageKey,
        })
        showSimpleAlert('성공', '용품이 등록되었습니다.', () => navigate(-1))
      }
    } catch (error) {
      showSimpleAlert(
        '오류',
        toErrorMessage(error, `용품 ${isEditMode ? '수정' : '등록'} 중 오류가 발생했습니다.`),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isDataLoading) {
    return (
      <div className="flex h-full flex-col">
        <AddTopBar title={isEditMode ? '용품 수정하기' : '용품 등록하기'} onBack={() => navigate(-1)} />
        <div className="flex flex-1 items-center justify-center">
          <Spinner className="size-9" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <AddTopBar title={isEditMode ? '용품 수정하기' : '용품 등록하기'} onBack={() => navigate(-1)} />

      <div className="flex-1 overflow-y-auto px-2xl pb-4xl">
        <div className="flex justify-center py-3xl">
          <button
            type="button"
            onClick={() => void handlePickImage()}
            className="flex size-28 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-ink-200 bg-white shadow-card"
          >
            {imageSrc ? (
              <img src={imageSrc} alt="" className="size-full object-cover" />
            ) : (
              <span className="flex flex-col items-center">
                <span aria-hidden className="text-[32px] leading-none font-light text-ink-400">
                  +
                </span>
                <span className="mt-xs text-caption-xs font-bold text-ink-400">사진 추가</span>
              </span>
            )}
          </button>
        </div>

        <div className="flex flex-col gap-2xl">
          <div className="flex flex-col gap-sm">
            <p className="ml-xs text-caption font-bold tracking-wide text-ink-500 uppercase">용품 이름</p>
            <div className="rounded-lg border border-ink-100 bg-white p-lg shadow-card">
              <input
                type="text"
                placeholder="예: 프리미엄 사료"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full text-body-lg text-ink-900 placeholder:text-ink-300"
              />
            </div>
          </div>

          <div className="flex flex-col gap-sm">
            <p className="ml-xs text-caption font-bold tracking-wide text-ink-500 uppercase">
              구매 링크 (선택)
            </p>
            <div className="flex items-center gap-md rounded-lg border border-ink-100 bg-white p-lg shadow-card">
              <span aria-hidden className="text-body-lg">
                🔗
              </span>
              <input
                type="text"
                placeholder="https://..."
                value={purchaseUrl}
                onChange={(event) => setPurchaseUrl(event.target.value)}
                autoCapitalize="none"
                className="w-full min-w-0 flex-1 text-body-lg text-ink-900 placeholder:text-ink-300"
              />
            </div>
          </div>

          <div className="flex gap-lg">
            <button
              type="button"
              onClick={() => setIsCycleModalOpen(true)}
              className="flex flex-1 flex-col gap-sm text-left"
            >
              <p className="ml-xs text-caption font-bold tracking-wide text-ink-500 uppercase">구매 주기</p>
              <div className="flex items-center justify-between rounded-lg border border-ink-100 bg-white p-lg shadow-card">
                <span className="text-body-lg font-medium text-ink-900">{purchaseCycleDays}일</span>
                <span aria-hidden className="text-caption text-ink-400">
                  ▼
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(true)}
              className="flex flex-1 flex-col gap-sm text-left"
            >
              <p className="ml-xs text-caption font-bold tracking-wide text-ink-500 uppercase">카테고리</p>
              <div className="flex items-center justify-between rounded-lg border border-ink-100 bg-white p-lg shadow-card">
                <span className="truncate text-body-lg font-medium text-ink-900">
                  {selectedCategory
                    ? `${selectedCategory.categoryEmoji} ${selectedCategory.categoryName}`
                    : '선택'}
                </span>
                <span aria-hidden className="text-caption text-ink-400">
                  ▼
                </span>
              </div>
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={isSubmitting}
          className={cn(
            'mt-3xl flex w-full items-center justify-center rounded-full py-lg font-bold text-ink-900 shadow-brand',
            isSubmitting ? 'bg-ink-200' : 'bg-brand',
          )}
        >
          {isSubmitting ? <Spinner className="size-6" /> : '등록하기'}
        </button>
      </div>

      <CyclePickerModal
        open={isCycleModalOpen}
        onClose={() => setIsCycleModalOpen(false)}
        onConfirm={setPurchaseCycleDays}
        initialDays={purchaseCycleDays}
      />

      <UserCategoryPickerModal
        open={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onConfirm={setSelectedCategory}
        userCategories={userCategories}
        initialCategory={selectedCategory?.category}
      />

      <CustomAlert alert={alert} onClose={hideAlert} />
    </div>
  )
}
