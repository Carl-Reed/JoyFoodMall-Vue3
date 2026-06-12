<script setup lang="ts">
import { orderApi } from '@@/apis/mall/order'
import { ArrowDown, ArrowUp, CreditCard, Location, Timer } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRoute } from 'vue-router'
import { getFullUrl } from '@/common/apis/request'
import 'element-plus/es/components/message-box/style/css'
import 'element-plus/es/components/message/style/css'

const route = useRoute()

// --- 状态变量 ---
const loading = ref(false)
const orderList = ref<any[]>([])
const activeTab = ref('-1')
const payDialogVisible = ref(false);
const currentPayingId = ref<number | null>(null);

// --- 分页相关 ---
const page = ref(1)
const limit = ref(5)
const total = ref(0)

// --- 折叠逻辑 ---
const expandedOrders = ref<number[]>([]) // 存储已展开的订单 ID

// --- 倒计时相关逻辑 ---
const countdowns = reactive<Record<number, string>>({}) // 存储每个订单的倒计时文本
let globalTimer: any = null // 全局定时器实例
const TIMEOUT_MS = 30 * 60 * 1000 // 订单超时时间

// 初始化并启动倒计时计算
function startCountdown() {
  if (globalTimer) clearInterval(globalTimer)

  const updateCountdowns = () => {
    const now = Date.now()
    let needRefresh = false

    orderList.value.forEach((order) => {
      // 只有状态为待付款(0)的订单才需要倒计时
      if (order.status === 0 && order.createTime) {

        const safeDateStr = order.createTime.replace('T', ' ').replace(/-/g, '/')
        const createTimeMs = new Date(safeDateStr).getTime()
        const expireTimeMs = createTimeMs + TIMEOUT_MS
        const remainMs = expireTimeMs - now

        if (remainMs > 0) {
          const minutes = Math.floor(remainMs / 1000 / 60)
          const seconds = Math.floor((remainMs / 1000) % 60)
          countdowns[order.id] = `${minutes}分${seconds.toString().padStart(2, '0')}秒`
        } else {
          const isJustExpired = countdowns[order.id] && countdowns[order.id] !== '已超时'

          countdowns[order.id] = '已超时'

          if (isJustExpired) {
            needRefresh = true
          }
        }
      }
    })

    // 若有订单的倒计时结束，自动触发刷新
    if (needRefresh) {
      clearInterval(globalTimer)
      fetchOrders()
    }
  }

  updateCountdowns()
  globalTimer = setInterval(updateCountdowns, 1000)
}

// --- 配置字典 ---
const statusConfig: any = {
  0: { text: '待付款', type: 'danger' },
  1: { text: '待发货', type: 'warning' },
  2: { text: '待收货', type: 'primary' },
  3: { text: '已完成', type: 'success' },
  4: { text: '已关闭', type: 'info' }
}

// --- 逻辑函数 ---

// 获取展示的商品（多于2个且未展开则截断）
function getVisibleItems(order: any) {
  if (!order.itemList) return []
  if (expandedOrders.value.includes(order.id) || order.itemList.length <= 2) {
    return order.itemList
  }
  return order.itemList.slice(0, 2)
}

// 切换展开/收起
function toggleExpand(orderId: number) {
  const index = expandedOrders.value.indexOf(orderId)
  if (index > -1) {
    expandedOrders.value.splice(index, 1)
  } else {
    expandedOrders.value.push(orderId)
  }
}

// 格式化规格 JSON
function formatProductAttr(attrStr: string) {
  try {
    const attrs = JSON.parse(attrStr)
    return attrs.map((item: any) => `${item.key}:${item.value}`).join('; ')
  } catch {
    return attrStr || '默认规格'
  }
}

// 获取数据
async function fetchOrders() {
  loading.value = true
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
  try {
    const params = {
      page: page.value,
      limit: limit.value,
      status: activeTab.value === '-1' ? undefined : Number(activeTab.value)
    }
    const res: any = await orderApi.getUserOrders(params)
    if (res.code === 200) {
      orderList.value = res.data.records || []
      total.value = res.data.total || 0
      startCountdown()
    }
  } catch {
    ElMessage.error('获取订单列表失败')
  } finally {
    loading.value = false
  }
}

// 交互操作
function handleTabChange() {
  page.value = 1
  expandedOrders.value = []
  fetchOrders()
}

// 支付操作
function handlePay(id: number) {
  currentPayingId.value = id;
  payDialogVisible.value = true;
};

async function confirmPay(type: number) {
  if (!currentPayingId.value) return;

  try{
    const res: any = await orderApi.payOrder({
      orderId: currentPayingId.value,
      payType: type
    });

    if (res.code === 200) {
      ElMessage.success(`${type === 1 ? '支付宝' : '微信'}支付成功`);
      payDialogVisible.value = false;
      fetchOrders(); // 刷新列表
    }
  }catch{
    ElMessage.error('支付失败，请重试');
  }

};

/** 确认收货交互 */
function handleConfirm(id: number) {
  ElMessageBox.confirm(
    '您是否已收到货物并确认商品无误？确认后订单将变更为完成状态。',
    '确认收货',
    {
      confirmButtonText: '已收到货',
      cancelButtonText: '取消',
      type: 'success',
      roundButton: true,
    }
  ).then(async () => {
    loading.value = true
    try {
      const res: any = await orderApi.confirmReceipt(id)
      if (res.code === 200) {
        ElMessage({
          type: 'success',
          message: '确认收货成功！',
          duration: 2000
        })
        fetchOrders() // 刷新列表，订单状态会从 2(待收货) 变为 3(已完成)
      }
    } catch {
      ElMessage.error('操作失败，请重试')
    } finally {
      loading.value = false
    }
  }).catch(() => {
    // 点击取消不做处理
  })
}

// 取消订单
function handleCancel(id: number) {
  ElMessageBox.confirm('确定取消订单吗？', '提示', { type: 'warning' }).then(async () => {
    const res: any = await orderApi.cancelOrder(id)
    if (res.code === 200) {
      ElMessage.success('订单已取消')
      fetchOrders()
    }
  })
}

// 删除订单
function handleDelete(orderId: number) {
  ElMessageBox.confirm(
    '删除后该订单将不再显示在您的订单列表中，确定删除吗？',
    '提示',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
  ).then(async () => {
    try {
      const res: any = await orderApi.deleteOrder(orderId);
      if (res.code === 200) {
        ElMessage.success('删除成功');
        fetchOrders(); // 刷新列表
      }
    } catch {
      ElMessage.error('删除失败');
    }
  });
}

const formatDate = (dateStr: string) => dateStr ? dateStr.replace('T', ' ') : ''

onMounted(() => {
  // 如果 URL 中有 status 参数，则设置 activeTab
  if (route.query.status !== undefined) {
    activeTab.value = String(route.query.status)
  }
  fetchOrders()
})

onBeforeUnmount(() => {
  if (globalTimer) {
    clearInterval(globalTimer)
  }
})
</script>

<template>
  <div class="my-orders-container">
    <div class="tabs-wrapper mb-4">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange" class="custom-tabs">
        <el-tab-pane label="全部" name="-1" />
        <el-tab-pane label="待付款" name="0" />
        <el-tab-pane label="待发货" name="1" />
        <el-tab-pane label="待收货" name="2" />
        <el-tab-pane label="已完成" name="3" />
        <el-tab-pane label="已关闭" name="4" />
      </el-tabs>
    </div>

    <div v-loading="loading" class="order-list-content">
      <div v-for="order in orderList" :key="order.id" class="order-card">

        <div class="order-header">
          <div class="header-left">
            <el-icon><Timer /></el-icon>
            <span class="time">{{ formatDate(order.createTime) }}</span>
            <span class="divider" />
            <span class="sn">单号: {{ order.orderSn }}</span>
            <template v-if="order.status === 0 && countdowns[order.id]">
                <span class="divider" />
                <span class="countdown-text">
                  <span class="highlight">{{ countdowns[order.id] }}</span> 后自动关闭
                </span>
            </template>
          </div>
          <el-tag :type="statusConfig[order.status]?.type" effect="dark" size="small" round>
            {{ statusConfig[order.status]?.text }}
          </el-tag>
        </div>

        <div class="order-content">
          <div class="items-preview-box">
            <div v-for="item in getVisibleItems(order)" :key="item.id" class="item-row">
              <el-image :src="getFullUrl(item.productPic)" class="item-img" fit="cover" />
              <div class="item-info">
                <div class="item-name">{{ item.productName }}</div>
                <div class="item-spec">{{ formatProductAttr(item.productAttr) }}</div>
                <div class="item-price-qty">
                  <span class="p">￥{{ item.productPrice.toFixed(2) }}</span>
                  <span class="q">x {{ item.productQuantity }}</span>
                </div>
              </div>
            </div>

            <div v-if="order.itemList && order.itemList.length > 2" class="expand-control">
              <el-button link type="primary" @click="toggleExpand(order.id)">
                {{ expandedOrders.includes(order.id) ? '收起商品' : `展开其余 ${order.itemList.length - 2} 件商品` }}
                <el-icon class="ml-1">
                  <component :is="expandedOrders.includes(order.id) ? ArrowUp : ArrowDown" />
                </el-icon>
              </el-button>
            </div>

            <div class="mini-address-card">
              <div class="addr-user">
                <el-icon><Location /></el-icon>
                <span class="name">{{ order.receiverName }}</span>
                <span class="phone">{{ order.receiverPhone }}</span>
              </div>
              <div class="addr-text">
                {{ order.receiverProvince }}{{ order.receiverCity }}{{ order.receiverRegion }} {{ order.receiverDetailAddress }}
              </div>
              <div v-if="order.note" class="note-info">备注: {{ order.note }}</div>
            </div>
          </div>

          <div class="price-box">
            <div class="price-label">实付款</div>
            <div class="price-value"><span class="unit">￥</span>{{ order.payAmount.toFixed(2) }}</div>
            <div class="freight">{{ order.freightAmount > 0 ? `含运费￥${order.freightAmount.toFixed(2)}` : '免运费' }}</div>
          </div>
        </div>

        <div class="order-footer">
          <div class="actions">
            <el-button v-if="order.status === 0" size="small" @click="handleCancel(order.id)">取消订单</el-button>
            <el-button v-if="order.status === 0" size="small" type="primary" class="btn-pay" @click="handlePay(order.id)">
              <el-icon class="mr-1"><CreditCard /></el-icon> 立即支付
            </el-button>
            <el-button v-if="order.status === 2" size="small" type="success" plain @click="handleConfirm(order.id)">确认收货</el-button>
            <el-button v-if="order.status >= 3" size="small" type="danger" @click="handleDelete(order.id)">删除订单</el-button>
          </div>
        </div>
      </div>

      <div v-if="total > 0" class="pagination-wrapper">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="limit"
          :total="total"
          layout="total, prev, pager, next"
          background
          @current-change="fetchOrders"
        />
      </div>

      <el-dialog v-model="payDialogVisible" title="选择支付方式" width="400px" center append-to-body destroy-on-close>
        <div class="pay-options">
          <div class="pay-item" @click="confirmPay(1)">
            <div class="left"><el-icon class="alipay">
                <WalletFilled />
              </el-icon> 支付宝</div>
            <el-icon>
              <ArrowRight />
            </el-icon>
          </div>
          <div class="pay-item" @click="confirmPay(2)">
            <div class="left"><el-icon class="wechat">
                <ChatDotRound />
              </el-icon> 微信支付</div>
            <el-icon>
              <ArrowRight />
            </el-icon>
          </div>
        </div>
      </el-dialog>

      <el-empty v-if="orderList.length === 0" description="暂无相关订单" />
    </div>
  </div>
</template>

<style scoped>
.my-orders-container {
  max-width: 900px;
  margin: 0 auto;
  padding-bottom: 40px;
}

/* 选项卡 */
.tabs-wrapper {
  padding: 0 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.custom-tabs :deep(.el-tabs__nav-wrap::after) { display: none; }
.custom-tabs :deep(.el-tabs__item) { height: 50px; font-weight: 500; }

/* 订单卡片 */
.order-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #f1f5f9;
  margin-top: 16px;
  overflow: hidden;
  transition: all 0.3s;
}
.order-card:hover {
  box-shadow: 0 8px 24px rgba(0,0,0,0.08);
  transform: translateY(-2px);
}

.order-header {
  padding: 12px 20px;
  background: #f8fafc;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #64748b;
}
/* 倒计时样式 */
.countdown-text {
  font-size: 13px;
  /* color: #64748b; */
  display: inline-flex;
  align-items: center;
}
.countdown-text .highlight {
  color: #ef4444; /* 红色高亮 */
  font-weight: 600;
  margin: 0 4px;
  font-family: monospace;
}
.divider { width: 1px; height: 12px; background: #e2e8f0; }
.sn { font-family: monospace; color: #334155; }

.order-content {
  padding: 20px;
  display: flex;
  gap: 24px;
}

.items-preview-box { flex: 1; }
.item-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  animation: slideIn 0.3s ease-out;
}
.item-img {
  width: 76px; height: 76px;
  border-radius: 10px;
  flex-shrink: 0;
}
.item-info { display: flex; flex-direction: column; justify-content: space-between; }
.item-name { font-size: 14px; font-weight: 600; color: #1e293b; line-height: 1.4; }
.item-spec { font-size: 12px; color: #64748b; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; align-self: flex-start; }
.item-price-qty { font-size: 13px; }
.item-price-qty .p { font-weight: bold; }
.item-price-qty .q { color: #94a3b8; margin-left: 6px; }

/* 支付样式 */
.pay-options {
  padding: 10px 0;
}
.pay-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid #f1f5f9;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.pay-item:hover {
  background-color: #f8fafc;
  border-color: #3b82f6;
}
.pay-item .left {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
}
.alipay { color: #1677ff; font-size: 24px; }
.wechat { color: #07c160; font-size: 24px; }

/* 地址 & 折叠 */
.expand-control {
  text-align: center;
  margin-bottom: 15px;
  border-bottom: 1px solid #f8fafc;
}
.mini-address-card {
  padding: 12px;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px dashed #cbd5e1;
}
.addr-user { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: bold; margin-bottom: 4px; }
.addr-user .el-icon { color: var(--el-color-primary); }
.addr-text { font-size: 12px; color: #64748b; padding-left: 20px; }
.note-info { font-size: 12px; color: #d97706; margin-top: 6px; padding-left: 20px; }

/* 价格盒子 */
.price-box {
  min-width: 140px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-end;
  border-left: 1px solid #f1f5f9;
  padding-left: 20px;
}
.price-label { font-size: 12px; color: #94a3b8; }
.price-value { font-size: 24px; font-weight: 800; color: #0f172a; }
.price-value .unit { font-size: 14px; }
.freight { font-size: 11px; color: #94a3b8; margin-top: 4px; }

/* 分页 & 页脚 */
.order-footer { padding: 12px 20px; border-top: 1px solid #f8fafc; display: flex; justify-content: flex-end; }
.btn-pay { background: linear-gradient(135deg, #3b82f6, #2563eb); border: none; color: white; }
.pagination-wrapper { margin-top: 24px; display: flex; justify-content: center; padding: 20px; background: white; border-radius: 12px; }

@keyframes slideIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 768px) {
  .order-content { flex-direction: column; }
  .price-box { border-left: none; border-top: 1px solid #f1f5f9; align-items: flex-start; padding: 15px 0 0; }
}
</style>
