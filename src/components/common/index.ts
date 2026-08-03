/**
 * 공통 컴포넌트 barrel.
 * 화면 코드에서 `import { Card, Badge } from '@/components/common'`처럼 씁니다.
 */
export { default as Badge } from './Badge'
export type { BadgeProps, BadgeVariant } from './Badge'

export { default as Card } from './Card'
export type { CardProps } from './Card'

export { default as CustomText } from './CustomText'
export type { CustomTextProps, TextVariant, TextWeight } from './CustomText'

export { default as FloatingActionButton } from './FloatingActionButton'
export type { FloatingActionButtonProps } from './FloatingActionButton'

export { default as MultiImageSelector } from './MultiImageSelector'
export type { MultiImageSelectorProps } from './MultiImageSelector'

export { default as PagedList } from './PagedList'
export type { PagedListProps, PageResult } from './PagedList'

export { default as PetTab } from './PetTab'
export type { PetTabProps, PetSummary } from './PetTab'

export { default as PlaceholderPage } from './PlaceholderPage'

export { default as ScrollableTab } from './ScrollableTab'
export type { ScrollableTabProps, ScrollableTabItem } from './ScrollableTab'

export { default as SearchBar } from './SearchBar'
export type { SearchBarProps } from './SearchBar'

export { default as WheelPicker } from './WheelPicker'
export type { WheelPickerProps } from './WheelPicker'

export { SearchIcon, Spinner } from './icons'

export { default as BottomSheetModal } from './modal/BottomSheetModal'
export type { BottomSheetModalProps } from './modal/BottomSheetModal'

export { default as DatePickerModal } from './modal/DatePickerModal'
export type { DatePickerModalProps } from './modal/DatePickerModal'

export { default as PickerConfirmButton } from './modal/PickerConfirmButton'
export type { PickerConfirmButtonProps } from './modal/PickerConfirmButton'

export { default as TimePickerModal } from './modal/TimePickerModal'
export type { TimePickerModalProps } from './modal/TimePickerModal'
