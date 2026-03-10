<script setup lang="ts">
import { mallCartApi } from '@@/apis/mall/cart'
import logo from "@@/assets/images/layouts/logo-text-3.png"
import defaultAvatarIcon from "@@/assets/images/user/default-mall-avatar.png"
import { ElMessage } from 'element-plus'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCartStore } from '@/pinia/stores/cart'
import { useUserStore } from "@/pinia/stores/user"

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const cartStore = useCartStore()

// 搜索关键词
const keyword = ref('')
// 购物车数量
const cartCount = computed(() => cartStore.cartList.length)

// 移动端底部 Tab 配置
const mobileTabs = [
  { name: '首页', path: '/mall/home', icon: 'HomeFilled' },
  { name: '分类', path: '/mall/category', icon: 'Menu' },
  { name: '购物车', path: '/mall/cart', icon: 'ShoppingCart' },
  { name: '我的', path: '/mall/profile', icon: 'UserFilled' },
]

// 搜索事件
function handleSearch () {
  const trimmedKeyword = keyword.value.trim()
  if (!trimmedKeyword) return

  // 跳转到搜索页，传递关键词 q
  router.push({
    path: '/mall/category',
    query: { q: trimmedKeyword }
  })
}

// 监听路由变化：如果用户在搜索页直接修改 URL，输入框应同步关键词
watch(() => route.query.q, (newQ) => {
  if (newQ) keyword.value = newQ as string
}, { immediate: true })

// 用户下拉菜单命令处理
function handleUserCommand (command: string) {
  switch (command) {
    case 'logout':
      ElMessage.success('退出登录成功')
      userStore.logout()
      // 如果当前在个人中心等敏感页面，则跳转回商城首页
      if (route.path.startsWith('/mall/profile')) {
        router.push('/')
      } else {
        location.reload()
      }
      break
    case 'order':
      router.push('/mall/order')
      break
    case 'profile':
      router.push('/mall/profile')
      break
    case 'login':
      router.push('/mall/login')
      break
    case 'register':
      router.push('/mall/register')
      break
  }
}

onMounted(async () => {
  // 如果用户已登录，初始化购物车数据
  if (userStore.token) {
    try {
      const res: any = await mallCartApi.getCartList()
      if (res.code === 200) {
        // 将后端返回的列表同步到 store 中
        cartStore.setCartList(res.data)
      }
    } catch (error) {
      console.error('初始化购物车失败', error)
    }
  }
})
</script>

<template>
  <div class="mall-wrapper">
    <el-affix :offset="0">
      <nav class="nav-header">
      <div class="container nav-content flex-y-center">

        <div class="logo-wrapper mr-10 flex-center cursor-pointer group" @click="router.push('/')">
          <el-image :src="logo" class="h-auto w-40 object-contain" />
        </div>

        <div class="hidden md:flex flex-1 items-center gap-2 pc-menu">
          <router-link to="/mall/home" custom v-slot="{ navigate, isActive }">
            <div class="nav-item" :class="{ 'is-active': isActive }" @click="navigate">
              <span>首页</span>
            </div>
          </router-link>
          <router-link to="/mall/category" custom v-slot="{ navigate, isActive }">
            <div class="nav-item" :class="{ 'is-active': isActive }" @click="navigate">
              <span>全部分类</span>
            </div>
          </router-link>

          <div class="search-container ml-6">
            <el-input
              v-model="keyword"
              placeholder="搜索心仪商品..."
              class="search-input"
              clearable
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <el-icon class="text-gray-400"><Search /></el-icon>
              </template>
            </el-input>
          </div>
        </div>

        <div class="actions ml-auto flex-y-center gap-5">
          <div class="action-btn-wrapper" @click="router.push('/mall/cart')">
            <el-badge :value="cartCount" :hidden="cartCount === 0" :max="99" class="cart-badge" @click="router.push('/mall/cart')">
              <div class="icon-btn flex-center">
                <el-icon :size="20"><ShoppingCart /></el-icon>
              </div>
            </el-badge>
          </div>

          <el-dropdown trigger="click" placement="bottom-end" @command="handleUserCommand">
            <div class="user-profile-trigger flex-y-center gap-2 py-1 px-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer border border-transparent hover:border-gray-200">
              <el-avatar :size="28" :src="userStore.userAvatar ? userStore.userAvatar : defaultAvatarIcon" />
              <el-icon :size="12" class="text-gray-400"><CaretBottom /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu class="user-dropdown" v-if="userStore.username">
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>个人中心
                </el-dropdown-item>
                <el-dropdown-item command="order">
                  <el-icon><List /></el-icon>我的订单
                </el-dropdown-item>
                <el-dropdown-item divided command="logout" class="!text-red-500">
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
              <el-dropdown-menu class="user-dropdown" v-else>
                <el-dropdown-item command="login">
                  <el-icon><User /></el-icon>登录
                </el-dropdown-item>
                <el-dropdown-item command="register">
                  <el-icon><Edit /></el-icon>注册
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>

      </div>
    </nav>
    </el-affix>

    <main class="main-body bg-gray-50">
      <router-view v-slot="{ Component }">
        <transition name="fade-transform" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <footer class="footer bg-white border-t border-gray-100 py-10 pb-24 md:pb-10 text-center text-gray-500">
      <div class="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-left pl-10 md:pl-0">
        <div>
          <h4 class="font-bold text-gray-800 mb-4">关于我们</h4>
          <p class="text-sm">JoyFood Mall 是一个基于 Vue3 + Element Plus 构建的现代化响应式商城系统。</p>
        </div>
        <div>
          <h4 class="font-bold text-gray-800 mb-4">客户服务</h4>
          <ul class="text-sm space-y-2">
            <li><a href="#" class="hover:text-primary">帮助中心</a></li>
            <li><a href="#" class="hover:text-primary">售后政策</a></li>
          </ul>
        </div>
        <div>
          <h4 class="font-bold text-gray-800 mb-4">联系方式</h4>
          <p class="text-sm">Email: 884126389@qq.com</p>
        </div>
      </div>
      <el-divider />
      <p class="mt-4 text-sm">© 2026 JoyFood Mall - 响应式商城演示 by CarlReed</p>
    </footer>

    <div
      class="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 z-50 flex justify-around items-center h-[55px] pb-safe">
      <router-link
        v-for="tab in mobileTabs" :key="tab.path" :to="tab.path"
        class="flex flex-col items-center justify-center w-full h-full text-gray-400 no-underline"
        active-class="text-primary active-tab">
        <el-icon :size="22" class="mb-0.5">
          <component :is="tab.icon" />
        </el-icon>
        <span class="text-[10px] scale-90">{{ tab.name }}</span>
      </router-link>
    </div>
  </div>
</template>

<style scoped lang="scss">
.mall-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.nav-header {
  /* 磨砂玻璃效果 */
  @apply bg-white/80 backdrop-blur-md border-b border-gray-100 h-18 flex-y-center shadow-sm z-50;
}

.nav-item {
  @apply relative px-4 py-2 cursor-pointer text-gray-600 font-500 transition-all text-sm rounded-md hover:text-primary hover:bg-primary/5;

  &.is-active {
    @apply text-primary font-700 bg-primary/5;
    &::after {
      content: '';
      @apply absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary rounded-full;
    }
  }
}

.search-input {
  :deep(.el-input__wrapper) {
    @apply rounded-full bg-gray-100 shadow-none border-none px-4 transition-all w-48 focus-within:w-72;
    &.is-focus {
      @apply bg-white shadow-md ring-1 ring-primary/20;
    }
  }
}

.icon-btn {
  @apply w-10 h-10 rounded-full text-gray-600 hover:bg-gray-100 hover:text-primary transition-all cursor-pointer;
}

/* 购物车角标微调 */
:deep(.cart-badge) {
  /* 确保定位参考物是正确的 */
  display: inline-flex;

  .el-badge__content.is-fixed {
    transform: none !important;
    cursor: pointer;

    /* 精准定位 */
    top: 2px !important;
    right: 2px !important;

    border: none !important;
    background-color: var(--el-color-primary) !important;
    height: 16px !important;
    min-width: 16px;
    padding: 0 4px;
    line-height: 16px;
    font-size: 10px;
    border-radius: 8px;

    .el-badge__content.is-fixed {
    pointer-events: none;
    user-select: none;
    transform: translate(20%, -20%) !important;
    top: 0 !important;
    right: 0 !important;
    border: 1px solid #fff !important;
    background-color: var(--el-color-primary) !important;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  }
}

.cart-badge:hover .icon-btn {
  @apply bg-gray-100;
}

/* 下拉菜单图标间距 */
.user-dropdown .el-dropdown-menu__item .el-icon {
  margin-right: 8px;
}

.container {
  @apply max-w-1200px mx-auto px-4 w-full;
}

/* PC端导航链接样式 */
.nav-link {
  @apply text-gray-600 hover:text-primary cursor-pointer font-medium px-4 py-2 rounded-md transition-colors relative;

  /* 激活状态下方的横条 */
  &.active {
    @apply text-primary font-bold;

    &::after {
      content: '';
      @apply absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary rounded-full;
    }
  }
}

.main-body {
  /* 确保 footer 被挤到底部 */
  flex: 1;
  width: 100%;
}

/* 移动端底部安全区适配 (iPhone X 等) */
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom);
}

/* 路由切换动画 */
.fade-transform-leave-active,
.fade-transform-enter-active {
  transition: all 0.3s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(10px);
}

.text-primary {
  color: var(--el-color-primary);
}

.bg-primary {
  background-color: var(--el-color-primary);
}
</style>
