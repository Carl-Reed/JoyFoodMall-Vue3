import { request } from "@/http/axios"

export const orderApi = {
  createOrder(data: any) {
    return request({
      url: '/order/create',
      method: 'post',
      data
    })
  },
  // 分页获取当前用户的订单
  getUserOrders: (params: { status?: number, page: number, limit: number }) => {
    return request<ApiResponseData<null>>({
      url: '/order/list-user',
      method: 'get',
      params
    })
  },
  // 取消订单
  cancelOrder: (orderId: number) => {
    return request<ApiResponseData<null>>({
      url: `/order/cancel/${orderId}`,
      method: 'post'
    })
  },
  // 删除订单
  deleteOrder: (orderId: number) => {
    return request<ApiResponseData<null>>({
      url: `/order/delete/${orderId}`,
      method: 'delete'
    })
  },
  // 模拟支付逻辑
  payOrder: (params:{orderId: number, payType: number}) => {
    return request<ApiResponseData<null>>({
      url: `/order/pay`,
      method: 'post',
      params
    })
  },
  // 获取订单状态统计数字
  getOrderStats: () => {
    return request({
      url: '/order/stats',
      method: 'get'
    })
  },
  // 确认收货
  confirmReceipt(orderId: number) {
    return request({
      url: `/order/confirm/${orderId}`,
      method: 'post'
    })
  }
}
