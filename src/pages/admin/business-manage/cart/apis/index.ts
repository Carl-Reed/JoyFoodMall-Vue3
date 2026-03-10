import { request } from "@/http/axios"

export const cartApi = {
/** 获取购物车用户分页列表 (主表数据) */
  getCartUserPage: (params: any) => {
    return request({
      url: '/admin/cart/user/page',
      method: 'get',
      params
    })
  },

  /** 获取指定用户的购物车清单 (子表展开数据) */
  getListByUserId: (userId: number) => {
    return request({
      url: `/admin/cart/list/${userId}`,
      method: 'get'
    })
  },

  /** 管理员删除某项商品 */
  delete: (id: number) => {
    return request({
      url: `/admin/cart/${id}`,
      method: 'delete'
    })
  },

  /** 一键清空某用户购物车 */
  clear: (userId: number) => {
    return request({
      url: `/admin/cart/clear/${userId}`,
      method: 'delete'
    })
  }
}
