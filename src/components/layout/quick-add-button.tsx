"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { TransactionForm } from "@/components/finance/transaction-form"
import type { Account, Category } from "@/lib/finance/types"

export function QuickAddButton({
  ready,
  accounts,
  categories,
}: {
  ready: boolean
  accounts: Account[]
  categories: Category[]
}) {
  const [open, setOpen] = useState(false)

  if (!ready) {
    return null
  }

  return (
    <>
      <Button
        type="button"
        size="icon-lg"
        aria-label="Lançar despesa"
        className="fixed right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 size-14 rounded-full shadow-lg shadow-primary/25 md:right-8 md:bottom-8"
        onClick={() => setOpen(true)}
      >
        <Plus className="size-6" />
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>Lançar agora</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6">
            <TransactionForm
              compact
              accounts={accounts}
              categories={categories}
              onCreated={() => setOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
