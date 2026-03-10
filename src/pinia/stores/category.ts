import { defineStore } from 'pinia'
import { ref } from 'vue'
import XEUtils from 'xe-utils'
import { categoryApi } from '@/pages/admin/data-manage/category/apis/index'

export const useCategoryStore = defineStore('category', () => {
  const categoryTree = ref<any[]>([])
  const loading = ref(false)

  // 核心方法：加载并处理分类树
  async function loadCategoryTree() {
    if (loading.value) return
    loading.value = true
    try {
      const res = await categoryApi.getList({})
      const list = Array.isArray(res.data) ? res.data : []

      const rootNode = {
        categoryId: 0,
        parentId: -1,
        categoryName: "全部分类",
        children: []
      }

      // 使用 XEUtils 转换为树结构
      categoryTree.value = XEUtils.toArrayTree([rootNode, ...list], {
        key: "categoryId",
        parentKey: "parentId"
      })
    } catch (err) {
      console.error("加载分类树失败", err)
    } finally {
      loading.value = false
    }
  }

  return {
    categoryTree,
    loading,
    loadCategoryTree
  }
})
