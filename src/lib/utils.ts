import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import md5 from "md5"

/**
 * 合并 Tailwind CSS 类名，自动处理冲突
 * 使用 clsx 拼接，twMerge 去重和优先级处理
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 对密码进行 MD5 加密
 */
export function encryptPassword(password: string): string {
  return md5(password)
}

/**
 * 生成唯一 ID（时间戳 + 随机字符串）
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

/**
 * 格式化时间戳为相对时间或日期
 * - 1 分钟内：刚刚
 * - 1 小时内：X分钟前
 * - 24 小时内：X小时前
 * - 超过 24 小时：MM-DD HH:mm
 */
export function formatTime(ts: number) {
  const d = new Date(ts)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${mm}-${dd} ${hh}:${mi}`
}

/**
 * 判断两个日期是否为同一天
 */
export function isSameDay(first: Date, second: Date) {
  return first.getFullYear() === second.getFullYear()
    && first.getMonth() === second.getMonth()
    && first.getDate() === second.getDate()
}
