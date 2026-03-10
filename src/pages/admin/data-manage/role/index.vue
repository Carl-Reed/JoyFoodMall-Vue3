<script lang="ts" setup>
import type { VxeGridInstance, VxeGridProps } from "vxe-table"
import { reactive, ref } from "vue"
import VXETable from "vxe-table"
import { roleApi } from "./apis"

defineOptions({
  name: "RoleManage"
})

// ===================== 类型定义 & 基础变量 =====================
interface RoleVO {
  id: number
  roleName: string
  roleDesc: string
  isDeleted: number
}

const gridRef = ref<VxeGridInstance<RoleVO>>()
const formRef = ref()

/** 查询参数 */
const params = reactive({
  page: 1,
  limit: 10,
  searchField: "",
  searchText: ""
})

/** 搜索表单 */
const searchForm = reactive({
  searchField: "roleName",
  searchText: ""
})

// ===================== 数据操作方法 =====================

/** 弹窗控制 */
const showEditModal = ref(false)
const isEditMode = ref(false)
const submitLoading = ref(false)

const formData = reactive({
  roleName: "",
  roleDesc: ""
})

/** 表单校验规则 */
const formRules = reactive({
  roleName: [
    { required: true, message: "请输入角色名称" },
    { pattern: /^ROLE_+./, message: "角色名称必须以 ROLE_ 开头" }
  ],
  roleDesc: [
    { required: true, message: "请输入角色描述" }
  ]
})

/** 打开新建角色弹窗 */
function handleAdd() {
  isEditMode.value = false
  showEditModal.value = true
  Object.assign(formData, { id: 0, roleName: "ROLE_", roleDesc: "", isDeleted: 0 })
}

/** 打开编辑角色弹窗 */
function handleEdit(row: RoleVO) {
  isEditMode.value = true
  showEditModal.value = true
  Object.assign(formData, { ...row })
}

/** 提交表单 */
async function submitEvent() {
  const $form = formRef.value
  if (await $form.validate()) return
  submitLoading.value = true

  try {
    const api = isEditMode.value ? roleApi.edit : roleApi.add
    const res = await api(formData)
    VXETable.modal.message({ content: res.message || "操作成功", status: "success" })
    showEditModal.value = false
    gridRef.value?.commitProxy("query")
  } catch (error: any) {
    VXETable.modal.message({ content: error.message || "操作失败", status: "error" })
  } finally {
    submitLoading.value = false
  }
}

/** 重置表单 */
function resetEvent (){
  Object.assign(formData, { roleName: "ROLE_", roleDesc: "" })
}

/** 自动构建可搜索字段 */
const searchableFields = computed(() => {
  const columns = gridOptions.columns
  const EXCLUDED_COLUMN_TYPES = ["seq"] // 排除的列类型
  const EXCLUDED_TITLES = ["操作","操作时间"] // 排除的列标题
  if (!columns) return []
  return gridOptions.columns!
    .filter((col) => {
      // 若无字段名，则跳过
      if (!col.field) return false
      // 排除特定类型、字段名和标题的列
      if (
        EXCLUDED_COLUMN_TYPES.includes(col.type!)
        || EXCLUDED_TITLES.includes(col.title as string)
      ) {
        return false
      }
      return true
    })
    .map(col => ({
      value: col.field,
      label: col.title || col.field
    }))
})

// ===================== 表格配置 =====================
const gridOptions = reactive<VxeGridProps<RoleVO>>({
  border: true,
  size: "small",
  height: "100%",
  align: "center",
  showOverflow: true,
  rowConfig: { height: 50 },
  pagerConfig: { pageSize: 10, pageSizes: [10, 20, 50] },
  toolbarConfig: {
    custom: true,
    zoom: true,
    refresh: true,
    slots: { buttons: "toolbar_buttons", tools: "toolbar_tools" }
  },
  columns: [
    { type: "seq", title: "序号", width: 70 },
    { field: "roleName", title: "角色名称", minWidth: 150 },
    { field: "roleDesc", title: "角色描述", minWidth: 200 },
    { field: 'optionTime', title: '操作时间', width: 240, slots: { default: 'optionTimeDefault' } },
    { title: "操作", width: 120, fixed: "right", slots: { default: "operationDefault" } }
  ],
  proxyConfig: {
    response: {
      result: "data", // 接口返回的数组路径
      total: "total" // 总数路径
    },
    ajax: {
      async query({ page }) {
        params.page = page.currentPage
        params.limit = page.pageSize
        params.searchField = searchForm.searchField
        params.searchText = searchForm.searchText

        const response = await roleApi.getList(params)
        return {
          data: response.data.rows,
          total: response.data.total
        }
      }
    }
  }
})
</script>

<template>
  <div class="table-container">
    <vxe-grid ref="gridRef" v-bind="gridOptions">
      <!-- 工具栏按钮插槽 -->
      <template #toolbar_buttons>
        <vxe-button icon="vxe-icon-add" status="primary" @click="handleAdd">新增角色</vxe-button>
      </template>

      <!-- 搜索栏插槽 -->
      <template #toolbar_tools>
        <vxe-form @submit="gridRef?.commitProxy('query')">
          <vxe-form-item field="searchField">
            <template #default>
              <vxe-select v-model="searchForm.searchField" placeholder="请选择字段" style="width: 95px;">
                <vxe-option
                  v-for="field in searchableFields"
                  :key="field.value"
                  :value="field.value"
                  :label="field.label"
                />
              </vxe-select>
            </template>
          </vxe-form-item>
          <vxe-form-item>
            <vxe-input v-model="searchForm.searchText" placeholder="请输入查询内容" clearable />
          </vxe-form-item>
          <vxe-form-item>
            <vxe-button type="submit" status="primary" content="查询" />
          </vxe-form-item>
        </vxe-form>
      </template>

      <!-- 操作时间插槽 -->
      <template #optionTimeDefault="{ row }">
        <div>创建时间：{{ row.createTime }}</div>
        <div>更新时间：{{ row.updateTime }}</div>
      </template>

      <!-- 操作列插槽 -->
      <template #operationDefault="{ row }">
        <vxe-button mode="text" icon="vxe-icon-edit" title="编辑" @click="handleEdit(row)" status="success" />
      </template>
    </vxe-grid>

    <!-- 新增编辑/角色弹窗 -->
    <vxe-modal v-model="showEditModal" :title="isEditMode ? '编辑角色' : '新增角色'" width="500" destroy-on-close>
      <vxe-form ref="formRef" :data="formData" :rules="formRules" title-width="100" @submit="submitEvent">
        <vxe-form-item title="角色名称" field="roleName" span="24">
          <vxe-input v-model="formData.roleName" placeholder="必须以 ROLE_ 开头" :disabled="isEditMode" />
        </vxe-form-item>
        <vxe-form-item title="角色描述" field="roleDesc" span="24">
          <vxe-input v-model="formData.roleDesc" placeholder="请输入描述" />
        </vxe-form-item>
        <vxe-form-item align="center" span="24">
          <vxe-button type="submit" status="primary" :loading="submitLoading">提交</vxe-button>
          <vxe-button @click="resetEvent" v-if="!isEditMode">重置</vxe-button>
          <vxe-button @click="showEditModal = false">取消</vxe-button>
        </vxe-form-item>
      </vxe-form>
    </vxe-modal>
  </div>
</template>

<style lang="scss" scoped>
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
}
</style>
