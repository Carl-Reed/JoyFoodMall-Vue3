<script lang="ts" setup>
import type { VxeGridInstance, VxeGridProps } from "vxe-table"
import { storeToRefs } from 'pinia'
import { nextTick, reactive, ref } from "vue"
import VXETable from "vxe-table"
import { useCategoryStore } from "@/pinia/stores/category"
import { categoryApi } from "./apis"

defineOptions({ name: "CategoryManage" })

// 类别数据源
const categoryStore = useCategoryStore()
const { categoryTree } = storeToRefs(categoryStore)

// ===================== 类型定义 =====================
interface CategoryVO {
  categoryId: number
  parentId: number
  categoryName: string
  description: string
  sortOrder: number
  isEnable: number
  children?: CategoryVO[]
}

// ===================== 状态变量 =====================
const gridRef = ref<VxeGridInstance<CategoryVO>>()
const showEditModal = ref(false)
const isEditMode = ref(false)
const submitLoading = ref(false)
const isExpand = ref(false)

/** 搜索表单数据 */
const formData = reactive({
  categoryId: 0,
  parentId: 0,
  categoryName: "",
  description: "",
  sortOrder: 0,
  isEnable: 1
})

/** 搜索表单规则 */
const formRules = reactive({
  categoryName: [{ required: true, message: "请输入分类名称" }],
  sortOrder: [{ required: true, message: "请输入排序值" }]
})

// ===================== 表格配置 =====================
const gridOptions = reactive<VxeGridProps<CategoryVO>>({
  border: true,
  size: "small",
  height: "100%",
  align: "center",
  keepSource: true,
  rowConfig: { height: 50 },

  // 开启虚拟滚动
  scrollY: {
    enabled: true,
    gt: 100 // 当数据超过100条时自动启用虚拟渲染
  },

  // 树形配置
  treeConfig: {
    transform: true, // 启用平铺转树形
    rowField: "categoryId",
    parentField: "parentId",
    expandAll: false
  },

  // 工具栏配置
  toolbarConfig: {
    refresh: true,
    zoom: true,
    custom: true,
    slots: { buttons: "toolbar_buttons" }
  },

  // 搜索表单配置
  formConfig: {
    titleWidth: 100,
    titleAlign: "right",
    items: [
      { field: "categoryName", title: "分类名称", itemRender: { name: "VxeInput", props: { placeholder: "模糊搜索" } } },
      {
        field: "isEnable",
        title: "状态",
        itemRender: {
          name: "VxeSelect",
          options: [
            { label: "全部", value: null },
            { label: "启用", value: 1 },
            { label: "停用", value: 0 }
          ]
        }
      },
      {
        itemRender: {
          name: "$buttons",
          children: [
            { props: { type: "submit", content: "查询", status: "primary" } },
            { props: { type: "reset", content: "重置" } }
          ]
        }
      }
    ]
  },
  // 列配置
  columns: [
    { field: "sortOrder", title: "排序", width: 150, slots: { default: "sort_default" } },
    { field: "categoryName", title: "分类名称", treeNode: true, align: "left", minWidth: 200, width: 240 },
    { field: "description", title: "描述", minWidth: 200 },
    { field: "isEnable", title: "状态", width: 100, slots: { default: "enable_slot" } },
    { field: 'updateTime', title: '更新时间', width: 240, slots: { default: 'updateTimeDefault' } },
    { title: "操作", width: 120, fixed: "right", slots: { default: "operate_slot" } }
  ],

  // 代理配置
  proxyConfig: {
    form: true,
    props: {
      result: "data"
    },
    ajax: {
      query: async ({ form }) => {
        const params = { searchText: form.categoryName || "", isEnable: form.isEnable }
        const res = await categoryApi.getList(params)
        return res.data
      }
    }
  }
})

// ===================== 操作逻辑 =====================

/** 打开新增顶级分类弹窗 */
function handleAddRoot() {
  isEditMode.value = false
  resetForm()
  formData.parentId = 0
  showEditModal.value = true
}

/** 打开新增子分类弹窗 */
function handleAddSub(row: CategoryVO) {
  isEditMode.value = false
  resetForm()
  formData.parentId = row.categoryId
  showEditModal.value = true
}

/** 打开修改分类弹窗并回填数据 */
function handleEdit(row: CategoryVO) {
  isEditMode.value = true
  Object.assign(formData, row)
  showEditModal.value = true
}

/** 删除分类 */
async function handleDelete(row: CategoryVO) {
  // 若有子分类，则不能删除
  if (row.children && row.children.length > 0) {
    VXETable.modal.message({ content: "请先删除该分类下的子分类", status: "warning" })
    return
  }
  const type = await VXETable.modal.confirm(`确定删除分类“${row.categoryName}”？`)
  if (type === "confirm") {
    await categoryApi.delete(row.categoryId)
    VXETable.modal.message({ content: "删除成功", status: "success" })
    reloadKeepExpand()
  }
}

/** 提交表单 */
async function submitEvent() {
  submitLoading.value = true
  try {
    if (isEditMode.value) {
      await categoryApi.edit(formData)
    } else {
      await categoryApi.add(formData)
    }
    VXETable.modal.message({ content: "操作成功", status: "success" })
    showEditModal.value = false
    categoryStore.loadCategoryTree()
    reloadKeepExpand()
  } finally {
    submitLoading.value = false
  }
}

/** 切换状态按钮修改状态 */
async function handleStatusChange(row: CategoryVO) {
  try {
    await categoryApi.edit({ categoryId: row.categoryId, isEnable: row.isEnable })
    VXETable.modal.message({ content: "状态已更新", status: "success" })
    gridRef.value?.updateData()
  } catch {
    row.isEnable = row.isEnable === 1 ? 0 : 1
  }
}

// ===================== 工具方法 =====================
/** 重置表单 */
function resetForm() {
  Object.assign(formData, { categoryId: 0, parentId: 0, categoryName: "", description: "", sortOrder: 0, isEnable: 1 })
}

/** 展开/折叠树形数据结构 */
function expandTree() {
  if (isExpand.value) {
    gridRef.value?.setAllTreeExpand(false)
  }else{
    gridRef.value?.setAllTreeExpand(true)
  }
  isExpand.value = !isExpand.value
}

/** 重新加载数据并保持展开状态 */
async function reloadKeepExpand() {
  const grid = gridRef.value
  if (!grid) return

  // 记录当前展开节点的 ID
  const expandRecords = grid.getTreeExpandRecords()
  const expandIds = expandRecords.map(item => item.categoryId)

  // 重新拉取后端数据
  await grid.commitProxy("query")

  // 等待数据合并到表格后，根据 ID 找回新行并展开
  nextTick(() => {
    const { fullData } = grid.getTableData() // 获取刷新后的全量数据
    const newExpandRecords = fullData.filter(item => expandIds.includes(item.categoryId))
    if (newExpandRecords.length > 0) {
      grid.setTreeExpand(newExpandRecords, true)
    }
  })
}

// ===================== 初始化 =====================
onMounted(() => {
  // 若类别缓存数据为空，则加载类别缓存数据
  if (categoryStore.categoryTree.length===0) {
    categoryStore.loadCategoryTree()
  }
})
</script>

<template>
  <div class="table-container">
    <vxe-grid ref="gridRef" v-bind="gridOptions">
      <!-- 工具栏按钮插槽 -->
      <template #toolbar_buttons>
        <vxe-button status="primary" icon="vxe-icon-add" @click="handleAddRoot">
          新增顶级分类
        </vxe-button>
        <vxe-button
        @click="expandTree"
        :icon="isExpand ? 'vxe-icon-square-up' : 'vxe-icon-square-down'"
        :content="isExpand ? '全部折叠' : '全部展开'" status="success"
        />
      </template>

      <!-- 排序列插槽 -->
      <template #sort_default="{ row, level }">
        <div :style="{ paddingLeft: `${level * 20}px` }" class="tree-sort-cell">
          <span>{{ row.sortOrder }}</span>
        </div>
      </template>

      <!-- 状态列插槽 -->
      <template #enable_slot="{ row }">
        <el-switch
          v-model="row.isEnable"
          :active-value="1"
          :inactive-value="0"
          inline-prompt
          active-text="启用"
          inactive-text="停用"
          @change="handleStatusChange(row)"
        />
      </template>

      <!-- 更新时间插槽 -->
      <template #updateTimeDefault="{ row }">
        <el-tag>{{ row.updateTime }}</el-tag>
      </template>

      <!-- 操作列插槽 -->
      <template #operate_slot="{ row }">
        <vxe-button mode="text" status="primary" icon="vxe-icon-add" title="添加子类" @click="handleAddSub(row)" />
        <vxe-button mode="text" status="success" icon="vxe-icon-edit" title="编辑" @click="handleEdit(row)" />
        <vxe-button mode="text" status="danger" icon="vxe-icon-delete" title="删除" @click="handleDelete(row)" />
      </template>
    </vxe-grid>

    <!-- 新增/编辑分类弹窗 -->
    <vxe-modal v-model="showEditModal" :title="isEditMode ? '编辑分类' : '新增分类'" width="500" :loading="submitLoading" destroy-on-close draggable resize>
      <vxe-form :data="formData" :rules="formRules" title-align="right" title-width="100" @submit="submitEvent">
        <vxe-form-item title="上级分类" field="parentId" span="24">
          <el-tree-select
            v-model="formData.parentId"
            :data="categoryTree"
            :props="{ label: 'categoryName', value: 'categoryId', children: 'children' }"
            check-strictly
            placeholder="请选择上级（不选则为顶级）"
            style="width: 100%"
            clearable
            :teleported="false"
          />
        </vxe-form-item>
        <vxe-form-item title="分类名称" field="categoryName" span="24">
          <vxe-input v-model="formData.categoryName" />
        </vxe-form-item>
        <vxe-form-item title="排序" field="sortOrder" span="24">
          <vxe-input v-model="formData.sortOrder" type="number" />
        </vxe-form-item>
        <vxe-form-item title="描述" field="description" span="24">
          <vxe-textarea v-model="formData.description" />
        </vxe-form-item>
        <vxe-form-item align="center" span="24">
          <vxe-button type="submit" status="primary">保存</vxe-button>
          <vxe-button @click="showEditModal = false">取消</vxe-button>
        </vxe-form-item>
      </vxe-form>
    </vxe-modal>
  </div>
</template>

<style scoped>
.table-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  padding: 10px;
  overflow: hidden;
}
.vxe-grid {
  margin: 0 auto;
  width: 100%;
  padding-top: 20px;
}
</style>
