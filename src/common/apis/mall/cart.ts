import { request } from "@/http/axios"

export const mallCartApi = {
  // 获取购物车列表
  getCartList() {
    return request({
      url: '/mall/cart/list',
      method: 'get'
    })
  },

  // 加入购物车
  addCart(data: any) {
    return request({
      url: '/mall/cart/add',
      method: 'post',
      data
    })
  },

  // 删除项
  deleteCart(id: number | string) {
    return request({
      url: `/mall/cart/delete/${id}`,
      method: 'delete'
    })
  }
}

