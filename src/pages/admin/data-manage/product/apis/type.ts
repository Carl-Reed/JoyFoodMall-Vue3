/** 定义查询参数的接口类型 */
export interface ProductQueryParams {
  page?: number,
  limit?: number,
  productName?: string,
  categoryId?: number
}

/** SKU 股票单元行数据结构 (对应 pms_sku_stock 表) */
export interface SkuItem {
  id?: number,
  productId?: number,
  skuCode: string,
  price: number,
  promotionPrice?: number,
  stock: number,
  lowStock: number,
  pic: string,
  /** 销售属性参数，JSON 格式 (例如: [{"key":"颜色","value":"黑色"}]) */
  spData: string,
  /** 前端辅助字段：用于展示解析后的规格 */
  specName?: string
}

/** 商品详情完整数据结构 */
export interface ProductDetail {
  id?: number,
  productName: string,
  categoryId: number,
  pic: string,
  albumPics: string, // 相册图片，JSON 数组字符串
  unit: string,
  description: string,
  isPublish: number,
  createTime: string,
  updateTime: string,
  createBy: string,
  updateBy: string
  /** 商品关联的 SKU 列表 */
  skuList: SkuItem[]
}
