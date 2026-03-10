/** 后端返回用户数据格式 */
export interface UserList {
  total: number,
  rows: Array<{
    id: number, username: string, password: string,
    email: string, phone: string, enabled: number, accountNonExpired: number,
    accountNonLocked: number, credentialsNonExpired: number, createTime: string,
    lastLogin: string, avatar: string, isDeleted: number
  }>
}

/** 用户表单数据 */
export interface UserFormData {
  id?: number,
  username: string,
  password?: string,
  email: string,
  phone: string,
  enabled: number,
  accountNonExpired: number,
  accountNonLocked: number,
  credentialsNonExpired: number
}
