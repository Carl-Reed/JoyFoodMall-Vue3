<script setup lang="ts">
import { mallCartApi } from '@@/apis/mall/cart'
import { getFullUrl } from "@@/apis/request"
import { Delete, ShoppingCart } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/pinia/stores/cart'
import 'element-plus/es/components/message-box/style/css'
import 'element-plus/es/components/message/style/css'

const router = useRouter()
const cartStore = useCartStore()
const loading = ref(false)

// 获取用户购物车数据
async function fetchCartData() {
  try {
    loading.value = true
    const res: any = await mallCartApi.getCartList()
    if (res.code === 200) {
      // 这里的映射要对应你 oms_cart_item 表的字段
      const formattedData = res.data.map((item: any) => ({
        ...item,
        pic: item.productPic, // 数据库 product_pic -> 前端 pic
        checked: true        // 默认全选
      }))
      cartStore.setCartList(formattedData)
    }
  } finally {
    loading.value = false
  }
}

/**
 * 购物车页面：修改数量逻辑
 * @param newVal 变化后的新数值
 * @param oldVal 变化前的旧数值
 * @param item 当前行商品对象
 */
async function handleQuantityChange(newVal: number | undefined, oldVal: number | undefined, item: any) {
  // 计算差值。例如：从 2 改到 3，delta 为 1；从 2 改到 1，delta 为 -1
  const delta = (newVal ?? 0) - (oldVal ?? 0);

  try {
    await mallCartApi.addCart({
      productId: item.productId,
      productSkuId: item.productSkuId,
      quantity: delta, // 后端执行 exist.quantity + delta
      price: item.price
    });

    // 同步更新 Pinia Store 里的数据
    item.quantity = newVal;
  } catch {
    ElMessage.error('更新数量失败');
    // 如果失败，强制刷新数据以回滚 UI 上的数字
    fetchCartData();
  }
}

// 删除商品
async function handleDelete(id: number) {
  ElMessageBox.confirm('确定从购物车移除该商品吗？', '提示', { type: 'warning',confirmButtonText: '确定', cancelButtonText: '取消' }).then(async () => {
    const res: any = await mallCartApi.deleteCart(id)
    if (res.code === 200) {
      cartStore.cartList = cartStore.cartList.filter(item => item.id !== id)
      ElMessage.success('移除成功')
    }
  })
}

// 结算跳转
async function handleCheckout() {
  if (cartStore.selectedList.length === 0) {
    return ElMessage.warning('请至少选择一件商品')
  }
  router.push('/mall/checkout')
}

// 解析商品规格
function parseSpecs(attrJson: string) {
  try {
    // 假设存的是 [{"key":"颜色","value":"红色"}, ...]
    const specs = JSON.parse(attrJson);
    return specs.map((s: any) => `${s.key}: ${s.value}`).join(' | ');
  } catch {
    return attrJson; // 如果解析失败返回原字符串
  }
}

onMounted(() => fetchCartData())
</script>

<template>
  <div class="cart-page bg-gray-50 min-h-screen pb-24">
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold mb-6 flex items-center gap-2">
        <el-icon><ShoppingCart /></el-icon> 我的购物车
      </h1>

      <div v-if="cartStore.cartList.length > 0" class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div class="lg:col-span-3 space-y-4">
          <div class="bg-white rounded-xl shadow-sm overflow-hidden">
            <div class="hidden md:grid grid-cols-12 gap-4 p-4 bg-gray-50 text-sm text-gray-500 border-b">
              <div class="col-span-1"><el-checkbox :model-value="cartStore.isAllChecked" @change="cartStore.toggleAll" /></div>
              <div class="col-span-5">商品信息</div>
              <div class="col-span-2 text-center">单价</div>
              <div class="col-span-2 text-center">数量</div>
              <div class="col-span-1 text-center">金额</div>
              <div class="col-span-1 text-center">操作</div>
            </div>

            <div v-for="item in cartStore.cartList" :key="item.id" class="grid grid-cols-12 gap-4 p-4 items-center border-b last:border-0 hover:bg-gray-50 transition-colors">
              <div class="col-span-1"><el-checkbox v-model="item.checked" /></div>
              <div class="col-span-11 md:col-span-5 flex gap-4">
                <el-image :src="getFullUrl(item.pic)" class="w-20 h-20 rounded-lg flex-shrink-0" fit="cover" />
                <div class="flex flex-col justify-center">
                  <h3 class="font-medium text-gray-800 line-clamp-1 cursor-pointer hover:text-blue-600" @click="router.push(`/mall/product/${item.productId}`)">
                    {{ item.productName }}
                  </h3>
                  <p class="text-xs text-gray-400 mt-1">{{ parseSpecs(item.productAttr) }}</p>
                </div>
              </div>
              <div class="hidden md:block col-span-2 text-center font-medium text-gray-700">￥{{ item.price }}</div>
              <div class="col-span-6 md:col-span-2 flex justify-center">
                <el-input-number
                  v-model="item.quantity" :min="1" :max="item.stock || 99" size="small"
                  @change="(newVal, oldVal) => handleQuantityChange(newVal, oldVal, item)" />
              </div>
              <div class="col-span-4 md:col-span-1 text-center font-bold text-red-500">￥{{ (item.price * item.quantity).toFixed(2) }}</div>
              <div class="col-span-2 md:col-span-1 text-center">
                <el-button :icon="Delete" circle size="small" type="danger" plain @click="handleDelete(item.id)" />
              </div>
            </div>
          </div>
        </div>

        <div class="lg:col-span-1">
          <div class="bg-white rounded-xl shadow-sm p-6 sticky top-4">
            <h3 class="text-lg font-bold mb-4">订单摘要</h3>
            <div class="space-y-3 pb-4 border-b">
              <div class="flex justify-between text-sm">
                <span class="text-gray-500">已选商品</span>
                <span class="font-medium">{{ cartStore.totalCount }} 件</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-500">运费</span>
                <span class="text-green-500">{{ cartStore.totalPrice >= 99 ? '包邮' : '￥10' }}</span>
              </div>
            </div>
            <div class="flex justify-between items-center mt-4 mb-6">
              <span class="font-bold">合计金额</span>
              <span class="text-2xl font-bold text-red-500 font-mono">￥{{ (cartStore.totalPrice + (cartStore.totalPrice >= 99 ? 0 : 10)).toFixed(2) }}</span>
            </div>
            <el-button type="primary" size="large" class="w-full !h-12 text-lg" @click="handleCheckout">
              去结算
            </el-button>
          </div>
        </div>
      </div>

      <el-empty v-else description="购物车还是空的，去逛逛吧~">
        <el-button type="primary" @click="router.push('/mall/home')">去首页</el-button>
      </el-empty>
    </div>
  </div>
</template>

<style scoped>
:deep(.el-checkbox__inner) {
  width: 20px;
  height: 20px;
}
:deep(.el-checkbox__inner::after) {
  height: 10px;
  left: 7px;
  top: 2px;
}
</style>
