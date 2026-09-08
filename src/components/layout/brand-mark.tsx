import { cn } from "@/lib/utils"

export function BrandMark({
  className,
  textClassName,
}: {
  className?: string
  textClassName?: string
}) {
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary font-semibold text-primary-foreground shadow-sm",
        className
      )}
      aria-hidden
    >
      <span className={cn("translate-y-px tracking-tight", textClassName)}>
        nós
      </span>
    </span>
  )
}
