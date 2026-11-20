import { theme } from 'antd'
import type { ThemeConfig } from 'antd'

export type ThemeMode = 'light' | 'dark'

const shared: ThemeConfig['token'] = {
  colorPrimary: 'hsl(5 64% 42%)',
  colorInfo: 'hsl(5 64% 42%)',
  colorSuccess: 'hsl(152 46% 27%)',
  colorWarning: 'hsl(30 82% 31%)',
  colorError: 'hsl(2 66% 42%)',
  borderRadius: 10,
  borderRadiusLG: 10,
  borderRadiusSM: 8,
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  fontSize: 14,
  controlHeight: 36,
  wireframe: false,
}

const lightTheme: ThemeConfig = {
  algorithm: theme.defaultAlgorithm,
  token: {
    ...shared,
    colorTextBase: 'hsl(20 10% 14%)',
    colorText: 'hsl(20 10% 14%)',
    colorTextSecondary: 'hsl(20 6% 38%)',
    colorTextTertiary: 'hsl(20 5% 44%)',
    colorBorder: 'hsl(20 8% 88%)',
    colorBorderSecondary: 'hsl(20 10% 94%)',
    colorBgLayout: 'hsl(24 20% 96%)',
    colorBgContainer: '#ffffff',
  },
  components: {
    Layout: {
      headerBg: 'transparent',
      headerHeight: 64,
      bodyBg: 'hsl(24 20% 96%)',
      siderBg: '#ffffff',
    },
    Menu: {
      itemBg: 'transparent',
      itemColor: 'hsl(20 8% 28%)',
      itemHoverBg: 'hsl(24 16% 97%)',
      itemSelectedBg: 'hsl(8 58% 92%)',
      itemSelectedColor: 'hsl(5 66% 34%)',
      itemBorderRadius: 8,
      itemHeight: 38,
    },
    Table: {
      headerBg: 'transparent',
      headerColor: 'hsl(20 6% 44%)',
      headerSplitColor: 'transparent',
      rowHoverBg: 'hsl(24 16% 97%)',
      borderColor: 'hsl(20 10% 94%)',
      cellPaddingBlock: 16,
      cellPaddingInline: 16,
    },
    Card: {
      paddingLG: 20,
      colorBorderSecondary: 'hsl(20 10% 94%)',
    },
    Tag: { borderRadiusSM: 6 },
    Button: { primaryShadow: 'none', defaultShadow: 'none', fontWeight: 500 },
    Input: { paddingInline: 12 },
    Select: { optionSelectedBg: 'hsl(8 58% 92%)' },
  },
}

const darkTheme: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    ...shared,
    colorPrimary: 'hsl(5 70% 64%)',
    colorInfo: 'hsl(5 70% 64%)',
    colorSuccess: 'hsl(152 45% 62%)',
    colorWarning: 'hsl(36 85% 64%)',
    colorError: 'hsl(2 70% 68%)',
    colorTextBase: 'hsl(30 12% 93%)',
    colorText: 'hsl(30 12% 93%)',
    colorTextSecondary: 'hsl(30 6% 70%)',
    colorTextTertiary: 'hsl(30 6% 64%)',
    colorBorder: 'hsl(30 7% 26%)',
    colorBorderSecondary: 'hsl(30 8% 20%)',
    colorBgLayout: 'hsl(30 10% 9%)',
    colorBgContainer: 'hsl(30 9% 13%)',
    colorBgElevated: 'hsl(30 9% 16%)',
  },
  components: {
    Layout: {
      headerBg: 'transparent',
      headerHeight: 64,
      bodyBg: 'hsl(30 10% 9%)',
      siderBg: 'hsl(30 9% 13%)',
    },
    Menu: {
      itemBg: 'transparent',
      itemColor: 'hsl(30 8% 80%)',
      itemHoverBg: 'hsl(30 9% 16%)',
      itemSelectedBg: 'hsl(5 40% 26%)',
      itemSelectedColor: 'hsl(5 75% 78%)',
      itemBorderRadius: 8,
      itemHeight: 38,
    },
    Table: {
      headerBg: 'transparent',
      headerColor: 'hsl(30 6% 64%)',
      headerSplitColor: 'transparent',
      rowHoverBg: 'hsl(30 9% 16%)',
      borderColor: 'hsl(30 8% 20%)',
      cellPaddingBlock: 16,
      cellPaddingInline: 16,
    },
    Card: {
      paddingLG: 20,
      colorBorderSecondary: 'hsl(30 8% 20%)',
    },
    Tag: { borderRadiusSM: 6 },
    Button: { primaryShadow: 'none', defaultShadow: 'none', fontWeight: 500 },
    Input: { paddingInline: 12 },
    Select: { optionSelectedBg: 'hsl(5 40% 26%)' },
  },
}

export function buildTheme(mode: ThemeMode): ThemeConfig {
  return mode === 'dark' ? darkTheme : lightTheme
}
