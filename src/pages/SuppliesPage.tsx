import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { FloatingActionButton, Spinner } from '@/components/common'
import CategoryTab from '@/components/supply/CategoryTab'
import SuppliesDetailModal from '@/components/supply/SuppliesDetailModal'
import SupplyItem from '@/components/supply/SupplyItem'
import { getSupplyStatus } from '@/components/supply/supplyStatus'
import { petItemApi, type PetItem } from '@/services/api/endpoints/petItem'
import { usePet } from '@/services/pet/PetContext'
import { ROUTES } from '@/routes/paths'

/** 용품 관리 화면. 네이티브 `src/screens/supply/SuppliesScreen.tsx` 이식. */
export default function SuppliesPage() {
  const navigate = useNavigate()
  const { selectedPet, isLoadingPet } = usePet()
  const [activeTab, setActiveTab] = useState('all')
  const [items, setItems] = useState<PetItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)

  const fetchItems = useCallback(async (petId: number, category: string) => {
    setIsLoading(true)
    try {
      setItems(await petItemApi.getPetItems(petId, category === 'all' ? undefined : category))
    } catch (error) {
      console.warn('용품 목록을 불러오지 못했습니다.', error)
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isLoadingPet || !selectedPet) return
    void (async () => {
      await fetchItems(selectedPet.id, activeTab)
    })()
  }, [isLoadingPet, selectedPet, activeTab, fetchItems])

  return (
    <div className="flex h-full flex-col">
      <CategoryTab
        activeTabId={activeTab}
        onTabPress={setActiveTab}
        onAddPress={() => navigate(ROUTES.SUPPLY_CATEGORIES)}
      />

      <div className="flex-1 overflow-y-auto px-2xl py-2xl">
        {isLoading ? (
          <div className="mt-4xl flex justify-center">
            <Spinner className="size-9" />
          </div>
        ) : !selectedPet ? (
          <p className="mt-4xl text-center text-body-lg text-ink-400">반려동물을 등록해주세요 🐶</p>
        ) : items.length === 0 ? (
          <p className="mt-4xl text-center text-body-lg text-ink-400">등록된 용품이 없어요 🦴</p>
        ) : (
          items.map((item) => {
            const status = getSupplyStatus(item.nextPurchaseAt)
            return (
              <SupplyItem
                key={item.petItemId}
                title={item.name}
                category={item.categoryName}
                image={item.imageUrl}
                status={status.label}
                statusVariant={status.variant}
                onPress={() => setSelectedItemId(item.petItemId)}
              />
            )
          })
        )}
        <div className="h-32" />
      </div>

      <FloatingActionButton label="용품 등록" onClick={() => navigate(ROUTES.ADD_SUPPLY)} />

      <SuppliesDetailModal
        open={selectedItemId !== null}
        petItemId={selectedItemId}
        onClose={() => setSelectedItemId(null)}
        onRefreshList={() => selectedPet && void fetchItems(selectedPet.id, activeTab)}
      />
    </div>
  )
}
