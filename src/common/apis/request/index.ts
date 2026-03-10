export function getFullUrl (path: string){
  if (!path) return ''
  // 如果已经是 http 开头或者是 blob(预览) 路径，直接返回
  if (path.startsWith('http') || path.startsWith('blob:')) return path
  // 如果路径没带 /api，则手动补全
  const prefix = import.meta.env.VITE_BASE_URL
  return path.startsWith(prefix) ? path : `${prefix}${path}`
}
