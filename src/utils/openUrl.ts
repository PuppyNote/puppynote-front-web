/**
 * 외부 링크 열기. 네이티브 `Linking.openURL`의 웹 대응입니다.
 *
 * 네이티브는 `Linking.canOpenURL`로 먼저 확인하지만 웹에는 대응하는 API가 없어서,
 * `window.open`을 시도하고 그 반환값(팝업 차단 등으로 실패하면 `null`)으로 성공 여부를 판단합니다.
 *
 * `noopener`를 window feature로 넘기면 새 창이 실제로 열려도 스펙상 항상 `null`을 돌려줘서
 * 성공 여부를 판별할 수 없습니다(팝업이 정상적으로 열렸는데도 차단된 것으로 오판하던 원인).
 * 그래서 feature 없이 연 뒤, 성공했을 때만 `opener`를 직접 끊어 noopener와 같은 효과를 냅니다.
 */
export function openUrl(url: string): boolean {
  if (typeof window === 'undefined' || !url) return false

  try {
    const opened = window.open(url, '_blank')
    if (!opened) return false
    opened.opener = null
    return true
  } catch {
    return false
  }
}
