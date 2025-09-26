import type { Plugin, PluginContext, PluginMountTarget, PluginEvent } from "../core/plugin.types"

let ctxRef: PluginContext | null = null
let latestForm: any = null

function coerceDuration(s: any): number {
  if (!s) return 0
  if (s.type === "dual-timer") {
    const pos = Number((s as any).positiveDuration ?? s.duration ?? 0)
    const neg = Number((s as any).negativeDuration ?? s.duration ?? 0)
    return (isNaN(pos) ? 0 : pos) + (isNaN(neg) ? 0 : neg)
  }
  const d = Number(s.duration ?? 0)
  return isNaN(d) ? 0 : d
}

function computeStats(form: any) {
  const stages = Array.isArray(form?.stages) ? form.stages : []
  const totalStages = stages.length
  const byType: Record<string, number> = { special: 0, speech: 0, "dual-timer": 0 }
  let totalDuration = 0
  for (const s of stages) {
    if (s?.type && typeof byType[s.type] === "number") byType[s.type]++
    totalDuration += coerceDuration(s)
  }
  const avgDuration = totalStages > 0 ? Math.round(totalDuration / totalStages) : 0
  return { totalStages, byType, totalDuration, avgDuration }
}

function emitChartsUpdate() {
  if (!ctxRef) return
  const stats = computeStats(latestForm)
  ctxRef.bus.emit({
    type: "custom",
    payload: { channel: "charts:update", data: stats },
  } as any)
}

export const ChartsPlugin: Plugin = {
  id: "charts",
  init(ctx: PluginContext) {
    ctxRef = ctx
  },
  mount(_target?: PluginMountTarget) {},
  unmount() {
    latestForm = null
  },
  onEvent(e: PluginEvent) {
    if (e.type === "data:loaded") {
      latestForm = (e as any).payload?.form || null
      emitChartsUpdate()
    }
    if (e.type === "data:update") {
      const f = (e as any).payload?.form
      if (typeof f !== "undefined") {
        latestForm = f
        emitChartsUpdate()
      }
    }
  },
}