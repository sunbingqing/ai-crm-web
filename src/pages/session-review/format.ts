import { isSameDay } from '@/lib/utils'

function toDate(value?: string) {
  if (value == null || value === '') return new Date(NaN)
  const ms = Number(value)
  if (Number.isFinite(ms) && /^\d{10,}$/.test(String(value).trim())) return new Date(ms)
  return new Date(value)
}

export function formatSessionTime(value?: string) {
  if (!value) return '-'

  const date = toDate(value)
  if (Number.isNaN(date.getTime())) return value

  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  const timeText = date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  if (isSameDay(date, today)) return `今天 ${timeText}`
  if (isSameDay(date, yesterday)) return `昨天 ${timeText}`

  const dateText = date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  })

  return `${dateText} ${timeText}`
}

export function formatDateTime(value?: string) {
  if (!value) return '暂无'

  const date = toDate(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function formatFollowTime(value?: string) {
  if (!value) return '暂无'

  const date = toDate(value)
  if (Number.isNaN(date.getTime())) return value

  const today = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)
  const timeText = date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  if (isSameDay(date, today)) return `今天 ${timeText}`
  if (isSameDay(date, tomorrow)) return `明天 ${timeText}`

  const dateText = date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  })

  return `${dateText} ${timeText}`
}

export function formatFollowStatus(value?: string) {
  if (!value) return '暂无'
  if (value === 'TODO') return '未开始'
  if (value === 'DONE') return '已完成'
  if (value === 'OVERDUE') return '已逾期'
  return value
}

export function getQualityTone(value?: string) {
  if (value?.includes('高')) return 'text-primary'
  if (value?.includes('低')) return 'text-destructive'
  return 'text-muted-foreground'
}

export function formatQualityLabel(value?: string) {
  if (!value?.trim()) return '暂无'
  return value.replace('风险', '').trim() || value
}

export function getIntentTone(value: string) {
  if (value.includes('高')) return 'bg-primary/10 text-primary'
  if (value.includes('低') || value.includes('弱')) return 'bg-muted text-muted-foreground'
  return 'bg-foreground/6 text-foreground'
}
