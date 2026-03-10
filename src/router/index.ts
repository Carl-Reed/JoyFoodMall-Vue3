import { createRouter } from "vue-router"
import { routerConfig } from "@/router/config"
import { registerNavigationGuard } from "@/router/guard"
import { flatMultiLevelRoutes } from "./helper"
import { adminConstantRoutes, adminDynamicRoutes } from "./modules/admin"
import { mallRoutes } from "./modules/mall"

const Layouts = () => import("@/layouts/admin/index.vue")

/**
 * @name 公共基础路由
 * @description 除了 redirect/403/404/login 等隐藏页面，其他页面建议设置唯一的 Name 属性
 */
const publicRoutes = [
  {
    path: "/",
    redirect: { name: "MallHome" },
    meta: { hidden: true }
  },
  {
    path: "/redirect",
    component: Layouts,
    meta: { hidden: true },
    children: [{ path: ":path(.*)", component: () => import("@/pages/admin/redirect/index.vue") }]
  },
  {
    path: "/403",
    component: () => import("@/pages/admin/error/403.vue"),
    meta: { hidden: true }
  },
  {
    path: "/404",
    component: () => import("@/pages/admin/error/404.vue"),
    meta: { hidden: true },
    alias: "/:pathMatch(.*)*"
  }
]

/** 导出给权限守卫使用的路由 */
export const constantRoutes = [...publicRoutes, ...adminConstantRoutes,...mallRoutes]
export const dynamicRoutes = [...adminDynamicRoutes]

/** 路由实例 */
export const router = createRouter({
  history: routerConfig.history,
  routes: routerConfig.thirdLevelRouteCache ? flatMultiLevelRoutes(constantRoutes) : constantRoutes,
  // 每次路由切换时，自动滚动到页面顶部
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0, behavior: 'smooth' }
    }
  }
})

/** 重置路由 */
export function resetRouter() {
  try {
    // 注意：所有动态路由路由必须带有 Name 属性，否则可能会不能完全重置干净
    router.getRoutes().forEach((route) => {
      const { name, meta } = route
      if (name && meta.roles?.length) {
        router.hasRoute(name) && router.removeRoute(name)
      }
    })
  } catch {
    // 强制刷新浏览器也行，只是交互体验不是很好
    location.reload()
  }
}

// 注册路由导航守卫
registerNavigationGuard(router)
