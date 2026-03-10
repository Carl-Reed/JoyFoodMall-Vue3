import { request } from "@/http/axios"

// 地址管理相关 API
export const mallAddressApi = {
  // 获取地址列表
  getAddressList() {
    return request({
      url: '/mall/address/list',
      method: 'get'
    })
  },
  // 保存或更新地址
  saveAddress(data: any) {
    return request({
      url: '/mall/address/save',
      method: 'post',
      data
    })
  },
  // 删除地址
  deleteAddress(id: number | string) {
    return request({
      url: `/mall/address/delete/${id}`,
      method: 'delete'
    })
  },
  // 设置默认地址
  setDefaultAddress(id: number | string) {
    return request({
      url: `/mall/address/setDefault/${id}`,
      method: 'post'
    })
  }
}
