import type { FileRecordList } from "./type"
import { request } from "@/http/axios"

export const fileApi = {
  /** 获取文件列表 */
  getList(params: {page: number,limit: number}){
    return request<ApiResponseData<FileRecordList>>(
      {
        url: "file/record/list",
        method: "get",
        params
      }
    )
  },

  /** 单个文件物理删除 */
  deleteById(id: number | string) {
    return request({
      url: `/file/record/delete/${id}`,
      method: "delete"
    });
  },

  /** 一键清理所有过期且未使用的文件 */
  clearAllUnused() {
    return request({
      url: "/file/record/clear-unused",
      method: "post"
    });
  }
}
