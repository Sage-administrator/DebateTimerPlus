<template>
  <div class="p-6 text-white">
    <h1 class="text-2xl font-bold">Route Check</h1>
    <p class="text-sm text-gray-300 mt-2">如果你看到了这段文字，说明 Nuxt 路由与布局已生效。</p>
    <NuxtLink to="/admin/projects" class="underline text-blue-300">前往项目列表</NuxtLink>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })
</script>