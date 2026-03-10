import { request } from "@/http/axios";

export const bannerApi = {
  /** 获取首页展示的轮播图列表 */
  getBannerList(limit: number) {
    return request({
      url: "/mall/banner/list",
      method: "get",
      params: {
        limit
      }
    })
  }
}
