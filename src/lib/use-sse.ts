"use client"

import { useEffect, useRef, useCallback } from "react"
import type { PaymentEvent } from "./event-bus"

export function usePaymentEvents(onEvent: (event: PaymentEvent) => void) {
  const cbRef = useRef(onEvent)
  cbRef.current = onEvent

  const handleEvent = useCallback((event: MessageEvent) => {
    try {
      const data: PaymentEvent = JSON.parse(event.data)
      cbRef.current(data)
    } catch {
      /* ignore parse errors */
    }
  }, [])

  useEffect(() => {
    let eventSource: EventSource | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let mounted = true

    function connect() {
      if (!mounted) return
      eventSource = new EventSource("/api/owner/events")

      eventSource.addEventListener("payment", handleEvent)

      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close()
          eventSource = null
        }
        if (mounted) {
          reconnectTimer = setTimeout(connect, 5000)
        }
      }
    }

    connect()

    return () => {
      mounted = false
      if (reconnectTimer) clearTimeout(reconnectTimer)
      if (eventSource) {
        eventSource.removeEventListener("payment", handleEvent)
        eventSource.close()
      }
    }
  }, [handleEvent])
}
