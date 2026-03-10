import { getActiveThemeName, setActiveThemeName } from "@@/utils/cache/local-storage"
import { setCssVar } from "@@/utils/css"
import { useRoute } from "vue-router"

const DEFAULT_THEME_NAME = "normal"

type DefaultThemeName = typeof DEFAULT_THEME_NAME

/** 注册的主题名称, 其中 DefaultThemeName 是必填的 */
export type ThemeName = DefaultThemeName | "dark" | "dark-blue"

interface ThemeList {
  title: string
  name: ThemeName
}

/** 主题列表 */
const themeList: ThemeList[] = [
  {
    title: "默认",
    name: DEFAULT_THEME_NAME
  },
  {
    title: "黑暗",
    name: "dark"
  },
  {
    title: "深蓝",
    name: "dark-blue"
  }
]

/** 正在应用的主题名称 */
const activeThemeName = ref<ThemeName>(getActiveThemeName() || DEFAULT_THEME_NAME)

/** 设置主题 */
function setTheme({ clientX, clientY }: MouseEvent, value: ThemeName) {
  const maxRadius = Math.hypot(
    Math.max(clientX, window.innerWidth - clientX),
    Math.max(clientY, window.innerHeight - clientY)
  )
  setCssVar("--v3-theme-x", `${clientX}px`)
  setCssVar("--v3-theme-y", `${clientY}px`)
  setCssVar("--v3-theme-r", `${maxRadius}px`)
  const handler = () => {
    activeThemeName.value = value
  }
  document.startViewTransition ? document.startViewTransition(handler) : handler()
}

/** 辅助函数：判断当前是否是商城页面 */
function isMallPage(path: string): boolean {
  return path.startsWith("/mall") || path === "/"
}

/** 初始化 */
function initTheme() {
  const route = useRoute()
  // watchEffect 来收集副作用
  watchEffect(() => {
    const themeValue = activeThemeName.value
    const currentPath = route.path

    // 获取所有可能的主题 class 名
    const allThemeClasses = themeList.map(item => item.name)

    // 无论什么情况，先移除所有旧主题 (避免残留)
    document.documentElement.classList.remove(...allThemeClasses)

    // 只有当 "不是商城页面" 时，才挂载当前选中的 admin 主题
    if (!isMallPage(currentPath)) {
      if (themeValue !== DEFAULT_THEME_NAME) {
        document.documentElement.classList.add(themeValue)
      }
    }

    // 持久化存储 (即使用户在商城页，也应该记住他设置的 Admin 主题，以便下次回到 Admin 时恢复)
    setActiveThemeName(themeValue)
  })
}

/** 主题 Composable */
export function useTheme() {
  return { themeList, activeThemeName, initTheme, setTheme }
}
