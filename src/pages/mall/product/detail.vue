<script setup lang="ts">
import { mallProductApi } from "@@/apis/mall/product"
import { getFullUrl } from "@@/apis/request"
import { ArrowRight } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import { useRoute, useRouter } from "vue-router"
import { mallCartApi } from "@/common/apis/mall/cart"
import { useCartStore } from "@/pinia/stores/cart"
import { useUserStore } from "@/pinia/stores/user"

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const cartStore = useCartStore()

const loading = ref(true)
const productId = route.params.id as string

// 响应式数据
const product = ref<any>(null)
const activeImage = ref("")
const currentSku = ref<any>(null)
const quantity = ref(1)

// 控制 Tabs 默认选中 "detail"
const activeTab = ref("detail")

async function handleAddToCart() {
  console.log(currentSku.value)
  // 登录校验
  if (!userStore.token) {
    ElMessage.warning("请先登录后再操作")
    router.push("/mall/login")
    return
  }

  // 规格校验
  if (!currentSku.value) {
    ElMessage.warning("请选择商品规格")
    return
  }

  // 库存校验
  if (quantity.value > currentSku.value.stock) {
    ElMessage.error("库存不足")
    return
  }

  try {
    // 完善数据对象
    const submitData = {
      productId: product.value.id,
      productSkuId: currentSku.value.id,
      quantity: quantity.value,
      price: currentSku.value.promotionPrice || currentSku.value.price,
      productPic: currentSku.value.pic || product.value.pic,
      productName: product.value.productName,
      productAttr: currentSku.value.spData
    }

    // 调用后端接口
    await mallCartApi.addCart(submitData)

    // 本地Store同步 (用于即时更新购物车预览)
    const cartItemForStore = {
      ...submitData,
      id: Date.now(),
      checked: true,
      specName: currentSku.value.specName
    }

    // 检查本地 Store 是否已存在同 SKU 商品
    const existingItem = cartStore.cartList.find(item => item.productSkuId === submitData.productSkuId)
    if (existingItem) {
      existingItem.quantity += submitData.quantity
    } else {
      cartStore.cartList.push(cartItemForStore)
    }

    // 交互反馈
    ElNotification({
      title: "已加入购物车",
      message: `${submitData.productName} 数量：${submitData.quantity}`,
      type: "success",
      position: "bottom-right"
    })
  } catch (error) {
    console.error("购物车操作失败:", error)
    ElMessage.error("加入购物车失败，请稍后再试")
  }
}

// 立即购买方法
function handleBuyNow() {
  // 登录校验
  if (!userStore.token) {
    ElMessage.warning("请先登录后再操作")
    router.push("/mall/login")
    return
  }

  // 规格校验
  if (!currentSku.value) {
    ElMessage.warning("请选择商品规格")
    return
  }

  // 库存校验
  if (quantity.value > currentSku.value.stock) {
    ElMessage.error("库存不足")
    return
  }

  // 带参数跳转到结算页
  router.push({
    path: "/mall/checkout",
    query: {
      id: product.value.id,
      skuId: currentSku.value.id,
      num: quantity.value,
      source: "buyNow"
    }
  })
}

// 初始化数据
async function initData() {
  try {
    loading.value = true
    const res = await mallProductApi.getProductDetail(productId)
    if (res.code === 200) {
      const data = res.data

      // 解析相册并去重
      let albumArray: string[] = []
      try {
        albumArray = JSON.parse(data.albumPics || "[]")
        // 如果相册第一张图和主图一样，剔除相册第一张
        if (albumArray.length > 0 && albumArray[0] === data.pic) {
          albumArray.shift()
        }
      } catch {
        albumArray = []
      }

      product.value = {
        ...data,
        album: albumArray.map(getFullUrl),
        mainImage: getFullUrl(data.pic)
      }

      // 默认选中第一个 SKU
      if (data.skuList && data.skuList.length > 0) {
        selectSku(data.skuList[0])
      } else {
        activeImage.value = getFullUrl(data.pic)
      }
    }
  } catch {
    ElMessage.error("获取商品详情失败")
  } finally {
    loading.value = false
  }
}

function selectSku(sku: any) {
  currentSku.value = sku
  activeImage.value = sku.pic ? getFullUrl(sku.pic) : getFullUrl(product.value.pic)
}

function parseSpData(spDataStr: string) {
  try {
    return JSON.parse(spDataStr)
  } catch {
    return []
  }
}

onMounted(() => {
  initData()
})
</script>

<template>
  <div class="product-detail bg-gray-50 min-h-screen pb-12">
    <div class="container mx-auto px-4 py-4">
      <el-breadcrumb :separator-icon="ArrowRight">
        <el-breadcrumb-item :to="{ path: '/mall/home' }">
          首页
        </el-breadcrumb-item>
        <el-breadcrumb-item>商品详情</el-breadcrumb-item>
        <el-breadcrumb-item v-if="product">
          {{ product.productName }}
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div v-if="loading" class="container mx-auto px-4">
      <el-skeleton :rows="10" animated />
    </div>

    <div v-else-if="product" class="container mx-auto px-4">
      <div class="bg-white rounded-xl shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-8 p-6">
        <div class="md:col-span-5 flex flex-col gap-4">
          <div class="aspect-square rounded-lg overflow-hidden border border-gray-100">
            <el-image
              :src="activeImage"
              :preview-src-list="[getFullUrl(product.pic), ...product.album]"
              fit="cover"
              class="w-full h-full cursor-zoom-in"
            />
          </div>
          <div class="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
            <div
              class="w-16 h-16 rounded-md border-2 flex-shrink-0 cursor-pointer overflow-hidden"
              :class="activeImage === getFullUrl(product.pic) ? 'border-blue-500' : 'border-transparent'"
              @mouseenter="activeImage = getFullUrl(product.pic)"
            >
              <img :src="getFullUrl(product.pic)" class="w-full h-full object-cover">
            </div>
            <div
              v-for="(img, index) in product.album" :key="index"
              class="w-16 h-16 rounded-md border-2 flex-shrink-0 cursor-pointer overflow-hidden"
              :class="activeImage === img ? 'border-blue-500' : 'border-transparent'"
              @mouseenter="activeImage = img"
            >
              <img :src="img" class="w-full h-full object-cover">
            </div>
          </div>
        </div>

        <div class="md:col-span-7 flex flex-col">
          <h1 class="text-2xl font-bold text-gray-800">
            {{ product.productName }}
          </h1>

          <div class="mt-6 p-4 bg-orange-50 rounded-lg">
            <div class="flex items-baseline gap-2">
              <span class="text-red-500 text-3xl font-bold">￥{{ currentSku?.promotionPrice || currentSku?.price }}</span>
              <span v-if="currentSku?.promotionPrice" class="text-gray-400 line-through text-sm">￥{{ currentSku?.price }}</span>
              <span class="text-gray-500 text-xs ml-1">/ {{ product.unit }}</span>
            </div>
          </div>

          <div class="mt-8 space-y-6">
            <div v-if="product.skuList?.length">
              <div class="text-sm font-medium text-gray-700 mb-3">
                规格选择
              </div>
              <div class="flex flex-wrap gap-3">
                <button
                  v-for="sku in product.skuList" :key="sku.id"
                  @click="selectSku(sku)"
                  class="px-4 py-2 rounded-md border text-sm transition-all"
                  :class="currentSku?.id === sku.id ? 'border-blue-500 bg-blue-50 text-blue-600 font-bold' : 'border-gray-200'"
                >
                  {{ sku.specName }}
                </button>
              </div>
            </div>

            <div v-if="currentSku" class="p-3 bg-gray-50 rounded-lg text-xs grid grid-cols-2 gap-2 border border-gray-100">
              <div v-for="item in parseSpData(currentSku.spData)" :key="item.key">
                <span class="text-gray-400">{{ item.key }}:</span>
                <span class="text-gray-700 ml-1">{{ item.value }}</span>
              </div>
            </div>

            <div class="flex items-center gap-4">
              <span class="text-sm font-medium text-gray-700">数量</span>
              <el-input-number v-model="quantity" :min="1" :max="currentSku?.stock || 1" />
              <span class="text-xs text-gray-400">库存: {{ (currentSku?.stock - currentSku?.lockStock) || 0 }}</span>
            </div>
          </div>

          <div class="mt-12 flex gap-4">
            <el-button type="primary" size="large" class="flex-1 !h-12" @click="handleAddToCart">
              加入购物车
            </el-button>
            <el-button type="danger" plain size="large" class="flex-1 !h-12" @click="handleBuyNow">
              立即购买
            </el-button>
          </div>
        </div>
      </div>

      <div class="mt-8 bg-white rounded-xl shadow-sm p-6">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="商品详情" name="detail">
            <div class="py-6 detail-content">
              <div v-if="product.description" v-html="product.description" />
              <el-empty v-else description="暂无详细介绍" />
            </div>
          </el-tab-pane>
          <el-tab-pane label="规格参数" name="params">
            <div class="py-6">
              <el-descriptions :column="1" border>
                <el-descriptions-item label="商品名称">
                  {{ product.productName }}
                </el-descriptions-item>
                <el-descriptions-item label="计量单位">
                  {{ product.unit }}
                </el-descriptions-item>
                <el-descriptions-item label="分类编号">
                  {{ product.categoryId }}
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  height: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 2px;
}

:deep(.detail-content img) {
  max-width: 100% !important;
  height: auto !important;
  display: block;
  margin: 0 auto;
}
:deep(.el-tabs__item) {
  font-size: 16px;
  padding: 0 30px;
}
</style>
