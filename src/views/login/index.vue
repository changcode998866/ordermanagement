<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useUserStore } from '@/stores/user'
import type { LoginParams } from '@/types/models'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const loading = ref(false)
const form = reactive<LoginParams>({ username: 'admin', password: '123456' })
const rules: FormRules<LoginParams> = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
}

const demoAccounts = [
  { username: 'admin', label: '超级管理员（全部权限）' },
  { username: 'operator', label: '运营人员（无删除、无门店/报表/系统）' },
]

async function handleLogin() {
  await formRef.value?.validate()
  loading.value = true
  try {
    await userStore.login(form)
    ElMessage.success('登录成功')
    const redirect = route.query.redirect
    router.replace(typeof redirect === 'string' ? redirect : '/')
  } finally {
    loading.value = false
  }
}

const title = import.meta.env.VITE_APP_TITLE
</script>

<template>
  <div class="login">
    <div class="login-banner">
      <div class="banner-content">
        <div class="banner-emoji">🍔 🍜 🧋</div>
        <h1>{{ title }}</h1>
        <p>门店 · 商品 · 订单 · 配送 · 营销，一站式管理你的外卖生意</p>
      </div>
    </div>
    <div class="login-panel">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        size="large"
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <h2>欢迎登录</h2>
        <p class="text-secondary subtitle">请使用后台账号登录</p>
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名" prefix-icon="User" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        <el-button type="primary" :loading="loading" class="submit" @click="handleLogin">
          登 录
        </el-button>
        <el-alert type="info" :closable="false" class="demo">
          <template #title>演示账号（密码均为 123456）</template>
          <div
            v-for="item in demoAccounts"
            :key="item.username"
            class="demo-item"
            @click="form.username = item.username"
          >
            <el-link type="primary">{{ item.username }}</el-link>
            <span>{{ item.label }}</span>
          </div>
        </el-alert>
      </el-form>
    </div>
  </div>
</template>

<style scoped lang="scss">
.login {
  display: flex;
  height: 100%;
  background: var(--el-bg-color);
}

.login-banner {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: linear-gradient(135deg, #ff9a3c 0%, #ff6a00 50%, #e84a0c 100%);

  h1 {
    margin: 24px 0 12px;
    font-size: 36px;
  }

  p {
    font-size: 16px;
    opacity: 0.9;
  }
}

.banner-emoji {
  font-size: 64px;
}

.login-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 520px;
}

.login-form {
  width: 360px;

  h2 {
    margin: 0 0 6px;
    font-size: 26px;
  }

  .subtitle {
    margin: 0 0 28px;
  }
}

.submit {
  width: 100%;
  margin-top: 8px;
}

.demo {
  margin-top: 24px;
}

.demo-item {
  display: flex;
  gap: 8px;
  margin-top: 4px;
  cursor: pointer;
}

@media (width <= 900px) {
  .login-banner {
    display: none;
  }

  .login-panel {
    width: 100%;
  }
}
</style>
