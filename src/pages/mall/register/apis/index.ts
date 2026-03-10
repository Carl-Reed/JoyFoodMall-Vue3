import { request } from "@/http/axios"

export const registerApi = {
  /** 注册新用户 */
  register(data: {
    username: string
    password: string
    email: string
    phone: string
  }) {
    return request({
      url: "/member/register",
      method: "post",
      data
    })
  }
}
