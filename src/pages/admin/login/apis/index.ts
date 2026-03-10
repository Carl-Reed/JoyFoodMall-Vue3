import type * as Auth from "./type"
import { request } from "@/http/axios"

/** 登录并返回 Token */
export function loginApi(data: Auth.LoginRequestData) {
  return request<Auth.LoginResponseData>({
    url: "check-login",
    method: "post",
    data: {
      username: data.username,
      password: data.password
    }
  })
}
