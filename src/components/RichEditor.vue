<script setup lang="ts">
import '@wangeditor/editor/dist/css/style.css'
import { onBeforeUnmount, shallowRef } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor'
import { uploadApi } from '@/api'

withDefaults(defineProps<{ height?: string; placeholder?: string }>(), {
  height: '300px',
  placeholder: '请输入内容...',
})
const html = defineModel<string>({ default: '' })

const editorRef = shallowRef<IDomEditor>()

const toolbarConfig: Partial<IToolbarConfig> = {
  excludeKeys: [
    'group-video',
    'insertVideo',
    'uploadVideo',
    'insertTable',
    'codeBlock',
    'fullScreen',
  ],
}

const editorConfig: Partial<IEditorConfig> = {
  MENU_CONF: {
    uploadImage: {
      async customUpload(file: File, insertFn: (url: string, alt: string, href: string) => void) {
        const { url } = await uploadApi.upload(file)
        insertFn(url, file.name, url)
      },
    },
  },
}

const handleCreated = (editor: IDomEditor) => (editorRef.value = editor)

onBeforeUnmount(() => editorRef.value?.destroy())
</script>

<template>
  <div class="rich-editor">
    <Toolbar :editor="editorRef" :default-config="toolbarConfig" mode="simple" class="toolbar" />
    <Editor
      v-model="html"
      :default-config="{ ...editorConfig, placeholder }"
      mode="simple"
      :style="{ height, overflowY: 'hidden' }"
      @on-created="handleCreated"
    />
  </div>
</template>

<style scoped lang="scss">
.rich-editor {
  width: 100%;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
}

.toolbar {
  border-bottom: 1px solid var(--el-border-color);
}
</style>
