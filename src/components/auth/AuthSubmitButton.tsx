import { Spinner } from '@/components/common'
import { cn } from '@/utils/cn'

export interface AuthSubmitButtonProps {
  label: string
  loading?: boolean
  disabled?: boolean
  onClick?: () => void
  type?: 'button' | 'submit'
  /** 네이티브가 로그인은 기본 크기(14), 회원가입/재설정은 16으로 씁니다. */
  textSize?: 'body' | 'body-lg'
  className?: string
}

/**
 * 인증 화면의 주 버튼(로그인/가입하기/비밀번호 변경하기).
 * 브랜드 배경 · radius 9999 · py16 · shadow-brand · 텍스트 ink-900 bold.
 *
 * `PickerConfirmButton`과 같은 스펙(디자인 스펙 §3-4)이지만 이쪽은 로딩 스피너와 disabled가
 * 필요해 따로 둡니다. 공통 Button 컴포넌트가 생기면 둘 다 그쪽으로 흡수될 자리입니다.
 */
export default function AuthSubmitButton({
  label,
  loading = false,
  disabled = false,
  onClick,
  type = 'submit',
  textSize = 'body-lg',
  className,
}: AuthSubmitButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'flex w-full items-center justify-center rounded-full bg-brand py-lg font-bold text-ink-900 shadow-brand',
        'transition-transform active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100',
        textSize === 'body' ? 'text-body' : 'text-body-lg',
        className,
      )}
    >
      {loading ? (
        // 네이티브 ActivityIndicator color="#0f172a" 대응.
        // Spinner 기본색(text-brand)을 확실히 덮기 위해 인라인 스타일로 지정합니다.
        <Spinner className="size-5" style={{ color: 'var(--color-ink-900)' }} />
      ) : (
        label
      )}
    </button>
  )
}
