import type { Plugin, PluginContext, PluginEvent } from "../core/plugin.types"

let ctxRef: PluginContext | null = null
let currentForm: any = null

function ensureForm(): any | null {
  return currentForm
}

function renumber() {
  if (!currentForm) return
  if (Array.isArray(currentForm.stages)) {
    currentForm.stages.forEach((s: any, i: number) => (s.order = i + 1))
  }
}

function emitUpdate(partial: { form?: any; loading?: boolean; saving?: boolean; error?: string | null }) {
  if (!ctxRef) return
  ctxRef.bus.emit({ type: "data:update", payload: partial })
}

async function doLoad() {
  if (!ctxRef) return
  const id = ctxRef.idParam
  emitUpdate({ loading: true, error: null })
  try {
    const res = await ctxRef.fetch(`/api/projects/${id}`)
    if ((res as any)?.success && (res as any).data) {
      const form = (res as any).data
      try {
        const g: any = form.global || (form.global = {})
        g.labels = g.labels || { mode: "two", positive: "正方", negative: "反方", third: "" }
        if (g && typeof g === "object" && "theme" in g) delete (g as any).theme
        g.teamPositiveName = typeof g.teamPositiveName === "string" ? g.teamPositiveName : ""
        g.teamNegativeName = typeof g.teamNegativeName === "string" ? g.teamNegativeName : ""
      } catch {}
      currentForm = form
      ctxRef.bus.emit({ type: "data:loaded", payload: { form } })
      emitUpdate({ form, loading: false, error: null })
    } else {
      const message = (res as any)?.message || "加载失败"
      ctxRef.bus.emit({ type: "data:error", payload: { message } })
      emitUpdate({ loading: false, error: message })
    }
  } catch (e: any) {
    const message = e?.message || "加载异常"
    console.error(message)
    ctxRef.bus.emit({ type: "data:error", payload: { message } })
    emitUpdate({ loading: false, error: message })
  }
}

async function doSave(form: any) {
  if (!ctxRef) return
  const id = ctxRef.idParam
  emitUpdate({ saving: true })
  try {
    const payload: any = JSON.parse(JSON.stringify(form))
    try {
      const g = payload.global
      if (g && typeof g === "object" && "theme" in g) delete g.theme
    } catch {}
    const res = await ctxRef.fetch(`/api/projects/${id}`, { method: "PUT", body: payload })
    if ((res as any)?.success) {
      const saved = (res as any).data
      currentForm = saved
      ctxRef.bus.emit({ type: "data:saved", payload: { form: saved } })
      emitUpdate({ form: saved, saving: false, error: null })
    } else {
      emitUpdate({ saving: false })
      console.error("保存失败")
    }
  } catch (e: any) {
    console.error(e?.message || e)
    emitUpdate({ saving: false })
  }
}

function doExport() {
  if (!currentForm) return
  const g = JSON.parse(JSON.stringify(currentForm.global || {}))
  delete (g as any).positiveTopic
  delete (g as any).negativeTopic
  if (g && typeof g === "object" && "theme" in g) delete (g as any).theme
  const payload = { global: g, stages: currentForm.stages || [] }
  try {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `project-${ctxRef?.idParam}.json`
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    console.error(e)
  }
}

function doImport(data: any) {
  if (!currentForm) return
  try {
    if (data.global) {
      delete data.global?.positiveTopic
      delete data.global?.negativeTopic
      try {
        if (data.global && typeof data.global === "object" && "theme" in data.global) {
          delete (data.global as any).theme
        }
      } catch {}
      currentForm.global = data.global
    }
    if (Array.isArray(data.stages)) {
      currentForm.stages = data.stages
      renumber()
    }
    emitUpdate({ form: currentForm })
  } catch (e) {
    console.error("导入异常")
  }
}

function addStageByType(type: "special" | "speech" | "dual-timer") {
  if (!currentForm) return
  const newStage = {
    id: Date.now(),
    order: (currentForm.stages?.length || 0) + 1,
    name: type === "special" ? "无计时环节" : type === "speech" ? "单方发言" : "双计时环节",
    duration: type === "special" ? 0 : 180,
    type,
    allowedRoles: ["评委", "观众"],
    description: "",
  }
  currentForm.stages = currentForm.stages || []
  currentForm.stages.push(newStage as any)
  emitUpdate({ form: currentForm })
  if (ctxRef) ctxRef.bus.emit({ type: "stage:expand", payload: { id: newStage.id } })
}

function addStageByName(name: string) {
  if (!currentForm) return
  const newStage = {
    id: Date.now(),
    order: (currentForm.stages?.length || 0) + 1,
    name,
    duration: name === "自由辩论" ? 300 : 180,
    type: (name === "自由辩论" ? "dual-timer" : "speech") as const,
    allowedRoles: ["评委", "观众"],
    description: "",
  }
  currentForm.stages = currentForm.stages || []
  currentForm.stages.push(newStage as any)
  emitUpdate({ form: currentForm })
  if (ctxRef) ctxRef.bus.emit({ type: "stage:expand", payload: { id: newStage.id } })
}

function addStageBlank() {
  if (!currentForm) return
  const maxId = (currentForm.stages || []).reduce((m: number, s: any) => Math.max(m, s.id), 0)
  currentForm.stages.push({
    id: maxId + 1,
    order: (currentForm.stages?.length || 0) + 1,
    name: "新环节",
    duration: 0,
    type: "speech",
    allowedRoles: [],
    description: "",
  })
  emitUpdate({ form: currentForm })
}

function removeStage(index: number) {
  if (!currentForm) return
  if (!Array.isArray(currentForm.stages)) return
  currentForm.stages.splice(index, 1)
  renumber()
  emitUpdate({ form: currentForm })
}

function duplicateStage(index: number) {
  if (!currentForm) return
  const arr = currentForm.stages || []
  const src = arr[index]
  if (!src) return
  const maxId = arr.reduce((m: number, s: any) => Math.max(m, s.id), 0)
  const dup = { ...src, id: maxId + 1, name: src.name + "（副本）" }
  arr.splice(index + 1, 0, dup as any)
  renumber()
  emitUpdate({ form: currentForm })
}

function moveUp(index: number) {
  if (!currentForm) return
  const arr = currentForm.stages || []
  if (index <= 0) return
  const curr = arr[index]
  const prev = arr[index - 1]
  if (!curr || !prev) return
  arr[index - 1] = curr
  arr[index] = prev
  renumber()
  emitUpdate({ form: currentForm })
}

function moveDown(index: number) {
  if (!currentForm) return
  const arr = currentForm.stages || []
  if (index >= arr.length - 1) return
  const curr = arr[index]
  const next = arr[index + 1]
  if (!curr || !next) return
  arr[index + 1] = curr
  arr[index] = next
  renumber()
  emitUpdate({ form: currentForm })
}

function expandPrev() {
  if (!currentForm) return
  const arr = currentForm.stages || []
  if (arr.length === 0) {
    if (ctxRef) ctxRef.bus.emit({ type: "stage:expand", payload: { id: null } })
    return
  }
  // 由页面维护 expandedId，DataPlugin 仅广播下一目标；页面订阅后更新
  // 此处让页面根据当前 expandedId 决定，不直接读取页面状态，因此退化策略：选第一个
  ctxRef?.bus.emit({ type: "stage:expand", payload: { id: arr[0].id } })
}

function expandNext() {
  if (!currentForm) return
  const arr = currentForm.stages || []
  if (arr.length === 0) {
    if (ctxRef) ctxRef.bus.emit({ type: "stage:expand", payload: { id: null } })
    return
  }
  // 退化策略：选最后一个
  ctxRef?.bus.emit({ type: "stage:expand", payload: { id: arr[arr.length - 1].id } })
}

export const DataPlugin: Plugin = {
  id: "data",
  init(ctx: PluginContext) {
    ctxRef = ctx
  },
  mount() {},
  unmount() {},
  onEvent(e: PluginEvent) {
    if (e.type === "data:load") doLoad()
    if (e.type === "data:save") doSave((e as any).payload?.form)
    if (e.type === "data:export") doExport()
    if (e.type === "data:import") doImport((e as any).payload?.data)
    if (e.type === "stage:addByType") addStageByType((e as any).payload?.type)
    if (e.type === "stage:addByName") addStageByName((e as any).payload?.name)
    if (e.type === "stage:add") addStageBlank()
    if (e.type === "stage:remove") removeStage((e as any).payload?.index)
    if (e.type === "stage:duplicate") duplicateStage((e as any).payload?.index)
    if (e.type === "stage:moveUp") moveUp((e as any).payload?.index)
    if (e.type === "stage:moveDown") moveDown((e as any).payload?.index)
    if (e.type === "stage:prev") expandPrev()
    if (e.type === "stage:next") expandNext()
    if (e.type === "stage:renumber") {
      renumber()
      emitUpdate({ form: currentForm })
    }
  },
}