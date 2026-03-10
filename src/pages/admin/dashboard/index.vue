<script setup lang="ts">
import { Goods, List, Money, ShoppingCart, TrendCharts, User, Warning } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { useTheme } from '@/common/composables/useTheme'


// === 定义数据模型 ===
const loading = ref(true)

const { activeThemeName } = useTheme()

// 核心指标数据
const statsData = ref([
  { title: '今日营收', value: 0, prefix: '¥', icon: Money, color: 'text-blue-500', trend: '+12%', trendType: 'up' },
  { title: '今日订单', value: 0, suffix: '单', icon: ShoppingCart, color: 'text-purple-500', trend: '+5%', trendType: 'up' },
  { title: '新增用户', value: 0, suffix: '人', icon: User, color: 'text-emerald-500', trend: '-2%', trendType: 'down' },
  { title: '商品总数', value: 0, suffix: '件', icon: Goods, color: 'text-orange-500', trend: '+0%', trendType: 'flat' }
])

// 待办事项 (直接关联业务逻辑)
const todoList = ref([
  { title: '待发货订单', count: 0, path: '/order/list?status=1', type: 'danger' },
  { title: '待审核售后', count: 0, path: '/order/return', type: 'warning' },
  { title: '库存预警', count: 0, path: '/product/list?stock=low', type: 'info' },
])

// 销量排行 (关联 salesActual)
const rankList = ref<any[]>([])

// === ECharts 初始化 ===
const chartRef = ref<HTMLElement>()
let myChart: echarts.ECharts | null = null

function initChart () {
  if (!chartRef.value) return
  myChart = echarts.init(chartRef.value)

  const option = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      axisLabel: { color: getCssVar('--el-text-color-regular') }
    },
    yAxis: { type: 'value', axisLabel: { color: getCssVar('--el-text-color-regular') } },
    series: [
      {
        name: '销售额',
        type: 'line',
        smooth: true,
        data: [820, 932, 901, 934, 1290, 1330, 1320],
        itemStyle: { color: '#409EFF' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64,158,255,0.5)' },
            { offset: 1, color: 'rgba(64,158,255,0.01)' }
          ])
        }
      },
      {
        name: '订单量',
        type: 'line',
        smooth: true,
        data: [20, 32, 21, 34, 90, 30, 20],
        itemStyle: { color: '#67C23A' }
      }
    ]
  }
  myChart.setOption(option)
}


const getCssVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

// 封装更新图表样式的方法
function refreshChartTheme () {
  if (!myChart) return

  // 实时抓取 CSS 变量
  const textColor = getCssVar('--el-text-color-regular')
  const splitLineColor = getCssVar('--el-border-color-lighter')

  myChart.setOption({
    xAxis: {
      axisLabel: { color: textColor },
      axisLine: { lineStyle: { color: splitLineColor } }
    },
    yAxis: {
      axisLabel: { color: textColor },
      splitLine: { lineStyle: { color: splitLineColor } }
    }
  })
}

watch(activeThemeName, async () => {
  await nextTick()
  refreshChartTheme()
})

// === 模拟获取后端数据 ===
async function loadData () {
  loading.value = true

  // 模拟网络延迟
  await new Promise(r => setTimeout(r, 800))

  // 填充模拟数据
  statsData.value[0].value = 12580 // 今日营收
  statsData.value[1].value = 86    // 今日订单
  statsData.value[2].value = 12    // 新增用户
  statsData.value[3].value = 340   // 商品总数

  todoList.value[0].count = 12     // 待发货
  todoList.value[1].count = 3      // 售后
  todoList.value[2].count = 5      // 库存预警

  // 填充排行榜 (这里对应你后端的 PmsProduct)
  rankList.value = [
    { id: 101, name: '极品智利车厘子 5KG', salesActual: 2450, price: 299.00 },
    { id: 102, name: '53度飞天茅台 500ml', salesActual: 1890, price: 2499.00 },
    { id: 103, name: '戴森吹风机 HD15', salesActual: 1200, price: 2899.00 },
    { id: 104, name: '有机五常大米 10KG', salesActual: 980, price: 128.00 },
    { id: 105, name: '纯棉加厚浴巾', salesActual: 850, price: 59.90 },
  ]

  loading.value = false
  nextTick(() => {
    initChart()
  })
}

// 监听窗口大小变化，重绘图表
const handleResize = () => myChart?.resize()

onMounted(() => {
  loadData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  myChart?.dispose()
})
</script>

<template>
  <div class="dashboard-container p-4 min-h-screen">

    <el-row :gutter="20" class="mb-4">
      <el-col :xs="24" :sm="12" :lg="6" v-for="(item, index) in statsData" :key="index" class="mb-4 lg:mb-0">
        <el-card shadow="hover" class="border-none relative overflow-hidden group cursor-pointer transition-all hover:-translate-y-1">
          <div class="flex justify-between items-start">
            <div>
              <p class="text-sm font-medium mb-2">{{ item.title }}</p>
              <h3 class="text-2xl font-bold">
                {{ item.prefix }}{{ item.value.toLocaleString() }}{{ item.suffix }}
              </h3>
              <div class="mt-2 text-xs flex items-center gap-1" :class="item.trendType === 'up' ? 'text-red-500' : 'text-green-500'">
                <span>较昨日 {{ item.trend }}</span>
                <el-icon><component :is="item.trendType === 'up' ? 'Top' : 'Bottom'" /></el-icon>
              </div>
            </div>
            <div class="p-3 rounded-lg group-hover:bg-blue-50 transition-colors">
              <el-icon :size="24" :class="item.color"><component :is="item.icon" /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mb-4">
      <el-col :xs="24" :lg="16" class="mb-4 lg:mb-0">
        <el-card shadow="never">
          <template #header>
            <div class="flex justify-between items-center">
              <span class="font-bold flex items-center gap-2">
                <el-icon class="text-blue-500"><TrendCharts /></el-icon> 销售趋势 (近7天)
              </span>
              <el-radio-group size="small" model-value="week">
                <el-radio-button label="week">本周</el-radio-button>
                <el-radio-button label="month">本月</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="chartRef" style="height: 350px; width: 100%;" />
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="8">
        <el-card shadow="never" class="h-full">
          <template #header>
            <span class="font-bold flex items-center gap-2">
              <el-icon class="text-orange-500"><Warning /></el-icon> 待办事项
            </span>
          </template>

          <div class="space-y-4">
            <div
                v-for="todo in todoList" :key="todo.title"
                 class="flex justify-between items-center p-3 rounded-lg cursor-pointer hover:bg-gray-100 hover:-translate-y-1"
                 :style="{backgroundColor: `var(--el-fill-color)`}"
                 @click="$router.push(todo.path)">
              <span class="text-sm">{{ todo.title }}</span>
              <el-tag :type="todo.type" effect="dark" round>
                {{ todo.count }}
              </el-tag>
            </div>
          </div>

          <el-divider content-position="left">快捷入口</el-divider>

          <div class="grid grid-cols-3 gap-2 text-center">
             <div
                class="p-2 hover:bg-gray-50 rounded cursor-pointer flex flex-col items-center hover:c-black"
                @click="$router.push('/admin/shop/product-manage')"
              >
               <el-icon class="text-blue-500 text-xl mb-1"><Goods /></el-icon>
               <span class="text-xs">发布商品</span>
             </div>
             <div
                class="p-2 hover:bg-gray-50 rounded cursor-pointer flex flex-col items-center hover:c-black"
                @click="$router.push('/admin/business/order-manage')"
              >
               <el-icon class="text-green-500 text-xl mb-1"><List /></el-icon>
               <span class="text-xs">订单管理</span>
             </div>
             <div
                class="p-2 hover:bg-gray-50 rounded cursor-pointer flex flex-col items-center hover:c-black"
                @click="$router.push('/admin/user/user-manage')"
              >
               <el-icon class="text-purple-500 text-xl mb-1"><User /></el-icon>
               <span class="text-xs">会员列表</span>
             </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row>
      <el-col :span="24">
        <el-card shadow="never">
          <template #header>
            <span class="font-bold flex items-center gap-2">
              <el-icon class="text-red-500"><Trophy /></el-icon> 商品畅销榜 TOP 10
            </span>
          </template>

          <el-table :data="rankList" style="width: 100%" stripe>
            <el-table-column type="index" label="排名" width="80" align="center">
              <template #default="scope">
                <span
                      v-if="scope.$index < 3"
                      class="w-6 h-6 rounded-full text-white flex items-center justify-center mx-auto text-xs"
                      :class="['bg-red-500','bg-orange-500','bg-yellow-500'][scope.$index]">
                  {{ scope.$index + 1 }}
                </span>
                <span v-else class="text-gray-500 font-bold">{{ scope.$index + 1 }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="商品名称" show-overflow-tooltip />
            <el-table-column prop="price" label="价格" width="120">
               <template #default="scope">¥{{ scope.row.price }}</template>
            </el-table-column>
            <el-table-column prop="salesActual" label="实际销量" width="120" sortable>
              <template #default="scope">
                <span class="text-red-500 font-bold">{{ scope.row.salesActual }}</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
               <template #default>
                 <el-tag type="success" size="small">热销中</el-tag>
               </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
