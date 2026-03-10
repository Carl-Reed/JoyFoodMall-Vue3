import type { RoleFormData, RoleListResponseData } from "./type"
import { request } from "@/http/axios"

export const roleApi = {
/** 获取角色列表 */
getList(params: {
  page: number,
  limit: number
}){
  return request<RoleListResponseData>({
    url: "role/list",
    method: "get",
    params
  })
},

/** 新增角色 */
add(data: RoleFormData
) {
  return request<ApiResponseData<null>>({
    url: "role/add",
    method: "post",
    data
  })
},

/** 编辑角色 */
edit(data: RoleFormData) {
  return request<ApiResponseData<null>>({
    url: "role/update",
    method: "put",
    data
  })
}
}


