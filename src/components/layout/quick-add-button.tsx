"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { TransactionForm } from "@/components/finance/transaction-form"
import { useMediaQuery } from "@/lib/use-media-query"
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
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (!ready) {
    return null
  }

  const form = (
    <TransactionForm
      compact={!isDesktop}
      accounts={accounts}
      categories={categories}
      onSaved={() => setOpen(false)}
    />
  )

  return (
    <>
      <Button
        type="button"
        size="icon-lg"
        aria-label="Novo lançamento"
        className="fixed right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 size-14 rounded-full shadow-lg shadow-primary/25 md:right-8 md:bottom-8"
        onClick={() => setOpen(true)}
      >
        <Plus className="size-6" />
      </Button>
      {isDesktop ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo lançamento</DialogTitle>
            </DialogHeader>
            {form}
          </DialogContent>
        </Dialog>
      ) : (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="bottom"
            className="max-h-[min(90dvh,100%)] overflow-y-auto rounded-t-3xl pb-[max(1.5rem,env(safe-area-inset-bottom))]"
          >
            <SheetHeader>
              <SheetTitle>Novo lançamento</SheetTitle>
            </SheetHeader>
            <div className="px-4 pb-2">{form}</div>
          </SheetContent>
        </Sheet>
      )}
    </>
  )
}
