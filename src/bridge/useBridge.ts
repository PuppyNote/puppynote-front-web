/** 브릿지용 React 훅 모음. */
import { useEffect, useRef, useState } from 'react'

import { getBridge, isInApp, waitForBridge } from './bridge'
import type { BridgeEventPayloadMap, BridgeEventType, PuppyNoteBridge } from './protocol'

/**
 * 앱 WebView 안인지 여부.
 * 브릿지는 첫 렌더 전에 주입되지만, 주입이 늦어지는 경우를 대비해 ready 이벤트도 한 번 더 확인합니다.
 */
export function useIsInApp(): boolean {
  const [inApp, setInApp] = useState(isInApp)

  useEffect(() => {
    if (inApp) return
    let cancelled = false
    void waitForBridge().then((bridge) => {
      if (!cancelled && bridge) setInApp(true)
    })
    return () => {
      cancelled = true
    }
  }, [inApp])

  return inApp
}

/** 주입된 브릿지 객체 (없으면 null) */
export function useBridge(): PuppyNoteBridge | null {
  const inApp = useIsInApp()
  return inApp ? getBridge() : null
}

/**
 * 앱 이벤트 구독 훅.
 * 핸들러는 ref로 보관하므로 매 렌더마다 새 함수를 넘겨도 재구독하지 않습니다.
 */
export function useBridgeEvent<E extends BridgeEventType>(
  event: E,
  handler: (payload: BridgeEventPayloadMap[E]) => boolean | void,
): void {
  const handlerRef = useRef(handler)
  useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  const inApp = useIsInApp()

  useEffect(() => {
    if (!inApp) return
    const bridge = getBridge()
    if (!bridge) return
    return bridge.on<BridgeEventPayloadMap[E]>(event, (payload) => handlerRef.current(payload))
  }, [event, inApp])
}
