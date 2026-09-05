"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { fieldClass } from "@/components/finance/fields"
import { createCategory, updateCategory } from "@/lib/finance/actions"
import type { Category } from "@/lib/finance/types"

const COLORS = ["#c4785a", "#5c8a6a", "#c46b84", "#5b7c99", "#c4a35a", "#8a7e72"]

export function CategoryForm({
  category,
  onSaved,
}: {
  category?: Category
  onSaved?: () => void
}) {
  const [pending, setPending] = useState(false)
  const prefix = category?.id ?? "new"

  async function onSubmit(formData: FormData) {
    setPending(true)
    const payload = {
      name: String(formData.get("name") ?? ""),
      kind: String(formData.get("kind") ?? "expense") as "income" | "expense",
      color: String(formData.get("color") ?? COLORS[0]),
      is_shared: true,
    }
    const result = category
      ? await updateCategory(category.id, payload)
      : await createCategory(payload)
    setPending(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success(category ? "Categoria atualizada" : "Categoria criada")
    onSaved?.()
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-category-name`}>Nome</Label>
        <input
          id={`${prefix}-category-name`}
          name="name"
          required
          defaultValue={category?.name}
          className={fieldClass}
          placeholder="Mercado"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-category-kind`}>Tipo</Label>
          <select
            id={`${prefix}-category-kind`}
            name="kind"
            className={fieldClass}
            defaultValue={category?.kind ?? "expense"}
          >
            <option value="expense">Despesa</option>
            <option value="income">Receita</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-category-color`}>Cor</Label>
          <input
            id={`${prefix}-category-color`}
            name="color"
            type="color"
            defaultValue={category?.color ?? COLORS[0]}
            className="h-11 w-full rounded-xl border border-input bg-transparent p-1"
          />
        </div>
      </div>
      <Button type="submit" className="h-11 w-full rounded-xl" disabled={pending}>
        {pending ? "Salvando..." : category ? "Salvar alterações" : "Salvar categoria"}
      </Button>
    </form>
  )
}
