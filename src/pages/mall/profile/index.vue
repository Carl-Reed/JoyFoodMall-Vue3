<script setup lang="ts">
import { orderApi } from "@@/apis/mall/order"
import defaultAvatar from "@@/assets/images/user/default-mall-avatar.png"
import { ArrowRight, Box, ChatDotSquare, Collection, CreditCard, Location, Service, Setting, Van, Wallet } from "@element-plus/icons-vue"
import { markRaw, onMounted, ref } from "vue"
import { useRouter } from "vue-router"
import { useUserStore } from "@/pinia/stores/user"
import EditProfile from "./components/EditProfile.vue"

const editProfileRef = ref()

// 点击按钮时触发编辑弹窗的 open 方法
function handleEditProfile() {
  editProfileRef.value?.open()
}

interface MenuItem {
  name: string
  icon: any
  color: string
  value?: string
  path?: string
  isService?: boolean
}

interface MenuGroup {
  title: string
  items: MenuItem[]
}

const router = useRouter()
const userStore = useUserStore()

// 订单统计数据
const orderStats = ref({
  pendingPay: 0, // status: 0
  pendingDeliver: 0, // status: 1
  pendingReceive: 0, // status: 2
  pendingComment: 0 // 待评价
})

// 获取订单统计
async function fetchOrderStats() {
  try {
    const res: any = await orderApi.getOrderStats()
    if (res.code === 200 && res.data) {
      orderStats.value = {
        pendingPay: res.data.status0 || 0,
        pendingDeliver: res.data.status1 || 0,
        pendingReceive: res.data.status2 || 0,
        pendingComment: res.data.status3 || 0
      }
    }
  } catch (e) {
    console.error("获取订单统计失败:", e)
  }
}

// 功能菜单配置
const menuGroups = ref<MenuGroup[]>([
  {
    title: "我的资产",
    items: [
      { name: "账户余额", icon: markRaw(Wallet), color: "text-orange-500", value: "￥1280.00" },
      { name: "优惠券", icon: markRaw(Collection), color: "text-red-500", value: "12张" }
    ]
  },
  {
    title: "常用工具",
    items: [
      { name: "收货地址", icon: markRaw(Location), color: "text-blue-500", path: "/mall/address" },
      { name: "我的评价", icon: markRaw(ChatDotSquare), color: "text-green-500", path: "/mall/comments" },
      { name: "设置", icon: markRaw(Setting), color: "text-gray-500", path: "/mall/settings" },
      { name: "联系客服", icon: markRaw(Service), color: "text-indigo-500", isService: true }
    ]
  }
])

function handleNav(path?: string) {
  if (path) router.push(path)
}

onMounted(() => {
  fetchOrderStats()
})
</script>

<template>
  <div class="profile-page bg-gray-50 min-h-screen pb-20">
    <div class="bg-gradient-to-r from-blue-600 to-blue-500 pt-12 pb-24 px-4">
      <div class="container mx-auto max-w-4xl flex items-center gap-6">
        <el-avatar
          :size="80"
          :src="userStore.userAvatar || defaultAvatar"
          class="border-4 border-white/20 shadow-lg"
        />
        <div class="text-white">
          <h2 class="text-2xl font-bold">
            {{ userStore.username || '未登录用户' }}
          </h2>
          <p class="opacity-80 text-sm mt-1">
            普通会员
          </p>
        </div>
        <el-button
          link
          class="ml-auto !text-white opacity-80 hover:opacity-100"
          @click="handleEditProfile"
        >
          编辑资料 <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
    </div>

    <div class="container mx-auto max-w-4xl px-4 -mt-12">
      <div class="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <div class="flex justify-between items-center mb-6">
          <span class="text-lg font-bold text-gray-800">我的订单</span>
          <el-button link type="primary" @click="router.push('/mall/order')">
            查看全部订单 <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
        <div class="flex justify-around">
          <div class="order-item" @click="router.push('/mall/order?status=0')">
            <el-badge :value="orderStats.pendingPay" :hidden="orderStats.pendingPay === 0" :max="99">
              <el-icon :size="28" class="text-orange-500">
                <CreditCard />
              </el-icon>
            </el-badge>
            <span>待付款</span>
          </div>

          <div class="order-item" @click="router.push('/mall/order?status=1')">
            <el-badge :value="orderStats.pendingDeliver" :hidden="orderStats.pendingDeliver === 0" :max="99">
              <el-icon :size="28" class="text-blue-500">
                <Box />
              </el-icon>
            </el-badge>
            <span>待发货</span>
          </div>

          <div class="order-item" @click="router.push('/mall/order?status=2')">
            <el-badge :value="orderStats.pendingReceive" :hidden="orderStats.pendingReceive === 0" :max="99">
              <el-icon :size="28" class="text-indigo-500">
                <Van />
              </el-icon>
            </el-badge>
            <span>待收货</span>
          </div>

          <div class="order-item" @click="router.push('/mall/order?status=3')">
            <el-badge :value="orderStats.pendingComment" :hidden="orderStats.pendingComment === 0" :max="99">
              <el-icon :size="28" class="text-green-500">
                <ChatDotSquare />
              </el-icon>
            </el-badge>
            <span>待评价</span>
          </div>
        </div>
      </div>

      <div v-for="group in menuGroups" :key="group.title" class="mb-6">
        <h3 class="text-sm font-bold text-gray-400 mb-3 px-2">
          {{ group.title }}
        </h3>
        <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div
            v-for="item in group.items" :key="item.name"
            class="flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b last:border-0 border-gray-50 transition-colors"
            @click="handleNav(item.path)"
          >
            <div class="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 mr-4">
              <el-icon :size="20" :class="item.color">
                <component :is="item.icon" />
              </el-icon>
            </div>
            <span class="flex-1 font-medium text-gray-700">{{ item.name }}</span>
            <span v-if="item.value" class="text-sm text-gray-400 mr-2">{{ item.value }}</span>
            <el-icon class="text-gray-300">
              <ArrowRight />
            </el-icon>
          </div>
        </div>
      </div>

      <el-button
        type="danger"
        plain
        class="w-full !h-12 !rounded-xl !border-none bg-white shadow-sm font-bold"
        @click="userStore.logout(); router.push('/')"
      >
        退出登录
      </el-button>
    </div>

    <EditProfile ref="editProfileRef" />
  </div>
</template>

<style scoped>
.order-item {
  @apply flex flex-col items-center gap-2 cursor-pointer transition-transform active:scale-95;
}
.order-item span {
  @apply text-xs text-gray-600 font-medium;
}
.order-item .el-icon {
  @apply text-gray-700;
}
:deep(.el-badge__content) {
  @apply bg-red-500 border-none;
}
</style>
