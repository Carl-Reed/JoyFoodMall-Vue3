import type { RouteLocationNormalizedGeneric, RouteRecordNameGeneric } from "vue-router"

/** 免登录白名单（匹配路由 path） */
const whiteListByPath: string[] = ["/admin/login","/mall/login","/403","/404","/","/mall/home","/mall/category","/mall/register"]

/** 免登录白名单（匹配路由 name） */
const whiteListByName: RouteRecordNameGeneric[] = ["ProductDetail"]

/** 判断是否在白名单 */
export function isWhiteList(to: RouteLocationNormalizedGeneric) {
  // path 和 name 任意一个匹配上即可
  return whiteListByPath.includes(to.path) || whiteListByName.includes(to.name)
}
