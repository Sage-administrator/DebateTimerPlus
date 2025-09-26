<template>
  <div :class="[isDark ? 'text-white bg-[#0b0f14]' : 'text-gray-900 bg-white']" class="p-4 min-h-screen transition-colors duration-300">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-xl font-bold tracking-wide">编辑项目 #{{ id }}</h2>
        <p class="text-gray-400 text-xs mt-0.5">保存后会广播到正在运行的计时页面</p>
      </div>
      <div class="space-x-2">
        <button class="px-3 py-1 border border-gray-600 rounded hover:bg-white/10 text-sm transition" @click="load">重载</button>
        <button class="px-3 py-1 border border-gray-600 rounded hover:bg-white/10 text-sm transition" @click="toggleTheme">{{ isDark ? '浅色' : '深色' }}</button>
        <button :class="isDark ? 'px-3 py-1 border border-green-600 text-green-300 rounded hover:bg-green-600/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition' : 'px-3 py-1 border border-green-600 text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition'" :disabled="saving || !form" @click="save">{{ saving ? '保存中...' : '保存' }}</button>
      </div>
    </div>

    <div v-if="loading" class="text-sm text-gray-400">
      <div class="animate-pulse">
        <div class="h-24 bg-white/5 rounded mb-3"></div>
        <div class="h-48 bg-white/5 rounded"></div>
      </div>
    </div>
    <div v-else-if="error" class="text-sm">
      <div class="border border-red-600/60 bg-red-900/20 text-red-300 rounded p-3">
        加载失败：{{ error }}
        <NuxtLink to="/admin/projects" class="ml-2 underline">返回列表</NuxtLink>
      </div>
    </div>
    <!-- 实时预览（当有表单数据时显示） -->
    <div v-if="false && form" class="mt-3 mb-3 border border-gray-700 rounded-lg p-3 bg-white/5">
      <div class="flex items-center justify-between mb-2">
        <div class="text-sm font-bold text-gray-100">实时预览</div>
        <div class="space-x-2">
          <NuxtLink :to="`/?projectId=${id}`" target="_blank" class="px-2 py-0.5 border border-gray-600 rounded text-xs hover:bg-white/10 transition">新窗口打开</NuxtLink>
          <button class="px-2 py-0.5 border border-gray-600 rounded text-xs hover:bg-white/10 transition" @click="reloadPreview">刷新预览</button>
        </div>
      </div>
      <div class="w-full overflow-hidden rounded border border-gray-700 bg-black/40">
        <iframe :key="iframeKey" :src="previewUrl" class="w-full" style="height: 360px; background: #0e1111;"></iframe>
      </div>
    </div>
    <div v-else-if="!form" class="text-sm text-gray-400">暂无数据</div>
    <div v-else class="grid grid-cols-12 gap-4">
      <!-- 基本信息 -->
      <div class="col-span-12 lg:col-span-5 space-y-4">
        <!-- 左侧：实时预览白卡 -->
        <div :class="isDark ? 'bg-gray-800 text-gray-100 border border-gray-700' : 'bg-white text-gray-900 border border-gray-200'" class="rounded-lg shadow">
          <div class="flex items-center justify-between px-3 py-2" :class="isDark ? 'border-b border-gray-700' : 'border-b border-gray-200'">
            <div class="text-sm font-bold" :class="isDark ? 'text-gray-100' : 'text-gray-800'">实时预览</div>
            <div class="space-x-2">

              <button :class="isDark ? 'px-2 py-0.5 border border-gray-600 rounded text-xs text-gray-100 hover:bg-white/10 transition' : 'px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-800 hover:bg-gray-50 bg-white transition'" @click="reloadPreview">刷新预览</button>
            </div>
          </div>
          <div class="p-2">
            <div :class="isDark ? 'overflow-hidden rounded border border-gray-700 bg-black/40' : 'overflow-hidden rounded border border-gray-200 bg-black/40'" style="width: 100%; height: 0; padding-bottom: 56.25%; position: relative;">
              <iframe ref="previewIframe" :key="iframeKey" :src="previewUrl" class="border-0" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #0e1111;" tabindex="-1"></iframe>
            </div>
            <div class="mt-2">
              <div class="flex items-center justify-between">
                <button
                  :class="isDark ? 'px-3 py-1 border border-gray-600 rounded text-xs text-gray-100 hover:bg-white/10 transition' : 'px-3 py-1 border border-gray-300 rounded text-xs text-gray-800 hover:bg-gray-50 bg-white transition'"
                  @click.stop="previewPrev"
                  :disabled="!form || (expandedId !== null && form!.stages.findIndex(s => s.id === expandedId) <= 0)"
                >
                  ← 上一环节
                </button>
                <NuxtLink :to="`/?projectId=${id}`" :class="isDark ? 'px-2 py-1 border border-gray-600 rounded text-xs text-gray-100 hover:bg-white/10 transition inline-block' : 'px-2 py-1 border border-gray-300 rounded text-xs text-gray-800 hover:bg-gray-50 bg-white transition inline-block'">
                  跳转计时页面
                </NuxtLink>
                <button
                  :class="isDark ? 'px-3 py-1 border border-gray-600 rounded text-xs text-gray-100 hover:bg-white/10 transition' : 'px-3 py-1 border border-gray-300 rounded text-xs text-gray-800 hover:bg-gray-50 bg-white transition'"
                  @click.stop="previewNext"
                  :disabled="!form || (expandedId !== null && form!.stages.findIndex(s => s.id === expandedId) >= form!.stages.length - 1)"
                >
                  下一环节 →
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 左侧：基本信息白卡 -->
        <div v-if="form" :class="isDark ? 'text-gray-100 border border-gray-700' : 'text-gray-900 border border-gray-200'" class="rounded-lg shadow p-4">
          <h3 class="font-bold mb-3" :class="isDark ? 'text-gray-100' : 'text-gray-800'">基本信息 / 主题</h3>
        <label class="block text-xs mb-1" :class="isDark ? 'text-gray-300' : 'text-black'">项目名称</label>
        <input v-model="form!.name" class="w-full px-2 py-1 bg-transparent border border-gray-600 rounded outline-none text-sm focus:ring-1 focus:ring-blue-600" />
        <label class="block text-xs mt-2 mb-1" :class="isDark ? 'text-gray-300' : 'text-black'">标题</label>
        <input v-model="form!.global.title" class="w-full px-2 py-1 bg-transparent border border-gray-600 rounded outline-none text-sm focus:ring-1 focus:ring-blue-600" />


        <div class="grid grid-cols-3 gap-2 mt-3">



        </div>


        <!-- 新增：辩论方显示名称设置 -->
        <h4 class="font-bold mt-3 mb-2" :class="isDark ? 'text-gray-100' : 'text-gray-800'">辩论方显示名称</h4>
        <div class="grid grid-cols-3 gap-2">
          <!-- 模式选择：双方/三方 -->
          <div>
            <label class="block text-xs mb-1" :class="isDark ? 'text-gray-300' : 'text-black'">模式</label>
            <select v-model="(form as any).global.labels.mode" :class="isDark ? 'bg-gray-800 text-gray-100 border border-gray-600' : 'bg-white text-gray-900 border border-gray-300'" class="w-full px-2 py-1 rounded-md outline-none text-sm focus:ring-1 focus:ring-blue-600 appearance-none">
              <option value="two">双方</option>
              <option value="three">三方</option>
            </select>
          </div>

          <!-- 正方名称 -->
          <div>
            <label class="block text-xs mb-1" :class="isDark ? 'text-gray-300' : 'text-black'">正方名称</label>
            <input v-model="(form as any).global.labels.positive" placeholder="自定义如：甲方/申请人…" class="mt-1 w-full px-2 py-1 bg-transparent border border-gray-600 rounded outline-none text-sm focus:ring-1 focus:ring-blue-600" />
          </div>

          <!-- 反方名称 -->
          <div>
            <label class="block text-xs mb-1" :class="isDark ? 'text-gray-300' : 'text-black'">反方名称</label>
            <input v-model="(form as any).global.labels.negative" placeholder="自定义如：乙方/被申请人…" class="mt-1 w-full px-2 py-1 bg-transparent border border-gray-600 rounded outline-none text-sm focus:ring-1 focus:ring-blue-600" />
          </div>

          <!-- 第三方（在三方模式时显示） -->
          <div class="col-span-3" v-if="(form as any).global.labels.mode === 'three'">
            <label class="block text-xs mb-1" :class="isDark ? 'text-gray-300' : 'text-black'">第三方名称</label>
            <div class="grid grid-cols-3 gap-2">
              <div class="col-span-1">
                <select @change="(form as any).global.labels.third = ($event.target as HTMLSelectElement).value" :class="isDark ? 'bg-gray-800 text-gray-100 border border-gray-600' : 'bg-white text-gray-900 border border-gray-300'" class="w-full px-2 py-1 rounded-md outline-none text-sm focus:ring-1 focus:ring-blue-600 appearance-none">
                  <option value="仲裁方">仲裁方</option>
                  <option value="C方">C方</option>
                  <option value="观众席">观众席</option>
                </select>
              </div>
              <div class="col-span-2">
                <input v-model="(form as any).global.labels.third" placeholder="自定义如：仲裁方/评审团…" class="w-full px-2 py-1 bg-transparent border border-gray-600 rounded outline-none text-sm focus:ring-1 focus:ring-blue-600" />
              </div>
            </div>
          </div>
        </div>
        </div>

        <!-- 界面编辑（暂不生效，最小侵入式） -->
        <div v-if="false && editTab==='ui'" :class="isDark ? 'bg-gray-800 text-gray-100 border border-gray-700' : 'bg-white text-gray-900 border border-gray-200'" class="rounded-lg shadow p-4">
          <h3 class="font-bold mb-3" :class="isDark ? 'text-gray-100' : 'text-gray-800'">
            <svg class="w-4 h-4 inline mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
              <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
            </svg>
            界面编辑（仅展示，暂不开发联动）
          </h3>
          <!-- 分段切换：背景 / 元素开关 / 属性 -->
          <div class="flex items-center gap-2 mb-3">
            <button
              class="px-2 py-1 rounded text-xs border"
              :class="[
                uiEditorTab==='background'
                  ? (isDark ? 'bg-white/10 border-gray-600 text-gray-100' : 'bg-gray-100 border-gray-300 text-gray-800')
                  : (isDark ? 'border-gray-700 text-gray-300 hover:bg-white/10' : 'border-gray-300 text-gray-700 hover:bg-gray-100')
              ]"
              @click="uiEditorTab='background'"
            >背景</button>
            <button
              class="px-2 py-1 rounded text-xs border"
              :class="[
                uiEditorTab==='elements'
                  ? (isDark ? 'bg-white/10 border-gray-600 text-gray-100' : 'bg-gray-100 border-gray-300 text-gray-800')
                  : (isDark ? 'border-gray-700 text-gray-300 hover:bg-white/10' : 'border-gray-300 text-gray-700 hover:bg-gray-100')
              ]"
              @click="uiEditorTab='elements'"
            >元素开关</button>
            <button
              class="px-2 py-1 rounded text-xs border"
              :class="[
                uiEditorTab==='props'
                  ? (isDark ? 'bg-white/10 border-gray-600 text-gray-100' : 'bg-gray-100 border-gray-300 text-gray-800')
                  : (isDark ? 'border-gray-700 text-gray-300 hover:bg-white/10' : 'border-gray-300 text-gray-700 hover:bg-gray-100')
              ]"
              @click="uiEditorTab='props'"
            >属性</button>
          </div>

          <!-- 开关组 -->
          <div class="space-y-3 mb-4">
            <!-- 关闭软件Logo -->
            <div class="flex items-center gap-2">
              <input type="checkbox" id="softwareLogo" v-model="uiEditor.softwareLogoVisible" class="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500">
              <label for="softwareLogo" class="text-sm" :class="isDark ? 'text-gray-300' : 'text-gray-700'">关闭软件Logo</label>
              <span class="text-xs text-gray-500">（屏幕中下方的软件Logo）</span>
            </div>
            
            <!-- 关闭横幅 -->
            <div class="flex items-center gap-2">
              <input type="checkbox" id="banner" v-model="uiEditor.bannerVisible" class="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500">
              <label for="banner" class="text-sm" :class="isDark ? 'text-gray-300' : 'text-gray-700'">关闭横幅</label>
              <span class="text-xs text-gray-500">（页面上方的红蓝两色长条）</span>
            </div>
            
            <!-- 关闭赛事名称 -->
            <div class="flex items-center gap-2">
              <input type="checkbox" id="eventName" v-model="uiEditor.eventNameVisible" class="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500">
              <label for="eventName" class="text-sm" :class="isDark ? 'text-gray-300' : 'text-gray-700'">关闭赛事名称</label>
              <span class="text-xs text-gray-500">（如果背景图片里有艺术字赛事名，可以关闭赛事名称显示）</span>
            </div>
            
            <!-- 正方用词 / 反方用词 -->
            <div class="grid grid-cols-2 gap-3 mt-4">
              <div>
                <label class="block text-sm font-medium mb-1" :class="isDark ? 'text-gray-300' : 'text-gray-700'">正方用词</label>
                <input v-model="uiEditor.positiveLabel" placeholder="正方" class="w-full px-3 py-2 border rounded-md text-sm" :class="isDark ? 'bg-gray-800 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'"/>
                <div class="text-xs text-gray-500 mt-1">可自定义为"甲方"、"申请人"、"A队"等</div>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1" :class="isDark ? 'text-gray-300' : 'text-gray-700'">反方用词</label>
                <input v-model="uiEditor.negativeLabel" placeholder="反方" class="w-full px-3 py-2 border rounded-md text-sm" :class="isDark ? 'bg-gray-800 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'"/>
                <div class="text-xs text-gray-500 mt-1">可自定义为"乙方"、"被申请人"、"B队"等</div>
              </div>
            </div>
          </div>

          <!-- 背景 -->
          <div v-if="uiEditorTab==='background'" class="space-y-3">
            <div class="grid grid-cols-3 gap-2">
              <div class="col-span-3">
                <label class="block text-xs mb-1" :class="isDark ? 'text-gray-300' : 'text-black'">背景模式</label>
                <div class="flex gap-2">
                  <label class="inline-flex items-center gap-1 text-sm">
                    <input type="radio" value="default" v-model="uiEditor.backgroundType" class="accent-blue-500/90">
                    <span>默认背景</span>
                  </label>
                  <label class="inline-flex items-center gap-1 text-sm">
                    <input type="radio" value="image" v-model="uiEditor.backgroundType" class="accent-blue-500/90">
                    <span>上传图片</span>
                  </label>
                </div>
              </div>
              <div class="col-span-3" v-if="uiEditor.backgroundType==='image'">
                <label class="block text-xs mb-1" :class="isDark ? 'text-gray-300' : 'text-black'">上传背景图片</label>
                <div class="flex items-center gap-2">
                  <label class="px-2 py-1 border rounded text-sm cursor-pointer"
                         :class="isDark ? 'border-gray-600 hover:bg-white/10' : 'border-gray-300 hover:bg-gray-100'">
                    选择文件
                    <input type="file" accept="image/*" class="hidden" @change="(e: Event) => uiEditor.imageFileName = (e.target as HTMLInputElement)?.files?.[0]?.name || ''">
                  </label>
                  <span class="text-xs text-gray-500" :class="isDark ? 'text-gray-400' : 'text-gray-500'">{{ uiEditor.imageFileName || '未选择文件' }}</span>
                </div>
                <div class="mt-2 h-24 rounded border flex items-center justify-center text-xs"
                     :class="isDark ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'">
                  预览占位（上传后将在此显示，当前不生效）
                </div>
              </div>
            </div>
          </div>

          <!-- 元素调整 -->
          <div v-if="uiEditorTab==='elements'" class="space-y-3">
            <div class="grid grid-cols-3 gap-2">
              <div>
                <label class="block text-xs mb-1" :class="isDark ? 'text-gray-300' : 'text-black'">横幅</label>
                <button class="w-full px-2 py-1 rounded border text-sm"
                        :class="isDark ? 'border-gray-600 hover:bg-white/10' : 'border-gray-300 hover:bg-gray-100'"
                        @click="uiEditor.bannerVisible = !uiEditor.bannerVisible">
                  {{ uiEditor.bannerVisible ? '关闭横幅' : '打开横幅' }}
                </button>
              </div>
              <div>
                <label class="block text-xs mb-1" :class="isDark ? 'text-gray-300' : 'text-black'">赛事名称</label>
                <button class="w-full px-2 py-1 rounded border text-sm"
                        :class="isDark ? 'border-gray-600 hover:bg-white/10' : 'border-gray-300 hover:bg-gray-100'"
                        @click="uiEditor.eventNameVisible = !uiEditor.eventNameVisible">
                  {{ uiEditor.eventNameVisible ? '关闭赛事名称' : '打开赛事名称' }}
                </button>
              </div>
              <div>
                <label class="block text-xs mb-1" :class="isDark ? 'text-gray-300' : 'text-black'">软件Logo</label>
                <button class="w-full px-2 py-1 rounded border text-sm"
                        :class="isDark ? 'border-gray-600 hover:bg-white/10' : 'border-gray-300 hover:bg-gray-100'"
                        @click="uiEditor.softwareLogoVisible = !uiEditor.softwareLogoVisible">
                  {{ uiEditor.softwareLogoVisible ? '关闭软件Logo' : '打开软件Logo' }}
                </button>
                <div class="text-[11px] mt-1" :class="isDark ? 'text-gray-400' : 'text-gray-500'">屏幕中下方的软件 Logo，可按需关闭</div>
              </div>
              <div class="col-span-3 grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-xs mb-1" :class="isDark ? 'text-gray-300' : 'text-black'">正方用词</label>
                  <input v-model="uiEditor.positiveLabel" placeholder="如：正方 / 红方 / A队" class="w-full px-2 py-1 bg-transparent border border-gray-600 rounded outline-none text-sm focus:ring-1 focus:ring-blue-600" :class="isDark ? 'border-gray-600' : 'border-gray-300'"/>
                </div>
                <div>
                  <label class="block text-xs mb-1" :class="isDark ? 'text-gray-300' : 'text-black'">反方用词</label>
                  <input v-model="uiEditor.negativeLabel" placeholder="如：反方 / 蓝方 / B队" class="w-full px-2 py-1 bg-transparent border border-gray-600 rounded outline-none text-sm focus:ring-1 focus:ring-blue-600" :class="isDark ? 'border-gray-600' : 'border-gray-300'"/>
                </div>
                <div class="col-span-2 text-xs mt-1" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
                  小字说明：非辩论赛事中，可替换为“红方 / A队”等；“蓝方 / B队”等
                </div>
              </div>
            </div>
          </div>

          <!-- 属性 -->
          <div v-if="uiEditorTab==='props'" class="space-y-4">
            <!-- 横幅 -->
            <div>
              <div class="text-sm font-semibold mb-2" :class="isDark ? 'text-gray-200' : 'text-gray-800'">横幅</div>
              <div class="grid grid-cols-3 gap-2 items-center">
                <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">上下位置</label>
                <input type="range" min="0" max="100" v-model.number="uiEditor.bannerPos" class="col-span-2">
                <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">字体大小</label>
                <input type="range" min="10" max="64" v-model.number="uiEditor.bannerFontSize" class="col-span-2">
                <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">正方横幅颜色</label>
                <input type="color" v-model="uiEditor.bannerColorPos" class="col-span-2 h-8 p-0 border rounded" :class="isDark ? 'border-gray-600' : 'border-gray-300'">
                <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">反方横幅颜色</label>
                <input type="color" v-model="uiEditor.bannerColorNeg" class="col-span-2 h-8 p-0 border rounded" :class="isDark ? 'border-gray-600' : 'border-gray-300'">
                <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">正方字体颜色</label>
                <input type="color" v-model="uiEditor.bannerFontColorPos" class="col-span-2 h-8 p-0 border rounded" :class="isDark ? 'border-gray-600' : 'border-gray-300'">
                <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">反方字体颜色</label>
                <input type="color" v-model="uiEditor.bannerFontColorNeg" class="col-span-2 h-8 p-0 border rounded" :class="isDark ? 'border-gray-600' : 'border-gray-300'">
              </div>
            </div>

            <!-- 赛事名称 -->
            <div>
              <div class="text-sm font-semibold mb-2" :class="isDark ? 'text-gray-200' : 'text-gray-800'">赛事名称</div>
              <div class="grid grid-cols-3 gap-2 items-center">
                <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">上下位置</label>
                <input type="range" min="0" max="100" v-model.number="uiEditor.eventPosY" class="col-span-2">
                <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">左右位置</label>
                <input type="range" min="0" max="100" v-model.number="uiEditor.eventPosX" class="col-span-2">
                <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">文字颜色</label>
                <input type="color" v-model="uiEditor.eventColor" class="col-span-2 h-8 p-0 border rounded" :class="isDark ? 'border-gray-600' : 'border-gray-300'">
                <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">字体大小</label>
                <input type="range" min="10" max="64" v-model.number="uiEditor.eventFontSize" class="col-span-2">
              </div>
            </div>

            <!-- 当前环节名 -->
            <div>
              <div class="text-sm font-semibold mb-2" :class="isDark ? 'text-gray-200' : 'text-gray-800'">当前环节名</div>
              <div class="grid grid-cols-3 gap-2 items-center">
                <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">上下位置</label>
                <input type="range" min="0" max="100" v-model.number="uiEditor.stagePosY" class="col-span-2">
                <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">左右位置</label>
                <input type="range" min="0" max="100" v-model.number="uiEditor.stagePosX" class="col-span-2">
                <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">文字颜色</label>
                <input type="color" v-model="uiEditor.stageColor" class="col-span-2 h-8 p-0 border rounded" :class="isDark ? 'border-gray-600' : 'border-gray-300'">
                <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">字体大小</label>
                <input type="range" min="10" max="64" v-model.number="uiEditor.stageFontSize" class="col-span-2">
              </div>
            </div>

            <!-- 无计时器环节名 -->
            <div>
              <div class="text-sm font-semibold mb-2" :class="isDark ? 'text-gray-200' : 'text-gray-800'">无计时器环节名</div>
              <div class="grid grid-cols-3 gap-2 items-center">
                <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">上下位置</label>
                <input type="range" min="0" max="100" v-model.number="uiEditor.noTimerStagePosY" class="col-span-2">
                <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">左右位置</label>
                <input type="range" min="0" max="100" v-model.number="uiEditor.noTimerStagePosX" class="col-span-2">
                <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">文字颜色</label>
                <input type="color" v-model="uiEditor.noTimerStageColor" class="col-span-2 h-8 p-0 border rounded" :class="isDark ? 'border-gray-600' : 'border-gray-300'">
                <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">字体大小</label>
                <input type="range" min="10" max="64" v-model.number="uiEditor.noTimerStageFontSize" class="col-span-2">
              </div>
            </div>

            <!-- 单计时器单元 -->
            <div>
              <div class="text-sm font-semibold mb-2" :class="isDark ? 'text-gray-200' : 'text-gray-800'">单计时器单元</div>
              <div class="grid grid-cols-3 gap-2 items-center">
                <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">上下位置</label>
                <input type="range" min="0" max="100" v-model.number="uiEditor.singleTimerPosY" class="col-span-2">
                <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">文字颜色</label>
                <input type="color" v-model="uiEditor.singleTimerColor" class="col-span-2 h-8 p-0 border rounded" :class="isDark ? 'border-gray-600' : 'border-gray-300'">
                <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">字体大小</label>
                <input type="range" min="10" max="64" v-model.number="uiEditor.singleTimerFontSize" class="col-span-2">
              </div>
            </div>

            <!-- 双计时器单元 -->
            <div>
              <div class="text-sm font-semibold mb-2" :class="isDark ? 'text-gray-200' : 'text-gray-800'">双计时器单元</div>
              <div class="grid grid-cols-3 gap-2 items-center">
                <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">上下位置</label>
                <input type="range" min="0" max="100" v-model.number="uiEditor.dualTimerPosY" class="col-span-2">
                <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">两个计时器间隔</label>
                <input type="range" min="0" max="200" v-model.number="uiEditor.dualTimerGap" class="col-span-2">
                <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">文字颜色</label>
                <input type="color" v-model="uiEditor.dualTimerColor" class="col-span-2 h-8 p-0 border rounded" :class="isDark ? 'border-gray-600' : 'border-gray-300'">
                <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">字体大小</label>
                <input type="range" min="10" max="64" v-model.number="uiEditor.dualTimerFontSize" class="col-span-2">
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 环节列表 -->
      <div class="col-span-12 lg:col-span-7">
        <div :class="isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'" class="border rounded-lg p-4 h-[calc(100dvh-160px)] overflow-hidden">
          <div class="flex items-center justify-between mb-2">
            <h3 :class="isDark ? 'text-white' : 'text-gray-900'" class="text-lg font-semibold">{{ editTab==='ui' ? '界面编辑' : '环节' }}</h3>
            <div class="flex items-center gap-2">
              <span
                class="text-sm cursor-pointer"
                :class="[isDark ? (editTab==='stages' ? 'text-gray-100 underline underline-offset-4' : 'text-gray-300') : (editTab==='stages' ? 'text-gray-900 underline underline-offset-4' : 'text-gray-600')]"
                @click="editTab='stages'"
              >计时器环节</span>
              <span :class="isDark ? 'text-gray-400' : 'text-gray-500'">→</span>
              <span
                class="text-sm cursor-pointer"
                :class="[isDark ? (editTab==='ui' ? 'text-gray-100 underline underline-offset-4' : 'text-gray-300') : (editTab==='ui' ? 'text-gray-900 underline underline-offset-4' : 'text-gray-600')]"
                @click="editTab='ui'"
              >界面编辑</span>
            </div>
          </div>
          <!-- 界面编辑整块（互斥显示） -->
          <div v-if="editTab==='ui'" class="mb-3">
            <!-- 分段切换：背景 / 元素开关 / 属性 -->
            <div class="flex items-center gap-2 mb-3">
              <button
                class="px-2 py-1 rounded text-xs border"
                :class="[
                  uiEditorTab==='background'
                    ? (isDark ? 'bg-white/10 border-gray-600 text-gray-100' : 'bg-gray-100 border-gray-300 text-gray-800')
                    : (isDark ? 'border-gray-700 text-gray-300 hover:bg-white/10' : 'border-gray-300 text-gray-700 hover:bg-gray-100')
                ]"
                @click="uiEditorTab='background'"
              >背景</button>
              <button
                class="px-2 py-1 rounded text-xs border"
                :class="[
                  uiEditorTab==='elements'
                    ? (isDark ? 'bg-white/10 border-gray-600 text-gray-100' : 'bg-gray-100 border-gray-300 text-gray-800')
                    : (isDark ? 'border-gray-700 text-gray-300 hover:bg-white/10' : 'border-gray-300 text-gray-700 hover:bg-gray-100')
                ]"
                @click="uiEditorTab='elements'"
              >元素开关</button>
              <button
                class="px-2 py-1 rounded text-xs border"
                :class="[
                  uiEditorTab==='props'
                    ? (isDark ? 'bg-white/10 border-gray-600 text-gray-100' : 'bg-gray-100 border-gray-300 text-gray-800')
                    : (isDark ? 'border-gray-700 text-gray-300 hover:bg-white/10' : 'border-gray-300 text-gray-700 hover:bg-gray-100')
                ]"
                @click="uiEditorTab='props'"
              >属性</button>
            </div>

            <!-- 开关组 -->
            <div class="space-y-3 mb-4">
              <div class="flex items-center gap-2">
                <input type="checkbox" id="softwareLogo" v-model="uiEditor.softwareLogoVisible" class="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500">
                <label for="softwareLogo" class="text-sm" :class="isDark ? 'text-gray-300' : 'text-gray-700'">关闭软件Logo</label>
                <span class="text-xs text-gray-500">（屏幕中下方的软件Logo）</span>
              </div>
              <div class="flex items-center gap-2">
                <input type="checkbox" id="banner" v-model="uiEditor.bannerVisible" class="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500">
                <label for="banner" class="text-sm" :class="isDark ? 'text-gray-300' : 'text-gray-700'">关闭横幅</label>
                <span class="text-xs text-gray-500">（页面上方的红蓝两色长条）</span>
              </div>
              <div class="flex items-center gap-2">
                <input type="checkbox" id="eventName" v-model="uiEditor.eventNameVisible" class="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500">
                <label for="eventName" class="text-sm" :class="isDark ? 'text-gray-300' : 'text-gray-700'">关闭赛事名称</label>
                <span class="text-xs text-gray-500">（如果背景图片里有艺术字赛事名，可以关闭赛事名称显示）</span>
              </div>
              <div class="grid grid-cols-2 gap-3 mt-4">
                <div>
                  <label class="block text-sm font-medium mb-1" :class="isDark ? 'text-gray-300' : 'text-gray-700'">正方用词</label>
                  <input v-model="uiEditor.positiveLabel" placeholder="正方" class="w-full px-3 py-2 border rounded-md text-sm" :class="isDark ? 'bg-gray-800 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'"/>
                  <div class="text-xs text-gray-500 mt-1">可自定义为"甲方"、"申请人"、"A队"等</div>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1" :class="isDark ? 'text-gray-300' : 'text-gray-700'">反方用词</label>
                  <input v-model="uiEditor.negativeLabel" placeholder="反方" class="w-full px-3 py-2 border rounded-md text-sm" :class="isDark ? 'bg-gray-800 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'"/>
                  <div class="text-xs text-gray-500 mt-1">可自定义为"乙方"、"被申请人"、"B队"等</div>
                </div>
              </div>
            </div>

            <div v-if="uiEditorTab==='background'" class="space-y-3">
              <div class="grid grid-cols-3 gap-2">
                <div class="col-span-3">
                  <label class="block text-xs mb-1" :class="isDark ? 'text-gray-300' : 'text-black'">背景模式</label>
                  <div class="flex gap-2">
                    <label class="inline-flex items-center gap-1 text-sm">
                      <input type="radio" value="default" v-model="uiEditor.backgroundType" class="accent-blue-500/90">
                      <span>默认背景</span>
                    </label>
                    <label class="inline-flex items-center gap-1 text-sm">
                      <input type="radio" value="image" v-model="uiEditor.backgroundType" class="accent-blue-500/90">
                      <span>上传图片</span>
                    </label>
                  </div>
                </div>
                <div class="col-span-3" v-if="uiEditor.backgroundType==='image'">
                  <label class="block text-xs mb-1" :class="isDark ? 'text-gray-300' : 'text-black'">上传背景图片</label>
                  <div class="flex items-center gap-2">
                    <label class="px-2 py-1 border rounded text-sm cursor-pointer"
                           :class="isDark ? 'border-gray-600 hover:bg-white/10' : 'border-gray-300 hover:bg-gray-100'">
                      选择文件
                      <input type="file" accept="image/*" class="hidden" @change="(e: Event) => uiEditor.imageFileName = (e.target as HTMLInputElement)?.files?.[0]?.name || ''">
                    </label>
                    <span class="text-xs text-gray-500" :class="isDark ? 'text-gray-400' : 'text-gray-500'">{{ uiEditor.imageFileName || '未选择文件' }}</span>
                  </div>
                  <div class="mt-2 h-24 rounded border flex items-center justify-center text-xs"
                       :class="isDark ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'">
                    预览占位（上传后将在此显示，当前不生效）
                  </div>
                </div>
              </div>
            </div>

            <div v-if="uiEditorTab==='elements'" class="space-y-3">
              <div class="grid grid-cols-3 gap-2">
                <div>
                  <label class="block text-xs mb-1" :class="isDark ? 'text-gray-300' : 'text-black'">横幅</label>
                  <button class="w-full px-2 py-1 rounded border text-sm"
                          :class="isDark ? 'border-gray-600 hover:bg-white/10' : 'border-gray-300 hover:bg-gray-100'"
                          @click="uiEditor.bannerVisible = !uiEditor.bannerVisible">
                    {{ uiEditor.bannerVisible ? '关闭横幅' : '打开横幅' }}
                  </button>
                </div>
                <div>
                  <label class="block text-xs mb-1" :class="isDark ? 'text-gray-300' : 'text-black'">赛事名称</label>
                  <button class="w-full px-2 py-1 rounded border text-sm"
                          :class="isDark ? 'border-gray-600 hover:bg-white/10' : 'border-gray-300 hover:bg-gray-100'"
                          @click="uiEditor.eventNameVisible = !uiEditor.eventNameVisible">
                    {{ uiEditor.eventNameVisible ? '关闭赛事名称' : '打开赛事名称' }}
                  </button>
                </div>
                <div>
                  <label class="block text-xs mb-1" :class="isDark ? 'text-gray-300' : 'text-black'">软件Logo</label>
                  <button class="w-full px-2 py-1 rounded border text-sm"
                          :class="isDark ? 'border-gray-600 hover:bg-white/10' : 'border-gray-300 hover:bg-gray-100'"
                          @click="uiEditor.softwareLogoVisible = !uiEditor.softwareLogoVisible">
                    {{ uiEditor.softwareLogoVisible ? '关闭软件Logo' : '打开软件Logo' }}
                  </button>
                  <div class="text-[11px] mt-1" :class="isDark ? 'text-gray-400' : 'text-gray-500'">屏幕中下方的软件 Logo，可按需关闭</div>
                </div>
                <div class="col-span-3 grid grid-cols-2 gap-2">
                  <div>
                    <label class="block text-xs mb-1" :class="isDark ? 'text-gray-300' : 'text-black'">正方用词</label>
                    <input v-model="uiEditor.positiveLabel" placeholder="如：正方 / 红方 / A队" class="w-full px-2 py-1 bg-transparent border border-gray-600 rounded outline-none text-sm focus:ring-1 focus:ring-blue-600" :class="isDark ? 'border-gray-600' : 'border-gray-300'"/>
                  </div>
                  <div>
                    <label class="block text-xs mb-1" :class="isDark ? 'text-gray-300' : 'text-black'">反方用词</label>
                    <input v-model="uiEditor.negativeLabel" placeholder="如：反方 / 蓝方 / B队" class="w-full px-2 py-1 bg-transparent border border-gray-600 rounded outline-none text-sm focus:ring-1 focus:ring-blue-600" :class="isDark ? 'border-gray-600' : 'border-gray-300'"/>
                  </div>
                  <div class="col-span-2 text-xs mt-1" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
                    小字说明：非辩论赛事中，可替换为“红方 / A队”等；“蓝方 / B队”等
                  </div>
                </div>
              </div>
            </div>

            <div v-if="uiEditorTab==='props'" class="space-y-4">
              <div>
                <div class="text-sm font-semibold mb-2" :class="isDark ? 'text-gray-200' : 'text-gray-800'">横幅</div>
                <div class="grid grid-cols-3 gap-2 items-center">
                  <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">上下位置</label>
                  <input type="range" min="0" max="100" v-model.number="uiEditor.bannerPos" class="col-span-2">
                  <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">字体大小</label>
                  <input type="range" min="10" max="64" v-model.number="uiEditor.bannerFontSize" class="col-span-2">
                  <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">正方横幅颜色</label>
                  <input type="color" v-model="uiEditor.bannerColorPos" class="col-span-2 h-8 p-0 border rounded" :class="isDark ? 'border-gray-600' : 'border-gray-300'">
                  <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">反方横幅颜色</label>
                  <input type="color" v-model="uiEditor.bannerColorNeg" class="col-span-2 h-8 p-0 border rounded" :class="isDark ? 'border-gray-600' : 'border-gray-300'">
                  <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">正方字体颜色</label>
                  <input type="color" v-model="uiEditor.bannerFontColorPos" class="col-span-2 h-8 p-0 border rounded" :class="isDark ? 'border-gray-600' : 'border-gray-300'">
                  <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">反方字体颜色</label>
                  <input type="color" v-model="uiEditor.bannerFontColorNeg" class="col-span-2 h-8 p-0 border rounded" :class="isDark ? 'border-gray-600' : 'border-gray-300'">
                </div>
              </div>
              <div>
                <div class="text-sm font-semibold mb-2" :class="isDark ? 'text-gray-200' : 'text-gray-800'">赛事名称</div>
                <div class="grid grid-cols-3 gap-2 items-center">
                  <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">上下位置</label>
                  <input type="range" min="0" max="100" v-model.number="uiEditor.eventPosY" class="col-span-2">
                  <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">左右位置</label>
                  <input type="range" min="0" max="100" v-model.number="uiEditor.eventPosX" class="col-span-2">
                  <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">文字颜色</label>
                  <input type="color" v-model="uiEditor.eventColor" class="col-span-2 h-8 p-0 border rounded" :class="isDark ? 'border-gray-600' : 'border-gray-300'">
                  <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">字体大小</label>
                  <input type="range" min="10" max="64" v-model.number="uiEditor.eventFontSize" class="col-span-2">
                </div>
              </div>
              <div>
                <div class="text-sm font-semibold mb-2" :class="isDark ? 'text-gray-200' : 'text-gray-800'">当前环节名</div>
                <div class="grid grid-cols-3 gap-2 items-center">
                  <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">上下位置</label>
                  <input type="range" min="0" max="100" v-model.number="uiEditor.stagePosY" class="col-span-2">
                  <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">左右位置</label>
                  <input type="range" min="0" max="100" v-model.number="uiEditor.stagePosX" class="col-span-2">
                  <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">文字颜色</label>
                  <input type="color" v-model="uiEditor.stageColor" class="col-span-2 h-8 p-0 border rounded" :class="isDark ? 'border-gray-600' : 'border-gray-300'">
                  <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">字体大小</label>
                  <input type="range" min="10" max="64" v-model.number="uiEditor.stageFontSize" class="col-span-2">
                </div>
              </div>
              <div>
                <div class="text-sm font-semibold mb-2" :class="isDark ? 'text-gray-200' : 'text-gray-800'">无计时器环节名</div>
                <div class="grid grid-cols-3 gap-2 items-center">
                  <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">上下位置</label>
                  <input type="range" min="0" max="100" v-model.number="uiEditor.noTimerStagePosY" class="col-span-2">
                  <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">左右位置</label>
                  <input type="range" min="0" max="100" v-model.number="uiEditor.noTimerStagePosX" class="col-span-2">
                  <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">文字颜色</label>
                  <input type="color" v-model="uiEditor.noTimerStageColor" class="col-span-2 h-8 p-0 border rounded" :class="isDark ? 'border-gray-600' : 'border-gray-300'">
                  <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">字体大小</label>
                  <input type="range" min="10" max="64" v-model.number="uiEditor.noTimerStageFontSize" class="col-span-2">
                </div>
              </div>
              <div>
                <div class="text-sm font-semibold mb-2" :class="isDark ? 'text-gray-200' : 'text-gray-800'">单计时器单元</div>
                <div class="grid grid-cols-3 gap-2 items-center">
                  <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">上下位置</label>
                  <input type="range" min="0" max="100" v-model.number="uiEditor.singleTimerPosY" class="col-span-2">
                  <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">文字颜色</label>
                  <input type="color" v-model="uiEditor.singleTimerColor" class="col-span-2 h-8 p-0 border rounded" :class="isDark ? 'border-gray-600' : 'border-gray-300'">
                  <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">字体大小</label>
                  <input type="range" min="10" max="64" v-model.number="uiEditor.singleTimerFontSize" class="col-span-2">
                </div>
              </div>
              <div>
                <div class="text-sm font-semibold mb-2" :class="isDark ? 'text-gray-200' : 'text-gray-800'">双计时器单元</div>
                <div class="grid grid-cols-3 gap-2 items-center">
                  <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">上下位置</label>
                  <input type="range" min="0" max="100" v-model.number="uiEditor.dualTimerPosY" class="col-span-2">
                  <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">两个计时器间隔</label>
                  <input type="range" min="0" max="200" v-model.number="uiEditor.dualTimerGap" class="col-span-2">
                  <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">文字颜色</label>
                  <input type="color" v-model="uiEditor.dualTimerColor" class="col-span-2 h-8 p-0 border rounded" :class="isDark ? 'border-gray-600' : 'border-gray-300'">
                  <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">字体大小</label>
                  <input type="range" min="10" max="64" v-model.number="uiEditor.dualTimerFontSize" class="col-span-2">
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧环节整块（互斥显示，含分类栏与列表） -->
          <div v-if="editTab==='stages'" class="flex gap-4 h-full min-h-0">
            <!-- 左侧分类栏 -->
            <div class="w-44 flex-shrink-0">
              <div class="space-y-4">
                <!-- 计时器数量分类 -->
                <div>
                  <h4 :class="isDark ? 'text-gray-300' : 'text-gray-700'" class="text-sm font-medium mb-2 flex items-center">
                    <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
                    </svg>
                    计时器数量
                  </h4>
                  <div class="space-y-1">
                    <button @click="addStageByType('special')" :class="isDark ? 'w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded flex items-center justify-between border border-gray-700' : 'w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded flex items-center justify-between border border-gray-300'">
                      <span>无计时器</span>
                      <span class="text-lg">+</span>
                    </button>
                    <button @click="addStageByType('speech')" :class="isDark ? 'w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded flex items-center justify-between border border-gray-700' : 'w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded flex items-center justify-between border border-gray-300'">
                      <span>单计时器</span>
                      <span class="text-lg">+</span>
                    </button>
                    <button @click="addStageByType('dual-timer')" :class="isDark ? 'w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded flex items-center justify-between border border-gray-700' : 'w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded flex items-center justify-between border border-gray-300'">
                      <span>双计时器</span>
                      <span class="text-lg">+</span>
                    </button>
                  </div>
                </div>

                <!-- 单方发言分类 -->
                <div>
                  <h4 :class="isDark ? 'text-gray-300' : 'text-gray-700'" class="text-sm font-medium mb-2 flex items-center">
                    <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd"/>
                    </svg>
                    单方发言
                  </h4>
                  <div class="space-y-1">
                    <button @click="addStageByName('立论')" :class="isDark ? 'w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded flex items-center justify-between border border-gray-700' : 'w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded flex items-center justify-between border border-gray-300'">
                      <span>立论</span>
                      <span class="text-lg">+</span>
                    </button>
                    <button @click="addStageByName('驳论')" :class="isDark ? 'w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded flex items-center justify-between border border-gray-700' : 'w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded flex items-center justify-between border border-gray-300'">
                      <span>驳论</span>
                      <span class="text-lg">+</span>
                    </button>
                    <button @click="addStageByName('小结')" :class="isDark ? 'w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded flex items-center justify-between border border-gray-700' : 'w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded flex items-center justify-between border border-gray-300'">
                      <span>小结</span>
                      <span class="text-lg">+</span>
                    </button>
                    <button @click="addStageByName('总结陈词')" :class="isDark ? 'w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded flex items-center justify-between border border-gray-700' : 'w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded flex items-center justify-between border border-gray-300'">
                      <span>总结陈词</span>
                      <span class="text-lg">+</span>
                    </button>
                    <button @click="addStageByName('自定义名称→')" :class="isDark ? 'w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded flex items-center justify-between' : 'w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded flex items-center justify-between'">
                      <span>自定义名称→</span>
                      <span class="text-lg">+</span>
                    </button>
                  </div>
                </div>

                <!-- 单方发问分类 -->
                <div>
                  <h4 :class="isDark ? 'text-gray-300' : 'text-gray-700'" class="text-sm font-medium mb-2 flex items-center">
                    <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
                    </svg>
                    单方发问
                  </h4>
                  <div class="space-y-1">
                    <button @click="addStageByName('质询')" :class="isDark ? 'w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded flex items-center justify-between border border-gray-700' : 'w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded flex items-center justify-between border border-gray-300'">
                      <span>质询</span>
                      <span class="text-lg">+</span>
                    </button>
                    <button @click="addStageByName('盘问')" :class="isDark ? 'w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded flex items-center justify-between border border-gray-700' : 'w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded flex items-center justify-between border border-gray-300'">
                      <span>盘问</span>
                      <span class="text-lg">+</span>
                    </button>
                    <button @click="addStageByName('自定义名称→')" :class="isDark ? 'w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded flex items-center justify-between' : 'w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded flex items-center justify-between'">
                      <span>自定义名称→</span>
                      <span class="text-lg">+</span>
                    </button>
                  </div>
                </div>

                <!-- 双边对辩分类 -->
                <div>
                  <h4 :class="isDark ? 'text-gray-300' : 'text-gray-700'" class="text-sm font-medium mb-2 flex items-center">
                    <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    双边对辩
                  </h4>
                  <div class="space-y-1">
                    <button @click="addStageByName('对辩')" :class="isDark ? 'w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded flex items-center justify-between border border-gray-700' : 'w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded flex items-center justify-between border border-gray-300'">
                      <span>对辩</span>
                      <span class="text-lg">+</span>
                    </button>
                    <button @click="addStageByName('自由辩论')" :class="isDark ? 'w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded flex items-center justify-between border border-gray-700' : 'w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded flex items-center justify-between border border-gray-300'">
                      <span>自由辩论</span>
                      <span class="text-lg">+</span>
                    </button>
                    <button @click="addStageByName('自定义名称→')" :class="isDark ? 'w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded flex items-center justify-between' : 'w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded flex items-center justify-between'">
                      <span>自定义名称→</span>
                      <span class="text-lg">+</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 右侧环节列表 -->
            <div class="flex-1 flex flex-col h-full min-h-0 min-w-0">
              <div class="flex items-center justify-end mb-2 sticky top-0 z-10 py-2 border-b" :class="isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'">
                <div class="space-x-2">
                  <button :class="isDark ? 'px-2 py-1 border border-gray-600 rounded text-sm hover:bg-white/10 transition' : 'px-2 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 transition'" @click="addStage">新增环节</button>
                  <button class="px-2 py-1 border border-gray-600 rounded text-sm hover:bg-white/10 transition" @click="exportJSON">导出</button>
                  <label class="px-2 py-1 border border-gray-600 rounded text-sm cursor-pointer hover:bg-white/10 transition">
                    导入
                    <input type="file" accept=".json,application/json" class="hidden" @change="importJSON">
                  </label>
                </div>
              </div>
              <!-- 界面编辑：当选择“调整界面”时显示；不影响原环节列表 -->
              <div v-if="false && editTab==='ui'" :class="isDark ? 'bg-gray-800/60 border border-gray-700' : 'bg-gray-50 border border-gray-200'" class="rounded-lg p-3 mb-3">
                <div class="text-sm font-semibold mb-2" :class="isDark ? 'text-gray-100' : 'text-gray-800'">界面编辑（待开发，当前选择不生效）</div>
                <!-- 分段切换：背景 / 元素开关 / 属性 -->
                <div class="flex items-center gap-2 mb-3">
                  <button
                    class="px-2 py-1 rounded text-xs border"
                    :class="[
                      uiEditorTab==='background'
                        ? (isDark ? 'bg-white/10 border-gray-600 text-gray-100' : 'bg-gray-100 border-gray-300 text-gray-800')
                        : (isDark ? 'border-gray-700 text-gray-300 hover:bg-white/10' : 'border-gray-300 text-gray-700 hover:bg-gray-100')
                    ]"
                    @click="uiEditorTab='background'"
                  >背景</button>
                  <button
                    class="px-2 py-1 rounded text-xs border"
                    :class="[
                      uiEditorTab==='elements'
                        ? (isDark ? 'bg-white/10 border-gray-600 text-gray-100' : 'bg-gray-100 border-gray-300 text-gray-800')
                        : (isDark ? 'border-gray-700 text-gray-300 hover:bg-white/10' : 'border-gray-300 text-gray-700 hover:bg-gray-100')
                    ]"
                    @click="uiEditorTab='elements'"
                  >元素开关</button>
                  <button
                    class="px-2 py-1 rounded text-xs border"
                    :class="[
                      uiEditorTab==='props'
                        ? (isDark ? 'bg-white/10 border-gray-600 text-gray-100' : 'bg-gray-100 border-gray-300 text-gray-800')
                        : (isDark ? 'border-gray-700 text-gray-300 hover:bg-white/10' : 'border-gray-300 text-gray-700 hover:bg-gray-100')
                    ]"
                    @click="uiEditorTab='props'"
                  >属性</button>
                </div>
                <div v-if="uiEditorTab==='elements'" class="grid grid-cols-3 gap-2">
                  <div>
                    <label class="block text-xs mb-1" :class="isDark ? 'text-gray-300' : 'text-black'">横幅</label>
                    <button class="w-full px-2 py-1 rounded border text-sm"
                            :class="isDark ? 'border-gray-600 hover:bg-white/10' : 'border-gray-300 hover:bg-gray-100'"
                            @click="uiEditor.bannerVisible = !uiEditor.bannerVisible">
                      {{ uiEditor.bannerVisible ? '关闭横幅' : '打开横幅' }}
                    </button>
                  </div>
                  <div>
                    <label class="block text-xs mb-1" :class="isDark ? 'text-gray-300' : 'text-black'">赛事名称</label>
                    <button class="w-full px-2 py-1 rounded border text-sm"
                            :class="isDark ? 'border-gray-600 hover:bg-white/10' : 'border-gray-300 hover:bg-gray-100'"
                            @click="uiEditor.eventNameVisible = !uiEditor.eventNameVisible">
                      {{ uiEditor.eventNameVisible ? '关闭赛事名称' : '打开赛事名称' }}
                    </button>
                  </div>
                  <div class="col-span-3 mt-4 grid grid-cols-2 gap-2">
                    <div>
                      <label class="block text-xs mb-1" :class="isDark ? 'text-gray-300' : 'text-black'">正方用词</label>
                      <input v-model="uiEditor.positiveLabel" placeholder="如：正方 / 红方 / A队" class="w-full px-2 py-1 bg-transparent border rounded outline-none text-sm focus:ring-1 focus:ring-blue-600" :class="isDark ? 'border-gray-600' : 'border-gray-300'"/>
                    </div>
                    <div>
                      <label class="block text-xs mb-1" :class="isDark ? 'text-gray-300' : 'text-black'">反方用词</label>
                      <input v-model="uiEditor.negativeLabel" placeholder="如：反方 / 蓝方 / B队" class="w-full px-2 py-1 bg-transparent border rounded outline-none text-sm focus:ring-1 focus:ring-blue-600" :class="isDark ? 'border-gray-600' : 'border-gray-300'"/>
                    </div>
                    <div class="col-span-2 text-xs mt-1" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
                      小字说明：非辩论赛事中，可替换为“红方 / A队”等；“蓝方 / B队”等
                    </div>
                  </div>
                </div>
                <!-- 背景分组 -->
                <div v-if="uiEditorTab==='background'" :class="isDark ? 'bg-gray-800/40 border border-gray-700' : 'bg-white border border-gray-200'" class="rounded-lg mb-3">
                  <button class="w-full text-left px-3 py-2 text-sm font-medium flex items-center justify-between" :class="isDark ? 'text-gray-100' : 'text-gray-800'" @click="uiOpen.background = !uiOpen.background">
                    <span>背景</span>
                    <span class="text-xs" :class="isDark ? 'text-gray-400' : 'text-gray-500'">{{ uiOpen.background ? '收起' : '展开' }}</span>
                  </button>
                  <div v-show="uiOpen.background" class="px-3 pb-3">
                    <div class="grid grid-cols-3 gap-2">
                      <div class="col-span-3">
                        <label class="block text-xs mb-1" :class="isDark ? 'text-gray-300' : 'text-black'">背景模式</label>
                        <div class="flex gap-2">
                          <label class="inline-flex items-center gap-1 text-sm">
                            <input type="radio" value="default" v-model="uiEditor.backgroundType" class="accent-blue-500/90">
                            <span>默认背景</span>
                          </label>
                          <label class="inline-flex items-center gap-1 text-sm">
                            <input type="radio" value="image" v-model="uiEditor.backgroundType" class="accent-blue-500/90">
                            <span>上传图片</span>
                          </label>
                        </div>
                      </div>
                      <div class="col-span-3" v-if="uiEditor.backgroundType==='image'">
                        <label class="block text-xs mb-1" :class="isDark ? 'text-gray-300' : 'text-black'">上传背景图片</label>
                        <div class="flex items-center gap-2">
                          <label class="px-2 py-1 border rounded text-sm cursor-pointer" :class="isDark ? 'border-gray-600 hover:bg-white/10' : 'border-gray-300 hover:bg-gray-100'">
                            选择文件
                            <input type="file" accept="image/*" class="hidden" @change="(e: Event) => uiEditor.imageFileName = (e.target as HTMLInputElement)?.files?.[0]?.name || ''">
                          </label>
                          <span class="text-xs" :class="isDark ? 'text-gray-400' : 'text-gray-500'">{{ uiEditor.imageFileName || '未选择文件' }}</span>
                        </div>
                        <div class="mt-2 h-20 rounded border flex items-center justify-center text-xs" :class="isDark ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'">
                          预览占位（当前不生效）
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 横幅分组 -->
                <div v-if="uiEditorTab==='props'" :class="isDark ? 'bg-gray-800/40 border border-gray-700' : 'bg-white border border-gray-200'" class="rounded-lg mb-3">
                  <button class="w-full text-left px-3 py-2 text-sm font-medium flex items-center justify-between" :class="isDark ? 'text-gray-100' : 'text-gray-800'" @click="uiOpen.banner = !uiOpen.banner">
                    <span>横幅</span>
                    <span class="text-xs" :class="isDark ? 'text-gray-400' : 'text-gray-500'">{{ uiOpen.banner ? '收起' : '展开' }}</span>
                  </button>
                  <div v-show="uiOpen.banner" class="px-3 pb-3 grid grid-cols-3 gap-2 items-center">
                    <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">上下位置</label>
                    <input type="range" min="0" max="100" v-model.number="uiEditor.bannerPos" class="col-span-2">
                    <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">字体大小</label>
                    <input type="range" min="10" max="64" v-model.number="uiEditor.bannerFontSize" class="col-span-2">
                    <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">正方横幅颜色</label>
                    <input type="color" v-model="uiEditor.bannerColorPos" class="col-span-2 h-8 p-0 border rounded" :class="isDark ? 'border-gray-600' : 'border-gray-300'">
                    <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">反方横幅颜色</label>
                    <input type="color" v-model="uiEditor.bannerColorNeg" class="col-span-2 h-8 p-0 border rounded" :class="isDark ? 'border-gray-600' : 'border-gray-300'">
                    <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">正方字体颜色</label>
                    <input type="color" v-model="uiEditor.bannerFontColorPos" class="col-span-2 h-8 p-0 border rounded" :class="isDark ? 'border-gray-600' : 'border-gray-300'">
                    <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">反方字体颜色</label>
                    <input type="color" v-model="uiEditor.bannerFontColorNeg" class="col-span-2 h-8 p-0 border rounded" :class="isDark ? 'border-gray-600' : 'border-gray-300'">
                  </div>
                </div>

                <!-- 赛事名称分组 -->
                <div v-if="uiEditorTab==='props'" :class="isDark ? 'bg-gray-800/40 border border-gray-700' : 'bg-white border border-gray-200'" class="rounded-lg mb-3">
                  <button class="w-full text-left px-3 py-2 text-sm font-medium flex items-center justify-between" :class="isDark ? 'text-gray-100' : 'text-gray-800'" @click="uiOpen.event = !uiOpen.event">
                    <span>赛事名称</span>
                    <span class="text-xs" :class="isDark ? 'text-gray-400' : 'text-gray-500'">{{ uiOpen.event ? '收起' : '展开' }}</span>
                  </button>
                  <div v-show="uiOpen.event" class="px-3 pb-3 grid grid-cols-3 gap-2 items-center">
                    <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">上下位置</label>
                    <input type="range" min="0" max="100" v-model.number="uiEditor.eventPosY" class="col-span-2">
                    <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">左右位置</label>
                    <input type="range" min="0" max="100" v-model.number="uiEditor.eventPosX" class="col-span-2">
                    <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">文字颜色</label>
                    <input type="color" v-model="uiEditor.eventColor" class="col-span-2 h-8 p-0 border rounded" :class="isDark ? 'border-gray-600' : 'border-gray-300'">
                    <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">字体大小</label>
                    <input type="range" min="10" max="64" v-model.number="uiEditor.eventFontSize" class="col-span-2">
                  </div>
                </div>

                <!-- 当前环节名分组 -->
                <div v-if="uiEditorTab==='props'" :class="isDark ? 'bg-gray-800/40 border border-gray-700' : 'bg-white border border-gray-200'" class="rounded-lg mb-3">
                  <button class="w-full text-left px-3 py-2 text-sm font-medium flex items-center justify-between" :class="isDark ? 'text-gray-100' : 'text-gray-800'" @click="uiOpen.stage = !uiOpen.stage">
                    <span>当前环节名</span>
                    <span class="text-xs" :class="isDark ? 'text-gray-400' : 'text-gray-500'">{{ uiOpen.stage ? '收起' : '展开' }}</span>
                  </button>
                  <div v-show="uiOpen.stage" class="px-3 pb-3 grid grid-cols-3 gap-2 items-center">
                    <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">上下位置</label>
                    <input type="range" min="0" max="100" v-model.number="uiEditor.stagePosY" class="col-span-2">
                    <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">左右位置</label>
                    <input type="range" min="0" max="100" v-model.number="uiEditor.stagePosX" class="col-span-2">
                    <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">文字颜色</label>
                    <input type="color" v-model="uiEditor.stageColor" class="col-span-2 h-8 p-0 border rounded" :class="isDark ? 'border-gray-600' : 'border-gray-300'">
                    <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">字体大小</label>
                    <input type="range" min="10" max="64" v-model.number="uiEditor.stageFontSize" class="col-span-2">
                  </div>
                </div>

                <!-- 无计时器环节名分组 -->
                <div v-if="uiEditorTab==='props'" :class="isDark ? 'bg-gray-800/40 border border-gray-700' : 'bg-white border border-gray-200'" class="rounded-lg mb-3">
                  <button class="w-full text-left px-3 py-2 text-sm font-medium flex items-center justify-between" :class="isDark ? 'text-gray-100' : 'text-gray-800'" @click="uiOpen.noTimerStage = !uiOpen.noTimerStage">
                    <span>无计时器环节名</span>
                    <span class="text-xs" :class="isDark ? 'text-gray-400' : 'text-gray-500'">{{ uiOpen.noTimerStage ? '收起' : '展开' }}</span>
                  </button>
                  <div v-show="uiOpen.noTimerStage" class="px-3 pb-3 grid grid-cols-3 gap-2 items-center">
                    <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">上下位置</label>
                    <input type="range" min="0" max="100" v-model.number="uiEditor.noTimerStagePosY" class="col-span-2">
                    <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">左右位置</label>
                    <input type="range" min="0" max="100" v-model.number="uiEditor.noTimerStagePosX" class="col-span-2">
                    <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">文字颜色</label>
                    <input type="color" v-model="uiEditor.noTimerStageColor" class="col-span-2 h-8 p-0 border rounded" :class="isDark ? 'border-gray-600' : 'border-gray-300'">
                    <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">字体大小</label>
                    <input type="range" min="10" max="64" v-model.number="uiEditor.noTimerStageFontSize" class="col-span-2">
                  </div>
                </div>

                <!-- 单计时器单元分组 -->
                <div v-if="uiEditorTab==='props'" :class="isDark ? 'bg-gray-800/40 border border-gray-700' : 'bg-white border border-gray-200'" class="rounded-lg mb-3">
                  <button class="w-full text-left px-3 py-2 text-sm font-medium flex items-center justify-between" :class="isDark ? 'text-gray-100' : 'text-gray-800'" @click="uiOpen.singleTimer = !uiOpen.singleTimer">
                    <span>单计时器单元</span>
                    <span class="text-xs" :class="isDark ? 'text-gray-400' : 'text-gray-500'">{{ uiOpen.singleTimer ? '收起' : '展开' }}</span>
                  </button>
                  <div v-show="uiOpen.singleTimer" class="px-3 pb-3 grid grid-cols-3 gap-2 items-center">
                    <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">上下位置</label>
                    <input type="range" min="0" max="100" v-model.number="uiEditor.singleTimerPosY" class="col-span-2">
                    <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">文字颜色</label>
                    <input type="color" v-model="uiEditor.singleTimerColor" class="col-span-2 h-8 p-0 border rounded" :class="isDark ? 'border-gray-600' : 'border-gray-300'">
                    <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">字体大小</label>
                    <input type="range" min="10" max="64" v-model.number="uiEditor.singleTimerFontSize" class="col-span-2">
                  </div>
                </div>

                <!-- 双计时器单元分组 -->
                <div v-if="uiEditorTab==='props'" :class="isDark ? 'bg-gray-800/40 border border-gray-700' : 'bg-white border border-gray-200'" class="rounded-lg mb-3">
                  <button class="w-full text-left px-3 py-2 text-sm font-medium flex items-center justify-between" :class="isDark ? 'text-gray-100' : 'text-gray-800'" @click="uiOpen.dualTimer = !uiOpen.dualTimer">
                    <span>双计时器单元</span>
                    <span class="text-xs" :class="isDark ? 'text-gray-400' : 'text-gray-500'">{{ uiOpen.dualTimer ? '收起' : '展开' }}</span>
                  </button>
                  <div v-show="uiOpen.dualTimer" class="px-3 pb-3 grid grid-cols-3 gap-2 items-center">
                    <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">上下位置</label>
                    <input type="range" min="0" max="100" v-model.number="uiEditor.dualTimerPosY" class="col-span-2">
                    <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">两个计时器间隔</label>
                    <input type="range" min="0" max="200" v-model.number="uiEditor.dualTimerGap" class="col-span-2">
                    <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">文字颜色</label>
                    <input type="color" v-model="uiEditor.dualTimerColor" class="col-span-2 h-8 p-0 border rounded" :class="isDark ? 'border-gray-600' : 'border-gray-300'">
                    <label class="text-xs" :class="isDark ? 'text-gray-300' : 'text-black'">字体大小</label>
                    <input type="range" min="10" max="64" v-model.number="uiEditor.dualTimerFontSize" class="col-span-2">
                  </div>
                </div>
              </div>

              <div v-if="editTab==='stages'" class="flex-1 overflow-y-auto min-h-0 pb-12 pr-1">
                <Draggable v-model="form!.stages" item-key="id" handle=".drag-handle" @end="renumber" ghost-class="opacity-60">
          <template #item="{ element: s, index: idx }">
            <div class="mb-3">
              <div class="flex items-center gap-0">
                <!-- 左侧序号区域 -->
                <div :class="isDark ? 'bg-gray-600 text-white' : 'bg-gray-600 text-white'" class="drag-handle cursor-move select-none w-14 h-14 rounded-l flex items-center justify-center text-base font-bold">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2v20m3-3l-3 3l-3-3M19 9l3 3l-3 3M2 12h20M5 9l-3 3l3 3M9 5l3-3l3 3"/>
                  </svg>
                  <span>{{ s.order }}</span>
                </div>
                
                <!-- 右侧卡片内容 -->
                <div
    :class="[
      isDark ? 'border border-gray-700 bg-transparent hover:border-blue-600/60 hover:shadow-blue-900/20'
             : 'border border-gray-300 bg-white hover:border-blue-400 hover:shadow-blue-200/40'
    ]"
    class="rounded-r-lg rounded-l-none p-3 hover:shadow-lg transition cursor-pointer flex-1 flex items-center h-14"
    @click="toggleExpand(s.id)"
  >
                  <div class="flex items-center justify-between w-full">
                    <div class="flex items-center gap-3 flex-1">
                    
                    <!-- 左侧：类型和时间徽标 -->
                    <div class="flex items-center gap-2">
                      <div class="flex items-center">
                        <span class="px-1.5 py-0.5 rounded-l text-[13px] font-bold bg-green-600 text-white">类</span>
                        <span :class="isDark ? 'px-1.5 py-0.5 rounded-r text-[13px] font-bold bg-transparent text-gray-100 border border-gray-600 border-l-0' : 'px-1.5 py-0.5 rounded-r text-[13px] font-bold bg-white text-gray-900 border border-gray-300 border-l-0'">{{ typeLabel(s.type) }}</span>
                      </div>
                      <template v-if="s.type !== 'special'">
                        <div class="flex items-center">
                          <span class="px-1.5 py-0.5 rounded-l text-[13px] font-bold bg-green-600 text-white">时</span>
                          <span v-if="s.type==='dual-timer'" :class="isDark ? 'px-1.5 py-0.5 rounded-r text-[13px] font-bold bg-transparent text-gray-100 border border-gray-600 border-l-0' : 'px-1.5 py-0.5 rounded-r text-[13px] font-bold bg-white text-gray-900 border border-gray-300 border-l-0'">
                            {{ (s as any).positiveDuration ?? s.duration }}/{{ (s as any).negativeDuration ?? s.duration }}
                          </span>
                          <span v-else :class="isDark ? 'px-1.5 py-0.5 rounded-r text-[13px] font-bold bg-transparent text-gray-100 border border-gray-600 border-l-0' : 'px-1.5 py-0.5 rounded-r text-[13px] font-bold bg-white text-gray-900 border border-gray-300 border-l-0'">{{ s.duration }}</span>
                          <span class="ml-0.5 text-[13px] text-gray-500">秒</span>
                        </div>
                      </template>
                      </div>
                      
                      <!-- 右侧：环节名称 -->
                      <div class="flex-1 text-right">
                        <span class="text-base font-semibold">{{ s.name }}</span>
                      </div>
                    </div>
                    <div></div>
                  </div>
                </div>
              </div>
              
              <!-- 展开的详情区域 - 移到整行下方 -->
              <div v-show="expandedId === s.id" :class="[
                isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'
              ]" class="mt-2 p-4 rounded-lg" @click.stop>
                <div class="grid grid-cols-12 gap-2">
                  <div class="col-span-4">
                    <label class="block text-xs mb-1" :class="isDark ? 'text-gray-300' : 'text-black'">名称</label>
                    <input v-model="s.name" :class="isDark ? 'bg-transparent border border-gray-600 text-gray-100' : 'bg-white border border-gray-300 text-gray-900'" class="w-full px-2 py-1 rounded outline-none text-sm focus:ring-1 focus:ring-blue-600" />
                  </div>
                  <!-- 新：允许发言身份组级联选择器（名称后，选择器样式，弹层两列） -->
                  <div class="col-span-8 relative">
                    <label class="block text-xs mb-1" :class="isDark ? 'text-gray-300' : 'text-black'">允许发言身份组</label>
                    <!-- 触发区：选择器外观，显示已选标签 -->
                    <div
                      :class="isDark ? 'bg-gray-800 text-gray-100 border border-gray-600' : 'bg-white text-gray-900 border border-gray-300'"
                      class="rounded-md px-2 py-1 text-sm flex items-center justify-between cursor-pointer select-none"
                      @click="rolesOpenId===s.id ? closeRoles() : openRoles(s.id, rolesActiveSide || '正方')"
                    >
                      <div class="flex flex-wrap gap-1">
                        <span v-for="chip in selectedChips(s)" :key="chip" class="px-2 py-0.5 rounded bg-green-100 text-green-700 border border-green-300 text-xs" :class="isDark ? 'bg-green-900/20 text-green-300 border-green-600' : ''">
                          {{ chip }}
                        </span>
                        <span v-if="selectedChips(s).length === 0" class="text-xs text-gray-400">未选择</span>
                      </div>
                      <svg class="w-4 h-4 opacity-70" :class="isDark ? 'text-gray-300' : 'text-gray-700'" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M6 9l6 6 6-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </div>
                    <!-- 弹层：两列 -->
                    <div v-if="rolesOpenId === s.id" class="fixed inset-0 z-10" @click="closeRoles"></div>
                    <div v-if="rolesOpenId === s.id" class="absolute z-20 mt-1 w-full">
                      <div :class="isDark ? 'bg-gray-800 border border-gray-700 text-gray-100' : 'bg-white border border-gray-300 text-gray-900'" class="rounded-md shadow-lg grid grid-cols-2">
                        <!-- 左列：顶级 -->
                        <div class="p-2 border-r" :class="isDark ? 'border-gray-700' : 'border-gray-200'">
                          <div class="space-y-1 text-sm">
                            <div class="flex items-center justify-between px-2 py-1 rounded" :class="rolesActiveSide==='正方' ? (isDark ? 'bg-green-900/20' : 'bg-green-50') : ''">
                              <label class="inline-flex items-center gap-2">
                                <input type="checkbox" class="accent-blue-500/90" :checked="sideAllUI(s,'正方')" @change="toggleSideAll(s,'正方', ($event.target as HTMLInputElement).checked)">
                                <span>正方</span>
                              </label>
                              <button class="text-xs px-2 py-0.5 rounded" :class="isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'" @click.stop="rolesActiveSide='正方'">›</button>
                            </div>
                            <div class="flex items-center justify-between px-2 py-1 rounded" :class="rolesActiveSide==='反方' ? (isDark ? 'bg-green-900/20' : 'bg-green-50') : ''">
                              <label class="inline-flex items-center gap-2">
                                <input type="checkbox" class="accent-blue-500/90" :checked="sideAllUI(s,'反方')" @change="toggleSideAll(s,'反方', ($event.target as HTMLInputElement).checked)">
                                <span>反方</span>
                              </label>
                              <button class="text-xs px-2 py-0.5 rounded" :class="isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'" @click.stop="rolesActiveSide='反方'">›</button>
                            </div>
                            <label class="flex items-center gap-2 px-2 py-1 rounded">
                              <input type="checkbox" class="accent-blue-500/90" :checked="hasRole(s,'评委')" @change="setRole(s,'评委', ($event.target as HTMLInputElement).checked)">
                              <span>评委</span>
                            </label>
                            <label class="flex items-center gap-2 px-2 py-1 rounded">
                              <input type="checkbox" class="accent-blue-500/90" :checked="hasRole(s,'观众')" @change="toggleAudience(s, ($event.target as HTMLInputElement).checked)">
                              <span>观众</span>
                            </label>
                            <label class="flex items-center gap-2 px-2 py-1 rounded">
                              <input type="checkbox" class="accent-blue-500/90" :checked="sideAllUI(s,'正方') && sideAllUI(s,'反方') && hasRole(s,'评委') && hasRole(s,'观众')" @change="toggleGlobalAll(s, ($event.target as HTMLInputElement).checked)">
                              <span>全体</span>
                            </label>
                          </div>
                        </div>
                        <!-- 右列：当前侧子项 -->
                        <div class="p-2">
                          <div class="text-xs font-semibold mb-1" :class="isDark ? 'text-gray-300' : 'text-gray-700'">{{ rolesActiveSide || '正方' }}</div>
                          <div class="space-y-1 text-sm max-h-44 overflow-y-auto">
                            <label v-for="(name,i) in SIDE_ROLES" :key="(rolesActiveSide||'正方')+'-'+i" class="flex items-center gap-2 px-2 py-1 rounded">
                              <input
                                type="checkbox"
                                class="accent-blue-500/90"
                                :checked="hasRole(s, roleKey(rolesActiveSide || '正方', i))"
                                @change="toggleSub(s, rolesActiveSide || '正方', i, ($event.target as HTMLInputElement).checked)"
                              />
                              <span>{{ name }}</span>
                            </label>
                            <label class="flex items-center gap-2 px-2 py-1 rounded">
                              <input
                                type="checkbox"
                                class="accent-blue-500/90"
                                :checked="sideAllUI(s, rolesActiveSide || '正方')"
                                @change="toggleSideAll(s, rolesActiveSide || '正方', ($event.target as HTMLInputElement).checked)"
                              />
                              <span>全体</span>
                            </label>
                          </div>
                        </div>
                      </div>
                      <div class="flex justify-end mt-1">
                        <button class="text-xs px-2 py-1 rounded border" :class="isDark ? 'border-gray-600 hover:bg-white/10' : 'border-gray-300 hover:bg-gray-100'" @click.stop="closeRoles()">关闭</button>
                      </div>
                    </div>
                  </div>
                  <div class="col-span-3">
                    <label class="block text-xs mb-1" :class="isDark ? 'text-gray-300' : 'text-black'">类型</label>
                    <select v-model="s.type" :class="isDark ? 'bg-gray-800 text-gray-100 border border-gray-600' : 'bg-white text-gray-900 border border-gray-300'" class="w-full px-2 py-1 rounded-md outline-none text-sm focus:ring-1 focus:ring-blue-600 appearance-none">
                      <option value="special">无计时器</option>
                      <option value="speech">单计时器</option>
                      <option value="dual-timer">双计时器</option>
                    </select>
                  </div>
                  <div class="col-span-2" v-if="s.type!=='dual-timer' && s.type!=='special'">
                    <label class="block text-xs mb-1" :class="isDark ? 'text-gray-300' : 'text-black'">时长(秒)</label>
                    <input v-model.number="s.duration" type="number" min="0" :class="isDark ? 'bg-transparent border border-gray-600 text-gray-100' : 'bg-white border border-gray-300 text-gray-900'" class="w-full px-2 py-1 rounded outline-none text-sm focus:ring-1 focus:ring-blue-600" />
                  </div>
                  <div class="col-span-2" v-if="s.type==='dual-timer'">
                    <label class="block text-xs mb-1" :class="isDark ? 'text-gray-300' : 'text-black'">正方时长(秒)</label>
                    <input v-model.number="(s as any).positiveDuration" type="number" min="0" :class="isDark ? 'bg-transparent border border-gray-600 text-gray-100' : 'bg-white border border-gray-300 text-gray-900'" class="w-full px-2 py-1 rounded outline-none text-sm focus:ring-1 focus:ring-blue-600" />
                  </div>
                  <div class="col-span-2" v-if="s.type==='dual-timer'">
                    <label class="block text-xs mb-1" :class="isDark ? 'text-gray-300' : 'text-black'">反方时长(秒)</label>
                    <input v-model.number="(s as any).negativeDuration" type="number" min="0" :class="isDark ? 'bg-transparent border border-gray-600 text-gray-100' : 'bg-white border border-gray-300 text-gray-900'" class="w-full px-2 py-1 rounded outline-none text-sm focus:ring-1 focus:ring-blue-600" />
                  </div>


                  <div class="col-span-12">
                    <label class="block text-xs mb-1" :class="isDark ? 'text-gray-300' : 'text-black'">描述</label>
                    <textarea v-model="s.description" rows="2" :class="isDark ? 'bg-transparent border border-gray-600 text-gray-100' : 'bg-white border border-gray-300 text-gray-900'" class="w-full px-2 py-1 rounded outline-none text-sm focus:ring-1 focus:ring-blue-600"></textarea>
                  </div>
                  
                  <!-- 操作按钮区域 -->
                  <div class="col-span-12 flex justify-end space-x-2 pt-2 border-t" :class="isDark ? 'border-gray-600' : 'border-gray-200'">
                    <button :class="isDark ? 'px-3 py-1.5 border border-gray-600 rounded text-sm hover:bg-white/10 transition flex items-center gap-1' : 'px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 transition flex items-center gap-1'" @click.stop="duplicateStage(idx)">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                      </svg>
                      复制
                    </button>
                    <button :class="isDark ? 'px-3 py-1.5 border border-red-600 text-red-300 rounded text-sm hover:bg-red-600/20 transition flex items-center gap-1' : 'px-3 py-1.5 border border-red-600 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition flex items-center gap-1'" @click.stop="removeStage(idx)">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                      删除
                    </button>
                  </div>
                </div>
              </div>
            </div>
              </template>
              </Draggable>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>


  </div>
</template>

<script setup lang="ts">
definePageMeta({ ssr: false })
const uiOpen = ref({
  background: true,
  banner: true,
  event: true,
  stage: true,
  noTimerStage: true,
  singleTimer: true,
  dualTimer: true,
})
import { onMounted, onUnmounted, ref, computed, watch } from 'vue'
import Draggable from 'vuedraggable'
import { createEventBus } from './[id]/core/plugin.bus'
import { createPluginRegistry } from './[id]/core/plugin.registry'
import type { PluginContext } from './[id]/core/plugin.types'
import { DataPlugin } from './[id]/plugins/data.plugin'
import { FormPlugin } from './[id]/plugins/form.plugin'
import { MembersPlugin } from './[id]/plugins/members.plugin'
import { ChartsPlugin } from './[id]/plugins/charts.plugin'
import { ActionsPlugin } from './[id]/plugins/actions.plugin'
import { LayoutPlugin } from './[id]/plugins/layout.plugin'
const route = useRoute()
const id = Number(route.params.id)
import { useDebateStore } from '~/stores/debate'
const debateStore = useDebateStore()

// 插件事件总线与注册中心（最小侵入式接入）
const bus = createEventBus()
const registry = createPluginRegistry()

// 标准化上下文（逐步补充依赖）
const pluginCtx: PluginContext = {
  idParam: id,
  fetch: $fetch,
  bus,
}

// 注册占位插件（不改变现有逻辑）
registry.register(DataPlugin)
registry.register(FormPlugin)
registry.register(MembersPlugin)
registry.register(ChartsPlugin)
registry.register(ActionsPlugin)
registry.register(LayoutPlugin)

// 订阅数据事件：统一同步页面状态（最小侵入）
bus.on("data:update", (e: any) => {
  if (typeof e?.payload?.loading !== "undefined") loading.value = !!e.payload.loading
  if (typeof e?.payload?.saving !== "undefined") saving.value = !!e.payload.saving
  if (typeof e?.payload?.error !== "undefined") error.value = e.payload.error
  if (typeof e?.payload?.form !== "undefined") form.value = e.payload.form
})
bus.on("data:loaded", (e: any) => {
  if (e?.payload?.form) form.value = e.payload.form
})
bus.on("data:saved", (e: any) => {
  if (e?.payload?.form) {
    form.value = e.payload.form
    alert('已保存并广播')
    reloadPreview()
  }
})
bus.on("stage:expand", (e: any) => {
  expandedId.value = e?.payload?.id ?? null
})

const ALL_ROLES = [
  // 默认权限组：主持人/后台已拥有发言权限，移出选项避免重复设置
  '评委', '观众',
  '正方一辩', '正方二辩', '正方三辩', '正方四辩',
  '反方一辩', '反方二辩', '反方三辩', '反方四辩'
]

type StageType = 'speech' | 'question' | 'summary' | 'special' | 'dual-timer'
interface Stage {
  id: number; order: number; name: string; duration: number; type: StageType; allowedRoles: string[]; description?: string
}
interface FormData {
  id: number
  name: string
  updatedAt: string
  global: {
    title: string
  }
  stages: Stage[]
}

const form = ref<FormData | null>(null)
const saving = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
const expandedId = ref<number | null>(null)
const editTab = ref<'stages'|'ui'>('ui')

// 界面编辑（UI暂不生效，仅本地状态）
type UiTab = 'background' | 'elements' | 'props'
const uiEditorTab = ref<UiTab>('background')
const uiEditor = ref({
  // 背景
  backgroundType: 'default' as 'default' | 'image',
  imageFileName: '',
  // 元素开关与术语
  bannerVisible: true,
  eventNameVisible: true,
  softwareLogoVisible: true,
  positiveLabel: '正方',
  negativeLabel: '反方',
  // 横幅
  bannerPos: 10,
  bannerFontSize: 20,
  bannerColorPos: '#A92323',
  bannerColorNeg: '#0369A1',
  bannerFontColorPos: '#ffffff',
  bannerFontColorNeg: '#ffffff',
  // 赛事名称
  eventPosY: 15,
  eventPosX: 50,
  eventColor: '#0369A1',
  eventFontSize: 24,
  // 当前环节名
  stagePosY: 30,
  stagePosX: 50,
  stageColor: '#ffffff',
  stageFontSize: 22,
  // 无计时器环节名
  noTimerStagePosY: 40,
  noTimerStagePosX: 50,
  noTimerStageColor: '#ffffff',
  noTimerStageFontSize: 20,
  // 单计时器单元
  singleTimerPosY: 60,
  singleTimerColor: '#ffffff',
  singleTimerFontSize: 20,
  // 双计时器单元
  dualTimerPosY: 65,
  dualTimerGap: 24,
  dualTimerColor: '#ffffff',
  dualTimerFontSize: 20,
})

/** 主题状态由 ActionsPlugin 维护，页面通过 actions:update 同步并仅派发事件 */
const isDark = ref(false)
function toggleTheme() { registry.emit({ type: 'theme:toggle' }) }

// 订阅 Actions 状态
bus.on('actions:update', (e: any) => {
  if (typeof e?.payload?.isDark !== 'undefined') isDark.value = !!e.payload.isDark
  if (typeof e?.payload?.previewUrl !== 'undefined') previewUrl.value = e.payload.previewUrl
  if (typeof e?.payload?.iframeKey !== 'undefined') iframeKey.value = e.payload.iframeKey
})

// 实时预览
const iframeKey = ref(0)
const previewUrl = ref<string>('')
/** 预览：交由 ActionsPlugin 负责，页面仅派发事件与接收状态 */
onMounted(() => {
  // ActionsPlugin.init 会发一次 actions:update 以初始化 previewUrl 与 isDark
})
function reloadPreview() { registry.emit({ type: 'preview:reload' }) }

// 预览联动：向 iframe 发送切换环节命令（优先 postMessage，回退键盘事件）
const previewIframe = ref<HTMLIFrameElement | null>(null)
function sendPreviewAction(action: 'prev' | 'next') {
  registry.emit({ type: 'preview:action', payload: { action } })
}
function previewPrev() { sendPreviewAction('prev') }
function previewNext() { sendPreviewAction('next') }

// 壳组件生命周期：初始化与装载/卸载（不迁移任何现有逻辑）
onMounted(() => {
  registry.initAll(pluginCtx)
  registry.mountAll({ refs: { previewIframe } })
})

onUnmounted(() => {
  registry.unmountAll()
})

// 徽标样式与文案
function typeLabel(t: StageType) {
  return t === 'special' ? '无计时器'
    : t === 'dual-timer' ? '双计时器'
    : '单计时器'
}
function typeBadgeClass(t: StageType) {
  // 深色：浅字+深底；浅色：深字+浅底
  if (isDark.value) {
    if (t === 'dual-timer') return 'border-purple-600 text-purple-300 bg-purple-900/20'
    if (t === 'special') return 'border-gray-500 text-gray-300 bg-gray-700/30'
    if (t === 'summary') return 'border-amber-600 text-amber-300 bg-amber-900/20'
    if (t === 'question') return 'border-cyan-600 text-cyan-300 bg-cyan-900/20'
    return 'border-blue-600 text-blue-300 bg-blue-900/20'
  } else {
    if (t === 'dual-timer') return 'border-purple-600 text-purple-700 bg-purple-100'
    if (t === 'special') return 'border-gray-500 text-gray-800 bg-gray-100'
    if (t === 'summary') return 'border-amber-600 text-amber-700 bg-amber-100'
    if (t === 'question') return 'border-cyan-600 text-cyan-700 bg-cyan-100'
    return 'border-blue-600 text-blue-700 bg-blue-100'
  }
}

function moveUp(idx: number) {
  registry.emit({ type: 'stage:moveUp', payload: { index: idx } })
}
function moveDown(idx: number) {
  registry.emit({ type: 'stage:moveDown', payload: { index: idx } })
}
function renumber() {
  registry.emit({ type: 'stage:renumber' })
}

function toggleExpand(id: number) {
  const next = expandedId.value === id ? null : id
  registry.emit({ type: 'stage:expand', payload: { id: next } })
}

// 上/下一个环节切换（基于 expandedId）
function prevStage() {
  registry.emit({ type: 'stage:prev' })
}
function nextStage() {
  registry.emit({ type: 'stage:next' })
}

function addStageByType(type: 'special' | 'speech' | 'dual-timer') {
  registry.emit({ type: 'stage:addByType', payload: { type } })
}

function addStageByName(name: string) {
  registry.emit({ type: 'stage:addByName', payload: { name } })
}

function addStage() {
  registry.emit({ type: 'stage:add' })
}
function removeStage(idx: number) {
  registry.emit({ type: 'stage:remove', payload: { index: idx } })
}
function duplicateStage(idx: number) {
  registry.emit({ type: 'stage:duplicate', payload: { index: idx } })
}

/** 二级下拉选择器辅助逻辑（最小侵入式，沿用 allowedRoles 字符串列表） */
const SIDE_ROLES = ['一辩','二辩','三辩','四辩']

function roleKey(side: '正方'|'反方', idx: number) {
  return `${side}${SIDE_ROLES[idx]}`
}
function hasRole(s: any, key: string) {
  return Array.isArray(s.allowedRoles) && s.allowedRoles.includes(key)
}
function setRole(s: any, key: string, val: boolean) {
  if (!Array.isArray(s.allowedRoles)) s.allowedRoles = []
  const i = s.allowedRoles.indexOf(key)
  if (val && i === -1) s.allowedRoles.push(key)
  if (!val && i !== -1) s.allowedRoles.splice(i, 1)
}

/** UI 判定：该方是否“全体”（四辩位均选中） */
function sideAllUI(s: any, side: '正方'|'反方') {
  return SIDE_ROLES.every((_, i) => hasRole(s, roleKey(side, i)))
}

/** 切换某方“全体” */
function toggleSideAll(s: any, side: '正方'|'反方', val: boolean) {
  for (let i = 0; i < SIDE_ROLES.length; i++) {
    setRole(s, roleKey(side, i), val)
  }
}

/** 切换子辩位；选中任一子项时视为取消“全体”（UI通过 sideAllUI 控制禁用） */
function toggleSub(s: any, side: '正方'|'反方', idx: number, val: boolean) {
  setRole(s, roleKey(side, idx), val)
}

/** 一级“全体”：同时切换正反方为全体 */
function toggleGlobalAll(s: any, val: boolean) {
  // 正反双方全体
  toggleSideAll(s, '正方', val)
  toggleSideAll(s, '反方', val)
  // 同步评委与观众
  setRole(s, '评委', val)
  setRole(s, '观众', val)
}

/** 观众：选中则自动勾选正反方全体；取消仅取消观众本身 */
function toggleAudience(s: any, val: boolean) {
  setRole(s, '观众', val)
  if (val) {
    toggleSideAll(s, '正方', true)
    toggleSideAll(s, '反方', true)
  }
}

/** 选择器弹层状态与标签生成（组件级，最小侵入式） */
const rolesOpenId = ref<number | null>(null)
const rolesActiveSide = ref<'正方' | '反方' | null>(null)
function openRoles(id: number, side?: '正方' | '反方') {
  rolesOpenId.value = id
  rolesActiveSide.value = side ?? rolesActiveSide.value ?? '正方'
}
function closeRoles() { rolesOpenId.value = null }

/** 已选标签显示：将 allowedRoles 映射为 “正方/一辩”等，并在 UI 层合并全体状态 */
function selectedChips(s: any): string[] {
  const has = (k: string) => Array.isArray(s.allowedRoles) && s.allowedRoles.includes(k)
  const sideAllPos = SIDE_ROLES.every((_, i) => has(roleKey('正方', i)))
  const sideAllNeg = SIDE_ROLES.every((_, i) => has(roleKey('反方', i)))
  const hasAllTop = has('评委') && has('观众')
  // 若满足全体（含评委与观众），仅显示“全体”
  if (sideAllPos && sideAllNeg && hasAllTop) {
    return ['全体']
  }
  // 否则显示详细标签
  const chips: string[] = []
  if (has('评委')) chips.push('评委')
  if (has('观众')) chips.push('观众')
  ;(['正方','反方'] as const).forEach(side => {
    const subs = SIDE_ROLES.map((r, i) => ({ key: roleKey(side, i), label: `${side}/${r}` })).filter(x => has(x.key))
    if (subs.length === SIDE_ROLES.length) {
      chips.push(`${side}/全体`)
    } else {
      chips.push(...subs.map(x => x.label))
    }
  })
  return chips
}

function exportJSON() {
  registry.emit({ type: 'data:export' })
}
async function importJSON(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return
  const file = input.files![0] as File
  const text = await file.text().catch(() => '')
  try {
    const data = JSON.parse(text)
    registry.emit({ type: 'data:import', payload: { data } })
    ;(e.target as HTMLInputElement).value = ''
  } catch {
    alert('导入的 JSON 无法解析')
  }
}

function load() {
  registry.emit({ type: 'data:load' })
}

function save() {
  if (!form.value) return
  registry.emit({ type: 'data:save', payload: { form: form.value } })
}

watch(uiEditor, (val) => {
  // 将编辑器状态同步到 form.global.ui（持久化用）
  if (form.value) {
    const g: any = (form.value as any).global || ((form.value as any).global = {})
    g.ui = val
    // 同步到 Pinia store，供展示页与其他组件读取
    debateStore.setUi(val || {})
  }
}, { deep: true })

onMounted(() => {
  load()
  // 初始化：用 store.currentUi 合并到 uiEditor（最小侵入）
  try {
    const initUi = (debateStore.currentUi || {}) as Record<string, any>
    Object.assign(uiEditor.value || {}, initUi || {})
  } catch {}
})
</script>