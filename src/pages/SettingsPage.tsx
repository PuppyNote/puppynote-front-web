import PlaceholderPage from '@/components/common/PlaceholderPage'
import { getAppVersion, getPlatform, useIsInApp } from '@/bridge'

/**
 * 설정 화면.
 * 지금은 이식 전 자리표시자 + 브릿지 감지가 동작하는지 눈으로 확인할 수 있는 환경 정보만 둡니다.
 * (환경 정보 블록은 실제 설정 화면 이식 시 제거하거나 개발 모드 전용으로 옮깁니다.)
 */
export default function SettingsPage() {
  const isInApp = useIsInApp()

  return (
    <div>
      <PlaceholderPage title="설정" nativeScreen="src/screens/setting/SettingScreen.tsx" />

      <dl className="mx-5 grid grid-cols-[6rem_1fr] gap-y-1 rounded-lg bg-gray-50 p-4 text-xs text-gray-500">
        <dt>실행 환경</dt>
        <dd>{isInApp ? '앱 WebView' : '일반 브라우저'}</dd>
        <dt>플랫폼</dt>
        <dd>{getPlatform()}</dd>
        <dt>앱 버전</dt>
        <dd>{getAppVersion() ?? '-'}</dd>
      </dl>
    </div>
  )
}
