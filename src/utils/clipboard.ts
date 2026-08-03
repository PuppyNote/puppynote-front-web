/**
 * 클립보드 복사. 네이티브 `Clipboard.setString`의 웹 대응입니다.
 *
 * `navigator.clipboard`는 보안 컨텍스트(https 또는 localhost)에서만 존재합니다.
 * 웹뷰를 http로 띄우는 개발 환경도 있어서, 없을 때는 숨긴 textarea + `execCommand('copy')`로
 * 폴백합니다(deprecated이지만 아직 모든 브라우저가 지원합니다).
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // 권한 거부 등. 아래 폴백을 한 번 더 시도합니다.
    }
  }

  return copyViaExecCommand(text)
}

function copyViaExecCommand(text: string): boolean {
  if (typeof document === 'undefined') return false

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  // 화면 밖에 두되 display:none은 피합니다. 숨겨진 요소는 선택이 되지 않습니다.
  textarea.style.position = 'fixed'
  textarea.style.top = '-9999px'
  document.body.appendChild(textarea)

  try {
    textarea.select()
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    textarea.remove()
  }
}
