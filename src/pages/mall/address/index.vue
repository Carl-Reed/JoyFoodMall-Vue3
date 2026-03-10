<script setup lang="ts">
import { mallAddressApi } from '@@/apis/mall/address'
import { ArrowLeft, Delete, Edit, Location, Plus } from '@element-plus/icons-vue'
import { pcaTextArr } from 'element-china-area-data'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import 'element-plus/es/components/message-box/style/css'
import 'element-plus/es/components/message/style/css'

const router = useRouter()

// --- 响应式状态 ---
const loading = ref(false)
const submitLoading = ref(false)
const addressList = ref<any[]>([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const regionOptions = pcaTextArr as any // 省市区数据源

// 表单对象
const addressForm = ref({
  id: null as number | null,
  name: '',
  phoneNumber: '',
  province: '',
  city: '',
  region: '',
  detailAddress: '',
  defaultStatus: false,
  _regionArray: [] as string[] // 级联选择器绑定用
})

// --- 核心逻辑方法 ---

// 获取地址列表
async function fetchAddressList() {
  loading.value = true
  try {
    const res: any = await mallAddressApi.getAddressList()
    addressList.value = res.data || []
  } catch (e: any) {
    console.error('获取地址失败', e)
  } finally {
    loading.value = false
  }
}

// 保存地址（新增或修改）
async function handleSave() {
  // 简单校验
  const { name, phoneNumber, _regionArray, detailAddress } = addressForm.value
  if (!name || !phoneNumber || _regionArray.length === 0 || !detailAddress) {
    return ElMessage.warning('请将收货信息填写完整')
  }

  submitLoading.value = true
  try {
    // 构造发送给后端的 DTO
    const postData = {
      ...addressForm.value,
      province: _regionArray[0],
      city: _regionArray[1],
      region: _regionArray[2] || '',
      // 将 boolean 转为后端的 Integer (0/1)
      defaultStatus: addressForm.value.defaultStatus ? 1 : 0
    }

    await mallAddressApi.saveAddress(postData)
    ElMessage.success(isEdit.value ? '修改成功' : '新增成功')
    dialogVisible.value = false
    fetchAddressList() // 刷新列表
  } catch {} finally {
    submitLoading.value = false
  }
}

// 设置默认地址
async function handleSetDefault(id: number) {
  try {
    await mallAddressApi.setDefaultAddress(id)
    ElMessage.success('设置默认地址成功')
    fetchAddressList()
  } catch {
    ElMessage.error('设置默认地址失败')
  }
}

// 删除地址
async function handleDelete(id: number) {
  ElMessageBox.confirm('确定要从地址簿中删除该地址吗？', '删除提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
    center: true
  }).then(async () => {
    try {
      await mallAddressApi.deleteAddress(id)
      ElMessage.success('删除成功')
      fetchAddressList()
    } catch {
      ElMessage.error('删除失败')
    }
  }).catch(() => () => {
    // 取消删除
  })
}

// 打开弹窗（区分新增/编辑）
async function openDialog(row?: any) {
  if (row) {
    isEdit.value = true
    // 回显数据映射
    addressForm.value = {
      ...row,
      defaultStatus: row.defaultStatus === 1,
      _regionArray: [row.province, row.city, row.region].filter(Boolean)
    }
  } else {
    isEdit.value = false
    addressForm.value = {
      id: null,
      name: '',
      phoneNumber: '',
      province: '',
      city: '',
      region: '',
      detailAddress: '',
      defaultStatus: addressList.value.length === 0,
      _regionArray: []
    }
  }
  dialogVisible.value = true
}

onMounted(() => {
  fetchAddressList()
})
</script>

<template>
  <div class="address-page bg-gray-50 min-h-screen py-6 md:py-10">
    <div class="container mx-auto max-w-4xl px-4">

      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center gap-3">
          <el-button :icon="ArrowLeft" circle @click="router.back()" class="!border-none shadow-sm" />
          <h2 class="text-2xl font-bold text-gray-800">地址管理</h2>
        </div>
        <el-button type="primary" :icon="Plus" round @click="openDialog()">新增地址</el-button>
      </div>

      <div v-loading="loading" class="space-y-4">
        <div
          v-for="item in addressList" :key="item.id"
          class="bg-white rounded-2xl p-6 shadow-sm border-2 transition-all relative overflow-hidden group"
          :class="item.defaultStatus === 1 ? 'border-primary/40 bg-primary/[0.02]' : 'border-transparent hover:border-gray-200'"
        >
          <div v-if="item.defaultStatus === 1" class="absolute top-0 right-0">
             <div class="bg-primary text-white text-[10px] px-3 py-1 rounded-bl-xl font-bold">默认地址</div>
          </div>

          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <span class="font-bold text-lg text-gray-900">{{ item.name }}</span>
                <span class="text-gray-500 font-medium">{{ item.phoneNumber }}</span>
              </div>
              <div class="flex items-start gap-1.5 text-gray-600 text-sm leading-relaxed">
                <el-icon class="mt-0.5 text-primary/70"><Location /></el-icon>
                <span>{{ item.province }} {{ item.city }} {{ item.region }} {{ item.detailAddress }}</span>
              </div>
            </div>

            <div class="flex items-center gap-2 md:border-l md:pl-6 border-gray-100">
              <el-button
                v-if="item.defaultStatus !== 1"
                link type="primary"
                size="small"
                @click="handleSetDefault(item.id)"
              >设为默认</el-button>

              <el-tooltip content="编辑" placement="top">
                <el-button :icon="Edit" circle size="small" @click="openDialog(item)" />
              </el-tooltip>

              <el-tooltip content="删除" placement="top">
                <el-button :icon="Delete" circle size="small" type="danger" plain @click="handleDelete(item.id)" />
              </el-tooltip>
            </div>
          </div>
        </div>

        <el-empty v-if="!loading && addressList.length === 0" description="空空如也，添加一个收货地址吧" />
      </div>

      <el-dialog
        v-model="dialogVisible"
        :title="isEdit ? '修改收货地址' : '添加收货地址'"
        width="520px"
        destroy-on-close
        class="rounded-3xl"
      >
        <el-form :model="addressForm" label-position="top" class="px-2">
          <div class="grid grid-cols-2 gap-4">
            <el-form-item label="收货人" required>
              <el-input v-model="addressForm.name" placeholder="请填写姓名" />
            </el-form-item>
            <el-form-item label="手机号码" required>
              <el-input v-model="addressForm.phoneNumber" placeholder="请填写手机号" maxlength="11" />
            </el-form-item>
          </div>

          <el-form-item label="所在地区" required>
            <el-cascader
              v-model="addressForm._regionArray"
              :options="regionOptions"
              placeholder="选择省 / 市 / 区"
              class="w-full"
              filterable
            />
          </el-form-item>

          <el-form-item label="详细地址" required>
            <el-input
              v-model="addressForm.detailAddress"
              type="textarea"
              :rows="2"
              placeholder="请输入街道、楼牌号等详细地址"
            />
          </el-form-item>

          <el-form-item class="!mb-0">
            <div class="flex items-center gap-2">
              <el-switch v-model="addressForm.defaultStatus" />
              <span class="text-sm text-gray-500 italic">设为默认收货地址</span>
            </div>
          </el-form-item>
        </el-form>

        <template #footer>
          <div class="flex gap-3 justify-end px-2 pb-2">
            <el-button @click="dialogVisible = false" round>取消</el-button>
            <el-button
              type="primary"
              round
              :loading="submitLoading"
              @click="handleSave"
              class="px-8"
            >确认保存</el-button>
          </div>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 800px;
}
:deep(.el-input__wrapper), :deep(.el-textarea__inner) {
  @apply !rounded-xl !bg-gray-50 border-none shadow-none focus-within:!bg-white focus-within:ring-1 ring-primary/20 transition-all;
}
:deep(.el-form-item__label) {
  @apply !text-xs !font-bold !text-gray-400 !ml-1 uppercase;
}
.text-primary {
  color: var(--el-color-primary);
}
.bg-primary {
  background-color: var(--el-color-primary);
}
</style>
