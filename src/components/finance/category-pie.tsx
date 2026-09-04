"use client"

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { formatBRL } from "@/lib/finance/format"

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 16,
  color: "var(--popover-foreground)",
  fontSize: 12,
}

export function CategoryPie({
  data,
}: {
  data: { name: string; color: string; value: number }[]
}) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Ainda não há despesas neste mês.
      </p>
    )
  }

  return (
    <div>
      <div className="h-52 w-full">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={48}
              outerRadius={80}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatBRL(Number(value))}
              contentStyle={tooltipStyle}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 space-y-1.5">
        {data.slice(0, 6).map((entry) => (
          <li
            key={entry.name}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: entry.color }}
              />
              <span className="truncate">{entry.name}</span>
            </span>
            <span className="shrink-0 text-muted-foreground">
              {formatBRL(entry.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
