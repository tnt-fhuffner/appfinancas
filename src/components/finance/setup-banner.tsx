"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function SetupBanner({
  sql,
  compact = false,
  title,
  description,
}: {
  sql: string
  compact?: boolean
  title?: string
  description?: string
}) {
  const [copied, setCopied] = useState(false)

  async function copySql() {
    await navigator.clipboard.writeText(sql)
    setCopied(true)
    toast.success("SQL copiado. Cole no SQL Editor do Supabase.")
    window.setTimeout(() => setCopied(false), 2000)
  }

  const actions = (
    <div className="mt-4 flex flex-wrap gap-2">
      <Button type="button" className="h-10 rounded-xl" onClick={() => void copySql()}>
        {copied ? "Copiado" : "Copiar SQL"}
      </Button>
      <a
        href="https://supabase.com/dashboard/project/fkdgvcwfzfilresljayf/sql/new"
        target="_blank"
        rel="noreferrer"
        className={cn(buttonVariants({ variant: "outline" }), "h-10 rounded-xl")}
      >
        Abrir SQL Editor
      </a>
    </div>
  )

  if (compact) {
    return (
      <div className="rounded-2xl bg-amber-500/10 p-4 ring-1 ring-amber-500/20">
        <p className="text-sm font-medium">
          {title ?? "Orçamento e alertas ainda não estão no banco"}
        </p>
        <p className="mt-1 text-sm text-pretty text-muted-foreground">
          {description ??
            "Rode mais um SQL no Supabase para criar as tabelas de orçamento e contas a pagar. O restante das finanças continua funcionando."}
        </p>
        {actions}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl rounded-3xl bg-card/90 p-6 ring-1 ring-foreground/8">
      <h2 className="font-heading text-2xl tracking-tight">{title ?? "Quase lá"}</h2>
      <p className="mt-2 text-sm text-pretty text-muted-foreground">
        {description ??
          "O banco ainda não tem as tabelas de finanças. Abra o projeto no Supabase, vá em SQL Editor, cole o script e rode uma vez. Depois recarregue esta página."}
      </p>
      {actions}
    </div>
  )
}
