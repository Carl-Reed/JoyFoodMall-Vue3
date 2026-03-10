import { request } from "@/http/axios"

export const userApi = {
  // 上传头像
  uploadAvatar(id: number, file: File) {
    const formData = new FormData()
    formData.append('id', id.toString())
    formData.append('file', file)
    return request({
      url: '/member/avatar/upload',
      method: 'post',
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  // 更新基础资料 (包含昵称、手机、邮箱)
  updateUserInfo(data: any) {
    return request({
      url: '/member/update',
      method: 'put',
      data
    })
  },
  // 修改密码
  updatePassword(params: any) {
    return request({
      url: '/member/updatePassword',
      method: 'put',
      params
    })
  }
}
