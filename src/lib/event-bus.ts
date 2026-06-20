import { EventEmitter } from "events"

export type PaymentEvent = {
  type: "payment_created" | "payment_updated"
  paymentId: string
  amount: number
  currency: string
  username: string
  reviewStatus: string
  priority: string
  timestamp: number
}

const emitter = new EventEmitter()
emitter.setMaxListeners(100)

export function emitPaymentEvent(event: PaymentEvent) {
  emitter.emit("payment", event)
}

export function onPaymentEvent(callback: (event: PaymentEvent) => void): () => void {
  emitter.on("payment", callback)
  return () => {
    emitter.off("payment", callback)
  }
}
