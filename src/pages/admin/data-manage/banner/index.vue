<script setup lang="ts">
import type { UploadRawFile } from "element-plus"
import type { VxeFormInstance, VxeGridInstance, VxeGridListeners, VxeGridProps } from "vxe-table"
import { getFullUrl } from "@@/apis/request"
import { getToken } from "@@/utils/cache/cookies"
import { ElMessage, ElUpload } from "element-plus"
import VXETable from "vxe-table"
import { bannerApi } from "./apis"

interface BannerForm {
  id: number | null
  title: string
  pic: string
  url: string
  sort: number
  status: number
}

const gridRef = ref<VxeGridInstance>()
const formRef = ref<VxeFormInstance>()
const dialogVisible = ref(false)
const isEdit = ref(false)
const uploadRef = ref<InstanceType<typeof ElUpload> | null>(null)

// 动态获取上传地址与请求头
const uploadUrl = `${import.meta.env.VITE_BASE_URL}/image/banner/upload`
const uploadHeaders = {
  Authorization: `Bearer ${getToken()}`
}

// ===================== 表格配置 =====================
const gridOptions = reactive<VxeGridProps>({
  border: true,
  height: "auto",
  rowConfig: { height: 70 },
  pagerConfig: { enabled: true, pageSize: 10, pageSizes: [10, 20, 50] },
  formConfig: {
    data: { title: "" },
    items: [
      { field: "title", title: "标题", span: 6, itemRender: { name: "VxeInput", props: { placeholder: "搜索标题" } } },
      { span: 12, align: "left",
      itemRender:
        { name: "$buttons",
          children:
          [
            { props: { type: "submit", content: "查询", status: "primary" } },
            { props: { type: "reset", content: "重置" } }
          ]
        }
      }
    ]
  },
  toolbarConfig: {
    refresh: true,
    custom: true,
    buttons: [{ code: "add", name: "新增轮播图", icon: "vxe-icon-add", status: "primary" }]
  },
  proxyConfig: {
    props: { result: "data.records", total: "data.total" },
    ajax: {
      query: async ({ page }: any) => {
        const searchTitle: string = gridOptions.formConfig?.data.title
        return await bannerApi.getPageList({
          page: page.currentPage,
          limit: page.pageSize,
          title: searchTitle
        })
      }
    }
  },
  columns: [
    { type: "seq", width: 60 },
    { field: "pic", title: "图片预览", width: 120, slots: { default: "pic_default" } },
    { field: "title", title: "标题", minWidth: 150 },
    { field: "url", title: "跳转链接", minWidth: 200, formatter: ({ cellValue }) => cellValue || '无' },
    { field: "sort", title: "排序", width: 80, align: "center" },
    { field: "status", title: "状态", width: 100, align: "center", slots: { default: "status_default" } },
    { field: "updateTime", title: "最后操作时间", width: 160 },
    { title: "操作", width: 180, fixed: "right", slots: { default: "action_default" } }
  ]
})

const gridEvents: VxeGridListeners = {
  toolbarButtonClick: ({ code }) => {
    if (code === "add") handleAdd()
  }
}

// ===================== 表单与上传逻辑 =====================
const formData = reactive<BannerForm>({
  id: null,
  title: "",
  pic: "",
  url: "",
  sort: 0,
  status: 1
})

const formRules = reactive({
  title: [{ required: true, message: "请输入轮播图标题" }],
  pic: [{ required: true, message: "请上传轮播图图片" }],
  sort: [{ required: true, message: "请输入排序值" }]
})

/** 处理超出限制，覆盖上传 */
function handleExceed(files: File[]) {
  uploadRef.value?.clearFiles()
  const file = files[0] as UploadRawFile
  uploadRef.value?.handleStart(file)
  uploadRef.value?.submit()
}

/** 上传成功回调 */
function handleUploadSuccess(response: any) {
  if (response.code === 200 && response.data) {
    formData.pic = response.data // 后端返回的相对路径
    ElMessage.success('图片上传成功')
    uploadRef.value?.clearFiles() // 清除组件记录，确保下次能点击更换
    formRef.value?.clearValidate('pic')
  } else {
    ElMessage.error('图片上传失败')
  }
}

function beforeUpload(file: any) {
  const isJPGPNG = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isJPGPNG) ElMessage.error('只能上传 JPG/PNG 格式!')
  if (!isLt5M) ElMessage.error('大小不能超过 5MB!')
  return isJPGPNG && isLt5M
}

// ===================== 业务操作 =====================
function handleAdd() {
  isEdit.value = false
  Object.assign(formData, { id: null, title: "", pic: "", url: "", sort: 0, status: 1 })
  dialogVisible.value = true
  nextTick(() => {
    uploadRef.value?.clearFiles()
    formRef.value?.reset()
  })
}

function handleEdit(row: BannerForm) {
  isEdit.value = true
  Object.assign(formData, row)
  dialogVisible.value = true
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

async function handleSubmit() {
  const errMap = await formRef.value?.validate()
  if (errMap) return
  try {
    isEdit.value ? await bannerApi.update(formData) : await bannerApi.add(formData)
    ElMessage.success("保存成功")
    dialogVisible.value = false
    gridRef.value?.commitProxy("query")
  } catch {
    ElMessage.error("保存失败")
  }
}

async function handleDelete(row: BannerForm) {
  const type = await VXETable.modal.confirm(`确定删除 Banner: "${row.title}"?`)
  if (type === "confirm") {
    await bannerApi.delete(row.id!)
    gridRef.value?.commitProxy("query")
  }
}

/** 更改状态的前置确认 */
async function handleBeforeChange(row: BannerForm) {
  const actionText = row.status === 1 ? '下架' : '上架'
  const type = await VXETable.modal.confirm(`您确定要${actionText} Banner: "${row.title}" 吗？`)
  if (type === "confirm") {
    return true
  } else {
    return false
  }
}

/** 更改状态逻辑 */
async function handleChangeStatus(row: BannerForm) {
  // 保存旧状态，用于失败回滚
  const oldStatus = row.status === 1 ? 0 : 1
  const actionText = row.status === 1 ? '上架' : '下架'

  try {
    await bannerApi.changeStatus(row.id!, row.status)
    ElMessage.success(`${actionText}成功`)
  } catch {
    // 失败处理：回滚状态
    row.status = oldStatus
    ElMessage.error(`${actionText}失败`)
  }
}
</script>

<template>
  <div class="banner-manage-container">
    <vxe-grid ref="gridRef" v-bind="gridOptions" v-on="gridEvents">
      <template #pic_default="{ row }">
        <el-image
          v-if="row.pic"
          :src="getFullUrl(row.pic)"
          class="table-img"
          :preview-src-list="[getFullUrl(row.pic)]"
          preview-teleported
          fit="cover"
        />
        <span v-else>-</span>
      </template>

      <template #status_default="{ row }">
        <el-switch
          v-model="row.status" :active-value="1" :inactive-value="0"
          inline-prompt active-text="上架" inactive-text="下架"
          :before-change="() => handleBeforeChange(row)"
          @change="handleChangeStatus(row)"
        />
      </template>

      <template #action_default="{ row }">
        <vxe-button mode="text" status="primary" icon="vxe-icon-edit" title="编辑" @click="handleEdit(row)" />
        <vxe-button mode="text" status="danger" icon="vxe-icon-delete" title="删除" @click="handleDelete(row)" />
      </template>
    </vxe-grid>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑 Banner' : '新增 Banner'" width="550px" destroy-on-close>
      <vxe-form ref="formRef" :data="formData" :rules="formRules" title-width="80">
        <vxe-form-item title="标题" field="title" span="24" :item-render="{ name: 'VxeInput', props: { placeholder: '请输入标题' } }" />

        <vxe-form-item title="图片" field="pic" span="24">
          <template #default>
            <ElUpload
              ref="uploadRef" class="banner-uploader" :action="uploadUrl" name="file" :headers="uploadHeaders"
              :limit="1" :on-exceed="handleExceed" :show-file-list="false" :on-success="handleUploadSuccess"
              :before-upload="beforeUpload" drag>
              <div v-if="formData.pic" class="image-preview-wrapper">
                <el-image :src="getFullUrl(formData.pic)" class="preview-img" fit="fill" />
                <div class="image-mask">
                  <el-icon><Edit /></el-icon>
                  <span>点击或拖拽更换图片</span>
                </div>
              </div>

              <div v-else class="uploader-placeholder">
                <el-icon class="uploader-icon"><UploadFilled /></el-icon>
                <div class="uploader-text">
                  <div class="main-tip">将文件拖到此处，或<b>点击上传</b></div>
                  <div class="sub-tip">建议尺寸 1920x400，不超过 5MB</div>
                </div>
              </div>
            </ElUpload>
          </template>
        </vxe-form-item>

        <vxe-form-item title="链接" field="url" span="24" :item-render="{ name: 'VxeInput', props: { placeholder: '跳转链接' } }" />
        <vxe-form-item title="排序" field="sort" span="12" :item-render="{ name: 'VxeInput', props: { type: 'number', placeholder:'排序值越大越靠前' } }" />
        <vxe-form-item title="状态" field="status" span="12">
          <template #default>
            <el-radio-group v-model="formData.status">
              <el-radio :value="1">上架</el-radio>
              <el-radio :value="0">下架</el-radio>
            </el-radio-group>
          </template>
        </vxe-form-item>
      </vxe-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.banner-manage-container { height: 100%; padding: 10px; overflow: hidden; }
.table-img { width: 60px; height: 60px; border-radius: 4px; border: 1px solid #eee; cursor: pointer; }

.banner-uploader {
  width: 100%;

  :deep(.el-upload) {
    width: 100%;
    height: 180px;
    border: 2px dashed #dcdfe6;
    border-radius: 8px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    display: block;

    &:hover {
      border-color: var(--el-color-primary);
    }
  }

  /* 穿透修改拖拽区域的样式，让它填满 */
  :deep(.el-upload-dragger) {
    padding: 0;
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background-color: transparent;
  }
}

/* 上传后的预览图样式 */
.image-preview-wrapper {
  position: absolute; /* 绝对定位充满父容器 */
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  .preview-img {
    width: 100%;
    height: 100%;
    display: block;
  }

  .image-mask {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5); /* 遮罩颜色加深一点 */
    color: #fff;
    opacity: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    transition: opacity 0.3s;
    backdrop-filter: blur(2px); /* 增加毛玻璃效果，更高级 */

    .mask-icon {
      font-size: 28px;
      margin-bottom: 8px;
    }
    .mask-text {
      font-size: 14px;
      letter-spacing: 1px;
    }
  }

  &:hover .image-mask {
    opacity: 1;
  }
}

/* 未上传时的占位样式 */
.uploader-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;

  .placeholder-content {
    text-align: center;
    color: #909399;

    .uploader-icon {
      font-size: 40px;
      margin-bottom: 12px;
      color: #c0c4cc;
    }

    .uploader-text {
      .main-tip {
        font-size: 15px;
        font-weight: bold;
        margin: 0 0 4px 0;
        color: #606266;
      }
      .sub-tip {
        font-size: 12px;
        margin: 0;
        color: #a8abb2;
      }
    }
  }
}

/* 表格图片预览 */
.table-img {
  width: 80px;
  height: 45px; /* 保持 Banner 的 16:9 比例感 */
  border-radius: 4px;
  border: 1px solid #ebeef5;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}
</style>
