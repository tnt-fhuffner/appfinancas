"use client"

import { useSyncExternalStore } from "react"
import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

const OPTIONS = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
] as const

const emptySubscribe = () => () => {}

export function ThemePicker() {
  const { theme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)

  return (
    <div className="grid grid-cols-3 gap-2">
      {OPTIONS.map((option) => {
        const Icon = option.icon
        const active = mounted && theme === option.value
        return (
          <Button
            key={option.value}
            type="button"
            variant={active ? "default" : "outline"}
            className="h-auto flex-col gap-1 rounded-2xl py-3"
            onClick={() => setTheme(option.value)}
          >
            <Icon className="size-4" />
            <span className="text-xs font-medium">{option.label}</span>
          </Button>
        )
      })}
    </div>
  )
}
