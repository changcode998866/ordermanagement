<template>
  <div class="not-found">
    <el-result icon="info" title="404" sub-title="页面不存在，或你没有访问权限">
      <template #extra>
        <el-button type="primary" @click="$router.replace('/')">返回首页</el-button>
      </template>
    </el-result>
  </div>
</template>

<style scoped>
.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>
