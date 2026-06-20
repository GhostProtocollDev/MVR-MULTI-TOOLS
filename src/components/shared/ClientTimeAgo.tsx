"use client"
import { useState, useEffect } from "react"
import { timeAgo } from "@/lib/utils"

export function ClientTimeAgo({ date }: { date: string | Date }) {
  const [text, setText] = useState("")
  useEffect(() => {
    setText(timeAgo(date))
  }, [date])
  return <>{text}</>
}
