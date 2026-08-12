import { Badge } from '@/components/common'
import type { BadgeVariant } from '@/components/common'

export interface SupplyItemProps {
  title: string
  category: string
  status: string
  statusVariant: BadgeVariant
  image: string | null
  onPress: () => void
}

/** 용품 목록 카드. 네이티브 `components/supply/item/SupplyItem.tsx` 이식. */
export default function SupplyItem({
  title,
  category,
  status,
  statusVariant,
  image,
  onPress,
}: SupplyItemProps) {
  return (
    <button
      type="button"
      onClick={onPress}
      className="mb-lg flex w-full items-center gap-lg rounded-lg border border-ink-100 bg-white p-lg text-left shadow-card"
    >
      {image ? (
        <img
          src={image}
          alt=""
          loading="lazy"
          decoding="async"
          className="size-16 shrink-0 rounded-md object-cover"
        />
      ) : (
        <span className="flex size-16 shrink-0 items-center justify-center rounded-md bg-ink-100 text-heading">
          🦴
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-title-sm font-bold text-ink-900">{title}</p>
        <p className="mt-0.5 truncate text-caption text-ink-400">{category}</p>
      </div>
      <Badge label={status} variant={statusVariant} />
    </button>
  )
}
