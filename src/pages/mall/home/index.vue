<script setup lang="ts">
import { mallProductApi } from "@@/apis/mall/product"
import { getFullUrl } from "@@/apis/request"
import defaultAvatarIcon from "@@/assets/images/user/default-mall-avatar.png"
import { Right } from "@element-plus/icons-vue"
import { computed, onMounted, ref } from "vue"
import { useRouter } from "vue-router"
import { useCategoryStore } from "@/pinia/stores/category"
import { useUserStore } from "@/pinia/stores/user"
import { bannerApi } from "./apis"

const router = useRouter()
const userStore = useUserStore()
const categoryStore = useCategoryStore()
const loading = ref(true)
const loadingMore = ref(false)
const noMore = ref(false)

// 获取分类树
const displayCategories = computed(() => {
  const root = categoryStore.categoryTree[0]
  return root ? root.children : []
})

const pageParams = ref({
  page: 1,
  limit: 10
})

// === 数据定义 ===

// 轮播图数据
const bannerList = ref<any[]>([])
// 分类数据
const categoryList = ref<any[]>([])
// 金刚区导航
const navList = ref<any[]>([])
// 新品列表数据
const newList = ref<any[]>([])
// 今日推荐数据
const todayList = ref<any[]>([])
// 推荐商品
const recommendList = ref<any[]>([])

// 金刚区点击跳转
function handleNavClick(nav: any) {
  if (nav.name === "更多") {
    router.push("/mall/category")
  } else {
    router.push(`/mall/category?categoryId=${nav.id}`)
  }
}

// 加载更多商品
async function loadMore() {
  loadingMore.value = true
  await loadMoreGoods()
  loadingMore.value = false
}

async function loadMoreGoods() {
  if (noMore.value) return

  try {
    const res = await mallProductApi.getProductList({
      page: pageParams.value.page,
      limit: pageParams.value.limit
    })

    if (res.code === 200) {
      const records = res.data.records

      // 映射后端数据到前端 UI 结构
      const formattedGoods = records.map((item: any) => ({
        id: item.id,
        name: item.productName,
        price: item.price,
        sales: item.salesShow || 0,
        tags: [
          item.isNew ? "新品" : "",
          item.isRecommend ? "今日推荐" : ""
        ].filter(Boolean),
        img: getFullUrl(item.pic)
      }))

      // 追加数据
      recommendList.value.push(...formattedGoods)

      // 判断是否还有更多
      if (records.length < pageParams.value.limit) {
        noMore.value = true
      } else {
        pageParams.value.page++
      }
    }
  } catch (error) {
    console.error("加载更多商品失败:", error)
  }
}

async function initData() {
  loading.value = true
  // 使用 Promise.all 并行请求，提高效率
  try {
    const [newRes, todayRes, bannerRes] = await Promise.all([
      mallProductApi.getNewList(),
      mallProductApi.getTodayRecommend(),
      bannerApi.getBannerList(5)
    ])

    // 处理新品数据
    if (newRes.code === 200) {
      newList.value = newRes.data.map((item: any) => ({
        id: item.id,
        name: item.productName,
        subtitle: "官方严选",
        price: item.price,
        img: getFullUrl(item.pic)
      }))
    }

    // 处理今日推荐数据
    if (todayRes.code === 200) {
      todayList.value = todayRes.data.map((item: any) => ({
        id: item.id,
        name: item.productName,
        desc: "精选好物 官方严选",
        price: item.price,
        img: getFullUrl(item.pic)
      }))
    }

    // 处理Banner数据
    if (bannerRes.code === 200) {
      bannerList.value = bannerRes.data.map((item: any) => ({
        id: item.id,
        imgUrl: getFullUrl(item.pic),
        jumpUrl: item.url,
        title: item.title
      }))
    }
    // 初始化金刚区
    navList.value = [
      { id: 4, name: "生鲜果蔬", icon: "🍎" },
      { id: 3, name: "粮油调味", icon: "🌾" },
      { id: 1, name: "休闲零食", icon: "🍪" },
      { id: 5, name: "乳品烘焙", icon: "🥛" },
      { id: 6, name: "方便速食", icon: "🍜" },
      { id: 7, name: "滋补养生", icon: "🍵" },
      { id: 8, name: "环球美食", icon: "🌍" },
      { id: 9, name: "有机健康", icon: "🥦" },
      { id: 2, name: "饮料饮品", icon: "🥤" },
      { id: -1, name: "更多", icon: "📦" }
    ]
    loadMoreGoods()
  } catch (error) {
    console.error("获取新品数据失败:", error)
  }
  // 初始化分类
  categoryList.value = Array.from({ length: 12 }).map((_, i) => ({ id: i, name: `热门分类 ${i + 1}` }))
}

// 点击轮播图跳转逻辑
function handleBannerClick(item: any) {
  if (item.jumpUrl) {
    // 如果是外部链接直接跳转，如果是内部路径用 router.push
    if (item.jumpUrl.startsWith("http")) {
      window.open(item.jumpUrl, "_blank")
    } else {
      router.push(item.jumpUrl)
    }
  }
}

onMounted(async () => {
  // 加载分类数据
  await categoryStore.loadCategoryTree()
  // 模拟网络延迟 1秒，展示骨架屏效果
  setTimeout(() => {
    initData()
    loading.value = false
  }, 800)
})
</script>

<template>
  <div class="mall-home bg-gray-50 min-h-screen pb-10">
    <div v-if="loading" class="container mx-auto px-4 py-4">
      <el-skeleton :rows="10" animated />
    </div>

    <div v-else class="container mx-auto px-2 md:px-4 transition-opacity duration-500">
      <div class="grid grid-cols-1 md:grid-cols-12 gap-4 my-4">
        <div class="hidden md:block md:col-span-2 bg-white rounded-lg shadow-sm h-[400px] p-2 overflow-y-auto custom-scrollbar">
          <div v-if="categoryStore.loading" class="p-4 space-y-4">
            <el-skeleton :rows="8" animated />
          </div>

          <div v-else class="h-full overflow-y-auto custom-scrollbar">
            <div
              v-for="item in displayCategories"
              :key="item.categoryId"
              class="category-row flex items-center justify-between px-4 py-2.8 hover:bg-orange-50 cursor-pointer transition-colors group"
              @click="router.push(`/mall/category?categoryId=${item.categoryId}`)"
            >
              <span class="text-sm text-gray-700 group-hover:text-primary group-hover:font-bold">
                {{ item.categoryName }}
              </span>
              <el-icon class="text-gray-300 group-hover:text-primary">
                <ArrowRight />
              </el-icon>

              <div
                v-if="item.children && item.children.length > 0"
                class="hidden group-hover:flex absolute left-[100%] top-0 w-[400px] min-h-[400px] bg-white shadow-xl z-50 border-l border-gray-100 p-4 animate-fade-in"
              >
                <div class="grid grid-cols-2 gap-4">
                  <div
                    v-for="sub in item.children" :key="sub.categoryId"
                    class="text-sm text-gray-600 hover:text-primary cursor-pointer"
                    @click="router.push(`/mall/category?categoryId=${sub.categoryId}`)"
                  >
                    {{ sub.categoryName }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-span-1 md:col-span-8 overflow-hidden rounded-lg shadow-sm bg-white relative">
          <el-carousel trigger="click" height="400px" class="banner-carousel">
            <el-carousel-item v-for="item in bannerList" :key="item.id">
              <el-image
                :src="item.imgUrl" :alt="item.title" fit="fill" class="w-full h-full cursor-pointer"
                @click="handleBannerClick(item)"
              >
                <template #placeholder>
                  <div class="w-full h-full bg-gray-100 flex items-center justify-center">
                    <el-icon class="is-loading">
                      <Loading />
                    </el-icon>
                  </div>
                </template>
              </el-image>
            </el-carousel-item>
          </el-carousel>
        </div>

        <div class="hidden md:flex md:col-span-2 flex-col gap-4">
          <div class="bg-white rounded-lg shadow-sm p-4 flex-1 flex flex-col items-center justify-center">
            <el-avatar :size="60" :src="userStore.userAvatar ? userStore.userAvatar : defaultAvatarIcon" />
            <div class="mt-2 font-bold text-gray-700 text-center line-height-5">
              {{ userStore.username ? userStore.username : '用户' }}<br>欢迎光临
            </div>
            <div class="mt-4 flex gap-2" v-if="!userStore.username">
              <el-button type="primary" round size="small" @click="router.push(`/mall/login`)">
                登录
              </el-button>
              <el-button round size="small" @click="router.push(`/mall/register`)">
                注册
              </el-button>
            </div>
          </div>
          <div class="bg-white rounded-lg shadow-sm p-4 h-1/2">
            <div class="font-bold mb-2 text-sm">
              商城快报
            </div>
            <div class="text-xs text-gray-500 space-y-2">
              <p class="truncate cursor-pointer hover:text-primary">
                🔥 618大促预告：全场5折起
              </p>
              <p class="truncate cursor-pointer hover:text-primary">
                📢 物流配送延迟通知
              </p>
              <p class="truncate cursor-pointer hover:text-primary">
                ✨ 新用户注册领100元券
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div class="grid grid-cols-5 md:grid-cols-10 gap-4">
          <div v-for="nav in navList" :key="nav.id" class="flex flex-col items-center cursor-pointer hover:opacity-80" @click="handleNavClick(nav)">
            <div class="w-10 h-10 md:w-12 md:h-12 rounded-full bg-orange-50 flex items-center justify-center text-xl mb-2">
              {{ nav.icon }}
            </div>
            <span class="text-xs text-gray-600">{{ nav.name }}</span>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div class="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
          <div class="w-1 h-6 bg-blue-500 rounded-r-full" />
          <h3 class="text-lg font-bold text-gray-800">
            📅 今日推荐
          </h3>
          <span class="text-xs text-gray-400 ml-auto">精选好物 官方严选</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <router-link
            v-for="item in todayList" :key="item.id"
            class="bg-gray-50 rounded-lg p-3 flex gap-3 cursor-pointer hover:bg-gray-100 transition-colors group"
            :to="`/mall/product/${item.id}`"
          >
            <div class="w-24 h-24 flex-shrink-0 bg-white rounded overflow-hidden">
              <el-image
                :src="item.img" fit="cover"
                class="w-full h-full group-hover:scale-110 transition-transform duration-300"
              >
                <template #error>
                  <div class="flex items-center justify-center w-full h-full bg-gray-100">
                    <el-icon class="text-gray-300">
                      <Picture />
                    </el-icon>
                  </div>
                </template>
              </el-image>
            </div>
            <div class="flex flex-col justify-between flex-1 py-1">
              <div>
                <div class="text-sm font-bold text-gray-800 line-clamp-1">
                  {{ item.name }}
                </div>
                <div class="text-xs text-gray-500 mt-1 line-clamp-2">
                  {{ item.desc }}
                </div>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-red-500 font-bold">￥{{ item.price }}</span>
                <div
                  class="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs group-hover:bg-blue-500 group-hover:text-white transition-colors"
                >
                  <el-icon>
                    <Right />
                  </el-icon>
                </div>
              </div>
            </div>
          </router-link>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div class="flex justify-between items-end mb-4 border-b border-gray-100 pb-3">
          <div class="flex items-center gap-2">
            <div class="w-1 h-6 bg-emerald-500 rounded-r-full" />
            <h3 class="text-lg font-bold text-gray-800">
              🌱 新品首发
            </h3>
            <span class="hidden md:inline-block text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              每日 10:00 上新
            </span>
          </div>
          <span class="text-xs text-gray-400 cursor-pointer flex items-center hover:text-primary transition-colors" @click="router.push('/mall/category?sort=1')">
            浏览全部 <el-icon class="ml-0.5"><Right /></el-icon>
          </span>
        </div>

        <div class="flex overflow-x-auto gap-4 pb-4 custom-x-scrollbar">
          <router-link
            v-for="item in newList" :key="item.id"
            class="flex-shrink-0 w-32 md:w-44 group cursor-pointer"
            :to="`/mall/product/${item.id}`"
          >
            <div class="relative w-full aspect-[1/1] bg-gray-50 rounded-lg overflow-hidden mb-3 border border-gray-100">
              <el-image :src="item.img" loading="lazy" fit="cover" class="w-full h-full group-hover:scale-105 transition-transform duration-500" />
              <div class="absolute top-0 left-0 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-br-lg shadow-sm z-10">
                NEW
              </div>
              <div class="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                <div class="w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm text-emerald-600 hover:bg-emerald-500 hover:text-white">
                  <el-icon><Right /></el-icon>
                </div>
              </div>
            </div>

            <div class="space-y-1">
              <div class="text-sm font-medium text-gray-800 truncate">
                {{ item.name }}
              </div>
              <div class="text-xs text-gray-400 truncate">
                {{ item.subtitle }}
              </div>
              <div class="flex items-center justify-between mt-1">
                <span class="font-bold text-gray-900">￥{{ item.price }}</span>
                <span class="text-[10px] text-emerald-600 bg-emerald-50 px-1 rounded">新品</span>
              </div>
            </div>
          </router-link>
        </div>
      </div>

      <h3 class="text-xl font-bold text-center my-6 flex items-center justify-center gap-2">
        <el-icon class="text-primary">
          <StarFilled />
        </el-icon> 猜你喜欢
      </h3>

      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-5">
        <router-link
          v-for="product in recommendList" :key="product.id"
          class="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 group cursor-pointer"
          :to="`/mall/product/${product.id}`"
        >
          <div class="w-full aspect-square bg-gray-100 overflow-hidden relative">
            <el-image :src="product.img" loading="lazy" fit="cover" class="w-full h-full" />

            <div
              class="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0"
            >
              <div
                class="w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm text-blue-600 hover:bg-blue-500 hover:text-white"
              >
                <el-icon>
                  <Right />
                </el-icon>
              </div>
            </div>
          </div>

          <div class="p-3">
            <h4 class="text-sm text-gray-800 line-clamp-2 h-10 mb-2">
              {{ product.name }}
            </h4>
            <div class="flex justify-between items-end">
              <div>
                <span class="text-xs text-red-500 font-bold">￥</span>
                <span class="text-lg text-red-500 font-bold">{{ product.price }}</span>
              </div>
              <span class="text-[10px] text-gray-400">{{ product.sales }}人付款</span>
            </div>
            <div class="mt-2 flex gap-1 h-5">
              <span
                v-for="tag in product.tags" :key="tag"
                class="text-[10px] px-1 py-0.5 border border-red-200 text-red-500 rounded"
              >
                {{ tag }}
              </span>
            </div>
          </div>
        </router-link>
      </div>

      <div class="text-center py-8 text-gray-400 text-sm">
        <el-divider v-if="noMore">
          没有更多了
        </el-divider>
        <el-button v-else :loading="loadingMore" round @click="loadMore">
          加载更多
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 自定义滚动条样式，用于横向滚动区 */

/* 自定义横向滚动条 (New Arrivals) */
.custom-x-scrollbar {
  /* 确保 overflow 开启 */
  overflow-x: auto;
  /* 平滑滚动 */
  scroll-behavior: smooth;
}

/* 侧边栏滚动条美化 */
/* Webkit 浏览器 (Chrome, Safari, Edge) 滚动条样式 */
.custom-x-scrollbar::-webkit-scrollbar {
  height: 6px; /* 横向滚动条的高度 */
}

.custom-x-scrollbar::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.custom-x-scrollbar::-webkit-scrollbar-thumb {
  background: #d1d5db; /* gray-300 */
  border-radius: 3px;
  cursor: pointer;
}

.custom-x-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #9ca3af; /* gray-400 */
}

/* 之前定义的侧边栏竖向滚动条 (保持不变) */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #eee;
  border-radius: 4px;
}

/* 响应式调整轮播图高度 */
:deep(.el-carousel__container) {
  /* 移动端高度小一点 */
  height: 200px !important;

  @media (min-width: 768px) {
    /* PC端恢复 400px */
    height: 400px !important;
  }
}

/* 强制修复切换按钮位置，防止漂移 */
:deep(.el-carousel__arrow--right) {
  right: 12px !important; /* 强制按钮离右侧边缘 12px */
}
:deep(.el-carousel__arrow--left) {
  left: 12px !important;
}

/* 优化指示点（底部横条）位置 */
:deep(.el-carousel__indicators--horizontal) {
  bottom: 10px;
}

/* 文本截断优化 */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}
</style>
