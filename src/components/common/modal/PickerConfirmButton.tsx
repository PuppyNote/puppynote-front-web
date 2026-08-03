import { cn } from '@/utils/cn'

export interface PickerConfirmButtonProps {
  onClick: () => void
  label?: string
  className?: string
}

/**
 * 피커 모달 하단의 확인 버튼.
 * 브랜드 배경 · radius 9999 · py16 · shadow `0 4px 8px rgba(238,189,43,.2)` · 텍스트 `#0f172a` bold
 *
 * 로그인 CTA와 같은 스펙이라(디자인 스펙 §3-4) 버튼 컴포넌트가 정리되면 그쪽으로 흡수될 수 있습니다.
 */
export default function PickerConfirmButton({
  onClick,
  label = '확인',
  className,
}: PickerConfirmButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full rounded-full bg-brand py-lg text-body-lg font-bold text-ink-900 shadow-brand',
        'transition-transform active:scale-[0.98]',
        className,
      )}
    >
      {label}
    </button>
  )
}
