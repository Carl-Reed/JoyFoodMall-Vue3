/** 角色单条数据格式 */
export interface RoleRowVO {
  id?: number,
  roleName: string,
  roleDesc: string,
  createTime: string,
  updateTime: string
}

/** 角色列表接口返回格式 */
export type RoleListResponseData = ApiResponseData<{
  total: number,
  rows: RoleRowVO[]
}>

/** 角色表单提交格式 */
export interface RoleFormData {
  id?: number,
  roleName: string,
  roleDesc: string
}
