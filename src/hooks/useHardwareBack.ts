/**
 * Android 하드웨어 뒤로가기 처리 훅.
 *
 * 앱은 뒤로가기를 스스로 처리하지 않고 웹에 위임합니다. 핸들러가 **동기적으로 `true`**를
 * 반환해야 "웹이 처리했다"로 간주되고, 그렇지 않으면 앱이 400ms ack 타임아웃 뒤
 * 자체 뒤로가기/종료로 폴백합니다.
 *
 * 그래서 핸들러 안에서 `await`을 쓰면 안 됩니다. 비동기 작업이 필요하면
 * `void doAsync()`로 띄워놓고 `true`를 먼저 반환하세요.
 */
import { useEffect, useRef } from 'react'

import { onBridgeEvent } from '@/bridge/bridge'
import { BridgeEvent } from '@/bridge/protocol'

type BackHandler = () => boolean

/**
 * 등록 순서대로 쌓이는 LIFO 스택.
 * 모달이 여러 겹 열려 있어도 가장 위(가장 나중에 등록된) 핸들러가 먼저 기회를 갖습니다.
 */
const handlerStack: BackHandler[] = []
let unsubscribe: (() => void) | null = null

function dispatchBack(): boolean {
  for (let i = handlerStack.length - 1; i >= 0; i -= 1) {
    // 핸들러가 true를 반환하면 거기서 소비하고 종료합니다.
    if (handlerStack[i]() === true) return true
  }
  return false
}

function pushHandler(handler: BackHandler): () => void {
  handlerStack.push(handler)
  if (!unsubscribe) {
    unsubscribe = onBridgeEvent(BridgeEvent.HARDWARE_BACK, dispatchBack)
  }

  return () => {
    const index = handlerStack.indexOf(handler)
    if (index !== -1) handlerStack.splice(index, 1)
    if (handlerStack.length === 0 && unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }
}

/**
 * @param handler 뒤로가기를 소비했으면 `true`, 아래(또는 앱)로 넘기려면 `false`. **동기 함수여야 합니다.**
 * @param enabled false면 이 핸들러는 등록되지 않습니다 (닫혀 있는 모달 등).
 */
export function useHardwareBack(handler: BackHandler, enabled = true): void {
  const handlerRef = useRef(handler)

  // 렌더 중에 ref를 건드리지 않도록 이펙트에서 갱신합니다.
  // 아래 등록 이펙트보다 먼저 선언되어 있어야 첫 렌더에서도 최신 핸들러가 들어갑니다.
  useEffect(() => {
    handlerRef.current = handler
  })

  useEffect(() => {
    if (!enabled) return
    return pushHandler(() => handlerRef.current())
  }, [enabled])
}
