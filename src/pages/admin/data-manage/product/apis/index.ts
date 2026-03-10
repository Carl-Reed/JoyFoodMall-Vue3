import type { ProductDetail, ProductQueryParams } from "./type"
import { request } from "@/http/axios"

export const productApi = {
  /** 分页获取商品列表 */
  getList(params: ProductQueryParams) {
    return request<ApiResponseData<null>>({
      url: 'products/list',
      method: 'get',
      params
    })
  },

  /** 删除商品 */
  delete(id: number) {
    return request<ApiResponseData<null>>({ url: `products/${id}`, method: 'delete' })
  },

  /** 获取单个商品详情（用于编辑回显） */
  getById: (id: any) => request<ApiResponseData<ProductDetail>>({
    url: `products/${id}`,
    method: 'get'
  }),

  /** 保存商品（包含新增和修改） */
  save: (data: Partial<ProductDetail>) => {
    // 统一访问 /api/products，通过 Method 区分
    return request<ApiResponseData<null>>({
      url: 'products',
      method: data.id ? 'put' : 'post',
      data
    })
  },

  /** 通用状态切换 */
  updateSwitch(id: number | string, field: string, value: number) {
    return request<ApiResponseData<null>>({
      url: `products/${id}/switch//${field}/${value}`,
      method: 'patch'
    })
  },

  /** 批量删除商品 */
  batchDelete(ids: (number | string)[]) {
    return request<ApiResponseData<null>>({
      url: "products/batch",
      method: "delete",
      params: { ids: ids.join(',') }
    });
  },

  /** 根据SPU ID查询SKU列表 */
  getSkuListBySpuId(spuId: number) {
    return request({
      url: `products/listSkuBySpu/${spuId}`,
      method: "get"
    });
  },

  updateSKUPublish(data: { id: number, isPublish: number }){
    return request<ApiResponseData<null>>({
      url: `products/sku/publish`,
      method: "patch",
      data
    })
  }
}
