/**
 * 외부 링크 열기. 네이티브 `Linking.openURL`의 웹 대응입니다.
 *
 * 네이티브는 `Linking.canOpenURL`로 먼저 확인하지만 웹에는 대응하는 API가 없어서,
 * `window.open`을 시도하고 그 반환값(팝업 차단 등으로 실패하면 `null`)으로 성공 여부를 판단합니다.
 */
export function openUrl(url: string): boolean {
  if (typeof window === 'undefined' || !url) return false

  try {
    const opened = window.open(url, '_blank', 'noopener,noreferrer')
    return opened !== null
  } catch {
    return false
  }
}
