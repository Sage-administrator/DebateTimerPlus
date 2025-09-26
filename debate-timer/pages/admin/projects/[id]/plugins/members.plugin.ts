import type { Plugin, PluginContext, PluginEvent } from "../core/plugin.types"

let ctxRef: PluginContext | null = null
let currentForm: any = null
let rolesOpenId: number | null = null
let rolesActiveSide: "正方" | "反方" | null = null

function emitMembers(partial: { rolesOpenId?: number | null; rolesActiveSide?: "正方" | "反方" | null }) {
  if (!ctxRef) return
  ctxRef.bus.emit({ type: "members:update", payload: partial })
}

function findStageById(id: number): any | null {
  if (!currentForm || !Array.isArray(currentForm.stages)) return null
  return currentForm.stages.find((s: any) => s?.id === id) || null
}

function ensureRoles(arr?: any[]) {
  if (!Array.isArray(arr)) return []
  return arr
}

function setRole(stageId: number, key: string, val: boolean) {
  const s = findStageById(stageId)
  if (!s) return
  s.allowedRoles = ensureRoles(s.allowedRoles)
  const i = s.allowedRoles.indexOf(key)
  if (val && i === -1) s.allowedRoles.push(key)
  if (!val && i !== -1) s.allowedRoles.splice(i, 1)
  ctxRef?.bus.emit({ type: "data:update", payload: { form: currentForm } })
}

function roleKey(side: "正方" | "反方", idx: number) {
  const SIDE = ["一辩", "二辩", "三辩", "四辩"]
  return `${side}${SIDE[idx]}`
}

function toggleSideAll(stageId: number, side: "正方" | "反方", val: boolean) {
  const s = findStageById(stageId)
  if (!s) return
  for (let i = 0; i < 4; i++) setRole(stageId, roleKey(side, i), val)
}

function toggleSub(stageId: number, side: "正方" | "反方", idx: number, val: boolean) {
  setRole(stageId, roleKey(side, idx), val)
}

function toggleGlobalAll(stageId: number, val: boolean) {
  const s = findStageById(stageId)
  if (!s) return
  setRole(stageId, "评委", val)
  setRole(stageId, "观众", val)
  toggleSideAll(stageId, "正方", val)
  toggleSideAll(stageId, "反方", val)
}

function toggleAudience(stageId: number, val: boolean) {
  setRole(stageId, "观众", val)
  if (val) {
    toggleSideAll(stageId, "正方", true)
    toggleSideAll(stageId, "反方", true)
  }
}

function openRoles(stageId: number, side?: "正方" | "反方") {
  rolesOpenId = stageId
  rolesActiveSide = side ?? rolesActiveSide ?? "正方"
  emitMembers({ rolesOpenId, rolesActiveSide })
}

function closeRoles() {
  rolesOpenId = null
  emitMembers({ rolesOpenId })
}

export const MembersPlugin: Plugin = {
  id: "members",
  init(ctx: PluginContext) {
    ctxRef = ctx
  },
  mount() {},
  unmount() {},
  onEvent(e: PluginEvent) {
    if (e.type === "data:loaded" || e.type === "data:update") {
      const f = (e as any).payload?.form
      if (f) currentForm = f
    }
    if (e.type === "members:openRoles") openRoles((e as any).payload?.stageId, (e as any).payload?.side)
    if (e.type === "members:closeRoles") closeRoles()
    if (e.type === "members:setRole") setRole((e as any).payload?.stageId, (e as any).payload?.key, !!(e as any).payload?.value)
    if (e.type === "members:toggleSideAll") toggleSideAll((e as any).payload?.stageId, (e as any).payload?.side, !!(e as any).payload?.value)
    if (e.type === "members:toggleSub") toggleSub((e as any).payload?.stageId, (e as any).payload?.side, (e as any).payload?.idx, !!(e as any).payload?.value)
    if (e.type === "members:toggleGlobalAll") toggleGlobalAll((e as any).payload?.stageId, !!(e as any).payload?.value)
    if (e.type === "members:toggleAudience") toggleAudience((e as any).payload?.stageId, !!(e as any).payload?.value)
  },
}