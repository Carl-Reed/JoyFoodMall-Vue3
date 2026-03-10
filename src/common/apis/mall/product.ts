import { request } from "@/http/axios"

export const mallProductApi = {
  // 获取新品列表
  getNewList() {
    return request({
      url: '/mall/product/new-list',
      method: 'get'
    })
  },

  // 获取推荐商品列表
  getTodayRecommend() {
    return request({
      url: '/mall/product/today-recommend',
      method: 'get'
    })
  },

  // 获取商品列表
  getProductList(params: {
    page: number
    limit: number
    keyword?: string
    productCategoryId?: number
    sort?: number
  }) {
    return request({
      url: '/mall/product/list',
      method: 'get',
      params
    })
  },

  // 获取商品详情
  getProductDetail(id: string | number){
    return request({
      url: `/mall/product/detail/${id}`,
      method: 'get'
    })
  },

  // 根据 SKUID 获取商品信息
  getProductDetailBySku(skuId: string | number){
    return request({
      url: `/mall/product/sku/${skuId}`,
      method: 'get'
    })
  }
}
