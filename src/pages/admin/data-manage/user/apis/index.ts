import type { UserFormData, UserList } from "./type"
import { request } from "@/http/axios"

export const userApi = {
/** 获取用户列表 */
getList(params: {
  page: number,
  limit: number
}){
  return request<ApiResponseData<UserList>>({
    url: "user/list",
    method: "get",
    params
  })
},

/** 删除用户 */
delete(id: number) {
  return request<ApiResponseData<null>>({
    url: `user/delete/${id}`,
    method: "delete"
  })
},

/** 新增用户 */
add(data: UserFormData
) {
  return request<ApiResponseData<null>>({
    url: "user/add",
    method: "post",
    data
  })
},

/** 编辑用户 */
edit(data: UserFormData) {
  return request<ApiResponseData<null>>({
    url: "user/update",
    method: "put",
    data
  })
},

/** 重置用户密码 */
resetPassword(id: number) {
  return request<ApiResponseData<null>>({
    url: `user/resetPwd/${id}`,
    method: "put"
  })
},

/** 修改用户头像 */
uploadAvatar(data: FormData) {
  return request<ApiResponseData<null>>({
    url: "image/avatar/upload",
    method: "post",
    data,
    headers: {
      "Content-Type": "multipart/form-data"
    }
  })
},

/** 获取所有角色列表 */
getAllRoles() {
  return request<ApiResponseData<null>>({
    url: "role/list/all",
    method: "get"
  })
},

/** 获取指定用户的角色ID集合 */
getUserRoleIds(userId: number) {
  return request<ApiResponseData<null>>({
    url: `role/idList/${userId}`,
    method: "get"
  })
},

/** 保存用户角色关联 */
saveUserRoles(data: { userId: number, roleIds: number[] }) {
  return request<ApiResponseData<null>>({
    url: "role/userRole/save",
    method: "post",
    data
  })
}

}
