<script lang="ts" setup>
import type { FormRules } from "element-plus"
import type { LoginRequestData } from "./apis/type"
import logo from "@@/assets/images/layouts/logo-text-3.png"
import { Lock, User } from "@element-plus/icons-vue"
import { useUserStore } from "@/pinia/stores/user"
import { loginApi } from "./apis"
import { useFocus } from "./composables/useFocus"

const router = useRouter()
const userStore = useUserStore()
const { handleBlur, handleFocus } = useFocus()

/** 登录表单元素的引用 */
const loginFormRef = useTemplateRef("loginFormRef")

/** 登录按钮 Loading */
const loading = ref(false)

/** 管理员登录页面的路径 */
const ADMIN_LOGIN_PATH = "/admin/login"

/** * === 核心逻辑：Logo 点击暗门 === */
const clickCount = ref(0)
let resetTimer: ReturnType<typeof setTimeout> | null = null

function handleSecretJump() {
  clickCount.value++

  // 每次点击后，如果 1 秒内没有下一次点击，则重置计数器
  if (resetTimer) clearTimeout(resetTimer)
  resetTimer = setTimeout(() => {
    clickCount.value = 0
  }, 1000)

  // 达到 5 次点击，触发跳转
  if (clickCount.value >= 5) {
    ElMessage.success("正在前往管理后台...")
    clickCount.value = 0 // 重置
    router.push(ADMIN_LOGIN_PATH)
  }
}

/** 登录表单数据 */
const loginFormData: LoginRequestData = reactive({
  username: "",
  password: "",
})

/** 登录表单校验规则 */
const loginFormRules: FormRules = {
  username: [
    { required: true, message: "请输入手机号/用户名/邮箱", trigger: "blur" }
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 5, max: 20, message: "长度在 5 到 20 个字符", trigger: "blur" }
  ]
}

/** 登录 */
function handleLogin() {
  loginFormRef.value?.validate((valid) => {
    if (!valid) return

    loading.value = true
    // 注意：这里应该调用商城的登录接口，如果接口不同请替换 loginApi
    loginApi(loginFormData).then(({ data }) => {
      userStore.setToken(data)
      ElMessage.success("欢迎回来，JoyFood会员！")
      router.push("/mall/home") // 登录成功跳转到商城首页
    }).catch(() => {
      ElMessage.error("登录失败，请检查手机号/用户名/邮箱和密码")
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
        <div class="logo-wrapper" @click="router.push('/mall/home')">
             <img :src="logo" alt="JoyFood" class="logo-img">
        </div>
        <div class="sub-title" @click="handleSecretJump">JoyFood · 会员登录</div>
      </div>

      <div class="content">
        <el-form ref="loginFormRef" :model="loginFormData" :rules="loginFormRules" @keyup.enter="handleLogin">
          <el-form-item prop="username">
            <el-input
              v-model.trim="loginFormData.username"
              placeholder="手机号 / 会员名 / 邮箱"
              type="text"
              tabindex="1"
              :prefix-icon="User"
              size="large"
              class="mall-input"
            />
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model.trim="loginFormData.password"
              placeholder="请输入密码"
              type="password"
              tabindex="2"
              :prefix-icon="Lock"
              size="large"
              show-password
              class="mall-input"
              @blur="handleBlur"
              @focus="handleFocus"
            />
          </el-form-item>

          <el-button :loading="loading" type="primary" size="large" class="login-btn" @click.prevent="handleLogin">
            立即登录
          </el-button>

          <div class="footer-links">
            <span>还没有账号？ <a class="link" @click="router.push('/mall/register')">立即注册</a></span>
            <span class="forgot">忘记密码</span>
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.login-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 100vh;
  background-color: #f5f7fa;
  position: relative;
  overflow: hidden;

  .theme-switch {
    position: fixed;
    top: 5%;
    right: 5%;
    cursor: pointer;
    z-index: 10;
  }

  /* 装饰背景球 */
  .circle {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    z-index: 0;
  }
  .circle-1 {
    width: 300px;
    height: 300px;
    background: rgba(255, 165, 0, 0.2); /* 橙色光晕 */
    top: 10%;
    left: 20%;
  }
  .circle-2 {
    width: 200px;
    height: 200px;
    background: rgba(64, 158, 255, 0.15); /* 蓝色光晕 */
    bottom: 10%;
    right: 20%;
  }

  .login-card {
    width: 420px;
    max-width: 90%;
    border-radius: 16px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08); /* 更柔和的阴影 */
    background-color: #ffffff;
    overflow: hidden;
    z-index: 1;
    transition: transform 0.3s;

    &:hover {
        transform: translateY(-5px);
    }

    .title-section {
        padding: 40px 0 20px 0;
        text-align: center;

        .logo-wrapper {
            display: inline-block;
            transition: opacity 0.2s;

            &:active {
                opacity: 0.7; /* 点击时的反馈 */
            }

            .logo-img {
                cursor: pointer;
                height: 120px;
                object-fit: contain;
            }
        }

        .sub-title {
            user-select: none;
            margin-top: 10px;
            font-size: 14px;
            color: #909399;
            letter-spacing: 1px;
        }
    }

    .content {
      padding: 10px 40px 40px 40px;

      /* 输入框样式优化 */
      :deep(.el-input__wrapper) {
         box-shadow: 0 0 0 1px #e4e7ed inset;
         border-radius: 8px;
         background-color: #f9fafe;
         &:hover {
             background-color: #fff;
         }
         &.is-focus {
             box-shadow: 0 0 0 1px var(--el-color-primary) inset !important;
             background-color: #fff;
         }
      }

      .login-btn {
        width: 100%;
        margin-top: 20px;
        border-radius: 25px; /* 圆角按钮 */
        font-weight: bold;
        letter-spacing: 2px;
        height: 44px;
        background: linear-gradient(to right, #17dbf9, #4980ff);
        border: none;

        &:hover {
            opacity: 0.9;
        }

        &:active {
            opacity: 1;
            transform: scale(0.98);
        }
      }

      .footer-links {
          margin-top: 20px;
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: #606266;

          .link {
              color: var(--el-color-primary);
              cursor: pointer;
              font-weight: 500;
              text-decoration: none;
          }

          .forgot {
              cursor: pointer;
              &:hover {
                  color: var(--el-color-primary);
              }
          }
      }
    }
  }
}
</style>
