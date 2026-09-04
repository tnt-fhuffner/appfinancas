import type { LucideIcon } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function ComingSoon({
  title,
  description,
  icon: Icon,
}: {
  title: string
  description: string
  icon: LucideIcon
}) {
  return (
    <Card className="mx-auto max-w-xl border-none bg-card/80 shadow-none ring-foreground/8">
      <CardHeader className="items-center text-center">
        <span className="mb-2 flex size-14 items-center justify-center rounded-3xl bg-primary/10 text-primary">
          <Icon className="size-7" />
        </span>
        <CardTitle className="font-heading text-2xl">{title}</CardTitle>
        <CardDescription className="max-w-md text-pretty">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="rounded-2xl bg-muted/80 px-4 py-3 text-center text-sm text-muted-foreground">
          Este módulo entra na próxima fase. A navegação já está pronta.
        </p>
      </CardContent>
    </Card>
  )
}
