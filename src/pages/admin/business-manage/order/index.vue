<script setup lang="ts">
import type { VxeGridInstance, VxeGridListeners, VxeGridProps } from "vxe-table"
import { reactive, ref } from "vue"
import VXETable from "vxe-table"
import { orderApi } from "./apis"

// ===================== 基础变量 =====================
const gridRef = ref<VxeGridInstance>()

/** 主表配置 */
const gridOptions = reactive<VxeGridProps>({
  border: true,
  keepSource: true,
  height: "100%",
  rowConfig: { height: 60 },

  // 分页配置
  pagerConfig: {
    enabled: true,
    pageSize: 10,
    pageSizes: [10, 20, 50]
  },

  // 搜索表单配置
  formConfig: {
    titleWidth: 80,
    titleAlign: "right",
    data: {
      orderSn: "",
      status: null
    },
    items: [
      { field: "orderSn", title: "订单编号", span: 6, itemRender: { name: "VxeInput", props: { placeholder: "输入订单号查询" } } },
      {
        field: "status", title: "订单状态", span: 6,
        itemRender: {
          name: "VxeSelect",
          options: [
            { label: '全部', value: null },
            { label: '待付款', value: 0 },
            { label: '待发货', value: 1 },
            { label: '已发货', value: 2 },
            { label: '已完成', value: 3 }
          ]
        }
      },
      { span: 12, align: "left", itemRender: { name: "$buttons", children: [{ props: { type: "submit", content: "查询", status: "primary" } }, { props: { type: "reset", content: "重置" } }] } }
    ]
  },

  toolbarConfig: {
    refresh: true,
    custom: true
  },

  // 数据代理配置
  proxyConfig: {
    props: {
      result: "data.records",
      total: "data.total"
    },
    ajax: {
      query: async ({ page }) => {
        const formData = gridOptions.formConfig!.data
        const res = await orderApi.getList({
          page: page.currentPage,
          limit: page.pageSize,
          orderSn: formData?.orderSn || "",
          status: formData?.status
        })
        return res
      }
    }
  },

  // 列配置
  columns: [
    { type: "seq", width: 60, title: "序号" },
    { field: 'expand', type: 'expand', width: 60, align: 'center', slots: { content: 'expandContent' } },
    { field: "orderSn", title: "订单编号", minWidth: 180 },
    { field: "createTime", title: "下单时间", width: 160 },
    { field: "receiverName", title: "收件人", width: 100 },
    { field: "totalAmount", title: "金额", width: 120, slots: { default: "amount_default" } },
    { field: "payType", title: "支付方式", width: 100, slots: { default: "payType_default" } },
    { field: "status", title: "订单状态", width: 120, slots: { default: "status_default" } },
    { title: "操作", width: 120, fixed: "right", slots: { default: "action_default" } }
  ]
})

/** 子表配置 (订单项明细) */
const subGridOptions = reactive<VxeGridProps>({
  border: true,
  showOverflow: true,
  size: 'mini',
  columns: [
    { field: 'productPic', title: '商品图片', width: 80, align: 'center', slots: { default: 'sub_pic_default' } },
    { field: 'productName', title: '商品名称', minWidth: 200 },
    { field: 'productAttr', title: '规格属性', width: 200, slots: { default: 'spec_default' } },
    { field: 'productPrice', title: '单价', width: 100, slots: { default: 'sub_price_default' } },
    { field: 'productQuantity', title: '数量', width: 80, align: 'center' },
    { title: '小计', width: 100, slots: { default: 'sub_total_default' } }
  ]
})

// ===================== 表格事件 =====================
const gridEvents: VxeGridListeners = {
  /** 监听行展开实现懒加载*/
  async toggleRowExpand({ row, expanded }) {
    if (expanded && (!row.items || row.items.length === 0)) {
      try {
        const res = await orderApi.getItemsByOrderId(row.id)
        row.items = res.data
      } catch {
        VXETable.modal.message({ content: "加载订单明细失败", status: "error" })
      }
    }
  }
}

// ===================== 详情弹窗相关 =====================
const detailVisible = ref(false)
const currentDetail = ref<any>(null)

/** 打开详情弹窗 */
function showDetail(row: any) {
  currentDetail.value = row
  detailVisible.value = true
}

/** 格式化完整地址 */
function getFullAddress(row: any) {
  if (!row) return ''
  return `${row.receiverProvince}${row.receiverCity}${row.receiverRegion} ${row.receiverDetailAddress}`
}

/** 状态映射（用于详情页展示） */
const statusMap: any = {
  0: { text: '待付款', type: 'danger' },
  1: { text: '待发货', type: 'warning' },
  2: { text: '已发货', type: 'primary' },
  3: { text: '已完成', type: 'success' },
  4: { text: '已关闭', type: 'info' }
}

// ===================== 发货相关 =====================
const deliveryVisible = ref(false)
const deliveryLoading = ref(false)
const deliveryFormRef = ref()

const deliveryForm = reactive({
  orderId: 0,
  orderSn: '',
  deliveryCompany: '',
  deliverySn: ''
})

const deliveryRules = {
  deliveryCompany: [{ required: true, message: '请选择物流公司', trigger: 'change' }],
  deliverySn: [{ required: true, message: '请输入物流单号', trigger: 'blur' }]
}

// 物流公司选项
const companyOptions = [
  { label: '顺丰快递', value: 'SF' },
  { label: '圆通速递', value: 'YTO' },
  { label: '中通快递', value: 'ZTO' },
  { label: '韵达快递', value: 'YD' }
]

/** 打开发货弹窗 */
function openDelivery(row: any) {
  deliveryForm.orderId = row.id
  deliveryForm.orderSn = row.orderSn
  deliveryForm.deliveryCompany = ''
  deliveryForm.deliverySn = ''
  deliveryVisible.value = true
}

/** 提交发货 */
async function handleDelivery() {
  await deliveryFormRef.value.validate()

  deliveryLoading.value = true
  try {
    const res: any = await orderApi.delivery({
      id: deliveryForm.orderId,
      deliveryCompany: deliveryForm.deliveryCompany,
      deliverySn: deliveryForm.deliverySn
    })

    if (res.code === 200) {
      VXETable.modal.message({ content: "发货成功", status: "success" })
      deliveryVisible.value = false
      // 刷新主表数据
      gridRef.value?.commitProxy('query')
    } else {
      VXETable.modal.message({ content: res.message || "发货失败", status: "error" })
    }
  } catch (error: any) {
    VXETable.modal.message({ content: error.message || "系统错误", status: "error" })
  } finally {
    deliveryLoading.value = false
  }
}


/** 模拟物流数据 */
const mockTracks = [
  { content: '快件已签收，签收人：本人，感谢使用**快递', time: '2026-01-30 14:00:00' },
  { content: '快件交给张三，正在派送途中', time: '2026-01-30 09:30:00' },
  { content: '快件到达 【**市**区**镇**村营业点】', time: '2026-01-29 23:10:00' },
  { content: '快件已发货，正运往目的地', time: '2026-01-29 02:13:08' }
]

/** 复制单号功能 */
function copySn(sn: string) {
  navigator.clipboard.writeText(sn)
  ElMessage.success('单号已复制到剪贴板')
}
// ===================== 辅助函数 =====================
function getPayTypeText(type: number) {
  const map: any = { 0: '未支付', 1: '支付宝', 2: '微信' }
  return map[type] || '未知'
}

/** 解析规格 JSON */
function parseSpec(specData: any) {
  if (!specData) return []
  try {
    return typeof specData === 'string' ? JSON.parse(specData) : specData
  } catch { return [] }
}
</script>

<template>
  <div class="table-container">
    <vxe-grid ref="gridRef" v-bind="gridOptions" v-on="gridEvents">

      <template #amount_default="{ row }">
        <span style="color: #f56c6c; font-weight: bold;">¥{{ row.payAmount }}</span>
        <div style="font-size: 10px; color: #999;">(含运费: ¥{{ row.freightAmount }})</div>
      </template>

      <template #payType_default="{ row }">
        <el-tag :type="(['warning','primary','success']as const)[row.payType]">
          {{ ['未支付', '支付宝', '微信'][row.payType] }}
        </el-tag>
      </template>

      <template #status_default="{ row }">
        <el-tag :type="(['danger', 'warning', 'primary', 'success', 'info']as const)[row.status]" effect="dark" size="small">
          {{ ['待付款', '待发货', '已发货', '已完成', '已关闭'][row.status] }}
        </el-tag>
      </template>

      <template #expandContent="{ row }">
        <div class="sub-table-container">
          <vxe-grid v-bind="subGridOptions" :data="row.items" v-loading="!row.items">

            <template #sub_pic_default="{ row: subRow }">
              <el-image :src="`/api${subRow.productPic}`" style="width: 40px; height: 40px; border-radius: 4px;" />
            </template>

            <template #spec_default="{ row: subRow }">
              <el-tag v-for="(item, idx) in parseSpec(subRow.productAttr)" :key="idx" size="small" style="margin-right: 4px;">
                {{ item.key }}: {{ item.value }}
              </el-tag>
            </template>

            <template #sub_price_default="{ row: subRow }">
              ¥{{ subRow.productPrice }}
            </template>

            <template #sub_total_default="{ row: subRow }">
              <span style="font-weight: bold;">¥{{ (subRow.productPrice * subRow.productQuantity).toFixed(2) }}</span>
            </template>

          </vxe-grid>
        </div>
      </template>

      <template #action_default="{ row }">
        <vxe-button v-if="row.status === 1" status="primary" mode="text" @click="openDelivery(row)">发货</vxe-button>
        <vxe-button status="info" mode="text" @click="showDetail(row)">详情</vxe-button>
      </template>

    </vxe-grid>

    <!-- 订单详情弹窗 -->
    <el-dialog v-model="detailVisible" title="订单详细信息" width="800px" destroy-on-close>
      <div v-if="currentDetail" class="order-detail-content">
        <el-alert
          :title="`当前订单状态：${statusMap[currentDetail.status]?.text}`"
          :type="statusMap[currentDetail.status]?.type" :closable="false" show-icon class="mb-4" />

        <el-descriptions title="基本信息" :column="2" border class="mb-4">
          <el-descriptions-item label="订单编号">{{ currentDetail.orderSn }}</el-descriptions-item>
          <el-descriptions-item label="下单时间">{{ currentDetail.createTime }}</el-descriptions-item>
          <el-descriptions-item label="支付方式">{{ getPayTypeText(currentDetail.payType) }}</el-descriptions-item>
          <el-descriptions-item label="支付时间">{{ currentDetail.paymentTime || '-' }}</el-descriptions-item>
        </el-descriptions>

        <el-descriptions title="收货人信息" :column="2" border class="mb-4">
          <el-descriptions-item label="收货人">{{ currentDetail.receiverName }}</el-descriptions-item>
          <el-descriptions-item label="手机号码">{{ currentDetail.receiverPhone }}</el-descriptions-item>
          <el-descriptions-item label="收货地址" :span="2">{{ getFullAddress(currentDetail) }}</el-descriptions-item>
          <el-descriptions-item label="买家备注" :span="2">{{ currentDetail.note || '无' }}</el-descriptions-item>
        </el-descriptions>

        <div v-if="currentDetail.status >= 2" class="logistics-section mb-4">
          <el-descriptions title="物流信息" :column="2" border>
            <el-descriptions-item label="物流公司">
              <el-tag size="small">{{ currentDetail.deliveryCompany }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="物流单号">
              {{ currentDetail.deliverySn }}
              <el-button
                type="primary" link size="small" class="ml-2"
                @click="copySn(currentDetail.deliverySn)">复制</el-button>
            </el-descriptions-item>
            <el-descriptions-item label="发货时间">{{ currentDetail.deliveryTime || '-' }}</el-descriptions-item>
            <el-descriptions-item label="收货时间">
              <span v-if="currentDetail.status >= 3">{{ currentDetail.receiveTime || '-' }}</span>
              <el-tag v-else type="info" size="small">待收货</el-tag>
            </el-descriptions-item>
          </el-descriptions>

          <div class="tracks-wrapper mt-4">
            <p class="section-sub-title">物流轨迹</p>
            <el-timeline class="mt-2">
              <el-timeline-item
                v-for="(activity, index) in mockTracks" :key="index"
                :type="index === 0 ? 'primary' : 'info'" :color="index === 0 ? '#409EFF' : ''"
                :timestamp="activity.time">
                {{ activity.content }}
              </el-timeline-item>
            </el-timeline>
          </div>
        </div>

        <el-descriptions title="费用信息" :column="2" border>
          <el-descriptions-item label="商品合计">¥{{ currentDetail.totalAmount }}</el-descriptions-item>
          <el-descriptions-item label="运费金额">¥{{ currentDetail.freightAmount }}</el-descriptions-item>
          <el-descriptions-item label="实付总额">
            <span class="text-red font-bold text-lg">¥{{ currentDetail.payAmount }}</span>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <!-- 订单发货弹窗 -->
    <el-dialog v-model="deliveryVisible" title="订单发货" width="450px" destroy-on-close>
      <el-form :model="deliveryForm" :rules="deliveryRules" ref="deliveryFormRef" label-width="100px">
        <el-form-item label="订单编号">
          <el-input v-model="deliveryForm.orderSn" disabled />
        </el-form-item>
        <el-form-item label="物流公司" prop="deliveryCompany">
          <el-select v-model="deliveryForm.deliveryCompany" placeholder="请选择物流公司" style="width: 100%">
            <el-option v-for="item in companyOptions" :key="item.value" :label="item.label" :value="item.label" />
          </el-select>
        </el-form-item>
        <el-form-item label="物流单号" prop="deliverySn">
          <el-input v-model="deliveryForm.deliverySn" placeholder="请输入物流单号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="deliveryVisible = false">取消</el-button>
        <el-button type="primary" :loading="deliveryLoading" @click="handleDelivery">确认发货</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.table-container {
  height: 100%;
  overflow: hidden;
  padding: 10px;
}

.sub-table-container {
  padding: 15px;
}

.order-detail-content {
  padding: 10px;

  .mb-4 {
    margin-bottom: 20px;
  }

  .text-red {
    color: #f56c6c;
  }

  .font-bold {
    font-weight: bold;
  }

  .text-lg {
    font-size: 18px;
  }
}

.order-detail-content {
  .section-sub-title {
    font-size: 14px;
    font-weight: bold;
    color: var(--el-text-color-regular);
    margin-bottom: 15px;
    padding-left: 10px;
    border-left: 4px solid var(--el-color-primary);
  }

  .tracks-wrapper {
    padding: 20px;
    background-color: #f8f9fb;
    border-radius: 8px;
  }

  :deep(.el-timeline-item__content) {
    font-size: 13px;
  }
}
</style>
