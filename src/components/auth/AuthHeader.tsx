import { cn } from '@/utils/cn'

export interface AuthHeaderProps {
  title: string
  subtitle?: string
  /**
   * 로고 크기. 네이티브가 화면마다 다르게 씁니다.
   * - `lg`: 로그인 (박스 96 / 이미지 80 / 제목 30)
   * - `md`: 회원가입·비밀번호 재설정 (박스 80 / 이미지 64 / 제목 28)
   */
  size?: 'lg' | 'md'
  className?: string
}

/**
 * 인증 화면 상단의 로고 + 제목 블록.
 * 네이티브 `LoginScreen` / `RegisterScreen` / `PasswordResetScreen`의 headerContainer 이식.
 */
export default function AuthHeader({ title, subtitle, size = 'md', className }: AuthHeaderProps) {
  const large = size === 'lg'

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div
        className={cn(
          'flex items-center justify-center',
          large ? 'size-24 mb-2xl' : 'size-20 mb-xl',
        )}
      >
        <img
          src="/assets/puppynote-icon.png"
          alt=""
          className={cn('object-contain', large ? 'size-20' : 'size-16')}
        />
      </div>

      <h1
        className={cn(
          'font-bold text-ink-900',
          // 28px는 토큰에 없는 값이라(스펙 §2 스케일: 24 / 30) 여기서만 직접 씁니다.
          large ? 'text-display-sm' : 'text-[28px] leading-[36px] tracking-[-0.5px]',
        )}
      >
        {title}
      </h1>

      {subtitle && (
        <p className="mt-sm text-center text-body font-medium text-ink-500">{subtitle}</p>
      )}
    </div>
  )
}
