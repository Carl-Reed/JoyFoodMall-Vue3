<script setup lang="ts">
import { mallAddressApi } from '@@/apis/mall/address'
import { orderApi } from '@@/apis/mall/order'
import { mallProductApi } from '@@/apis/mall/product'
import { getFullUrl } from "@@/apis/request"
import { ArrowRight, Check, Location, Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useCartStore } from '@/pinia/stores/cart'

const router = useRouter()
const cartStore = useCartStore()
const route = useRoute()

const loading = ref(false)
const orderNote = ref('')

// 判断是购物车结算还是立即购买
const isBuyNow = computed(() => !!route.query.skuId)
const buyNowProduct = ref<any>(null) // 存放立即购买的临时商品数据

// --- 地址逻辑 ---
const addressList = ref<any[]>([])
const selectedAddressId = ref<number | string | null>(null)


function handleSelectAddress(id: number | string) {
  selectedAddressId.value = Number(id)
}


// 获取真实地址列表
async function fetchAddressList() {
  try {
    const res: any = await mallAddressApi.getAddressList()
    addressList.value = res.data || []
    // 自动选中默认地址，如果没有默认地址则选中第一个
    if (addressList.value.length > 0) {
      const defaultAddr = addressList.value.find(a => a.defaultStatus === 1)
      selectedAddressId.value = defaultAddr ? defaultAddr.id : addressList.value[0].id
    }
  } catch {
    ElMessage.error('获取地址失败')
  }
}

const selectedAddress = computed(() => {
  if (!selectedAddressId.value) return null
  return addressList.value.find(a => a.id === selectedAddressId.value)
})

// 统一清单数据源：如果是立即购买则取单品，否则取购物车勾选项
const displayItemList = computed(() => {
  if (isBuyNow.value) {
    return buyNowProduct.value ? [buyNowProduct.value] : []
  }
  return cartStore.selectedList
})

// --- 费用计算 ---
const totalPrice = computed(() => {
  if (isBuyNow.value) {
    return buyNowProduct.value ? (buyNowProduct.value.price * buyNowProduct.value.quantity) : 0
  }
  return cartStore.totalPrice
})
const shippingFee = computed(() => (totalPrice.value > 99 ? 0 : 10))
const finalAmount = computed(() => (Number(totalPrice.value) + shippingFee.value).toFixed(2))


// --- 初始化立即购买数据 ---
async function initBuyNowData() {
  const { skuId, num } = route.query
  if (!skuId) return

  try {
    loading.value = true
    const res: any = await mallProductApi.getProductDetailBySku(skuId as string)
    if (res.code === 200) {
      const data = res.data
      buyNowProduct.value = {
        id: Date.now(),
        productId: data.productId,
        productSkuId: data.id,
        productName: data.skuName,
        productPic: data.pic,
        price: data.promotionPrice || data.price,
        quantity: Number(num) || 1,
        spData: data.spData
      }
    }
  } catch {
    ElMessage.error('获取购买商品信息失败')
    router.back()
  } finally {
    loading.value = false
  }
}

// --- 提交订单 ---
async function handleCreateOrder() {
  if (!selectedAddress.value) return ElMessage.warning('请选择收货地址')

  try {
    loading.value = true

    // 构造后端 oms_order 所需的数据结构
    const orderData = {
      memberReceiveAddressId: selectedAddress.value.id,
      receiverName: selectedAddress.value.name,
      receiverPhone: selectedAddress.value.phoneNumber,
      receiverProvince: selectedAddress.value.province,
      receiverCity: selectedAddress.value.city,
      receiverRegion: selectedAddress.value.region,
      receiverDetailAddress: selectedAddress.value.detailAddress,
      note: orderNote.value,
      freightAmount: shippingFee.value,
      itemList: displayItemList.value.map(item => ({
        productSkuId: item.productSkuId,
        quantity: item.quantity
    }))
    }

    const res: any = await orderApi.createOrder(orderData)

    if (res.code === 200) {
      ElMessage.success('订单已创建')
      // 成功后清除购物车中已购买的商品
      if (!isBuyNow.value) {
        cartStore.clearCart()
      }
      // 跳转到我的订单
      router.push({ path: '/mall/order?status=1', query: { sn: res.data.orderSn || res.data } })
    }
  } catch {
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchAddressList()
  if (isBuyNow.value) {
    initBuyNowData()
  } else {
    // 购物车模式校验
    if (cartStore.selectedList.length === 0) {
      ElMessage.warning('请先选择要结算的商品')
      router.replace('/mall/cart')
    }
  }
})
</script>

<template>
  <div class="checkout-page bg-gray-50 min-h-screen py-8">
    <div class="container mx-auto px-4 max-w-4xl">
      <el-breadcrumb :separator-icon="ArrowRight" class="mb-6">
        <el-breadcrumb-item to="/mall/cart">购物车</el-breadcrumb-item>
        <el-breadcrumb-item>填写订单</el-breadcrumb-item>
      </el-breadcrumb>

      <div class="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-bold flex items-center gap-2">
            <el-icon class="text-primary"><Location /></el-icon> 收货地址
          </h3>
          <el-button link type="primary" :icon="Plus" @click="router.push('/mall/address')">管理地址</el-button>
        </div>

        <div v-if="addressList.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="addr in addressList"
            :key="addr.id"
            @click="handleSelectAddress(addr.id)"
            class="address-card border-2 rounded-lg p-4 cursor-pointer transition-all relative overflow-hidden"
            :class="{ 'is-active': Number(selectedAddressId) === Number(addr.id) }"
          >
            <div
              v-if="Number(selectedAddressId) === Number(addr.id)"
              class="active-badge"
            >
              <el-icon :size="12"><Check /></el-icon>
            </div>

            <div class="flex justify-between mb-2">
              <span class="font-bold text-gray-800">{{ addr.name }}</span>
              <span class="text-gray-500 text-sm">{{ addr.phoneNumber }}</span>
            </div>
            <p class="text-xs text-gray-600 line-clamp-2 leading-relaxed pr-4">
              {{ addr.province }} {{ addr.city }} {{ addr.region }} {{ addr.detailAddress }}
            </p>

            <div
              v-if="addr.defaultStatus === 1"
              class="absolute top-0 right-0 bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-bl-lg font-bold"
            >默认</div>
          </div>
        </div>

        <div v-else class="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
          <p class="text-gray-400 mb-3">还没有收货地址</p>
          <el-button type="primary" plain @click="router.push('/mall/address')">去添加地址</el-button>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h3 class="text-lg font-bold mb-4">商品清单</h3>
        <div class="divide-y divide-gray-100">
          <div v-for="item in displayItemList" :key="item.productSkuId" class="py-4 flex gap-4">
            <el-image :src="getFullUrl(item.productPic)" class="w-20 h-20 rounded-lg flex-shrink-0" fit="cover" />
            <div class="flex-1">
              <h4 class="font-medium text-gray-800">{{ item.productName }}</h4>
              <p class="text-xs text-gray-400 mt-1">
                {{item.spData ? JSON.parse(item.spData).map((s: any) => s.value).join(' / ') : '默认规格'}}
              </p>
              <div class="flex justify-between mt-2">
                <span class="text-gray-600">￥{{ item.price }} x {{ item.quantity }}</span>
                <span class="font-bold text-gray-800">￥{{ (item.price * item.quantity).toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="mt-4 pt-4 border-t border-dashed">
          <el-input
            v-model="orderNote"
            type="textarea"
            placeholder="订单备注：选填，可以告诉卖家您的特殊需求"
            :rows="2"
            maxlength="100"
            show-word-limit
          />
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-6">
        <div class="space-y-3 text-sm text-gray-600 mb-6">
          <div class="flex justify-between">
            <span>商品总额</span>
            <span>￥{{ totalPrice }}</span>
          </div>
          <div class="flex justify-between">
            <span>运费合计</span>
            <span>￥{{ shippingFee }}</span>
          </div>
          <el-divider />
          <div class="flex justify-between items-center">
            <span class="text-lg font-bold text-gray-800">应付总额</span>
            <span class="text-3xl font-bold text-red-500">￥{{ finalAmount }}</span>
          </div>
        </div>
        <el-button
          type="primary"
          size="large"
          class="w-full !h-14 text-xl font-bold !rounded-xl"
          :loading="loading"
          @click="handleCreateOrder"
        >
          提交订单
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 基础颜色变量补丁 */
.text-primary { color: #409eff; }
.bg-primary { background-color: #409eff; }

/* 地址卡片基础样式 */
.address-card {
  border-color: #f3f4f6; /* 默认灰色 border-gray-100 */
}

.address-card:hover {
  border-color: #d1d5db; /* 悬浮灰色 border-gray-300 */
}

/* 激活状态样式 */
.address-card.is-active {
  border-color: #409eff !important; /* 强制蓝色边框 */
  background-color: rgba(64, 158, 255, 0.05); /* 浅蓝色背景 */
}

/* 选中角标样式 */
.active-badge {
  position: absolute;
  bottom: -10px;
  right: -10px;
  background-color: #409eff;
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-bottom: 8px;
  padding-right: 8px;
  z-index: 10;
}

/* 默认标记颜色补丁 */
.text-primary {
  color: #409eff;
}
</style>
