import { isArray } from "@@/utils/validate"
import { useUserStore } from "@/pinia/stores/user"

/** 全局权限判断函数，和权限指令 v-permission 功能类似 */
export function checkPermission(permissionRoles: string[]): boolean {
  if (isArray(permissionRoles) && permissionRoles.length > 0) {
    const { roles } = useUserStore()
    return roles.some(role => permissionRoles.includes(role))
  } else {
    console.error("参数必须是一个数组且长度大于 0，参考：checkPermission(['admin', 'editor'])")
    return false
  }
}

/** 若用户只有一个角色，且该角色为传入的权限，则返回 true */
export function checkOnePermission(permissionRoles: string): boolean {
  const { roles } = useUserStore()
  if (roles.length === 1) {
    return roles[0] === permissionRoles
  }else{
    return false
  }
}
