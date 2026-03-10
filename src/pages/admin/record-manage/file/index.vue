<script lang="ts" setup>
import type { VxeGridInstance, VxeGridProps } from "vxe-table"
import { reactive, ref} from "vue"
import {VXETable} from "vxe-table"
import { fileApi } from "./apis"

defineOptions({
  name: "FileManage"
})

// ===================== 类型定义 & 基础变量 =====================
interface FileVO {
  id: number
  filePath: string
  fileType: string
  isUsed: number      // 0: 未使用, 1: 已使用
  createBy: string
  updateBy: string
  createTime: string
  updateTime: string
}

const gridRef = ref<VxeGridInstance<FileVO>>()

/** 查询参数 */
const params = reactive({
  page: 1,
  limit: 10,
  isUsed: null as number | null,
  searchText: ""
})

/** 搜索表单 */
const searchForm = reactive({
  isUsed: null,
  searchText: ""
})

// ===================== 表格配置 =====================
const gridOptions = reactive<VxeGridProps<FileVO>>({
  border: true,
  size: "small",
  height: "100%",
  align: "center",
  showOverflow: true,
  rowConfig: { height: 60 },
  pagerConfig: { pageSize: 10, pageSizes: [10, 20, 50] },
  toolbarConfig: {
    custom: true,
    zoom: true,
    refresh: true,
    slots: { buttons: "toolbar_buttons", tools: "toolbar_tools" }
  },
  columns: [
    { type: "seq", title: "序号", width: 70 },
    {
      field: "fileImg",
      title: "缩略图",
      width: 100,
      slots: { default: "imageDefault" }
    },
    { field: "filePath", title: "文件路径", minWidth: 250, align: "left" },
    {
      field: "filePath",
      title: "文件类别",
      width: 120,
      slots: { default: "categoryDefault" }
    },
    { field: "fileType", title: "文件类型", width: 100,slots: { default: "typeDefault" } },
    {
      field: "isUsed",
      title: "状态",
      width: 100,
      slots: { default: "statusDefault" }
    },
    {
      field: "auditInfo",
      title: "操作审计",
      width: 260,
      slots: { default: "auditDefault" }
    },
    { title: "操作", width: 100, fixed: "right", slots: { default: "operationDefault" } }
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
        params.isUsed = searchForm.isUsed
        params.searchText = searchForm.searchText

        const response = await fileApi.getList(params)
        return { data: response.data.rows, total: response.data.total }
      }
    }
  }
})

// ===================== 操作方法 =====================
/** 从路径中提取 images 后的文件夹名 */
function getCategoryKeyFromPath(path: string): string | null {
  if (!path) return null;
  // 统一分隔符并分割
  const parts = path.replace(/\\/g, '/').split('/');
  // 找到 'images' 的索引
  const imagesIndex = parts.findIndex(part => part === 'images');

  // 如果找到 images 且后面还有元素，返回下一个元素
  if (imagesIndex !== -1 && imagesIndex + 1 < parts.length) {
    return parts[imagesIndex + 1];
  }
  return null;
}

/** 将文件夹 key 映射为中文类别名称 */
function getCategoryName(path: string): string {
  const key = getCategoryKeyFromPath(path);

  if (!key) return '未知类别';

  switch (key) {
    case 'bannerImages':
      return '轮播图';
    case 'avatars':
      return '头像';
    case 'productImages':
      return '商品图';
    default:
      return `${key}`;
  }
}

/** 根据文件类型名返回显示名称 */
function getFileTypeName(fileType: string) {
  if (!fileType) return '未知文件';

  // 统一转小写进行匹配
  const ext = fileType.toLowerCase();

  // 定义分类映射
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
  const videoExts = ['.mp4', '.avi', '.wmv', '.mov', '.flv'];
  const docExts = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'];
  const archiveExts = ['.zip', '.rar', '.7z', '.tar', '.gz'];

  // 返回对应名称
  if (imageExts.includes(ext)) return '图片文件';
  if (videoExts.includes(ext)) return '视频文件';
  if (docExts.includes(ext)) return '文档文件';
  if (archiveExts.includes(ext)) return '压缩文件';

  return '其他文件';
}

/** 判断是否为图片 */
function isImage(fileType: string) {
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
  return fileType && imageExts.includes(fileType.toLowerCase());
}

/** 校验是否超过 24 小时 */
function isOver24Hours(createTime: string) {
  if (!createTime) return false
  const now = new Date().getTime()
  const cTime = new Date(createTime).getTime()
  return (now - cTime) > 24 * 60 * 60 * 1000
}

/** 批量清理，调用后端全局清理接口 */
async function handleClearAllUnused() {
  const type = await VXETable.modal.confirm(
    '将清理系统中所有【未使用】且【上传超过24小时】的文件，该操作将物理删除文件，不可恢复！是否继续？'
  )

  if (type === 'confirm') {
    try {
      const res = await fileApi.clearAllUnused()
      if(res.data.count !== 0 || res.data.failCount !== 0){
        VXETable.modal.message({
          content: `系统已成功清理 ${res.data.count} 个无用文件，清理失败 ${res.data.failCount}个。`,
          status: 'success'
        })
      }else{
        VXETable.modal.message({
          content: `系统中暂无过期未使用的文件，无需清理。`,
          status: 'info'
        })
      }

      gridRef.value?.commitProxy('query')
    } catch (e: any) {
      VXETable.modal.message({ content: e.message || '批量清理失败', status: 'error' })
    }
  }
}

/** 单个文件记录清理 */
async function handleSingleDelete(row: FileVO) {
  // 前置校验
  if (!isOver24Hours(row.createTime)) {
    VXETable.modal.message({
      content: '该文件上传未满 24 小时，为防误删暂不可清理',
      status: 'warning'
    })
    return
  }

  const type = await VXETable.modal.confirm('确定要永久删除该文件吗？')
  if (type === 'confirm') {
    try {
      await fileApi.deleteById(row.id)
      VXETable.modal.message({ content: '删除成功', status: 'success' })
      gridRef.value?.commitProxy('query')
    } catch (e: any) {
      VXETable.modal.message({ content: e.message || '删除失败', status: 'error' })
    }
  }
}
</script>

<template>
  <div class="table-container">
    <vxe-grid ref="gridRef" v-bind="gridOptions">
      <!-- 工具栏按钮插槽 -->
      <template #toolbar_buttons>
        <vxe-button status="danger" icon="vxe-icon-delete" @click="handleClearAllUnused">一键清理过期未使用文件</vxe-button>
      </template>
      <!-- 工具栏工具插槽 -->
      <template #toolbar_tools>
        <vxe-form @submit="gridRef?.commitProxy('query')">
          <vxe-form-item>
            <vxe-select v-model="searchForm.isUsed" placeholder="使用状态" clearable style="width: 120px;">
              <vxe-option :value="1" label="已引用" />
              <vxe-option :value="0" label="待清理" />
            </vxe-select>
          </vxe-form-item>
          <vxe-form-item>
            <vxe-input v-model="searchForm.searchText" placeholder="路径搜索..." clearable />
          </vxe-form-item>
          <vxe-form-item>
            <vxe-button type="submit" status="primary" content="查询" />
          </vxe-form-item>
        </vxe-form>
      </template>

      <!-- 缩略图插槽 -->
      <template #imageDefault="{ row }">
        <div class="file-preview">
          <el-image
          v-if="isImage(row.fileType)"
          :src="`/api${ row.filePath }`"
          :preview-src-list="[`/api${ row.filePath }`]"
          style="width: 40px; height: 40px; object-fit: contain;"
          alt="pic" />
          <i v-else class="vxe-icon-file-txt" style="font-size: 24px;" />
        </div>
      </template>

      <!-- 类别插槽 -->
      <template #categoryDefault="{ row }">
        <el-tag type="warning">
          {{ getCategoryName(row.filePath) }}
        </el-tag>
      </template>

      <!-- 类型插槽 -->
      <template #typeDefault="{ row }">
        <el-tag>{{ getFileTypeName(row.fileType) }}</el-tag>
      </template>

      <!-- 状态插槽 -->
      <template #statusDefault="{ row }">
        <template v-if="!isOver24Hours(row.createTime) && row.isUsed === 0">
          <el-tag type="warning">待定中</el-tag>
        </template>
        <el-tag v-else :type="row.isUsed === 1 ? 'success' : 'danger'">
          {{ row.isUsed === 1 ? '已引用' : '待清理' }}
        </el-tag>
      </template>

      <!-- 操作审计插槽 -->
      <template #auditDefault="{ row }">
        <div class="audit-cell">
          <div class="audit-row">
            <span class="label">上传:</span> {{ row.createTime }}
            <span class="user">({{ row.createBy || 'System' }})</span>
          </div>
          <div class="audit-row">
            <span class="label">更新:</span> {{ row.updateTime }}
            <span class="user">({{ row.updateBy || '-' }})</span>
          </div>
        </div>
      </template>

      <!-- 操作列插槽 -->
      <template #operationDefault="{ row }">
        <template v-if="row.isUsed === 0">
          <vxe-button
            v-if="isOver24Hours(row.createTime)" mode="text" icon="vxe-icon-delete" status="danger" title="物理删除"
            @click="handleSingleDelete(row)" />
          <vxe-icon v-else title="上传未满24小时,暂时锁定" style="color: #E6A23C; cursor: help;" name="time" />
        </template>
        <vxe-icon v-else status="success" name="lock-fill" title="正在使用中" />
      </template>

    </vxe-grid>
  </div>
</template>

<style lang="scss" scoped>
.table-container {
  height: 100%;
  width: 100%;
  overflow: hidden;
  padding: 10px;
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
</style>
