import { request } from "@/http/axios"

export const categoryApi = {
  /** 获取分类列表 */
  getList(params?: any) {
    return request<ApiResponseData<null>>({ url: "/category/list", method: "get", params })
  },

  /** 新增分类 */
  add(data: any) {
    return request<ApiResponseData<null>>({ url: "/category/add", method: "post", data })
  },

  /** 编辑分类 */
  edit(data: any) {
    return request<ApiResponseData<null>>({ url: "/category/edit", method: "put", data })
  },

  /** 删除分类 */
  delete(id: number) {
    return request<ApiResponseData<null>>({ url: `/category/delete/${id}`, method: "delete" })
  }
}
