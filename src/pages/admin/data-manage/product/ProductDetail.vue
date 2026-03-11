<script setup lang="ts">
import { getFullUrl } from "@@/apis/request"
import { getToken } from "@@/utils/cache/cookies"
import { Plus } from '@element-plus/icons-vue'
import { createEditor, createToolbar } from '@wangeditor/editor'
import { storeToRefs } from 'pinia'
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VXETable from 'vxe-table'
import { useCategoryStore } from "@/pinia/stores/category"
import { productApi } from './apis'
import '@wangeditor/editor/dist/css/style.css'


const route = useRoute()
const router = useRouter()
const categoryStore = useCategoryStore()
const { categoryTree } = storeToRefs(categoryStore)

// 动态获取上传地址
const uploadUrl = `${import.meta.env.VITE_BASE_URL}/image/product/upload`

// 上传组件需要手动携带 Token
const uploadHeaders = {
  Authorization: `Bearer ${getToken()}`
}

// 步骤条控制
const activeStep = ref(0)

// 商品主表单数据 (SPU)
const productForm = reactive({
  productName: '',
  categoryId: undefined as any,
  salesShow: 0,
  pic: '',
  albumPics: '',
  unit: '件',
  description: '',
  isPublish: 1,
  specs: [] as any[]
})

// 相册数据
const albumFileList = ref<any[]>([])
// SKU 列表数据
const skuList = ref<any[]>([])

// 返回列表页
const goBack = () => router.push({ name: 'ProductManage' })

// 下一步
function nextStep() {
  if (activeStep.value < 2) activeStep.value++
}

// 上一步
function prevStep() {
  if (activeStep.value > 0) activeStep.value--
}


/**
 * 提取路径工具函数（处理逻辑）：
 * 提交给后端时，去掉 /api 前缀；前端显示时，加上 /api 前缀。
 */
const prefix = import.meta.env.VITE_BASE_URL

// 提交后端前脱敏用
function stripPrefix(url: string){
  if (!url) return ''
  // 只替换开头的 prefix
  if (url.startsWith(prefix)) {
    return url.substring(prefix.length)
  }
  return url
}

// 保存提交
async function handleSubmit() {
  try {
    // 基础校验
    if (!productForm.productName) {
      return VXETable.modal.message({ content: '请输入商品名称', status: 'error' })
    }
    if (!productForm.categoryId) {
      return VXETable.modal.message({ content: '请选择商品分类', status: 'error' })
    }
    if (skuList.value.length === 0) {
      return VXETable.modal.message({ content: '请至少配置一组规格库存', status: 'error' })
    }

    // 构造最终提交的 DTO
    const submitData = {
      ...productForm,

      // 处理 SPU 主图：去掉 /api
      pic: stripPrefix(productForm.pic),

      // 处理 SPU 相册：从 albumFileList 提取 URL，去掉 /api，转成 JSON 字符串
      albumPics: JSON.stringify(
        albumFileList.value
          .map(file => {
            // 兼容新上传(response.data)和编辑回显(url)
            const rawUrl = file.response ? file.response.data : file.url
            return stripPrefix(rawUrl)
          })
          .filter(url => !!url)
      ),

      // 处理 SKU 列表：对应后端 ProductSaveDTO 中的 skus 字段
      skuList: skuList.value.map(sku => ({
        id: sku.id || undefined, // 如果是编辑，带上 ID
        skuCode: sku.skuCode,
        price: sku.price,
        promotionPrice: sku.promotionPrice,
        stock: sku.stock,
        lowStock: sku.lowStock || 10,
        spData: sku.spData,
        // 如果 SKU 没单独设置图片，自动使用商品主图
        pic: stripPrefix(sku.pic) || stripPrefix(productForm.pic),
        specName: sku.specName
      }))
    }

    let res
    if (route.params.id) {
      // 编辑模式
      res = await productApi.save(submitData)
    } else {
      // 新增模式
      res = await productApi.save(submitData)
    }

    // 结果处理
    if (res.code === 200) {
      VXETable.modal.message({
        content: route.params.id ? '修改成功' : '发布成功',
        status: 'success'
      })
      // 成功后跳转回列表页
      router.push({ name: 'ProductManage' })
    } else {
      VXETable.modal.message({ content: res.message || '操作失败', status: 'error' })
    }
  } catch (error: any) {
    console.error('Submit Error:', error)
    VXETable.modal.message({
      content: error.response?.data?.message || '系统繁忙，请稍后再试',
      status: 'error'
    })
  }
}

function cartesianProduct(sets: any[][]) {
  return sets.reduce((acc, set) => {
    const res: any[] = []
    acc.forEach(a => {
      set.forEach(b => {
        res.push([...a, b])
      })
    })
    return res
  }, [[]] as any[][])
}

// 规格定义数据结构
const specList = ref<any[]>([
  { name: '', values: [] }
])

// 添加规格名
function addSpecItem() {
  specList.value.push({ name: '', values: [] })
}

// 删除规格名
function removeSpecItem(index: number) {
  specList.value.splice(index, 1)
  generateSkuList() // 重新生成
}

// 监听规格变化，生成 SKU 列表
function generateSkuList() {
  // 过滤掉空的规格
  const validSpecs = specList.value.filter(s => s.name && s.values.length > 0)

  if (validSpecs.length === 0) {
    skuList.value = []
    return
  }

  // 获取所有属性值的集合
  const valuesArray = validSpecs.map(s => s.values)

  // 计算笛卡尔积
  const combinations = cartesianProduct(valuesArray)

  // 映射为表格行数据
  skuList.value = combinations.map(comb => {
    // 构造规格名称：颜色:红;尺寸:M
    const specName = validSpecs.map((s, i) => `${s.name}:${comb[i]}`).join(';')

    // 尽量保留已有数据（如果有的话）
    const existing = skuList.value.find(s => s.specName === specName)

    return existing || {
      specName,
      price: 0,
      promotionPrice: 0,
      stock: 0,
      lowStock: 10,
      skuCode: '', // SKU 编码
      pic: ''      // SKU 特有图片
    }
  })
}

const previewImage = ref('')
const previewVisible = ref(false)

// 图片预览
function handlePictureCardPreview(uploadFile: any) {
  previewImage.value = uploadFile.url!
  previewVisible.value = true
}

/**
 * 限制上传图片大小和格式
 */
function beforeImageUpload (rawFile: any) {
  // 限制格式
  const isJPGorPNG = rawFile.type === 'image/jpeg' || rawFile.type === 'image/png' || rawFile.type === 'image/webp'
  // 限制大小 (5MB)
  const isLt5M = rawFile.size / 1024 / 1024 < 5

  if (!isJPGorPNG) {
    VXETable.modal.message({ content: '上传图片只能是 JPG/PNG/WEBP 格式!', status: 'error' })
    return false
  }
  if (!isLt5M) {
    VXETable.modal.message({ content: '上传图片大小不能超过 5MB!', status: 'error' })
    return false
  }
  return true
}

// 图片上传成功回调
function handleUploadSuccess(res: any, file: any) {
  // 后端返回的是 Result<String>，res.data 是图片访问 URL
  if (res.code === 200) {
    const fullUrl = getFullUrl(res.data)
    file.url = fullUrl        // 用于 el-upload 内部列表回显显示
    productForm.pic = fullUrl  // 同步到表单主图
    syncAlbumData()
  } else {
    VXETable.modal.message({ content: res.msg || '上传失败', status: 'error' })
  }
}

function handleUploadError() {
  VXETable.modal.message({ content: '网络错误，上传失败', status: 'error' })
}

// 同步相册字符串到表单
function syncAlbumData() {
  // 提取所有已上传成功的 URL
  const urls = albumFileList.value
    .map(f => f.url || (f.response && f.response.data))
    .filter(u => !!u)

  // 将数组转为 JSON 字符串存储，符合后端 Product 实体要求
  productForm.albumPics = JSON.stringify(urls)

  // 自动将第一张图设为主图 (SPU pic)
  if (urls.length > 0) {
    productForm.pic = urls[0]
  }
}

let editor: any = null

onMounted(async () => {
  if (categoryStore.categoryTree.length === 0) {
    categoryStore.loadCategoryTree()
  }
  // 如果是编辑模式
  if (route.params.id) {
    try {
      const res = await productApi.getById(route.params.id)
      const data = res.data

      if (data) {
        // 基础信息回显
        Object.assign(productForm, data)
        productForm.pic = getFullUrl(data.pic)

        // 相册回显：从 JSON 字符串转回数组
        if (data.albumPics) {
          const urls = JSON.parse(data.albumPics)
          albumFileList.value = urls.map((url: string) => ({ url: getFullUrl(url) }))
        }

        // SKU 列表回显 & 路径拼接
        if (data.skuList) {
          skuList.value = data.skuList.map((sku: any) => {
            // 解析 spData 供表格显示规格组合
            const spData = JSON.parse(sku.spData || '[]')
            const specName = spData.map((s: any) => `${s.key}:${s.value}`).join(';')
            return {
              ...sku,
              specName,
              pic: getFullUrl(sku.pic)
            }
          })
        }

        const rawSkuList = data.skuList || []

        // 从 SKU 反向推导出规格选择器 (specList)
        if (rawSkuList.length > 0) {
          try {
            const firstSpData = JSON.parse(data.skuList[0].spData || '[]')
            specList.value = firstSpData.map((sp: any) => {
              // 提取该规格名下的所有不重复取值
              const allValues = data.skuList.map((s: any) => {
                const itemSpData = JSON.parse(s.spData)
                return itemSpData.find((i: any) => i.key === sp.key)?.value
              })
              return {
                name: sp.key,
                values: [...new Set(allValues)] // 去重
              }
            })
          } catch (error) {
            console.error("规格推导失败", error)
          }
        }
      }
    } catch {
      VXETable.modal.message({ content: '获取商品详情失败', status: 'error' })
    }
  }
// --- 初始化富文本编辑器 ---
  editor = createEditor({
    selector: '#editor-container',
    html: productForm.description || '',
    config: {
      placeholder: '请输入商品详情介绍...',
      autoFocus: false,
      onChange(editor) {
        productForm.description = editor.getHtml()
      },
      MENU_CONF: {
        uploadImage: {
          server: `${import.meta.env.VITE_BASE_URL}/image/product/upload`,
          fieldName: 'file',
          headers: uploadHeaders,
          maxFileSize: 5 * 1024 * 1024, // 限制 5M
          customInsert(res: any, insertFn: any) {
            if (res.code === 200) {
              // 富文本内部插入图片也补全 /api
              insertFn(getFullUrl(res.data), '', '')
            }
          }
        }
      }
    },
    mode: 'default',
  })

  createToolbar({
    editor,
    selector: '#editor-toolbar',
    mode: 'default',
  })
})

// 组件销毁时销毁编辑器
onBeforeUnmount(() => {
  if (editor == null) return
  editor.destroy()
})
</script>

<template>
  <div class="product-detail-container">
    <el-card class="header-card">
      <template #header>
        <div class="card-header">
          <span>{{ route.params.id ? '编辑商品' : '新增商品' }}</span>
          <el-button @click="goBack">返回列表</el-button>
        </div>
      </template>
      <el-steps :active="activeStep" finish-status="success" align-center>
        <el-step title="基础信息" />
        <el-step title="规格库存" />
        <el-step title="详情设置" />
      </el-steps>
    </el-card>

    <div class="form-content">
      <el-card v-show="activeStep === 0" title="填写商品基础信息">
        <el-form :model="productForm" label-width="120px" style="max-width: 800px">
          <el-form-item label="商品名称" required>
            <el-input v-model="productForm.productName" placeholder="例如：iPhone 15 Pro Max" />
          </el-form-item>
          <el-form-item label="商品分类" required>
            <el-cascader
              v-model="productForm.categoryId" :options="categoryTree"
              :props="{ label: 'categoryName', value: 'categoryId', emitPath: false }" style="width: 100%" />
          </el-form-item>
          <el-form-item label="展示销量">
            <el-input type="number" min="0" v-model="productForm.salesShow" />
          </el-form-item>
          <el-form-item label="计量单位">
            <el-input v-model="productForm.unit" />
          </el-form-item>
          <el-form-item label="商品相册">
            <div class="album-wrapper">
              <el-upload
                v-model:file-list="albumFileList" :action="uploadUrl" name="file"
                list-type="picture-card" :before-upload="beforeImageUpload" :on-success="handleUploadSuccess" :on-error="handleUploadError"
                :headers="uploadHeaders" :on-preview="handlePictureCardPreview">
                <el-icon>
                  <Plus />
                </el-icon>
              </el-upload>
              <div class="tip">建议尺寸 800x800，最多上传 5 张，首张默认为主图</div>
            </div>
          </el-form-item>
        </el-form>
        <el-dialog v-model="previewVisible">
          <img w-full :src="previewImage" alt="预览图像">
        </el-dialog>
      </el-card>

      <el-card v-show="activeStep === 1">
        <div class="spec-container">
          <div v-for="(spec, index) in specList" :key="index" class="spec-item">
            <div class="spec-header">
              <el-input v-model="spec.name" placeholder="规格名(如:颜色)" style="width: 200px" @change="generateSkuList" />
              <el-button type="danger" link icon="Delete" @click="removeSpecItem(index)">删除</el-button>
            </div>

            <div class="spec-values">
              <el-select
                v-model="spec.values" multiple filterable allow-create default-first-option
                placeholder="输入值按回车(如:红色)" style="width: 100%; margin-top: 10px;" @change="generateSkuList">
                <el-option v-for="item in spec.values" :key="item" :label="item" :value="item" />
              </el-select>
            </div>
          </div>

          <el-button type="primary" plain icon="Plus" @click="addSpecItem" :disabled="specList.length >= 3">
            添加规格项
          </el-button>
        </div>

        <div class="sku-table-wrapper" style="margin-top: 30px">
          <div class="table-title">SKU 组合列表</div>
          <vxe-table border show-overflow :data="skuList" keep-source :edit-config="{ trigger: 'click', mode: 'cell' }">
            <vxe-column field="pic" title="SKU图片" width="100">
              <template #default="{ row }">
                <el-upload
                  :action="uploadUrl" :headers="uploadHeaders" :show-file-list="false" :before-upload="beforeImageUpload"
                  :on-success="(res) => row.pic = getFullUrl(res.data)" name="file">
                  <img v-if="row.pic || productForm.pic" :src="row.pic || productForm.pic" style="width: 30px; height: 30px; object-fit: cover;">
                  <el-button v-else icon="Plus" circle size="small" />
                </el-upload>
              </template>
            </vxe-column>
            <vxe-column field="specName" title="规格组合" min-width="180" />
            <vxe-column field="price" title="销售价格" width="120" :edit-render="{}">
              <template #edit="{ row }">
                <vxe-input v-model="row.price" type="number" placeholder="价格" />
              </template>
            </vxe-column>
            <vxe-column field="promotionPrice" title="促销价格" width="120" :edit-render="{}">
              <template #edit="{ row }">
                <vxe-input v-model="row.promotionPrice" type="number" placeholder="促销价格" />
              </template>
            </vxe-column>
            <vxe-column field="stock" title="库存数量" width="120" :edit-render="{}">
              <template #edit="{ row }">
                <vxe-input v-model="row.stock" type="integer" placeholder="库存" />
              </template>
            </vxe-column>
            <vxe-column field="lowStock" title="库存预警" width="120" :edit-render="{}">
              <template #edit="{ row }">
                <vxe-input v-model="row.lowStock" type="integer" placeholder="库存预警" />
              </template>
            </vxe-column>
            <vxe-column field="skuCode" title="SKU 编码" min-width="150" :edit-render="{}">
              <template #edit="{ row }">
                <vxe-input v-model="row.skuCode" placeholder="自定义编码" />
              </template>
            </vxe-column>
          </vxe-table>
        </div>
      </el-card>

      <el-card v-show="activeStep === 2">
        <el-form :model="productForm" label-width="100px">
          <el-form-item label="详细介绍">
            <div style="border: 1px solid var(--el-border-color); width: 100%; border-radius: 4px;">
              <div id="editor-toolbar" style="border-bottom: 1px solid var(--el-border-color);" />
              <div id="editor-container" style="height: 400px;" />
            </div>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <div class="footer-btns">
      <el-button v-if="activeStep > 0" @click="prevStep">上一步</el-button>

      <el-button v-if="activeStep < 2" type="primary" @click="nextStep">
        {{ activeStep === 0 ? '下一步：配置规格' : '下一步：填写详情' }}
      </el-button>

      <el-button v-if="activeStep === 2" type="success" @click="handleSubmit">确认提交</el-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.product-detail-container {
  padding: 20px;
  background-color: var(--el-bg-color-page);
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 1200px;

  .header-card {
    border-radius: 8px;
  }

  .form-content {
    flex: 1;

    .el-card {
      min-height: 400px;
    }
  }

  .footer-btns {
    position: sticky;
    bottom: 0;
    background: var(--el-bg-color);
    padding: 15px;
    text-align: center;
    border-top: 1px solid var(--el-border-color-light);
    z-index: 10;
  }

  .placeholder-box {
    border: 2px dashed var(--el-border-color);
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #999;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.spec-container {
  background-color: var(--el-fill-color-blank);
  padding: 20px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;

  .spec-item {
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px dashed var(--el-border-color);

    .spec-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }
}

.table-title {
  font-weight: bold;
  margin-bottom: 10px;
  color: var(--el-text-color-primary);

  &::before {
    content: "|";
    color: var(--el-color-primary);
    margin-right: 8px;
    font-weight: bold;
  }
}

.album-wrapper {
  :deep(.el-upload-list--picture-card) {
    --el-upload-list-picture-card-size: 100px;
  }
}

/* 适配富文本编辑器在暗黑模式下的颜色 */
:deep(.w-e-toolbar),
:deep(.w-e-text-container) {
  background-color: var(--el-bg-color) !important;
  color: var(--el-text-color-primary) !important;
  border-color: var(--el-border-color) !important;
}

.tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 8px;
  line-height: 1.2;
}
</style>
