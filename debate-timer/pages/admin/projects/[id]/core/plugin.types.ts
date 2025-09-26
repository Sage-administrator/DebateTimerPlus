export type PluginEvent =
  | { type: "error"; payload: { pluginId: string; message: string } }
  | { type: "loaded"; payload: { pluginId: string } }
  | { type: "saved"; payload: { pluginId: string } }
  | { type: "theme:toggle" }
  | { type: "data:load" }
  | { type: "data:loaded"; payload: { form: any } }
  | { type: "data:save"; payload: { form: any } }
  | { type: "data:saved"; payload: { form: any } }
  | { type: "data:update"; payload: { form?: any; loading?: boolean; saving?: boolean; error?: string | null } }
  | { type: "data:error"; payload: { message: string } }
  | { type: "data:export" }
  | { type: "data:import"; payload: { data: any } }
  | { type: "actions:update"; payload: { isDark?: boolean; iframeKey?: number; previewUrl?: string } }
  | { type: "preview:reload" }
  | { type: "preview:action"; payload: { action: "prev" | "next" } }
  | { type: "stage:prev" }
  | { type: "stage:next" }
  | { type: "stage:expand"; payload: { id: number | null } }
  | { type: "stage:addByType"; payload: { type: "special" | "speech" | "dual-timer" } }
  | { type: "stage:addByName"; payload: { name: string } }
  | { type: "stage:add" }
  | { type: "stage:remove"; payload: { index: number } }
  | { type: "stage:duplicate"; payload: { index: number } }
  | { type: "stage:moveUp"; payload: { index: number } }
  | { type: "stage:moveDown"; payload: { index: number } }
  | { type: "stage:renumber" }
  | { type: "members:openRoles"; payload: { stageId: number; side?: "正方" | "反方" } }
  | { type: "members:closeRoles" }
  | { type: "members:setRole"; payload: { stageId: number; key: string; value: boolean } }
  | { type: "members:toggleSideAll"; payload: { stageId: number; side: "正方" | "反方"; value: boolean } }
  | { type: "members:toggleSub"; payload: { stageId: number; side: "正方" | "反方"; idx: number; value: boolean } }
  | { type: "members:toggleGlobalAll"; payload: { stageId: number; value: boolean } }
  | { type: "members:toggleAudience"; payload: { stageId: number; value: boolean } }
  | { type: "members:update"; payload: { rolesOpenId?: number | null; rolesActiveSide?: "正方" | "反方" | null } }
  | { type: "form:uiChanged"; payload: { ui: any } }
  | { type: "form:editTabChanged"; payload: { tab: "stages" | "ui" } }
  | { type: "form:update"; payload: { ui?: any; tab?: "stages" | "ui" } }
  | { type: "custom"; payload: Record<string, any> }

export interface EventBus {
  on(type: PluginEvent["type"], handler: (e: PluginEvent) => void): () => void
  off(type: PluginEvent["type"], handler: (e: PluginEvent) => void): void
  emit(event: PluginEvent): void
}

export interface PluginContext {
  idParam: number
  // 可按需注入依赖（后续迁移逐步补齐）
  fetch: typeof $fetch
  bus: EventBus
  // 预留：Pinia/Store/Router 等
  // store?: any
  // router?: any
}

export interface PluginMountTarget {
  // 将来在壳组件中传入对应的 ref/元素/props
  refs?: Record<string, any>
}

export interface Plugin {
  id: string
  init(ctx: PluginContext): void
  mount(target?: PluginMountTarget): void
  unmount(): void
  onEvent?(event: PluginEvent): void
}

export interface PluginRegistry {
  register(plugin: Plugin): void
  initAll(ctx: PluginContext): void
  mountAll(target?: PluginMountTarget): void
  unmountAll(): void
  emit(event: PluginEvent): void
}

export type HealthStatus = "idle" | "init" | "mounted" | "error"

export interface RegisteredPluginState {
  plugin: Plugin
  status: HealthStatus
  lastError?: string
}