import type { FinanceAlert, HealthStatus } from "@/lib/finance/types"
import { formatBRL } from "@/lib/finance/format"

export function AlertsList({
  alerts,
  health,
  projected,
}: {
  alerts: FinanceAlert[]
  health?: HealthStatus
  projected?: number
}) {
  return (
    <div className="space-y-3">
      {health ? (
        <div className="flex items-center gap-3">
          <span className={`size-3 shrink-0 rounded-full ${health.color}`} />
          <p className="text-sm">{health.label}</p>
        </div>
      ) : null}
      {typeof projected === "number" ? (
        <p className="text-sm text-muted-foreground">
          Previsão no fim do mês:{" "}
          <span className="font-medium text-foreground">{formatBRL(projected)}</span>
        </p>
      ) : null}
      {alerts.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum alerta agora. Tudo calmo.</p>
      ) : (
        <ul className="space-y-2">
          {alerts.map((alert) => (
            <li
              key={alert.id}
              className="flex gap-3 rounded-2xl bg-muted/70 px-4 py-3"
            >
              <span
                className={`mt-1 size-2.5 shrink-0 rounded-full ${
                  alert.level === "red" ? "bg-red-500" : "bg-amber-400"
                }`}
              />
              <div>
                <p className="text-sm font-medium">{alert.title}</p>
                <p className="text-xs text-muted-foreground">{alert.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
