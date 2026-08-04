import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { AddTopBar, CustomAlert, Spinner } from '@/components/common'
import { useAlert } from '@/hooks/useAlert'
import { petItemApi, type MajorCategory } from '@/services/api/endpoints/petItem'
import { toErrorMessage } from '@/services/api/types'
import { userItemCategoryApi } from '@/services/api/endpoints/userItemCategory'
import { cn } from '@/utils/cn'

interface SelectedTab {
  id: string
  label: string
}

const ALL_TAB: SelectedTab = { id: 'all', label: '전체' }

/**
 * 용품 카테고리 관리 화면. 네이티브 `src/screens/supply/CategoryManagementScreen.tsx` 이식.
 *
 * 네이티브는 길게 눌러 드래그로 순서를 바꾸지만, 웹은 드래그 라이브러리 없이 위/아래 버튼으로
 * 같은 결과(순서 변경 → 저장)를 냅니다. 제스처 자체보다 "순서를 바꿔서 저장한다"가 기능 요구라
 * 라이브러리를 새로 들이지 않았습니다.
 */
export default function CategoryManagementPage() {
  const navigate = useNavigate()
  const { alert, showSimpleAlert, hideAlert } = useAlert()

  const [selected, setSelected] = useState<SelectedTab[]>([ALL_TAB])
  const [allCategories, setAllCategories] = useState<MajorCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    void (async () => {
      try {
        const [categories, userCategories] = await Promise.all([
          petItemApi.getCategories(),
          userItemCategoryApi.getUserCategories('ITEM'),
        ])
        setAllCategories(categories)
        setSelected([
          ALL_TAB,
          ...userCategories.map((category) => ({
            id: category.category,
            label: `${category.categoryEmoji} ${category.categoryName}`,
          })),
        ])
      } catch (error) {
        showSimpleAlert('오류', toErrorMessage(error, '데이터를 불러오는데 실패했습니다.'))
      } finally {
        setIsLoading(false)
      }
    })()
  }, [showSimpleAlert])

  const handleAdd = (id: string, label: string) => {
    if (selected.some((tab) => tab.id === id)) {
      showSimpleAlert('알림', '이미 추가된 카테고리입니다.')
      return
    }
    setSelected((prev) => [...prev, { id, label }])
  }

  const handleRemove = (id: string) => {
    setSelected((prev) => prev.filter((tab) => tab.id !== id))
  }

  /** index와 index+direction을 맞바꿉니다. 'all'(0번)은 움직이지 않습니다. */
  const handleMove = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 1 || target >= selected.length) return
    setSelected((prev) => {
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const codes = selected.filter((tab) => tab.id !== 'all').map((tab) => tab.id)
      await userItemCategoryApi.saveUserCategories('ITEM', codes)
      navigate(-1)
    } catch (error) {
      showSimpleAlert('오류', toErrorMessage(error, '저장에 실패했습니다.'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <AddTopBar title="용품 카테고리 설정" onBack={() => navigate(-1)} />

      <div className="flex-1 overflow-y-auto px-2xl pb-3xl">
        <div className="mt-2xl mb-lg flex items-center justify-between">
          <p className="text-title-sm font-bold text-ink-900">현재 카테고리 (화살표로 순서 변경)</p>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving}
            className={cn(
              'rounded-sm px-lg py-sm font-bold text-white',
              isSaving ? 'bg-ink-300' : 'bg-brand',
            )}
          >
            {isSaving ? '저장 중...' : '저장'}
          </button>
        </div>

        <div className="rounded-lg bg-white p-md">
          {selected.map((tab, index) => (
            <div
              key={tab.id}
              className="flex h-16 items-center justify-between border-b border-ink-100 px-md last:border-b-0"
            >
              <span className={cn('text-body-lg text-ink-700', tab.id === 'all' && 'text-ink-400')}>
                {tab.label}
              </span>
              {tab.id !== 'all' && (
                <div className="flex items-center gap-md">
                  <button
                    type="button"
                    onClick={() => handleMove(index, -1)}
                    disabled={index <= 1}
                    aria-label="위로 이동"
                    className="text-body-lg text-ink-300 disabled:opacity-30"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(index, 1)}
                    disabled={index >= selected.length - 1}
                    aria-label="아래로 이동"
                    className="text-body-lg text-ink-300 disabled:opacity-30"
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(tab.id)}
                    aria-label={`${tab.label} 삭제`}
                    className="flex size-7 items-center justify-center rounded-full bg-error-bg text-body-lg text-error"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-2xl">
          <p className="mb-lg text-title-sm font-bold text-ink-900">추가할 수 있는 카테고리</p>
          {isLoading ? (
            <div className="mt-2xl flex justify-center">
              <Spinner className="size-9" />
            </div>
          ) : (
            allCategories.map((major) => (
              <div key={major.majorCategory} className="mt-lg rounded-lg bg-white p-lg">
                <div className="mb-md flex items-center gap-sm">
                  <span aria-hidden className="text-body-lg">
                    {major.majorCategoryEmoji}
                  </span>
                  <span className="text-body-lg font-bold text-ink-600">{major.majorCategoryName}</span>
                </div>
                <div className="flex flex-wrap gap-sm">
                  {major.categories.map((category) => {
                    const isAdded = selected.some((tab) => tab.id === category.category)
                    return (
                      <button
                        key={category.category}
                        type="button"
                        onClick={() => handleAdd(category.category, `${category.emoji} ${category.categoryName}`)}
                        className={cn(
                          'rounded-full px-lg py-sm text-body text-ink-700',
                          isAdded ? 'bg-ink-200 opacity-50' : 'bg-ink-100',
                        )}
                      >
                        {category.emoji} {category.categoryName}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <CustomAlert alert={alert} onClose={hideAlert} />
    </div>
  )
}
