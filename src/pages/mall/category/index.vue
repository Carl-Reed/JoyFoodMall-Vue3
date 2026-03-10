<script setup lang="ts">
import { mallProductApi } from '@@/apis/mall/product'
import { getFullUrl } from "@@/apis/request"
import { ArrowRight, Search } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

// --- 状态变量 ---
const loading = ref(false)
const productList = ref<any[]>([])
const total = ref(0)
const queryParams = ref({
  page: 1,
  limit: 12,
  keyword: '',
  categoryId: null as number | null,
  sort: 0 // 排序：0->相关性；1->新品；2->销量；3->价格从低到高；4->价格从高到低
})

// --- 排序配置 ---
const sortOptions = [
  { label: '综合', value: 0 },
  { label: '新品', value: 1 },
  { label: '销量', value: 2 },
  { label: '价格低-高', value: 3 },
  { label: '价格高-低', value: 4 }
]

// --- 核心逻辑：获取商品数据 ---
async function fetchProducts() {
  loading.value = true
  try {
    // 组装请求参数
    const params = {
      ...queryParams.value,
      keyword: (route.query.q as string) || '',
      categoryId: route.query.categoryId ? Number(route.query.categoryId) : null
    }

    const res: any = await mallProductApi.getProductList(params)
    if (res.code === 200) {
      productList.value = res.data.records.map((item: any) => ({
        ...item,
        tags: [
          item.isNew ? '新品' : '',
          item.isRecommend ? '推荐' : ''
        ].filter(Boolean)
      }))
      total.value = res.data.total || 0
    }
  } catch (error) {
    console.error('获取商品列表失败', error)
  } finally {
    loading.value = false
  }
}

// --- 监听路由变化 (搜索词或分类ID) ---
watch(
  () => route.query,
  () => {
    queryParams.value.page = 1 // 切换关键词或分类时重置页码
    fetchProducts()
  },
  { deep: true }
)

// 处理排序切换
function handleSortChange(sortValue: number) {
  queryParams.value.sort = sortValue
  queryParams.value.page = 1
  fetchProducts()
}

// 跳转详情
function goDetail(id: number) {
  router.push(`/mall/product/${id}`)
}

onMounted(() => {
  fetchProducts()
})
</script>

<template>
  <div class="category-page container mx-auto px-4 py-6">
    <div class="mb-6 flex justify-between items-end">
      <div>
        <el-breadcrumb :separator-icon="ArrowRight">
          <el-breadcrumb-item :to="{ path: '/mall/home' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item>全部分类</el-breadcrumb-item>
          <el-breadcrumb-item v-if="route.query.q">搜索: "{{ route.query.q }}"</el-breadcrumb-item>
        </el-breadcrumb>
        <h2 class="text-2xl font-bold mt-3 text-gray-800">
          {{ route.query.q ? `"${route.query.q}" 的搜索结果` : '发现好物' }}
        </h2>
      </div>

      <div class="flex gap-2">
        <el-select
          v-model="queryParams.sort"
          placeholder="排序方式"
          style="width: 140px"
          @change="handleSortChange"
        >
          <el-option
            v-for="item in sortOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </div>
    </div>

    <div v-loading="loading" class="min-h-[400px]">
      <div v-if="productList.length > 0" class="product-grid">
        <div
          v-for="item in productList"
          :key="item.id"
          class="product-card group"
          @click="goDetail(item.id)"
        >
          <div class="image-wrapper">
            <el-image :src="getFullUrl(item.pic)" fit="cover" lazy />
            <div class="hover-mask">
              <el-button type="primary" round :icon="Search">查看详情</el-button>
            </div>
          </div>
          <div class="p-4">
            <h3 class="product-name">{{ item.productName }}</h3>
            <div class="mt-2 flex flex-wrap gap-1 h-5 overflow-hidden">
              <span
                v-for="tag in item.tags" :key="tag"
                class="text-[12px] px-1.5 py-1 border border-red-200 text-red-500 rounded bg-red-50"
              >
                {{ tag }}
              </span>
            </div>
            <div class="flex justify-between items-center mt-4">
              <span class="price">￥{{ item.price }}</span>
              <span class="text-xs text-gray-400">已售 {{ item.salesShow || 0 }}</span>
            </div>
          </div>
        </div>
      </div>

      <el-empty
        v-else-if="!loading"
        description="没有找到匹配的商品"
        :image-size="200"
      >
        <el-button type="primary" plain @click="router.push('/mall/home')">去首页看看</el-button>
      </el-empty>
    </div>

    <div v-if="total > 0" class="flex justify-center mt-12">
      <el-pagination
        v-model:current-page="queryParams.page"
        :page-size="queryParams.limit"
        :total="total"
        layout="prev, pager, next"
        background
        @current-change="fetchProducts"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;

  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
  @media (min-width: 1024px) {
    grid-template-columns: repeat(4, 1fr);
  }
}

.product-card {
  @apply bg-white rounded-xl overflow-hidden border border-gray-100 transition-all cursor-pointer;

  &:hover {
    @apply shadow-xl border-primary/20 -translate-y-1;
    .image-wrapper .el-image {
      transform: scale(1.05);
    }
    .hover-mask {
      opacity: 1;
    }
  }

  .image-wrapper {
    @apply relative aspect-square overflow-hidden bg-gray-50;

    .el-image {
      @apply w-full h-full transition-transform duration-500;
    }

    .hover-mask {
      @apply absolute inset-0 bg-black/20 flex-center opacity-0 transition-opacity duration-300;
    }
  }

  .name {
    @apply text-sm font-bold text-gray-800 line-clamp-2 h-10;
  }

  .price {
    @apply text-lg font-bold text-red-500;
  }
}

.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
