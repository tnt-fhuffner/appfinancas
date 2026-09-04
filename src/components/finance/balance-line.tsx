"use client"

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { formatBRL } from "@/lib/finance/format"

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 16,
  color: "var(--popover-foreground)",
  fontSize: 12,
}

export function BalanceLine({
  data,
}: {
  data: { label: string; saldo: number }[]
}) {
  const hasMovement = data.some((point) => point.saldo !== 0)

  if (!hasMovement) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        A evolução aparece depois dos primeiros lançamentos.
      </p>
    )
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            width={48}
            tickFormatter={(value) =>
              Number(value).toLocaleString("pt-BR", {
                notation: "compact",
                currency: "BRL",
              })
            }
          />
          <Tooltip
            formatter={(value) => formatBRL(Number(value))}
            contentStyle={tooltipStyle}
          />
          <Line
            type="monotone"
            dataKey="saldo"
            stroke="var(--primary)"
            strokeWidth={2.4}
            dot={false}
            activeDot={{ r: 4, fill: "var(--primary)" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
