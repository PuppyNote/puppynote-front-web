import PlaceholderPage from '@/components/common/PlaceholderPage'

/**
 * 로그인 화면.
 * 앱 안에서는 브릿지 LOGIN_KAKAO / LOGIN_APPLE 액션으로 네이티브 SDK 로그인을 태우고,
 * 일반 브라우저에서는 웹 OAuth 폴백을 태우는 분기가 들어갈 자리입니다. (후속 티켓)
 */
export default function LoginPage() {
  return <PlaceholderPage title="로그인" nativeScreen="src/screens/login/" />
}
