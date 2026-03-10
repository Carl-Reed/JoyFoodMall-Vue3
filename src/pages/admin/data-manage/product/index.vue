<script setup lang="ts">
import type { VxeGridInstance, VxeGridListeners, VxeGridProps } from "vxe-table"
import defaultProductIcon from "@@/assets/images/product/default-product.png"
import { storeToRefs } from "pinia"
import { reactive, ref } from "vue"
import { useRouter } from "vue-router"
import VXETable from "vxe-table"
import { useCategoryStore } from "@/pinia/stores/category"
import { productApi } from "./apis"

// ===================== 类型定义 & 基础变量 =====================
const router = useRouter()
const gridRef = ref<VxeGridInstance>()
const categoryStore = useCategoryStore()
const { categoryTree } = storeToRefs(categoryStore)
/** 控制整个侧边栏是否物理折叠 */
const isSideCollapsed = ref(false)
/** 控制分类栏是否展开 */
const isExpand = ref(false)

const gridOptions = reactive<VxeGridProps>({
  border: true,
  keepSource: true,
  height: "100%",
  rowConfig: { height: 50 },

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
      categoryName: "",
      categoryId: null
    },
    items: [
      { field: "productName", title: "商品名称", span: 6, itemRender: { name: "VxeInput", props: { placeholder: "输入名称查询" } } },
      { field: "categoryName", title: "当前分类", span: 6, itemRender: { name: "VxeInput", props: { placeholder: "请从左侧选择分类", readonly: true } } },
      { span: 12, align: "left", itemRender: { name: "$buttons", children: [{ props: { type: "submit", content: "查询", status: "primary" } }, { props: { type: "reset", content: "重置" } }] } }
    ]
  },

  toolbarConfig: {
    buttons: [
      { code: "add", name: "新增商品", status: "primary", icon: "vxe-icon-add" },
      { code: "batch_delete", name: "批量删除", status: "danger" }
    ],
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
        // 获取搜索表单数据
        const formData = gridOptions.formConfig!.data

        const res = await productApi.getList({
          page: page.currentPage,
          limit: page.pageSize,
          productName: formData?.productName || "",
          categoryId: formData?.categoryId || null
        })
        return res
      }
    }
  },

  // 列配置
  columns: [
    { type: "checkbox", width: 50 },
    { type: "seq", width: 60, title: "序号" },
    { field: 'expand', type: 'expand', width: 60, align: 'center', slots: { content: 'expandContent' } },
    { field: "pic", title: "图片", width: 80, slots: { default: "pic_default" } },
    { field: "productName", title: "商品名称", minWidth: 200 },
    { field: "price", title: "价格", width: 120, slots: { default: "price_default" } },
    { field: "unit", title: "单位", width: 80 },
    { field: "salesActual", title: "实际销量", width: 90 },
    { field: "salesShow", title: "展示销量", width: 90 },
    { field: "isPublish", title: "状态", width: 70, slots: { default: "publish_default" } },
    { field: "isNew", title: "新品", width: 70, slots: { default: "new_default" } },
    { field: "isRecommend", title: "推荐", width: 70, slots: { default: "recommend_default" } },
    { field: "stock", title: "总库存", width: 100, slots: { default: "stock_default" } },
    { field: 'optionTime', title: '操作审计', width: 200, slots: { default: 'audit_default' } },
    { title: "操作", width: 90, fixed: "right", slots: { default: "action_default" } }
  ]
})


const subGridOptions = reactive<VxeGridProps>({
  border: true,
  showOverflow: true,
  size: 'mini',
columns: [
    { field: 'pic', title: '关联规格图', width: 100, align: 'center', slots: { default: 'sub_pic_default' } },
    { field: 'skuName', title: '规格名称', width: 200 },
    { field: 'skuCode', title: 'SKU编码', width: 160 },
    { field: 'price', title: '销售价', width: 100, slots: { default: 'sub_price_default' } },
    { field: 'promotionPrice', title: '促销价', width: 100, slots: { default: 'sub_promotionPrice_default' } },
    { field: 'specData', title: '规格项', minWidth: 120, slots: { default: 'spec_default' } },
    { field: 'stock', title: '库存', width: 100, align: 'center', slots: { default: 'sub_stock_default' } },
    { field: 'lowStock', title: '库存预警', width: 100, align: 'center' },
    { field: 'status', title: '状态', width: 120, align: 'center', slots: { default: 'statusDefault' } }
  ]
})
// ===================== 表格事件 =====================
const gridEvents: VxeGridListeners = {
  /** 判断点击的按钮并做出相应操作 */
  async toolbarButtonClick({ code }) {
    if (code === "add") {
      router.push({ name: "ProductAdd" })
    } else if (code === "batch_delete") {
      const selectRecords = gridRef.value?.getCheckboxRecords()
      if (selectRecords?.length) {
        const type = await VXETable.modal.confirm(`确定要删除选中的 ${selectRecords.length} 项吗？`)
        if (type === "confirm") {
          try {
            // 提取 ID 数组
            const ids = selectRecords.map(row => row.id)
            await productApi.batchDelete(ids)

            VXETable.modal.message({ content: "批量删除成功", status: "success" })
            gridRef.value?.commitProxy("query")
          } catch (err: any) {
            VXETable.modal.message({ content: err.message || "删除失败", status: "error" })
          }
        }
      } else {
        VXETable.modal.message({ content: "请至少选择一项", status: "warning" })
      }
    }
  },

  /** 监听行展开事件实现懒加载 */
  async toggleRowExpand({ row, expanded }) {
    // 只有在展开且当前没有数据时才进行查询
    if (expanded && (!row.subList || row.subList.length === 0)) {
      try {
        // 调用后端接口，根据 SPU 的 id 查询 SKU 列表
        const res = await productApi.getSkuListBySpuId(row.id);
        // 将查询到的结果赋值给当前行的 subList
        row.subList = res.data;
      } catch {
        VXETable.modal.message({ content: "加载SKU列表失败", status: "error" });
      }
    }
  }
}

// ===================== 数据操作 =====================
/** 删除逻辑 */
async function handleDelete(row: any) {
  const type = await VXETable.modal.confirm(`您确定要删除商品【${row.productName}】吗？`)
  if (type === "confirm") {
    try {
      await productApi.delete(row.id)
      VXETable.modal.message({ content: "删除成功", status: "success" })
      gridRef.value?.commitProxy("query") // 刷新列表
    } catch {
      VXETable.modal.message({ content: "删除失败", status: "error" })
    }
  }
}

/** 编辑逻辑 */
function handleEdit(row: any) {
  router.push({
    name: "ProductEdit",
    params: { id: row.id }
  })
}

/** 分类栏点击，数据同步至搜索栏 */
function handleCategoryClick(data: any) {
  // 同时更新 ID 和名称
  const formData = gridOptions.formConfig!.data

  if (formData) {
    formData.categoryId = data.categoryId === 0 ? null : data.categoryId
    formData.categoryName = data.categoryName
  }

  // 自动触发查询
  gridRef.value?.commitProxy("query")
}

/** 统一处理开关切换 */
async function handleStatusChange(row: any, field: 'isPublish' | 'isNew' | 'isRecommend') {
  const targetValue = row[field]; // 获取 switch 改变后的新值

  try {
    const res = await productApi.updateSwitch(row.id, field, targetValue);
    if (res.code === 200) {
      VXETable.modal.message({ content: "操作成功", status: "success" });
    } else {
      VXETable.modal.message({ content: res.message || "操作失败", status: "error" });
    }
  } catch {
    // 失败处理：回滚前端状态（1变0，0变1）
    row[field] = targetValue === 1 ? 0 : 1;
    VXETable.modal.message({ content: "操作失败，状态已回滚", status: "error" });
  }
}

/** 切换SKU状态 */
async function toggleSKUPublish(row: any){
  const newStatus = row.isPublish === 1 ? 1 : 0
  try {
    await productApi.updateSKUPublish({ id: row.id, isPublish: newStatus })
    row.isPublish = newStatus
    VXETable.modal.message({ content: "状态更新成功", status: "success" })
  } catch {
    VXETable.modal.message({ content: "操作失败", status: "error" })
  }
}

/** 解析规格 JSON */
function parseSpec(specData: string | any[]) {
  if (!specData) return []
  try {
    // 如果后端存的是字符串，则解析；如果是对象则直接返回
    const list = typeof specData === 'string' ? JSON.parse(specData) : specData
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

// ===================== 初始化 =====================
onMounted(() => {
  // 若类别缓存数据为空，则加载类别缓存数据
  if (categoryStore.categoryTree.length === 0) {
    categoryStore.loadCategoryTree()
  }
})
</script>

<template>
  <div class="product-page-container">
    <!-- 左侧类别栏 -->
    <div class="category-sidebar" :class="{ 'is-side-collapsed': isSideCollapsed }">
      <div class="side-collapse-btn" @click="isSideCollapsed = !isSideCollapsed">
        <i :class="isSideCollapsed ? 'vxe-icon-arrow-right' : 'vxe-icon-arrow-left'" />
      </div>

      <div class="sidebar-inner" v-show="!isSideCollapsed">
        <div class="sidebar-title">
          商品分类
          <vxe-button
            mode="text" :title="isExpand ? '收起' : '展开'"
            :icon="isExpand ? 'vxe-icon-square-down' : 'vxe-icon-square-up'"
            @click="isExpand = !isExpand"
          />
        </div>
        <el-tree
          :key="isExpand ? 'expand' : 'collapse'"
          :data="categoryTree"
          @node-click="handleCategoryClick"
          :default-expand-all="isExpand"
          highlight-current
          :props="{ label: 'categoryName', children: 'children' }"
        />
      </div>
    </div>
    <!-- 右侧表格区域 -->
    <div class="product-page-wrapper">
      <vxe-grid ref="gridRef" v-bind="gridOptions" v-on="gridEvents">
        <!-- 商品主图插槽 -->
        <template #pic_default="{ row }">
          <el-image v-if="row.pic" :src="`/api${row.pic}`" style="width: 40px; height: 40px; object-fit: contain;" :preview-src-list="[`/api${row.pic}`]" />
          <img v-else :src="defaultProductIcon" style="width: 40px; height: 40px; object-fit: contain;">
        </template>

        <!-- 价格插槽 -->
        <template #price_default="{ row }">
          <span style="color: rgb(51, 136, 255); font-weight: bold;">
            <template v-if="(row.minPrice === row.maxPrice) && row.minPrice !== null">
              ¥{{ row.minPrice }}
            </template>
            <template v-else-if="row.maxPrice === null">
              暂无价格
            </template>
            <template v-else>
              ¥{{ row.minPrice }} ~ ¥{{ row.maxPrice }}
            </template>
          </span>
        </template>

        <!-- 总库存插槽 -->
        <template #stock_default="{ row }">
          <el-tag :type="row.totalStock < 10 ? 'danger' : 'success'" >
            {{ row.totalStock }}
          </el-tag>
        </template>

        <!-- 商品状态插槽 -->
        <template #publish_default="{ row }">
          <el-switch
          v-model="row.isPublish" :active-value="1" :inactive-value="0"
          inline-prompt active-text="在售" inactive-text="下架"
          @change="handleStatusChange(row, 'isPublish')"
        />
        </template>

        <!-- 新品插槽 -->
        <template #new_default="{ row }">
          <el-switch
            v-model="row.isNew" :active-value="1" :inactive-value="0" inline-prompt active-text="新品"
            inactive-text="非新" @change="handleStatusChange(row, 'isNew')" />
        </template>

        <!-- 推荐插槽 -->
        <template #recommend_default="{ row }">
          <el-switch
            v-model="row.isRecommend" :active-value="1" :inactive-value="0" inline-prompt active-text="推荐"
            inactive-text="非推" @change="handleStatusChange(row, 'isRecommend')" />
        </template>

        <!-- 操作审计插槽 -->
        <template #audit_default="{ row }">
        <div class="audit-cell">
          <div class="audit-row">
            <span class="label">创建:</span> {{ row.createTime }}
            <span class="user">({{ row.createBy || 'System' }})</span>
          </div>
          <div class="audit-row">
            <span class="label">更新:</span> {{ row.updateTime }}
            <span class="user">({{ row.updateBy || '-' }})</span>
          </div>
        </div>
        </template>

        <!-- 操作按钮插槽 -->
        <template #action_default="{ row }">
          <vxe-button mode="text" size="medium" icon="vxe-icon-edit" status="success" title="编辑" @click="handleEdit(row)" />
          <vxe-button mode="text" size="medium" icon="vxe-icon-delete" status="danger" title="删除" @click="handleDelete(row)" />
        </template>


        <!-- 展开商品规格插槽 -->
        <template #expandContent="{ row }">
          <div style="padding: 15px;">
            <vxe-grid v-bind="subGridOptions" :data="row.subList" v-loading="!row.subList">

            <template #sub_pic_default="{ row: subRow }">
              <el-image
                v-if="subRow.pic" :src="`/api${subRow.pic}`"
                style="width: 30px; height: 30px; border-radius: 2px;" :preview-src-list="[`/api${subRow.pic}`]"
                preview-teleported />
              <img v-else :src="defaultProductIcon" style="width: 30px; height: 30px; border-radius: 2px;">
            </template>

            <template #sub_price_default="{ row: subRow  }">
              <span v-if="subRow.price" style="color: rgb(51, 136, 255); font-weight: bold;">¥{{ subRow.price }}</span>
              <span v-else>-</span>
            </template>

            <template #sub_promotionPrice_default="{ row: subRow  }">
              <span v-if="subRow.promotionPrice" style="color: rgb(102, 195, 64); font-weight: bold;">¥{{ subRow.promotionPrice }}</span>
              <span v-else>-</span>
            </template>

            <template #sub_stock_default="{ row: subRow }">
              <el-tag :type="subRow.stock < subRow.lowStock ? 'danger' : 'success'" size="small">
                {{ subRow.stock }}
              </el-tag>
            </template>

            <template #spec_default="{ row: subRow }">
              <div class="spec-tags">
                <el-tag
                  v-for="(item, index) in parseSpec(subRow.spData)" :key="index" size="small" effect="plain"
                  style="margin-right: 5px;">
                  {{ item.key }}: {{ item.value }}
                </el-tag>
              </div>
            </template>

              <template #statusDefault="{ row: subRow }">
                <el-switch
                  v-model="subRow.isPublish" :active-value="1" :inactive-value="0"
                  inline-prompt active-text="在售"
                  inactive-text="下架" @change="toggleSKUPublish(subRow)" />
              </template>
            </vxe-grid>
          </div>

        </template>
      </vxe-grid>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.product-page-container {
  display: flex;
  padding: 15px;
  gap: 15px;
  height: 100%;
  overflow: hidden;
  position: relative;
}

.category-sidebar {
  width: 220px;
  background: var(--el-bg-color);
  border-radius: 4px;
  padding: 15px;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); // 添加平滑动画
  box-shadow: var(--el-box-shadow-light);

  // 物理折叠样式
  &.is-side-collapsed {
    width: 0;
    padding-left: 0;
    padding-right: 0;
    margin-left: -15px; // 抵消父级 gap 的一部分，让它贴边
    border: none;

    .sidebar-inner {
      display: none;
    }
  }

  .sidebar-inner {
    width: 190px; // 固定内部宽度，防止动画时挤压文字
    overflow: hidden;
  }

  // 悬浮折叠按钮
  .side-collapse-btn {
    position: absolute;
    right: -12px; // 一半在内一半在外
    top: 50%;
    transform: translateY(-50%);
    width: 24px;
    height: 50px;
    background: var(--el-color-primary-light-9);
    border: 1px solid var(--el-color-primary-light-7);
    border-radius: 0 8px 8px 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--el-color-primary);
    z-index: 10;
    box-shadow: 2px 0 4px rgba(0,0,0,0.1);

    &:hover {
      background: var(--el-color-primary);
      color: #fff;
    }
  }

  .sidebar-title {
    font-weight: bold;
    margin-bottom: 15px;
    padding-bottom: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    white-space: nowrap;
  }
}

.product-page-wrapper {
  flex: 1; // 占据右侧所有空间
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding-bottom: 15px;
  transition: all 0.3s;
}

.audit-cell {
  text-align: left;
  font-size: 12px;
  line-height: 1.4;

  .audit-row {
    white-space: nowrap;
    .label { color: #999; }
    .user { color: #409eff; margin-left: 4px; }
  }
}

:deep(.vxe-grid) {
  height: 100%;
}
</style>
