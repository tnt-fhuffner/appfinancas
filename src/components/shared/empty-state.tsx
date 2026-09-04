import type { LucideIcon } from "lucide-react"

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon
  title: string
  description: string
}) {
  return (
    <div className="rounded-3xl bg-card/80 px-5 py-8 text-center ring-1 ring-foreground/8">
      <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="size-6" />
      </span>
      <p className="font-heading text-lg tracking-tight">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-pretty text-muted-foreground">
        {description}
      </p>
    </div>
  )
}
