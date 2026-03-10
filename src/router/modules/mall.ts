import type { RouteRecordRaw } from "vue-router"

/** 商城端路由 */
export const mallRoutes: RouteRecordRaw[] = [
  {
    path: "/mall/login",
    component: () => import("@/pages/mall/login/index.vue"),
    meta: { hidden: true }
  },
  {
    path: "/mall/register",
    component: () => import("@/pages/mall/register/index.vue"),
    meta: { hidden: true }
  },
  {
    path: "/mall",
    component: () => import("@/layouts/mall/index.vue"),
    redirect: { name: "MallHome" },
    meta: { hidden: true},
    children: [
      {
        path: "home",
        component: () => import("@/pages/mall/home/index.vue"),
        name: "MallHome",
        meta: { title: "商城首页" }
      },
      {
        path: 'product/:id',
        name: 'ProductDetail',
        component: () => import('@/pages/mall/product/detail.vue'),
        meta: { title: '商品详情' }
      },
      {
        path: 'cart',
        name: 'MallCart',
        component: () => import('@/pages/mall/cart/index.vue'),
        meta: { title: '购物车' }
      },
      {
        path: 'checkout',
        name: 'CheckOut',
        component: () => import('@/pages/mall/checkout/index.vue'),
        meta: { title: '结算' }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/pages/mall/profile/index.vue'),
        meta: { title: '个人中心' }
      },
      {
        path: 'address',
        name: 'Address',
        component: () => import('@/pages/mall/address/index.vue'),
        meta: { title: '地址管理' }
      },
      {
        path: 'order',
        name: 'Order',
        component: () => import('@/pages/mall/orders/index.vue'),
        meta: { title: '我的订单' }
      },
      {
        path: 'category',
        name: 'Category',
        component: () => import('@/pages/mall/category/index.vue'),
        meta: { title: '商品分类' }
      }
    ]
  }
]
