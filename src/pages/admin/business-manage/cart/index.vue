<script setup lang="ts">
import type { VxeGridInstance, VxeGridProps } from "vxe-table"
import VXETable from "vxe-table"
import { checkPermission } from "@/common/utils/permission"
import { cartApi } from "./apis"


const gridRef = ref<VxeGridInstance>()

// ===================== 表格配置 =====================
const gridOptions = reactive<VxeGridProps>({
  border: true,
  keepSource: true,
  height: "100%",
  rowConfig: { height: 60, isHover: true },

  toolbarConfig: {
    refresh: true,
    custom: true
  },

  // 开启展开行配置
  expandConfig: {
    lazy: true,
    loadMethod: async ({ row }) => {
      const res = await cartApi.getListByUserId(row.userId)
      row.cartItems = res.data
    }
  },

  pagerConfig: {
    enabled: true,
    pageSize: 10,
  },

  formConfig: {
    data: { userId: "", username: "" },
    items: [
      { field: "userId", title: "用户ID", span: 6, itemRender: { name: "VxeInput" } },
      { field: "username", title: "昵称", span: 6, itemRender: { name: "VxeInput" } },
      { span: 12, itemRender: { name: "$buttons", children: [{ props: { type: "submit", content: "查询", status: "primary" } }, { props: { type: "reset", content: "重置" } }] } }
    ]
  },

  proxyConfig: {
    props: { result: "data.records", total: "data.total" },
    ajax: {
      query: async ({ page }: any): Promise<any> => {
        return await cartApi.getCartUserPage({
          page: page.currentPage,
          limit: page.pageSize,
          ...gridOptions.formConfig!.data
        })
      }
    }
  },

  columns: [
    { type: "seq", width: 60 },
    { type: "expand", width: 60, slots: { content: "expand_content" } },
    { field: "userId", title: "用户ID", width: 120 },
    { field: "username", title: "用户昵称", minWidth: 150 },
    { field: "itemCount", title: "加购商品数", width: 120, align: 'center' },
    { field: "totalPrice", title: "购物车总额", width: 150, slots: { default: "user_total_default" } },
    { field: "lastUpdateTime", title: "最后更新时间", width: 180 },
    { title: "操作", width: 120, fixed: "right", slots: { default: "user_action" } }
  ]
})

/** 删除单项记录 */
async function handleDeleteItem(row: any) {
  const type = await VXETable.modal.confirm('确定要从用户购物车移除此商品吗？')
  if (type === "confirm") {
    await cartApi.delete(row.id)
    VXETable.modal.message({ content: "操作成功", status: "success" })
    gridRef.value?.commitProxy("query")
  }
}

/** 一键清空逻辑 */
async function handleClearCart(row: any) {
  const type = await VXETable.modal.confirm({
    title: '警告',
    content: `确定要彻底清空用户【${row.username || row.userId}】的购物车吗？此操作不可撤销。`,
    status: 'error'
  })

  if (type === "confirm") {
    try {
      await cartApi.clear(row.userId)
      VXETable.modal.message({ content: "该用户购物车已清空", status: "success" })
      gridRef.value?.commitProxy("query")
    } catch {
      VXETable.modal.message({ content: "操作失败", status: "error" })
    }
  }
}

function parseSpec(specData: any) {
  try {
    return typeof specData === 'string' ? JSON.parse(specData) : specData
  } catch {
    return []
  }
}
</script>

<template>
  <div class="table-container">
    <vxe-grid ref="gridRef" v-bind="gridOptions">

      <template #user_total_default="{ row }">
        <span class="total-text">¥{{ row.totalPrice?.toFixed(2) }}</span>
      </template>

      <template #expand_content="{ row }">
        <div class="expand-wrapper">
          <vxe-table :data="row.cartItems" border size="mini" :row-config="{height: 55}">
            <vxe-column field="productPic" title="商品图片" width="100">
              <template #default="{ row: item }">
                <el-image :src="`/api${item.productPic}`" class="sub-img" fit="cover" />
              </template>
            </vxe-column>
            <vxe-column field="productName" title="商品详情" min-width="250" />
            <vxe-column field="productAttr" title="规格属性" width="220" >
              <template #default="{ row: item }">
                <div class="spec-tags">
                  <el-tag v-for="(spec, idx) in parseSpec(item.productAttr)" :key="idx" size="small">
                    {{ spec.key }}: {{ spec.value }}
                  </el-tag>
                </div>
              </template>
            </vxe-column>
            <vxe-column field="price" title="单价" width="120">
              <template #default="{ row: item }">¥{{ item.price }}</template>
            </vxe-column>
            <vxe-column field="quantity" title="数量" width="100" align="center" />
            <vxe-column title="小计" width="120">
              <template #default="{ row: item }">
                <span class="sub-total">¥{{ (item.price * item.quantity).toFixed(2) }}</span>
              </template>
            </vxe-column>
            <vxe-column title="操作" width="80" fixed="right" v-if="checkPermission(['ROOT'])">
              <template #default="{ row: item }">
                <vxe-button mode="text" status="danger" icon="vxe-icon-delete" @click="handleDeleteItem(item)" />
              </template>
            </vxe-column>
          </vxe-table>
        </div>
      </template>

      <template #user_action="{ row }">
        <el-button type="danger" link size="small" @click="handleClearCart(row)">一键清空</el-button>
      </template>

    </vxe-grid>
  </div>
</template>

<style lang="scss" scoped>
.table-container { height: 100%; padding: 10px; overflow: hidden; }
.expand-wrapper { padding: 15px; }
.sub-img { width: 50px; height: 50px; border-radius: 4px; }
.sub-total { color: #f56c6c; font-weight: bold; }
.total-text { color: #f56c6c; font-size: 16px; font-weight: bold; }
</style>
