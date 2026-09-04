"use client"

import { PERIOD_PRESETS, type PeriodPreset } from "@/lib/finance/period"
import { fieldClass } from "@/components/finance/fields"

export function PeriodFilter({
  preset,
  customStart,
  customEnd,
  onPreset,
  onCustomStart,
  onCustomEnd,
}: {
  preset: PeriodPreset
  customStart: string
  customEnd: string
  onPreset: (preset: PeriodPreset) => void
  onCustomStart: (value: string) => void
  onCustomEnd: (value: string) => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex gap-1 overflow-x-auto no-scrollbar rounded-2xl bg-muted p-1">
        {PERIOD_PRESETS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onPreset(item.id)}
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium whitespace-nowrap ${
              preset === item.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {preset === "custom" ? (
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1 text-xs text-muted-foreground">
            De
            <input
              type="date"
              value={customStart}
              onChange={(event) => onCustomStart(event.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            Até
            <input
              type="date"
              value={customEnd}
              onChange={(event) => onCustomEnd(event.target.value)}
              className={fieldClass}
            />
          </label>
        </div>
      ) : null}
    </div>
  )
}
