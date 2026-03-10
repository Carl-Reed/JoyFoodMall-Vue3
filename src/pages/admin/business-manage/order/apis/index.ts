import { request } from "@/http/axios"

export const orderApi = {
  /** 获取订单分页列表 */
  getList (params: any) {
    return request<ApiResponseData<null>>({
      url: '/order/list',
      method: 'get',
      params
    })
  },

  /** 根据订单ID查询商品明细 (用于懒加载) */
  getItemsByOrderId (orderId: number) {
    return request<ApiResponseData<null>>({
      url: `/order/items/${orderId}`,
      method: 'get'
    })
  },

  /** 订单状态修改（如发货、取消） */
  updateStatus (data: { id: number, status: number }) {
    return request<ApiResponseData<null>>({
      url: '/order/update-status',
      method: 'put',
      data
    })
  },

  /** 订单发货 */
  delivery(data: { id: number, deliveryCompany: string, deliverySn: string }) {
    return request({
      url: "/order/delivery",
      method: "post",
      data
    })
  }
}
