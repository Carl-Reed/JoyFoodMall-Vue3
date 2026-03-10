<script lang="ts" setup>
import type { FormRules } from "element-plus"
import logo from "@@/assets/images/layouts/logo-text-3.png"
import { Iphone, Lock, Message, User } from "@element-plus/icons-vue"
import { registerApi } from "./apis"

const router = useRouter()
const registerFormRef = useTemplateRef("registerFormRef")
const loading = ref(false)

/** 注册表单数据 */
const registerFormData = reactive({
  username: "",
  phone: "",
  password: "",
  confirmPassword: "",
  email: ""
})

/** 自定义校验：确认密码 */
function validateConfirmPassword (rule: any, value: any, callback: any) {
  if (value === "") {
    callback(new Error("请再次输入密码"))
  } else if (value !== registerFormData.password) {
    callback(new Error("两次输入密码不一致!"))
  } else {
    callback()
  }
}

/** 注册校验规则 */
const registerFormRules: FormRules = {
  username: [{ required: true, message: "请输入会员名", trigger: "blur" }],
  phone: [
    { required: true, message: "请输入手机号", trigger: "blur" },
    { pattern: /^1[3-9]\d{9}$/, message: "请输入正确的手机号格式", trigger: "blur" }
  ],
  email: [
    { required: true, message: "请输入邮箱", trigger: "blur" },
    { type: "email", message: "请输入正确的邮箱格式", trigger: "blur" }
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, message: "密码至少 6 位", trigger: "blur" }
  ],
  confirmPassword: [{ validator: validateConfirmPassword, trigger: "blur" }]
}

/** 注册提交 */
function handleRegister() {
  registerFormRef.value?.validate((valid) => {
    if (!valid) return

    loading.value = true
    registerApi.register({
      username: registerFormData.username,
      password: registerFormData.password,
      email: registerFormData.email,
      phone: registerFormData.phone
    }).then(() => {
      ElMessage.success("注册成功，请登录！")
      router.push("/mall/login")
    }).catch((e:any) => {
      ElMessage.error(e.message || "注册失败，该用户名可能已被占用")
    }).finally(() => {
      loading.value = false
    })
  })
}
</script>

<template>
  <div class="login-container">
    <div class="circle circle-1" />
    <div class="circle circle-2" />

    <div class="login-card">
      <div class="title-section">
        <div class="logo-wrapper">
          <img :src="logo" alt="JoyFood" class="logo-img">
        </div>
        <div class="sub-title">加入 JoyFood · 开启美食之旅</div>
      </div>

      <div class="content">
        <el-form ref="registerFormRef" :model="registerFormData" :rules="registerFormRules" @keyup.enter="handleRegister">
          <el-form-item prop="username">
            <el-input
              v-model.trim="registerFormData.username"
              placeholder="设置会员名"
              :prefix-icon="User"
              size="large"
              class="mall-input"
            />
          </el-form-item>

          <el-form-item prop="phone">
            <el-input
            v-model.trim="registerFormData.phone"
            placeholder="请输入手机号"
            :prefix-icon="Iphone"
            size="large"
            class="mall-input" />
          </el-form-item>

          <el-form-item prop="email">
            <el-input
              v-model.trim="registerFormData.email"
              placeholder="电子邮箱"
              :prefix-icon="Message"
              size="large"
              class="mall-input"
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model.trim="registerFormData.password"
              type="password"
              placeholder="设置密码 (至少6位)"
              :prefix-icon="Lock"
              size="large"
              show-password
              class="mall-input"
            />
          </el-form-item>

          <el-form-item prop="confirmPassword">
            <el-input
              v-model.trim="registerFormData.confirmPassword"
              type="password"
              placeholder="确认密码"
              :prefix-icon="Lock"
              size="large"
              show-password
              class="mall-input"
            />
          </el-form-item>

          <el-button
            :loading="loading"
            type="primary"
            size="large"
            class="login-btn"
            @click.prevent="handleRegister"
          >
            立即注册
          </el-button>

          <div class="footer-links">
            <span>已有账号？ <a class="link" @click="router.push('/mall/login')">立即登录</a></span>
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* 完全复用并优化 Login.vue 的样式 */
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 100vh;
  background-color: #f5f7fa;
  position: relative;
  overflow: hidden;

  .circle {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    z-index: 0;
  }
  .circle-1 {
    width: 300px;
    height: 300px;
    background: rgba(255, 165, 0, 0.2);
    top: 10%;
    left: 20%;
  }
  .circle-2 {
    width: 250px;
    height: 250px;
    background: rgba(64, 158, 255, 0.15);
    bottom: 10%;
    right: 20%;
  }

  .login-card {
    width: 440px; /* 注册页稍微宽一点更美观 */
    border-radius: 16px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
    background-color: #ffffff;
    z-index: 1;
    transition: transform 0.3s;

    &:hover {
      transform: translateY(-5px);
    }

    .title-section {
      padding: 30px 0 10px 0;
      text-align: center;

      .logo-img {
        height: 100px; /* 缩小一点，给表单留空间 */
        object-fit: contain;
      }

      .sub-title {
        margin-top: 10px;
        font-size: 14px;
        color: #909399;
        letter-spacing: 1px;
      }
    }

    .content {
      padding: 20px 40px 40px 40px;

      :deep(.el-input__wrapper) {
         box-shadow: 0 0 0 1px #e4e7ed inset;
         border-radius: 8px;
         background-color: #f9fafe;
         &.is-focus {
             box-shadow: 0 0 0 1px var(--el-color-primary) inset !important;
             background-color: #fff;
         }
      }

      .login-btn {
        width: 100%;
        margin-top: 15px;
        border-radius: 25px;
        font-weight: bold;
        letter-spacing: 2px;
        height: 44px;
        background: linear-gradient(to right, #ff9a44, #ff6a00); /* 注册用橙色色调区分 */
        border: none;

        &:hover { opacity: 0.9; }
        &:active { transform: scale(0.98); }
      }

      .footer-links {
          margin-top: 20px;
          display: flex;
          justify-content: center;
          font-size: 13px;
          color: #606266;

          .link {
              color: var(--el-color-primary);
              cursor: pointer;
              margin-left: 8px;
              font-weight: 500;
              &:hover { text-decoration: underline; }
          }
      }
    }
  }
}
</style>
