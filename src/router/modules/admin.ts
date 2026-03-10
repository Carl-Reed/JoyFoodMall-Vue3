import type { RouteRecordRaw } from "vue-router"

const Layouts = () => import("@/layouts/admin/index.vue")

/** 后台常驻路由 (不需要权限) */
export const adminConstantRoutes: RouteRecordRaw[] = [
  {
    path: "/admin/login",
    component: () => import("@/pages/admin/login/index.vue"),
    meta: { hidden: true }
  },
  {
    path: "/admin",
    component: Layouts,
    redirect: { name: "Dashboard" },
    children: [
      {
        path: "dashboard",
        component: () => import("@/pages/admin/dashboard/index.vue"),
        name: "Dashboard",
        meta: {
          title: "首页",
          svgIcon: "dashboard",
          affix: true
        }
      }
    ]
  },
  {
    path: "/mall",
    redirect: "/mall/home",
    meta: {
      title: "商城首页",
      elIcon: "ShoppingBag"
    }
  },
]

/**
 * 后台动态路由 (需要权限)
 * 必须带有唯一的 Name 属性
 * 用来放置有权限 (Roles 属性) 的路由
 */
export const adminDynamicRoutes: RouteRecordRaw[] = [
  {
    path: "/admin/user",
    component: Layouts,
    redirect: { name: "UserManage" },
    name: "UserManagement",
    meta: { title: "用户角色管理", elIcon: "User", roles: ["ADMIN", "ROOT"], alwaysShow: true },
    children: [
      {
        path: "user-manage",
        component: () => import("@/pages/admin/data-manage/user/index.vue"),
        name: "UserManage",
        meta: { title: "用户管理", roles: ["ADMIN"] }
      },
      {
        path: "role-manage",
        component: () => import("@/pages/admin/data-manage/role/index.vue"),
        name: "RoleManage",
        meta: { title: "角色管理", roles: ["ADMIN"] }
      }
    ]
  },
  {
    path: "/admin/shop",
    component: Layouts,
    redirect: { name: "ProductManage" },
    name: "ShopManagement",
    meta: { title: "商城数据管理", elIcon: "Goods", roles: ["ADMIN", "ROOT", "MERCHANT"], alwaysShow: true },
    children: [
      {
        path: "product-manage",
        component: () => import("@/pages/admin/data-manage/product/index.vue"),
        name: "ProductManage",
        meta: { title: "商品管理", roles: ["ADMIN", "ROOT", "MERCHANT"] }
      },
      {
        path: "product-add",
        name: "ProductAdd",
        component: () => import("@/pages/admin/data-manage/product/ProductDetail.vue"),
        meta: { title: "新增商品", hidden: true, activeMenu: "/admin/shop-management/product-manage" }
      },
      {
        path: "product-edit/:id",
        name: "ProductEdit",
        component: () => import("@/pages/admin/data-manage/product/ProductDetail.vue"),
        meta: { title: "编辑商品", hidden: true, activeMenu: "/admin/shop-management/product-manage" }
      },
      {
        path: "category-manage",
        component: () => import("@/pages/admin/data-manage/category/index.vue"),
        name: "CategoryManage",
        meta: { title: "类别管理", roles: ["ADMIN", "ROOT", "MERCHANT"] }
      },
      {
        path: "banner-manage",
        component: () => import("@/pages/admin/data-manage/banner/index.vue"),
        name: "BannerManage",
        meta: { title: "轮播图管理", roles: ["ADMIN", "ROOT"] }
      }
    ]
  },
  {
    path: "/admin/business",
    component: Layouts,
    redirect: { name: "OrderManage" },
    name: "BusinessManagement",
    meta: { title: "用户业务管理", elIcon: "ShoppingCart", roles: ["ADMIN", "ROOT"], alwaysShow: true },
    children: [
      {
        path: "order-manage",
        component: () => import("@/pages/admin/business-manage/order/index.vue"),
        name: "OrderManage",
        meta: { title: "订单管理", roles: ["ADMIN", "ROOT"] }
      },
      {
        path: "cart-manage",
        component: () => import("@/pages/admin/business-manage/cart/index.vue"),
        name: "CartManage",
        meta: { title: "购物车管理", roles: ["ADMIN", "ROOT"] }
      }
    ]
  },
  {
    path: "/admin/record",
    component: Layouts,
    redirect: { name: "FileRecord" },
    name: "RecordManagement",
    meta: { title: "操作记录管理", elIcon: "Tickets", roles: ["ADMIN", "ROOT"], alwaysShow: true },
    children: [
      {
        path: "file-record",
        component: () => import("@/pages/admin/record-manage/file/index.vue"),
        name: "FileRecord",
        meta: { title: "文件记录", roles: ["ADMIN", "ROOT"] }
      }
    ]
  }
]
