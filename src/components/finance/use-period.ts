"use client"

import { useMemo, useState } from "react"
import {
  periodRange,
  type PeriodPreset,
  type PeriodRange,
} from "@/lib/finance/period"
import { monthBounds } from "@/lib/finance/format"

export function usePeriod(initial: PeriodPreset = "this-month") {
  const current = monthBounds()
  const [preset, setPreset] = useState<PeriodPreset>(initial)
  const [customStart, setCustomStart] = useState(current.start)
  const [customEnd, setCustomEnd] = useState(current.end)

  const range = useMemo(
    () => periodRange(preset, customStart, customEnd),
    [preset, customStart, customEnd]
  )

  return {
    preset,
    setPreset,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    range,
  }
}

export function periodLabel(range: PeriodRange) {
  if (range.preset === "all") return "Todo o histórico"
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
  const start = formatter.format(
    new Date(
      Number(range.start.slice(0, 4)),
      Number(range.start.slice(5, 7)) - 1,
      Number(range.start.slice(8, 10))
    )
  )
  const end = formatter.format(
    new Date(
      Number(range.end.slice(0, 4)),
      Number(range.end.slice(5, 7)) - 1,
      Number(range.end.slice(8, 10))
    )
  )
  return start === end ? start : `${start} — ${end}`
}
