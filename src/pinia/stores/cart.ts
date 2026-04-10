import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', () => {
  // 状态：购物车原始数据
  const cartList = ref<any[]>([])

  // 计算属性：选中的商品列表
  const selectedList = computed(() => cartList.value.filter(item => item.checked))

  // 计算属性：选中商品总件数 (用于结算按钮)
  const totalCount = computed(() =>
    selectedList.value.reduce((sum, item) => sum + item.quantity, 0)
  )

  // 计算属性：选中商品总价 (返回数值类型，方便后续可能的二次计算)
  const totalPrice = computed(() => {
    const total = selectedList.value.reduce((sum, item) => {
      return sum + (item.price * item.quantity)
    }, 0)
    return Number.parseFloat(total.toFixed(2))
  })

  // 计算属性：是否全选
  const isAllChecked = computed(() => {
    return cartList.value.length > 0 && cartList.value.every(item => item.checked)
  })

  // 切换全选状态
  const toggleAll = () => {
    const targetStatus = !isAllChecked.value
    cartList.value.forEach(item => (item.checked = targetStatus))
  }

  // 同步后端数据到本地
  const setCartList = (list: any[]) => {
    cartList.value = list.map(item => ({
      ...item,
      // 数据库是 product_pic, 前端统一用 pic 方便模板渲染
      pic: item.productPic,
      // 后端不存选中状态，前端默认为选中
      checked: item.checked ?? true,
      // 确保数量是数字类型
      quantity: Number(item.quantity)
    }))
  }

  // 清空购物车 (用于退出登录)
  const clearCart = () => {
    cartList.value = []
  }

  return {
    cartList,
    selectedList,
    totalCount,
    totalPrice,
    isAllChecked,
    toggleAll,
    setCartList,
    clearCart
  }
})
