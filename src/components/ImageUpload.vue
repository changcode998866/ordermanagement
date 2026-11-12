<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, type UploadRawFile, type UploadRequestOptions } from 'element-plus'
import { uploadApi } from '@/api'

const props = withDefaults(defineProps<{ size?: number; maxSizeMB?: number }>(), {
  size: 120,
  maxSizeMB: 2,
})
const url = defineModel<string>({ default: '' })
const uploading = ref(false)

function beforeUpload(file: UploadRawFile) {
  if (!file.type.startsWith('image/')) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  if (file.size > props.maxSizeMB * 1024 * 1024) {
    ElMessage.error(`图片不能超过 ${props.maxSizeMB}MB`)
    return false
  }
  return true
}

/** 上传到后端，由后端转存 OSS 并返回访问地址 */
async function httpRequest(options: UploadRequestOptions) {
  uploading.value = true
  try {
    const res = await uploadApi.upload(options.file)
    url.value = res.url
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <el-upload
    v-loading="uploading"
    class="image-upload"
    :style="{ width: `${size}px`, height: `${size}px` }"
    :show-file-list="false"
    :before-upload="beforeUpload"
    :http-request="httpRequest"
    accept="image/*"
  >
    <img v-if="url" :src="url" class="preview" alt="" />
    <div v-else class="placeholder">
      <el-icon :size="24"><Plus /></el-icon>
      <span>上传图片</span>
    </div>
  </el-upload>
</template>

<style scoped lang="scss">
.image-upload {
  overflow: hidden;
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  transition: border-color 0.2s;

  &:hover {
    border-color: var(--el-color-primary);
  }

  :deep(.el-upload) {
    width: 100%;
    height: 100%;
  }
}

.preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
