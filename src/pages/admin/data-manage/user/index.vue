<script lang="ts" setup>
import type { UploadFile } from "element-plus"
import type { VxeColumnPropTypes, VxeGridInstance, VxeGridProps } from "vxe-table"
import defaultAvatarIcon from "@@/assets/images/user/default-avatar.png"
import { checkPermission } from "@@/utils/permission"
import { reactive, ref } from "vue"
import VXETable from "vxe-table"
import { useUserStore } from "@/pinia/stores/user"
import { userApi } from "./apis"

defineOptions({
  name: "UserManage"
})

const userStore = useUserStore()

// ===================== 类型定义 & 基础变量 =====================
interface RowVO {
  id: number
  avatar: string
  username: string
  email: string
  phone: string
  enabled: number
  accountNonExpired: number
  accountNonLocked: number
  credentialsNonExpired: number
  createTime: string
  lastLogin: string
  /** 不存在于数据库 */
  // avatarUrl?: string
}

const gridRef = ref<VxeGridInstance<RowVO>>()

/** 查询参数 */
const params = reactive({
  page: 1,
  limit: 10,
  searchField: "",
  searchText: ""
})

/** 账号状态过滤选项 */
const statusOptions: VxeColumnPropTypes.Filter[] = [
  { label: "是", value: 0 },
  { label: "否", value: 1 }
]

/** 搜索参数 */
const searchForm = reactive({
  searchField: "username", // 默认字段
  searchText: ""
})

const currentEditRow = ref<RowVO | null>(null)

// ===================== 工具方法 =====================
/** 自动构建可搜索字段 */
const searchableFields = computed(() => {
  const columns = gridOptions.columns
  const EXCLUDED_COLUMN_TYPES = ["seq"] // 排除的列类型
  const EXCLUDED_FIELD_NAMES = ["avatar", "enabled", "accountNonExpired", "accountNonLocked", "credentialsNonExpired", "createTime", "lastLogin"] // 排除的字段名
  const EXCLUDED_TITLES = ["操作"] // 排除的列标题
  if (!columns) return []
  return gridOptions.columns!
    .filter((col) => {
      // 若无字段名，则跳过
      if (!col.field) return false
      // 排除特定类型、字段名和标题的列
      if (
        EXCLUDED_COLUMN_TYPES.includes(col.type!)
        || EXCLUDED_FIELD_NAMES.includes(col.field)
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

// ===================== 数据操作方法 =====================

// ======== 删除用户功能 ========
async function handleDelete(row: RowVO) {
  const type = await VXETable.modal.confirm({title: "删除确认", content: `确定删除用户【${row.username}】？`})
  if (type === "confirm") {
    await userApi.delete(row.id).then(() => {
      const $grid = gridRef.value
      if ($grid) {
        // 刷新表格数据
        $grid.commitProxy("query")
        VXETable.modal.message({ content: `删除用户“${row.username}”成功`, status: "success" })
      }
    }
    ).catch((error) => {
      const errorMsg = error.message || "删除用户失败，请联系管理员"
      VXETable.modal.message({ content: errorMsg, status: "error" })
    })
  }
}

// ======== 新增/编辑用户 功能 ========

/** 弹窗可见性 */
const showEditModal = ref(false)
/** 当前是否为编辑模式（用于区分标题和API调用） */
const isEditMode = ref(false)
/** 提交按钮 loading 状态 */
const submitLoading = ref(false)
/** 表单实例引用 */
const formRef = ref()

/** 定义表单数据结构 */
const formData = reactive({
  id: 0,
  username: "",
  password: "",
  email: "",
  phone: "",
  avatar: "",
  enabled: 1,
  accountNonExpired: 1,
  accountNonLocked: 1,
  credentialsNonExpired: 1
})

/** 表单校验规则 */
const formRules = reactive({
  username: [
    { required: true, message: "请输入用户名" },
    { min: 2, max: 20, message: "长度在 2 到 20 个字符" }
  ],
  email: [
    { required: true, message: "请输入邮箱" },
    { pattern: /^[\w-]+@[\w-]+\.[\w-]+$/, message: "邮箱格式不正确" }
  ],
  phone: [
    { required: false, message: "请输入手机号" },
    { pattern: /^1[3-9]\d{9}$/, message: "手机号格式不正确" }
  ],
  password: [
    { required: true, message: "请输入密码" },
    { min: 6, max: 20, message: "长度在 6 到 20 个字符" }
  ]
})

/** 打开新增用户弹窗 */
function handleAdd() {
  isEditMode.value = false
  showEditModal.value = true

  // 重置表单数据
  Object.assign(formData, {
    id: 0,
    username: "",
    password: "",
    email: "",
    phone: "",
    avatar: "",
    enabled: 1,
    accountNonExpired: 1,
    accountNonLocked: 1,
    credentialsNonExpired: 1
  })
}

/** 打开编辑弹窗 */
function handleEdit(row: RowVO) {
  isEditMode.value = true
  showEditModal.value = true

  // 回填数据
  Object.assign(formData, row)
}

/** 重置提交表单 */
function resetEvent() {
  Object.assign(formData, {
    username: "",
    password: "",
    email: "",
    phone: "",
    avatar: "",
    enabled: 1,
    accountNonExpired: 1,
    accountNonLocked: 1,
    credentialsNonExpired: 1
  })
}

/** 提交表单 */
async function submitEvent() {
  const $form = formRef.value
  if (!$form) return

  // 校验表单
  const errMap = await $form.validate()
  if (errMap) return // 有错误则停止

  submitLoading.value = true

  try {
    // 根据模式调用不同接口
    if (isEditMode.value) {
      const res = await userApi.edit(formData)
      if (res.code === 200) {
        // 成功提示
        VXETable.modal.message({ content: res.message, status: "success" })
      } else {
        // 修改自己的信息，要求重新登录
        VXETable.modal.message({ content: res.message, status: "info" })
        setTimeout(() => {
          userStore.logout()
          location.reload()
        }, 3000)
      }
    } else {
      const res = await userApi.add(formData)
      VXETable.modal.message({ content: res.message, status: "success" })
    }

    // 关闭弹窗并刷新表格
    showEditModal.value = false
    const $grid = gridRef.value
    if ($grid) {
      $grid.commitProxy("query")
    }
  } catch (error: any) {
    const errorMsg = error.message || "操作失败"
    VXETable.modal.message({ content: errorMsg, status: "error" })
  } finally {
    submitLoading.value = false
  }
}

// ======== 重置用户密码功能 ========
async function handleResetPassword(row: RowVO) {
  const type = await VXETable.modal.confirm({ title:"重置密码确认", content:`确定重置【${row.username}】的密码?` })
  if (type === "confirm") {
    await userApi.resetPassword(row.id).then((res) => {
      const $grid = gridRef.value
      if ($grid) {
        // 刷新表格数据
        $grid.commitProxy("query")
        VXETable.modal.message({ content: "重置密码成功", status: "success" })
        VXETable.modal.confirm({ title:`用户“${row.username}”密码已重置`, content: `密码已重置为：${res.data}` })
      }
    }
  ).catch((error) => {
      const errorMsg = error.message || "重置密码失败，请联系管理员"
      VXETable.modal.message({ content: errorMsg, status: "error" })
    })
  }
}

// ======== 修改用户头像功能 ========
const showEditAvatarModal = ref(false)
// 头像上传相关状态
const avatarUploadLoading = ref(false)
const avatarFile = ref<UploadFile | null>(null)
const avatarPreviewUrl = ref("")

/** 打开修改头像弹窗 */
async function handleEditAvatar(row: RowVO) {
  // 保存当前编辑的用户行
  currentEditRow.value = row
  // 重置上传状态
  avatarFile.value = null
  if (row.avatar) {
    avatarPreviewUrl.value = `${import.meta.env.VITE_BASE_URL}${row.avatar}`
  }
  // 打开弹窗
  showEditAvatarModal.value = true
}

/** 处理头像文件选择 */
function handleAvatarChange(file: UploadFile) {
  if (file.raw) {
    // 限制文件类型和大小
    const isImage = file.raw.type.startsWith('image/')
    const isLt2M = file.raw.size / 1024 / 1024 < 2

    if (!isImage) {
      VXETable.modal.message({ content: '请选择图片格式的文件（jpg/png/gif）', status: 'error' })
      return false
    }
    if (!isLt2M) {
      VXETable.modal.message({ content: '头像文件大小不能超过 2MB', status: 'error' })
      return false
    }

    // 生成预览URL
    avatarFile.value = file
    avatarPreviewUrl.value = URL.createObjectURL(file.raw as Blob)
  }
}

/** 提交头像修改 */
async function submitAvatarChange() {
  if (!currentEditRow.value || !avatarFile.value || !avatarFile.value.raw) {
    VXETable.modal.message({ content: '请选择要上传的头像图片', status: 'warning' })
    return
  }

  avatarUploadLoading.value = true

  try {
    // 构建FormData
    const formData = new FormData()
    formData.append('id', currentEditRow.value.id.toString())
    formData.append('file', avatarFile.value.raw as Blob)

    // 调用上传头像API
    const res = await userApi.uploadAvatar(formData)

    if (res.code === 200) {
      VXETable.modal.message({ content: '头像修改成功', status: 'success' })
      // 若是更新自己的账号，则重新获取用户信息
      if (currentEditRow.value.username === userStore.username) {
        userStore.getInfo()
      }

      // 关闭弹窗
      showEditAvatarModal.value = false
      // 刷新表格数据
      const $grid = gridRef.value
      if ($grid) {
        $grid.commitProxy("query")
      }
    } else {
      VXETable.modal.message({ content: res.message || '头像修改失败', status: 'error' })
    }
  } catch (error: any) {
    VXETable.modal.message({ content: error.message || '头像上传失败，请重试', status: 'error' })
  } finally {
    avatarUploadLoading.value = false
    // 释放预览URL
    if (avatarPreviewUrl.value) {
      avatarPreviewUrl.value = ""
    }
  }
}

/** 取消头像修改 */
function cancelAvatarChange() {
  showEditAvatarModal.value = false
  // 释放预览URL
  if (avatarPreviewUrl.value && currentEditRow.value && avatarPreviewUrl.value !== currentEditRow.value.avatar) {
    avatarPreviewUrl.value = ""
  }
}

// ===================== 角色权限分配功能 =====================
const showRoleModal = ref(false)
const roleSubmitLoading = ref(false)
const allRoleList = ref<any[]>([]) // 所有可用角色
const checkedRoleIds = ref<number[]>([]) // 当前选中的角色ID
const currentRoleUser = ref<RowVO | null>(null) // 当前正在操作的用户

/** 打开分配角色弹窗 */
async function handleAssignRole(row: RowVO) {
  currentRoleUser.value = row
  showRoleModal.value = true
  roleSubmitLoading.value = true

  try {
    // 并行请求：获取所有角色 + 获取当前用户的角色
    const [rolesRes, userRolesRes] = await Promise.all([
      userApi.getAllRoles(),
      userApi.getUserRoleIds(row.id)
    ])

    // 设置数据
    allRoleList.value = rolesRes.data || []
    checkedRoleIds.value = userRolesRes.data || []

  } catch {
    VXETable.modal.message({ content: "获取角色数据失败", status: "error" })
  } finally {
    roleSubmitLoading.value = false
  }
}

/** 提交角色分配 */
async function submitAssignRole() {
  if (!currentRoleUser.value) return

  roleSubmitLoading.value = true
  try {
    await userApi.saveUserRoles({
      userId: currentRoleUser.value.id,
      roleIds: checkedRoleIds.value
    })
    VXETable.modal.message({ content: "角色分配成功", status: "success" })
    showRoleModal.value = false
  } catch (e: any) {
    VXETable.modal.message({ content: e.message || "分配失败", status: "error" })
  } finally {
    roleSubmitLoading.value = false
  }
}

// ===================== 表格核心配置 =====================
const gridOptions = reactive<VxeGridProps<RowVO>>({
  border: true,
  showOverflow: true,
  loading: false,
  size: "small",
  height: "100%",
  maxHeight: "100%",
  align: "center",
  scrollX: {
    enabled: true
  },
  // 列配置
  columnConfig: {
    resizable: true // 列宽拖拽
  },
  // 行配置
  rowConfig: {
    isHover: true, // 悬停高亮
    height: 80
  },
  // 分页配置
  pagerConfig: {
    pageSize: params.limit,
    pageSizes: [10, 20, 50, 100]
  },
  // 工具栏配置
  toolbarConfig: {
    custom: true, // 启用自定义工具栏
    refresh: true, // 显示刷新按钮
    slots: {
      buttons: "toolbar_buttons",
      tools: "toolbar_tools"
    }
  },
  // 列配置
  columns: [
    { type: "seq", title: "序号", width: 70, minWidth: 50 },
    {
      field: "avatar",
      title: "头像",
      width: 120,
      minWidth: 100,
      slots: { default: "avatarDefault" }
    },
    { field: "username", title: "用户名", width: 130, minWidth: 110 },
    { field: "email", title: "邮箱", width: 180, minWidth: 130 },
    { field: "phone", title: "手机号", width: 120, minWidth: 100 },
    {
      field: "enabled",
      title: "账号禁用",
      width: 94,
      minWidth: 94,
      filters: statusOptions,
      slots: { default: "enabledDefault" }
    },
    {
      field: "accountNonExpired",
      title: "账号过期",
      width: 94,
      minWidth: 94,
      filters: statusOptions,
      slots: { default: "accountNonExpiredDefault" }
    },
    {
      field: "accountNonLocked",
      title: "账号锁定",
      width: 94,
      minWidth: 94,
      filters: statusOptions,
      slots: { default: "accountNonLockedDefault" }
    },
    {
      field: "credentialsNonExpired",
      title: "凭证过期",
      width: 94,
      minWidth: 94,
      filters: statusOptions,
      slots: { default: "credentialsNonExpiredDefault" }
    },
    {
      field: "createTime",
      title: "创建时间",
      width: 160,
      minWidth: 160,
      slots: { default: "createTimeDefault" }
    },
    {
      field: "lastLogin",
      title: "上次登录",
      width: 160,
      minWidth: 160,
      slots: { default: "lastLoginDefault" }
    },
    {
      title: "操作",
      showOverflow: false,
      width: 140,
      minWidth: 140,
      fixed: "right",
      slots: { default: "operationDefault" }
    }
  ],
  // 数据代理配置
  proxyConfig: {
    response: {
      result: "data", // 接口返回的数组路径
      total: "total" // 总数路径
    },
    ajax: {
      async query({ page }) {
        // 同步分页参数
        params.page = page.currentPage
        params.limit = page.pageSize

        // 同步搜索参数
        params.searchField = searchForm.searchField
        params.searchText = searchForm.searchText.trim()

        // 调用接口
        const response = await userApi.getList(params)
        if (response.code === 200) {
          const tableData = response.data.rows
          return {
            data: tableData,
            total: response.data.total || tableData.length
          }
        }
        return { data: [], total: 0 }
      }
    }
  }
})
</script>

<template>
  <div class="table-container">
    <vxe-grid
      ref="gridRef"
      v-bind="gridOptions"
      class="vxe-grid"
    >
      <!-- 自定义工具栏按钮插槽 -->
      <template #toolbar_buttons>
        <vxe-button icon="vxe-icon-add" @click="handleAdd" status="primary">新增用户</vxe-button>
      </template>

      <!-- 搜索功能插槽 -->
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
          <vxe-form-item field="searchText">
            <template #default>
              <vxe-input type="text" v-model="searchForm.searchText" placeholder="请输入查询内容" clearable />
            </template>
          </vxe-form-item>
          <vxe-form-item>
            <template #default>
              <vxe-button type="submit" status="primary" content="查询" />
            </template>
          </vxe-form-item>
        </vxe-form>
      </template>

      <!-- 头像列插槽 -->
      <template #avatarDefault="{ row }">
        <vxe-button type="text" title="修改头像" @click="handleEditAvatar(row)">
          <img v-if="row.avatar" :src="`/api${row.avatar}`" style="width: 60px; height: 60px; border-radius: 50%" alt="头像" border="2px solid">
          <img v-else :src="defaultAvatarIcon" style="width: 60px; height: 60px; border-radius: 50%" alt="头像">
        </vxe-button>

      </template>

      <!-- 账号禁用插槽 -->
      <template #enabledDefault="{ row }">
        <el-tag :type="row.enabled === 1 ? 'success' : 'danger'">
          {{ row.enabled === 1 ? '否' : '是' }}
        </el-tag>
      </template>

      <!-- 账号过期插槽 -->
      <template #accountNonExpiredDefault="{ row }">
        <el-tag :type="row.accountNonExpired === 1 ? 'success' : 'danger'">
          {{ row.accountNonExpired === 1 ? '否' : '是' }}
        </el-tag>
      </template>

      <!-- 账号锁定插槽 -->
      <template #accountNonLockedDefault="{ row }">
        <el-tag :type="row.accountNonLocked === 1 ? 'success' : 'danger'">
          {{ row.accountNonLocked === 1 ? '否' : '是' }}
        </el-tag>
      </template>

      <!-- 凭证过期插槽 -->
      <template #credentialsNonExpiredDefault="{ row }">
        <el-tag :type="row.credentialsNonExpired === 1 ? 'success' : 'danger'">
          {{ row.credentialsNonExpired === 1 ? '否' : '是' }}
        </el-tag>
      </template>

      <!-- 创建时间插槽 -->
      <template #createTimeDefault="{ row }">
        <el-tag>
          {{ row.createTime }}
        </el-tag>
      </template>

      <!-- 上次登录插槽 -->
      <template #lastLoginDefault="{ row }">
        <el-tag>
          <span v-if="row.lastLogin">{{ row.lastLogin }}</span>
          <span v-else>从未登录</span>
        </el-tag>
      </template>

      <!-- 操作列插槽 -->
      <template #operationDefault="{ row }">
        <vxe-button mode="text" size="medium" icon="vxe-icon-edit" title="编辑" @click="handleEdit(row)" status="success" />
        <vxe-button mode="text" size="medium" icon="vxe-icon-user-fill" title="分配角色" status="primary" v-if="checkPermission(['ROOT'])" @click="handleAssignRole(row)" />
        <vxe-button mode="text" size="medium" icon="vxe-icon-lock" title="重置密码" v-if="checkPermission(['ROOT'])" @click="handleResetPassword(row)" status="warning" />
        <vxe-button mode="text" size="medium" icon="vxe-icon-delete" title="删除" @click="handleDelete(row)" status="danger" />
      </template>
    </vxe-grid>

    <!-- 新增/编辑用户弹窗 -->
    <vxe-modal
      v-model="showEditModal"
      :title="isEditMode ? '编辑用户' : '新增用户'"
      width="600"
      min-width="400"
      min-height="300"
      :loading="submitLoading"
      draggable
      resize
      destroy-on-close
    >
      <template #default>
        <vxe-form
          ref="formRef"
          :data="formData"
          :rules="formRules"
          title-align="right"
          title-width="100"
          @submit="submitEvent"
        >
          <vxe-form-item title="用户名" field="username" span="24">
            <template #default>
              <vxe-input v-model="formData.username" placeholder="请输入用户名" />
            </template>
          </vxe-form-item>

          <vxe-form-item title="密码" field="password" span="24" v-if="!isEditMode">
            <template #default>
              <vxe-input v-model="formData.password" type="password" placeholder="请输入密码" />
            </template>
          </vxe-form-item>

          <vxe-form-item title="邮箱" field="email" span="24">
            <template #default>
              <vxe-input v-model="formData.email" placeholder="请输入邮箱" />
            </template>
          </vxe-form-item>

          <vxe-form-item title="手机号" field="phone" span="24">
            <template #default>
              <vxe-input v-model="formData.phone" placeholder="请输入手机号" />
            </template>
          </vxe-form-item>

          <vxe-form-item title="账号禁用" field="enabled" span="12">
            <template #default>
              <vxe-switch v-model="formData.enabled" open-label="是" :open-value="0" close-label="否" :close-value="1" />
            </template>
          </vxe-form-item>

          <vxe-form-item title="账号锁定" field="accountNonLocked" span="12">
            <template #default>
              <vxe-switch v-model="formData.accountNonLocked" open-label="是" :open-value="0" close-label="否" :close-value="1" />
            </template>
          </vxe-form-item>

          <vxe-form-item title="账号过期" field="accountNonExpired" span="12">
            <template #default>
              <vxe-switch v-model="formData.accountNonExpired" open-label="是" :open-value="0" close-label="否" :close-value="1" />
            </template>
          </vxe-form-item>

          <vxe-form-item title="凭证过期" field="credentialsNonExpired" span="12">
            <template #default>
              <vxe-switch v-model="formData.credentialsNonExpired" open-label="是" :open-value="0" close-label="否" :close-value="1" />
            </template>
          </vxe-form-item>

          <vxe-form-item align="center" span="24" :item-render="{}">
            <template #default>
              <vxe-button type="submit" status="primary" content="提交" />
              <vxe-button content="重置" v-if="!isEditMode" @click="resetEvent" />
              <vxe-button content="取消" @click="showEditModal = false" />
            </template>
          </vxe-form-item>
        </vxe-form>
      </template>
    </vxe-modal>

    <!-- 修改用户头像弹窗 -->
    <vxe-modal
      v-model="showEditAvatarModal"
      title="修改用户头像"
      width="500"
      min-width="400"
      :loading="avatarUploadLoading"
      draggable
      resize
      destroy-on-close
      @close="cancelAvatarChange"
    >
      <template #default>
        <div class="avatar-edit-container">
          <!-- 头像预览区域 -->
          <div class="avatar-preview">
            <h4 style="text-align: center; margin-bottom: 20px;">
              {{ currentEditRow?.username }} 的头像
            </h4>
            <div class="preview-box">
              <img
                :src="avatarPreviewUrl || defaultAvatarIcon"
                alt="头像预览"
                class="preview-img"
              >
            </div>
          </div>

          <!-- 头像上传区域 -->
          <div class="avatar-upload" style="margin-top: 30px;">
            <el-upload
              class="avatar-uploader"
              action="#"
              :show-file-list="false"
              :on-change="handleAvatarChange"
              :before-upload="() => false"
              accept="image/*"
            >
              <vxe-button status="primary" icon="vxe-icon-upload">选择图片</vxe-button>
              <div class="el-upload__tip" style="margin-top: 10px;">
                请上传 jpg/png/gif 格式的图片，大小不超过 2MB
              </div>
            </el-upload>
          </div>

          <!-- 操作按钮 -->
          <div class="avatar-actions" style="margin-top: 30px; text-align: center;">
            <vxe-button
              status="primary"
              content="确认修改"
              :loading="avatarUploadLoading"
              @click="submitAvatarChange"
              style="margin-right: 20px;"
            />
            <vxe-button
              content="取消"
              @click="cancelAvatarChange"
            />
          </div>
        </div>
      </template>
    </vxe-modal>

    <!-- 分配角色弹窗 -->
    <vxe-modal v-model="showRoleModal" title="分配角色权限" width="500" :loading="roleSubmitLoading" destroy-on-close draggable>
      <template #default>
        <div>
          <h4>
            正在为用户 <span style="color: #409eff">{{ currentRoleUser?.username }}</span> 分配角色权限:
          </h4>

          <el-checkbox-group v-model="checkedRoleIds">
            <el-row :gutter="20">
              <el-col :span="12" v-for="role in allRoleList" :key="role.id" style="margin-bottom: 10px;">
                <div style="color: #999; font-size: 12px; margin-left: 5px; margin-top: 5px; height: 10px;">{{ role.roleDesc }}</div>
                <el-checkbox :label="role.id" border style="width: 100%;">
                  {{ role.roleName }}

                </el-checkbox>

              </el-col>
            </el-row>
          </el-checkbox-group>

          <div style="margin-top: 30px; text-align: center;">
            <vxe-button status="primary" content="保存授权" @click="submitAssignRole" />
            <vxe-button content="取消" @click="showRoleModal = false" style="margin-left: 20px;" />
          </div>
        </div>
      </template>
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
  overflow: hidden;
}
.vxe-grid {
  margin: 0 auto;
  max-width: 100%;
}
// 弹窗表单样式优化
:deep(.vxe-modal-body) {
  padding: 20px;
}
:deep(.vxe-form-item) {
  margin-bottom: 16px;
}
// 密码项提示样式
:deep(.vxe-form-item__tips) {
  color: #666;
  font-size: 12px;
}

// 头像修改弹窗样式
.avatar-edit-container {
  padding: 10px;
}
.preview-box {
  display: flex;
  justify-content: center;
  align-items: center;
}
.preview-img {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  border: 2px solid #e5e7eb;
  object-fit: cover;
}
:deep(.el-upload) {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
