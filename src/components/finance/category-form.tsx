"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { checkboxClass, fieldClass } from "@/components/finance/fields"
import { createCategory } from "@/lib/finance/actions"

const COLORS = ["#c4785a", "#5c8a6a", "#c46b84", "#5b7c99", "#c4a35a", "#8a7e72"]

export function CategoryForm({ onCreated }: { onCreated?: () => void }) {
  const [pending, setPending] = useState(false)

  async function onSubmit(formData: FormData) {
    setPending(true)
    const result = await createCategory({
      name: String(formData.get("name") ?? ""),
      kind: String(formData.get("kind") ?? "expense") as "income" | "expense",
      color: String(formData.get("color") ?? COLORS[0]),
      is_shared: formData.get("is_shared") === "on",
    })
    setPending(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success("Categoria criada")
    onCreated?.()
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="category-name">Nome</Label>
        <input id="category-name" name="name" required className={fieldClass} placeholder="Mercado" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="category-kind">Tipo</Label>
        <select id="category-kind" name="kind" className={fieldClass} defaultValue="expense">
          <option value="expense">Despesa</option>
          <option value="income">Receita</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="category-color">Cor</Label>
        <input
          id="category-color"
          name="color"
          type="color"
          defaultValue={COLORS[0]}
          className="h-11 w-full rounded-xl border border-input bg-transparent p-1"
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_shared" className={checkboxClass} defaultChecked />
        Compartilhada com o casal
      </label>
      <Button type="submit" className="h-11 w-full rounded-xl" disabled={pending}>
        {pending ? "Salvando..." : "Salvar categoria"}
      </Button>
    </form>
  )
}
