import { zhCN } from 'date-fns/locale/zh-CN'
import type { Locale } from 'date-fns'

const localeMap: Record<string, Locale> = {
  'zh-CN': zhCN,
}

let currentLocale: Locale = zhCN

export function getDateLocale(): Locale {
  return currentLocale
}

export function setDateLocale(code: string) {
  const locale = localeMap[code]
  if (locale) {
    currentLocale = locale
  }
}

export function registerDateLocale(code: string, locale: Locale) {
  localeMap[code] = locale
}
