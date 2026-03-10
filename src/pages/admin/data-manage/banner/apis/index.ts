import { request } from "@/http/axios"

export const bannerApi = {
  /** 获取 Banner 分页列表 */
  getPageList: (params: any) => {
    return request({
      url: '/banner/page',
      method: 'get',
      params
    })
  },

  /** 添加 Banner */
  add: (data: any) => {
    return request({
      url: '/banner/add',
      method: 'post',
      data
    })
  },

  /** 更新 Banner */
  update: (data: any) => {
    return request({
      url: '/banner/update',
      method: 'put', // 或者 post，看后端定义
      data
    })
  },

  /** 删除 Banner */
  delete: (id: number) => {
    return request({
      url: `/banner/delete/${id}`,
      method: 'delete'
    })
  },

  /** 上下架 Banner */
  changeStatus: (id: number, status: number) => {
    return request({
      url: `/banner/status/${id}/${status}`,
      method: 'put'
    })
  }
}
