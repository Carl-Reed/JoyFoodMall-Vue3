import type * as Users from "./type"
import { request } from "@/http/axios"

/** 获取当前登录用户详情 */
export function getCurrentUserApi() {
  return request<Users.CurrentUserResponseData>({
    url: "user/info",
    method: "get"
  })
}

/** 获取用户头像  */
export function getUserAvatarApi(avatarPath: string) {
  return request<Blob>({
    url: avatarPath,
    method: "get",
    responseType: 'blob'
  })
}
