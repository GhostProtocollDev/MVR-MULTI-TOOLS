import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { onPaymentEvent, PaymentEvent } from "@/lib/event-bus"

export const dynamic = "force-dynamic"
export const maxDuration = 300

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (role !== "owner" && role !== "administrator") {
    return new Response("Forbidden", { status: 403 })
  }

  const encoder = new TextEncoder()
  let cleanup: (() => void) | null = null
  let closed = false

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode("retry: 3000\n\n"))

      cleanup = onPaymentEvent((event: PaymentEvent) => {
        if (closed) return
        const data = JSON.stringify(event)
        controller.enqueue(encoder.encode(`event: payment\ndata: ${data}\n\n`))
      })

      const keepalive = setInterval(() => {
        if (closed) return
        controller.enqueue(encoder.encode(": keepalive\n\n"))
      }, 15000)

      req.signal.addEventListener("abort", () => {
        closed = true
        clearInterval(keepalive)
        if (cleanup) cleanup()
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
