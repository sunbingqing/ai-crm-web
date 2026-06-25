import { useState } from 'react'
import {
  ChevronDown,
  Clock3,
  Gauge,
  MessageCircleMore,
  PhoneCall,
  Sparkles,
  TimerReset,
  TriangleAlert,
  UsersRound,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

type QuickRange = 'month' | '7d' | '30d'
type EmployeeScope = 'all' | 'frontline' | 'new-team' | 'managers'

const OVERVIEW_METRICS = [
  {
    label: '电话会话',
    value: '1,286',
    detail: '本月已完成会话',
    icon: PhoneCall,
    tone: 'text-accent-blue',
  },
  {
    label: '企微会话',
    value: '3,521',
    detail: '客户沟通总量',
    icon: MessageCircleMore,
    tone: 'text-accent-green',
  },
  {
    label: '总通话时长',
    value: '89.2 小时',
    detail: '人均 22.3 小时',
    icon: Clock3,
    tone: 'text-accent-teal',
  },
  {
    label: '平均响应时长',
    value: '2.4 分钟',
    detail: '较上周缩短 0.6 分钟',
    icon: TimerReset,
    tone: 'text-accent-amber',
  },
]

const PHONE_FUNNEL = [
  { label: '呼出通话', count: 830, ratio: 100, accent: 'bg-accent-blue' },
  { label: '已接通', count: 720, ratio: 86.7, accent: 'bg-primary' },
  { label: '有效通话（30 秒以上）', count: 629, ratio: 75.8, accent: 'bg-accent-green' },
]

const PHONE_SUMMARY = [
  { label: '总通话时长', value: '89.2 小时' },
  { label: '平均通话时长', value: '4.2 分钟' },
  { label: '呼入通话', value: '456' },
  { label: '呼出通话', value: '830' },
]

const WECHAT_LEGEND = [
  { label: '有客户回复的会话', value: '2,197', color: 'bg-accent-green' },
  { label: '无客户回复的会话', value: '1,324', color: 'bg-muted' },
]

const WECHAT_SUMMARY = [
  { label: '平均首次响应时长', value: '1.8 分钟' },
  { label: '员工主动消息占比', value: '62.1%' },
  { label: '单员工日均会话数', value: '29' },
  { label: '客户平均等待时长', value: '4.2 分钟' },
]

const TEAM_ROWS = [
  {
    id: 'zhang-san',
    name: '张三',
    badge: '稳',
    callCount: 156,
    effectiveCallCount: 127,
    wechatReplyCount: 328,
    averageResponse: '2.1 分钟',
    replyRate: '58.2%',
    note: '电话转化稳定，建议补强企微追单。',
  },
  {
    id: 'li-si',
    name: '李四',
    badge: '新',
    callCount: 142,
    effectiveCallCount: 118,
    wechatReplyCount: 295,
    averageResponse: '2.5 分钟',
    replyRate: '52.7%',
    note: '响应节奏偏慢，适合跟进模板辅助。',
  },
  {
    id: 'wang-wu',
    name: '王五',
    badge: '稳',
    callCount: 138,
    effectiveCallCount: 101,
    wechatReplyCount: 267,
    averageResponse: '3.0 分钟',
    replyRate: '48.3%',
    note: '需要关注高意向客户二次触达。',
  },
  {
    id: 'zhao-liu',
    name: '赵六',
    badge: '优',
    callCount: 198,
    effectiveCallCount: 172,
    wechatReplyCount: 425,
    averageResponse: '1.8 分钟',
    replyRate: '63.1%',
    note: '客户回复率最佳，可沉淀打法给团队。',
  },
]

const EMPLOYEE_OPTIONS: Array<{ value: EmployeeScope; label: string }> = [
  { value: 'all', label: '全部员工' },
  { value: 'frontline', label: '一线销售' },
  { value: 'new-team', label: '新员工小组' },
  { value: 'managers', label: '管理视角' },
]

const QUICK_RANGE_OPTIONS: Array<{ value: QuickRange; label: string }> = [
  { value: 'month', label: '本月' },
  { value: '7d', label: '近 7 天' },
  { value: '30d', label: '近 30 天' },
]

const TEAM_PULSE = [
  {
    title: '本日队列压力',
    value: '17 个待处理会话',
    detail: '上午 10:00 到 11:30 是集中响应高峰。',
    icon: Zap,
  },
  {
    title: '需要跟进的成员',
    value: '2 人',
    detail: '李四、王五的平均响应时长仍高于团队基线。',
    icon: TriangleAlert,
  },
  {
    title: '本周最佳表现',
    value: '赵六 63.1%',
    detail: '客户回复率和有效通话率都在团队前列。',
    icon: Gauge,
  },
]

const TOP_PERFORMERS = [
  { name: '赵六', metric: '回复率 63.1%', note: '节奏快，适合沉淀标准话术。', tone: '优' },
  { name: '张三', metric: '有效通话 127', note: '电话转化稳定，执行很扎实。', tone: '稳' },
  { name: '李四', metric: '响应 2.5 分钟', note: '适合补一层企微跟进模板。', tone: '新' },
]

const HERO_SIGNALS = [
  { label: '今日排队峰值', value: '10:00 - 11:30' },
  { label: '待处理企微会话', value: '17 个' },
  { label: '需优先复盘成员', value: '2 人' },
]

export default function RevenueCockpitRoute() {
  const initialRange = getRangeFromPreset('month')
  const [startDate, setStartDate] = useState(initialRange.startDate)
  const [endDate, setEndDate] = useState(initialRange.endDate)
  const [quickRange, setQuickRange] = useState<QuickRange>('month')
  const [employeeScope, setEmployeeScope] = useState<EmployeeScope>('all')

  return (
    <div className="page-shell">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_390px]">
        <div className="panel-strong overflow-hidden">
          <div className="soft-grid p-5 sm:p-6">
            <div className="max-w-4xl">
              <p className="page-kicker text-white/58">团队作战看板</p>
              <h2 className="mt-3 max-w-4xl text-4xl font-semibold leading-tight sm:text-5xl">
                在客户感知之前，先看见团队节奏哪里慢了。
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-white/64">
                把电话接通率、企微回复和员工响应效率压进同一块屏里，页面有一点酷，但核心还是团队运营判断。
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Button variant="secondary">
                  <Sparkles className="size-4" />
                  生成班前简报
                </Button>
                <Button
                  variant="outline"
                  className="border-white/15 bg-white/10 text-white hover:bg-white/15 hover:text-white"
                >
                  <UsersRound className="size-4" />
                  查看成员队列
                </Button>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {HERO_SIGNALS.map((signal) => (
                  <div
                    key={signal.label}
                    className="rounded-lg border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-xl"
                  >
                    <p className="text-xs font-semibold uppercase text-white/48">{signal.label}</p>
                    <p className="mt-2 text-sm font-semibold text-white">{signal.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {OVERVIEW_METRICS.map((metric) => (
                <HeroMetric key={metric.label} {...metric} />
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <section className="toolbar-band h-fit">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <label className="space-y-2">
                <span className="block text-xs font-semibold uppercase text-muted-foreground">
                  开始日期
                </span>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="h-10 bg-card"
                />
              </label>

              <label className="space-y-2">
                <span className="block text-xs font-semibold uppercase text-muted-foreground">
                  结束日期
                </span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="h-10 bg-card"
                />
              </label>

              <FilterSelect
                label="快捷选择"
                value={quickRange}
                onChange={(value) => {
                  const next = value as QuickRange
                  const range = getRangeFromPreset(next)
                  setQuickRange(next)
                  setStartDate(range.startDate)
                  setEndDate(range.endDate)
                }}
                options={QUICK_RANGE_OPTIONS}
              />

              <FilterSelect
                label="员工"
                value={employeeScope}
                onChange={(value) => setEmployeeScope(value as EmployeeScope)}
                options={EMPLOYEE_OPTIONS}
              />
            </div>
          </section>

          <section className="panel-strong overflow-hidden p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Sparkles className="size-4 text-accent-teal" />
                AI 团队简报
              </div>
              <Badge variant="outline" className="border-white/15 bg-white/10 text-white">
                实时
              </Badge>
            </div>
            <div className="mt-4 space-y-3">
              <DarkBriefLine label="最佳回复率" value="赵六 63.1%" variant="dark" />
              <DarkBriefLine label="本周改善" value="响应时长下降 14%" variant="dark" />
              <DarkBriefLine label="需关注成员" value="李四、王五" variant="dark" />
            </div>
          </section>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_320px]">
        <div className="panel p-5">
          <ChannelHeader
            icon={PhoneCall}
            title="移动电话"
            subtitle="本月共 1,286 次通话"
            tone="bg-accent-blue/12 text-accent-blue"
          />

          <div className="mt-6 border-t border-border/70 pt-6">
            <p className="text-sm font-semibold">通话转化漏斗</p>
            <div className="mt-4 space-y-4">
              {PHONE_FUNNEL.map((item) => (
                <FunnelRow key={item.label} {...item} />
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-4 border-t border-border/70 pt-5 sm:grid-cols-4">
            {PHONE_SUMMARY.map((item) => (
              <SummaryStat key={item.label} {...item} />
            ))}
          </div>
        </div>

        <div className="panel p-5">
          <ChannelHeader
            icon={MessageCircleMore}
            title="企业微信"
            subtitle="本月共 3,521 次会话"
            tone="bg-accent-green/12 text-accent-green"
          />

          <div className="mt-6 border-t border-border/70 pt-6">
            <p className="text-sm font-semibold">客户回复率</p>
            <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-center">
              <ReplyDonut value={62.4} />
              <div className="min-w-0 flex-1 space-y-3">
                {WECHAT_LEGEND.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className={cn('size-2.5 rounded-full', item.color)} />
                      <span className="truncate text-muted-foreground">{item.label}</span>
                    </div>
                    <span className="mono-stat shrink-0">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 border-t border-border/70 pt-5 sm:grid-cols-2 xl:grid-cols-2">
            {WECHAT_SUMMARY.map((item) => (
              <SummaryStat key={item.label} {...item} />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <section className="panel-strong overflow-hidden p-5">
            <SectionHeader title="团队脉冲" subtitle="给主管一个可以立刻判断的侧栏视角。" inverse />
            <div className="mt-5 space-y-3">
              {TEAM_PULSE.map((item) => (
                <PulseItem key={item.title} {...item} inverse />
              ))}
            </div>
          </section>

          <section className="panel p-5">
            <SectionHeader title="本周表现" subtitle="既看结果，也看执行稳定性。" />
            <div className="mt-5 space-y-3">
              {TOP_PERFORMERS.map((item, index) => (
                <MemberHighlight key={item.name} index={index + 1} {...item} />
              ))}
            </div>
          </section>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_320px]">
        <div className="panel p-4 sm:p-5">
          <SectionHeader
            title="员工会话统计"
            subtitle="按成员查看电话会话、有效通话、企微回复和响应效率。"
          />
          <div className="mt-5 overflow-hidden rounded-lg border border-border/80">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4">员工</TableHead>
                  <TableHead>通话次数</TableHead>
                  <TableHead>有效通话次数</TableHead>
                  <TableHead>企微回复数</TableHead>
                  <TableHead>平均响应时长</TableHead>
                  <TableHead>客户回复率</TableHead>
                  <TableHead className="w-[280px]">重点提醒</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {TEAM_ROWS.map((member, index) => (
                  <TableRow key={member.id}>
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                          {member.name.slice(0, 1)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{member.name}</span>
                            <Badge variant="outline" className="bg-muted/55">
                              第 {index + 1}
                            </Badge>
                            <Badge
                              variant="secondary"
                              className={cn(
                                member.badge === '优' && 'bg-success/12 text-success-foreground',
                                member.badge === '新' && 'bg-warning/18 text-warning-foreground',
                                member.badge === '稳' && 'bg-muted text-muted-foreground',
                              )}
                            >
                              {member.badge}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="mono-stat">{member.callCount}</TableCell>
                    <TableCell className="mono-stat">{member.effectiveCallCount}</TableCell>
                    <TableCell className="mono-stat">{member.wechatReplyCount}</TableCell>
                    <TableCell>{member.averageResponse}</TableCell>
                    <TableCell>{member.replyRate}</TableCell>
                    <TableCell className="max-w-[280px] whitespace-normal text-sm text-muted-foreground">
                      {member.note}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <section className="panel-strong overflow-hidden p-5">
          <SectionHeader title="主管备注" subtitle="适合放经理每天最关心的判断信息。" inverse />
          <div className="mt-5 space-y-4">
            <NoteCard
              title="今天先盯谁"
              body="先看李四和王五的企微跟进节奏，尤其是高意向客户的二次触达有没有拖延。"
              inverse
            />
            <NoteCard
              title="可以复用的打法"
              body="赵六的客户回复承接很稳，建议把首条追问模板和收口节奏整理成团队标准流程。"
              inverse
            />
            <NoteCard
              title="电话与企微怎么配合"
              body="张三的电话通话质量很好，可以补一层企微复盘，争取把有效通话转成持续回复。"
              inverse
            />
          </div>
        </section>
      </section>
    </div>
  )
}

function getRangeFromPreset(preset: QuickRange) {
  const end = new Date()

  if (preset === 'month') {
    const start = new Date(end.getFullYear(), end.getMonth(), 1)
    return {
      startDate: formatDate(start),
      endDate: formatDate(end),
    }
  }

  const days = preset === '7d' ? 6 : 29
  const start = new Date(end)
  start.setDate(end.getDate() - days)
  return {
    startDate: formatDate(start),
    endDate: formatDate(end),
  }
}

function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function SectionHeader({
  title,
  subtitle,
  inverse = false,
}: {
  title: string
  subtitle: string
  inverse?: boolean
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className={cn('h-6 w-1 rounded-full', inverse ? 'bg-white' : 'bg-foreground')} />
        <h3 className={cn('text-lg font-semibold', inverse ? 'text-white' : 'text-foreground')}>
          {title}
        </h3>
      </div>
      <p className={cn('mt-2 text-sm', inverse ? 'text-white/62' : 'text-muted-foreground')}>
        {subtitle}
      </p>
    </div>
  )
}

function HeroMetric({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string
  value: string
  detail: string
  icon: LucideIcon
  tone: string
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-white/56">{label}</p>
        <Icon className={cn('size-4', tone)} />
      </div>
      <p className="mt-5 text-4xl font-semibold leading-none text-white">{value}</p>
      <p className="mt-3 text-sm text-white/62">{detail}</p>
    </div>
  )
}

function ChannelHeader({
  icon: Icon,
  title,
  subtitle,
  tone,
}: {
  icon: LucideIcon
  title: string
  subtitle: string
  tone: string
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn('flex size-11 items-center justify-center rounded-lg', tone)}>
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-xl font-semibold">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  )
}

function FunnelRow({
  label,
  count,
  ratio,
  accent,
}: {
  label: string
  count: number
  ratio: number
  accent: string
}) {
  return (
    <div className="grid grid-cols-[130px_minmax(0,1fr)_96px] items-center gap-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="h-7 overflow-hidden rounded-md bg-muted">
        <div
          className={cn('flex h-full items-center rounded-md px-3 text-xs font-semibold text-white', accent)}
          style={{ width: `${ratio}%` }}
        />
      </div>
      <div className="text-right">
        <span className="mono-stat text-base">{count}</span>
        <span className="ml-1 text-sm text-muted-foreground">次</span>
        {ratio < 100 && (
          <p className="text-xs text-muted-foreground">{ratio.toFixed(1)}%</p>
        )}
      </div>
    </div>
  )
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-3xl font-semibold leading-none">{value}</p>
      <p className="mt-2 text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

function DarkBriefLine({
  label,
  value,
  variant = 'light',
}: {
  label: string
  value: string
  variant?: 'light' | 'dark'
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-lg px-3 py-3',
        variant === 'dark'
          ? 'border border-white/10 bg-white/10'
          : 'border border-border/80 bg-muted/35',
      )}
    >
      <span className={cn('text-sm', variant === 'dark' ? 'text-white/62' : 'text-muted-foreground')}>
        {label}
      </span>
      <span className={cn('text-sm font-semibold', variant === 'dark' ? 'text-white' : 'text-foreground')}>
        {value}
      </span>
    </div>
  )
}

function ReplyDonut({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-5">
      <div
        className="relative size-28 rounded-full"
        style={{
          background: `conic-gradient(var(--accent-green) ${value}%, color-mix(in oklch, var(--muted) 92%, white 8%) ${value}% 100%)`,
        }}
      >
        <div className="absolute inset-[10px] flex items-center justify-center rounded-full bg-card">
          <div className="text-center">
            <p className="mono-stat text-3xl">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">回复率</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function PulseItem({
  title,
  value,
  detail,
  icon: Icon,
  inverse = false,
}: {
  title: string
  value: string
  detail: string
  icon: LucideIcon
  inverse?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-lg p-4',
        inverse
          ? 'border border-white/10 bg-white/10'
          : 'border border-border/80 bg-muted/35',
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('icon-tile', inverse && 'border-white/10 bg-white/10 text-white')}>
          <Icon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className={cn('text-sm font-semibold', inverse && 'text-white')}>{title}</p>
            <span className={cn('text-xs font-semibold', inverse ? 'text-white/58' : 'text-muted-foreground')}>
              {value}
            </span>
          </div>
          <p className={cn('mt-2 text-sm leading-5', inverse ? 'text-white/62' : 'text-muted-foreground')}>
            {detail}
          </p>
        </div>
      </div>
    </div>
  )
}

function MemberHighlight({
  index,
  name,
  metric,
  note,
  tone,
}: {
  index: number
  name: string
  metric: string
  note: string
  tone: string
}) {
  return (
    <div className="rounded-lg border border-border/80 bg-muted/35 p-4">
      <div className="flex items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {index}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{name}</span>
            <Badge
              variant="secondary"
              className={cn(
                tone === '优' && 'bg-success/12 text-success-foreground',
                tone === '新' && 'bg-warning/18 text-warning-foreground',
                tone === '稳' && 'bg-muted text-muted-foreground',
              )}
            >
              {tone}
            </Badge>
          </div>
          <p className="mt-2 text-sm font-medium">{metric}</p>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">{note}</p>
        </div>
      </div>
    </div>
  )
}

function NoteCard({
  title,
  body,
  inverse = false,
}: {
  title: string
  body: string
  inverse?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-lg p-4',
        inverse
          ? 'border border-white/10 bg-white/10'
          : 'border border-border/80 bg-muted/35',
      )}
    >
      <p className={cn('text-sm font-semibold', inverse && 'text-white')}>{title}</p>
      <p className={cn('mt-2 text-sm leading-6', inverse ? 'text-white/62' : 'text-muted-foreground')}>
        {body}
      </p>
    </div>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return (
    <label className="space-y-2">
      <span className="block text-xs font-semibold uppercase text-muted-foreground">
        {label}
      </span>
      <div className="relative min-w-[160px]">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-full appearance-none rounded-lg border border-input bg-card px-3 pr-10 text-sm shadow-none outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      </div>
    </label>
  )
}
