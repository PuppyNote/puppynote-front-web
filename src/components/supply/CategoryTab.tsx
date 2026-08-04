import { useEffect, useState } from 'react'

import { ScrollableTab } from '@/components/common'
import type { ScrollableTabItem } from '@/components/common'
import { userItemCategoryApi } from '@/services/api/endpoints/userItemCategory'

const ALL_TAB: ScrollableTabItem = { id: 'all', label: '전체' }

export interface CategoryTabProps {
  activeTabId: string
  onTabPress: (id: string) => void
  onAddPress: () => void
}

/**
 * 용품 카테고리 탭(연결 버전). 네이티브 `components/health/item/CategoryTab.tsx`를
 * `categoryType="ITEM"` 용도로 이식했습니다 (활동 카테고리는 건강 기록 이식 티켓에서).
 *
 * 표시는 {@link ../common/ScrollableTab}이 하고, 여기서는 사용자가 등록해 둔 용품
 * 카테고리 목록만 조회해서 넘깁니다. `+` 버튼은 카테고리 관리 화면으로 이동합니다.
 */
export default function CategoryTab({ activeTabId, onTabPress, onAddPress }: CategoryTabProps) {
  const [tabs, setTabs] = useState<ScrollableTabItem[]>([ALL_TAB])

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const categories = await userItemCategoryApi.getUserCategories('ITEM')
        if (cancelled) return
        setTabs([
          ALL_TAB,
          ...categories.map((category) => ({
            id: category.category,
            label: `${category.categoryEmoji} ${category.categoryName}`,
          })),
        ])
      } catch (error) {
        console.warn('용품 카테고리를 불러오지 못했습니다.', error)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <ScrollableTab
      tabs={tabs}
      activeTabId={activeTabId}
      onTabPress={(id) => onTabPress(String(id))}
      onAdd={onAddPress}
      addLabel="카테고리 관리"
    />
  )
}
