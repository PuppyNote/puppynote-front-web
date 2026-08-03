/**
 * 인증 화면(로그인/회원가입/비밀번호 재설정) 전용 컴포넌트 barrel.
 * 세 화면에서만 쓰는 조각들이라 `components/common`과 분리해 둡니다.
 */
export { AuthField, AuthInput } from './AuthField'
export type { AuthFieldProps, AuthInputProps } from './AuthField'

export { default as AuthHeader } from './AuthHeader'
export type { AuthHeaderProps } from './AuthHeader'

export { default as AuthSplash } from './AuthSplash'

export { default as AuthSubmitButton } from './AuthSubmitButton'
export type { AuthSubmitButtonProps } from './AuthSubmitButton'

export { default as EmailVerification } from './EmailVerification'
export type { EmailVerificationProps } from './EmailVerification'
