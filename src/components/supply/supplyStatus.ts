import type { BadgeVariant } from '@/components/common'
import { calculateDaysDifference } from '@/utils/date'

export interface SupplyStatus {
  label: string
  variant: BadgeVariant
}

/**
 * 다음 구매 예정일로 소진 상태 배지를 계산합니다.
 * 네이티브 `SuppliesScreen`/`SuppliesDetailModal`에 각각 복제되어 있던 `getStatusInfo`를 하나로 모았습니다.
 */
export function getSupplyStatus(nextPurchaseAt: string | null): SupplyStatus {
  if (!nextPurchaseAt) return { label: '미구매 항목', variant: 'neutral' }

  const daysLeft = calculateDaysDifference(nextPurchaseAt)

  if (daysLeft < 0) return { label: `소진됨 (${Math.abs(daysLeft)}일 경과)`, variant: 'error' }
  if (daysLeft === 0) return { label: '오늘 소진 예정', variant: 'error' }
  if (daysLeft <= 3) return { label: `${daysLeft}일 후 소진 예정`, variant: 'error' }
  if (daysLeft <= 7) return { label: `${daysLeft}일 후 소진 예정`, variant: 'warning' }
  return { label: '재고 충분', variant: 'success' }
}
