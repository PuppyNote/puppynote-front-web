/**
 * 선택된 펫 저장소.
 *
 * 앱 안에서는 브릿지 SecureStore(`selectedPetId` / `selectedPetName` — 규약 화이트리스트에
 * 이미 들어 있습니다)를, 일반 브라우저에서는 localStorage를 씁니다.
 *
 * 토큰({@link ../auth/tokenStorage})과 달리 localStorage를 허용하는 이유는, 여기 담기는 값이
 * 펫 id/이름뿐이라 유출돼도 세션을 탈취당하지 않기 때문입니다. 대신 새로고침해도 보던 펫이
 * 유지되어 앱과 동작이 같아집니다.
 */
import { BridgeAction, isInApp, requestBridge } from '@/bridge'
import type { GetTokenData } from '@/bridge'

const PET_ID_KEY = 'selectedPetId'
const PET_NAME_KEY = 'selectedPetName'

export interface StoredPet {
  id: number
  name: string
}

export async function loadSelectedPet(): Promise<StoredPet | null> {
  try {
    const [rawId, name] = isInApp()
      ? await Promise.all([
          requestBridge<GetTokenData>(BridgeAction.GET_TOKEN, { key: PET_ID_KEY }).then(
            (data) => data?.value ?? null,
          ),
          requestBridge<GetTokenData>(BridgeAction.GET_TOKEN, { key: PET_NAME_KEY }).then(
            (data) => data?.value ?? null,
          ),
        ])
      : [localStorage.getItem(PET_ID_KEY), localStorage.getItem(PET_NAME_KEY)]

    if (!rawId || !name) return null

    const id = Number(rawId)
    return Number.isFinite(id) ? { id, name } : null
  } catch {
    // 저장소 접근 실패는 "저장된 펫 없음"과 같게 처리합니다 (첫 번째 펫이 자동 선택됩니다).
    return null
  }
}

export async function saveSelectedPet(id: number, name: string): Promise<void> {
  try {
    if (isInApp()) {
      await requestBridge(BridgeAction.SET_TOKEN, { key: PET_ID_KEY, value: String(id) })
      await requestBridge(BridgeAction.SET_TOKEN, { key: PET_NAME_KEY, value: name })
      return
    }
    localStorage.setItem(PET_ID_KEY, String(id))
    localStorage.setItem(PET_NAME_KEY, name)
  } catch {
    // 저장에 실패해도 이번 세션의 선택은 메모리 상태로 그대로 유지됩니다.
  }
}

export async function clearSelectedPet(): Promise<void> {
  try {
    if (isInApp()) {
      // 토큰까지 지우지 않도록 펫 키만 지정합니다.
      await requestBridge(BridgeAction.CLEAR_TOKEN, { keys: [PET_ID_KEY, PET_NAME_KEY] })
      return
    }
    localStorage.removeItem(PET_ID_KEY)
    localStorage.removeItem(PET_NAME_KEY)
  } catch {
    // 무시
  }
}
