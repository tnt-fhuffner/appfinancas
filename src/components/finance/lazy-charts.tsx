"use client"

import dynamic from "next/dynamic"

const chartFallback = (
  <div className="h-52 animate-pulse rounded-2xl bg-muted/60" />
)

export const CategoryPie = dynamic(
  () => import("@/components/finance/category-pie").then((mod) => mod.CategoryPie),
  { ssr: false, loading: () => chartFallback }
)

export const BalanceLine = dynamic(
  () => import("@/components/finance/balance-line").then((mod) => mod.BalanceLine),
  { ssr: false, loading: () => chartFallback }
)
