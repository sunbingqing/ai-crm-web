import { Fragment, type ReactNode } from 'react'
import {
  BarChart3,
  Bot,
  ClipboardList,
  Clock3,
  MessageSquare,
  PhoneCall,
  Sparkles,
  TrendingUp,
  User,
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  type CallAnalysisBlock,
  type CallAnalysisChart,
  type CallAnalysisMetric,
  type CallAnalysisResult,
  type CallAnalysisSession,
  type CallAnalysisTable,
  type CallAnalysisTableValue,
} from '@/services/assistant'

interface AssistantAnalysisCardProps {
  analysis: CallAnalysisResult
  onSend?: (query: string) => void
}

export function AssistantAnalysisCard({ analysis, onSend }: AssistantAnalysisCardProps) {
  const blocks = analysis.blocks ?? []
  const filterTags = buildFilterTags(analysis)
  const isIrrelevant = analysis.summary?.startsWith('我是销售通话分析助手') ?? false
  const isTaskMetric = analysis.effectiveFilters?.analysisIntent === 'task_metric'

  return (
    <div className="overflow-hidden rounded-3xl border bg-background shadow-sm">
      <div className="border-b bg-gradient-to-r from-primary/8 via-background to-background px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-lg font-semibold">{analysis.title}</p>
            {!isIrrelevant && (
              <p className="mt-1 text-xs text-muted-foreground">
                {isTaskMetric ? '统计口径' : '分析范围'}：{analysis.scopeDescription || (isTaskMetric ? '当前任务' : '最近一段时间')}
              </p>
            )}
          </div>
          <div className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
            查询：{analysis.query}
          </div>
        </div>
        {filterTags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {filterTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border bg-background/80 px-2.5 py-1 text-[11px] text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        {analysis.effectiveFilters?.summary && (
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            {analysis.effectiveFilters.summary}
          </p>
        )}
      </div>

      <div className="px-5 py-5">
        <div className="space-y-5">
          {blocks.map((block, index) => (
            <Fragment key={block.id}>
              {index > 0 && <Separator />}
              <AnalysisBlockRenderer block={block} />
            </Fragment>
          ))}
        </div>
      </div>

      {isIrrelevant && onSend && (
        <div className="border-t px-5 py-4">
          <p className="mb-3 text-xs font-medium text-muted-foreground">试试以下分析：</p>
          <div className="grid gap-2 md:grid-cols-2">
            {PRESET_IRRELEVANT_QUESTIONS.map((q) => (
              <Button
                key={q.id}
                variant="outline"
                size="sm"
                className="h-auto justify-start gap-2 px-3 py-2.5 text-left font-normal"
                onClick={() => onSend(q.text)}
              >
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="line-clamp-2 text-xs">{q.text}</span>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const PRESET_IRRELEVANT_QUESTIONS = [
  { id: '1', text: '近 7 天有哪些风险会话？' },
  { id: '2', text: '哪些客户需要优先处理？' },
  { id: '3', text: '哪些成员需要我关注？' },
  { id: '4', text: '近 7 天的通话情况如何？' },
]

function buildFilterTags(analysis: CallAnalysisResult) {
  const filters = analysis.effectiveFilters
  if (!filters) {
    return []
  }

  const tags = []

  const isTaskMetric = filters.analysisIntent === 'task_metric'
  const hitUnit = isTaskMetric ? '项' : filters.analysisIntent === 'member_attention' ? '位' : '条'

  tags.push(`命中：${analysis.matchedSessionCount} ${hitUnit}`)
  if (filters.analysisIntent) {
    tags.push(`意图：${labelForIntent(filters.analysisIntent)}`)
  }
  if (filters.callerName) {
    tags.push(`成员：${filters.callerName}`)
  }
  if (filters.customerName) {
    tags.push(`客户：${filters.customerName}`)
  }

  return tags
}

function labelForIntent(intent: string) {
  switch (intent) {
    case 'priority_customers':
      return '优先客户'
    case 'risk_sessions':
      return '风险会话'
    case 'member_attention':
      return '成员关注'
    case 'task_metric':
      return '任务指标'
    default:
      return '通用分析'
  }
}

function AnalysisBlockRenderer({ block }: { block: CallAnalysisBlock }) {
  if (block.type === 'summary') {
    return <SummaryBlock block={block} />
  }

  if (block.type === 'metrics') {
    return <MetricsBlock block={block} />
  }

  if (block.type === 'chart' && block.chart) {
    return <ChartBlock block={block} chart={block.chart} />
  }

  if (block.type === 'table' && block.table) {
    return <TableBlock block={block} table={block.table} />
  }

  if (block.type === 'sessions') {
    return <SessionsBlock block={block} />
  }

  return <TextBlock block={block} />
}

function SummaryBlock({ block }: { block: CallAnalysisBlock }) {
  return (
    <div className="space-y-3">
      <BlockHeading
        block={{ ...block, description: undefined }}
        icon={<Sparkles className="h-4 w-4 text-primary" />}
      />
      <div className="rounded-2xl bg-muted/60 p-4">
        <p className="text-sm leading-7 text-foreground">
          {block.content || '已完成通话分析，但暂时没有可展示的摘要。'}
        </p>
      </div>
      {block.items.length > 0 && (
        <div className="grid gap-2 md:grid-cols-2">
          {block.items.map((item, index) => (
            <div
              key={`${item}-${index}`}
              className="rounded-2xl border bg-background px-3 py-3 text-sm text-muted-foreground"
            >
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MetricsBlock({ block }: { block: CallAnalysisBlock }) {
  return (
    <div className="space-y-3">
      <BlockHeading block={block} icon={<BarChart3 className="h-4 w-4 text-primary" />} />
      <div className="grid gap-3 md:grid-cols-4">
        {block.metrics.map((metric) => (
          <MetricCard
            key={metric.label}
            icon={iconForMetric(metric)}
            label={metric.label}
            value={metric.value}
            helperText={metric.helperText}
          />
        ))}
      </div>
    </div>
  )
}

function ChartBlock({
  block,
  chart,
}: {
  block: CallAnalysisBlock
  chart: CallAnalysisChart
}) {
  const safeData = chart.data.map((item) => ({
    label: item.label,
    value: Number.isFinite(item.value) ? item.value : 0,
  }))

  return (
    <div className="space-y-3">
      <BlockHeading block={block} icon={<TrendingUp className="h-4 w-4 text-primary" />} />
      <div className="rounded-2xl border bg-background p-4">
        {safeData.length === 0 ? (
          <div className="flex h-44 items-center justify-center rounded-2xl bg-muted/40 text-sm text-muted-foreground">
            暂无图表数据
          </div>
        ) : chart.type === 'bar' ? (
          <BarSvgChart data={safeData} />
        ) : (
          <LineSvgChart data={safeData} />
        )}
      </div>
    </div>
  )
}

function TableBlock({
  block,
  table,
}: {
  block: CallAnalysisBlock
  table: CallAnalysisTable
}) {
  return (
    <div className="space-y-3">
      <BlockHeading block={block} icon={<MessageSquare className="h-4 w-4 text-primary" />} />
      <div className="overflow-hidden rounded-2xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              {table.columns.map((column) => (
                <TableHead key={column.key}>{column.title}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={Math.max(table.columns.length, 1)} className="py-8 text-center text-muted-foreground">
                  暂无表格数据
                </TableCell>
              </TableRow>
            ) : (
              table.rows.map((row, index) => (
                <TableRow key={row.id ?? index}>
                  {table.columns.map((column) => (
                    <TableCell key={column.key} className="max-w-[280px] whitespace-normal align-top break-words">
                      {renderCellValue(row[column.key])}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function SessionsBlock({ block }: { block: CallAnalysisBlock }) {
  const sessions = block.sessions.slice(0, 6)

  return (
    <div className="space-y-3">
      <BlockHeading block={block} icon={<PhoneCall className="h-4 w-4 text-primary" />} />
      <div className="grid gap-3">
        {sessions.map((session) => (
          <SessionCard key={session.sessionId} session={session} />
        ))}
      </div>
    </div>
  )
}

function TextBlock({ block }: { block: CallAnalysisBlock }) {
  return (
    <div className="space-y-3">
      <BlockHeading block={block} icon={<Bot className="h-4 w-4 text-primary" />} />
      <div className="rounded-2xl border bg-background px-4 py-4 text-sm leading-7 text-muted-foreground">
        {block.content || block.items.join('；') || '暂无内容'}
      </div>
    </div>
  )
}

function BlockHeading({
  block,
  icon,
}: {
  block: CallAnalysisBlock
  icon: ReactNode
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-sm font-medium">
        {icon}
        <span>{block.title || '分析模块'}</span>
      </div>
      {block.description ? (
        <p className="text-xs text-muted-foreground">{block.description}</p>
      ) : null}
    </div>
  )
}

function MetricCard({
  icon,
  label,
  value,
  helperText,
}: {
  icon: ReactNode
  label: string
  value: string
  helperText?: string
}) {
  return (
    <div className="rounded-2xl border bg-background px-4 py-3">
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
      {helperText ? (
        <div className="mt-1 text-[11px] leading-5 text-muted-foreground">{helperText}</div>
      ) : null}
    </div>
  )
}

function SessionCard({ session }: { session: CallAnalysisSession }) {
  const chips = [
    session.customerIntent ? `意向：${session.customerIntent}` : '',
    session.followStage ? `阶段：${session.followStage}` : '',
    typeof session.qualityScore === 'number' ? `质量：${session.qualityScore}` : '',
  ].filter(Boolean)

  return (
    <div className="rounded-2xl border bg-background px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium">
            {session.customerName || '未命名客户'}
            {session.customerPhone ? (
              <span className="ml-2 text-xs text-muted-foreground">{session.customerPhone}</span>
            ) : null}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {formatDateTime(session.startTime)} · {session.callerName || '未知成员'}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-muted px-2.5 py-1">{session.messageCount} 条消息</span>
          <span className="rounded-full bg-muted px-2.5 py-1">
            {formatSessionDuration(session.durationMinutes, session.endTime)}
          </span>
          {session.endTime == null ? (
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">进行中</span>
          ) : null}
        </div>
      </div>

      {chips.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span key={chip} className="rounded-full border bg-muted/40 px-2.5 py-1 text-[11px] text-muted-foreground">
              {chip}
            </span>
          ))}
        </div>
      )}

      <p className={cn('mt-3 text-sm leading-6 text-muted-foreground', session.excerpt ? 'line-clamp-3' : '')}>
        {session.concludeSummary || session.excerpt || '暂无摘要'}
      </p>
    </div>
  )
}

function LineSvgChart({ data }: { data: Array<{ label: string; value: number }> }) {
  const width = 320
  const height = 180
  const padding = { top: 16, right: 16, bottom: 34, left: 24 }
  const innerWidth = width - padding.left - padding.right
  const innerHeight = height - padding.top - padding.bottom
  const maxValue = Math.max(...data.map((item) => item.value), 1)
  const points = data.map((item, index) => {
    const x = data.length === 1
      ? padding.left + innerWidth / 2
      : padding.left + (innerWidth * index) / (data.length - 1)
    const y = padding.top + innerHeight - (item.value / maxValue) * innerHeight
    return { ...item, x, y }
  })
  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + innerHeight} L ${points[0].x} ${padding.top + innerHeight} Z`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full">
      {[0, 0.5, 1].map((ratio) => {
        const y = padding.top + innerHeight * ratio
        return (
          <line
            key={ratio}
            x1={padding.left}
            y1={y}
            x2={padding.left + innerWidth}
            y2={y}
            stroke="currentColor"
            className="text-border/70"
          />
        )
      })}

      <path d={areaPath} fill="currentColor" className="text-primary/10" />
      <path d={linePath} fill="none" stroke="currentColor" strokeWidth="3" className="text-primary" />

      {points.map((point) => (
        <g key={point.label}>
          <circle cx={point.x} cy={point.y} r="4" fill="currentColor" className="text-primary" />
          <text
            x={point.x}
            y={height - 10}
            textAnchor="middle"
            className="fill-muted-foreground text-[10px]"
          >
            {truncateLabel(point.label)}
          </text>
        </g>
      ))}

      <text x={padding.left} y={12} className="fill-muted-foreground text-[10px]">
        {formatValue(maxValue)}
      </text>
      <text x={padding.left} y={padding.top + innerHeight + 12} className="fill-muted-foreground text-[10px]">
        0
      </text>
    </svg>
  )
}

function BarSvgChart({ data }: { data: Array<{ label: string; value: number }> }) {
  const width = 320
  const height = 180
  const padding = { top: 16, right: 16, bottom: 42, left: 24 }
  const innerWidth = width - padding.left - padding.right
  const innerHeight = height - padding.top - padding.bottom
  const maxValue = Math.max(...data.map((item) => item.value), 1)
  const slotWidth = innerWidth / data.length
  const barWidth = Math.min(36, slotWidth * 0.64)

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full">
      {[0, 0.5, 1].map((ratio) => {
        const y = padding.top + innerHeight * ratio
        return (
          <line
            key={ratio}
            x1={padding.left}
            y1={y}
            x2={padding.left + innerWidth}
            y2={y}
            stroke="currentColor"
            className="text-border/70"
          />
        )
      })}

      {data.map((item, index) => {
        const x = padding.left + slotWidth * index + (slotWidth - barWidth) / 2
        const barHeight = (item.value / maxValue) * innerHeight
        const y = padding.top + innerHeight - barHeight
        return (
          <g key={item.label}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(barHeight, 2)}
              rx="10"
              fill="currentColor"
              className="text-primary/80"
            />
            <text
              x={x + barWidth / 2}
              y={y - 6}
              textAnchor="middle"
              className="fill-foreground text-[10px]"
            >
              {formatValue(item.value)}
            </text>
            <text
              x={x + barWidth / 2}
              y={height - 12}
              textAnchor="middle"
              className="fill-muted-foreground text-[10px]"
            >
              {truncateLabel(item.label)}
            </text>
          </g>
        )
      })}

      <text x={padding.left} y={12} className="fill-muted-foreground text-[10px]">
        {formatValue(maxValue)}
      </text>
    </svg>
  )
}

function iconForMetric(metric: CallAnalysisMetric) {
  if (metric.label.includes('通话') || metric.label.includes('会话')) {
    return <PhoneCall className="h-4 w-4" />
  }
  if (metric.label.includes('任务') || metric.label.includes('跟进') || metric.label.includes('逾期')) {
    return <ClipboardList className="h-4 w-4" />
  }
  if (metric.label.includes('消息')) {
    return <MessageSquare className="h-4 w-4" />
  }
  if (metric.label.includes('时长')) {
    return <Clock3 className="h-4 w-4" />
  }
  if (metric.label.includes('质量') || metric.label.includes('风险')) {
    return <TrendingUp className="h-4 w-4" />
  }
  return <User className="h-4 w-4" />
}

function renderCellValue(value: CallAnalysisTableValue | undefined) {
  if (value == null || value === '') {
    return '-'
  }
  return String(value)
}

function formatDateTime(value?: string) {
  if (!value) return '时间未知'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatSessionDuration(durationMinutes: number, endTime?: string) {
  if (durationMinutes > 0) return `${durationMinutes} 分钟`
  return endTime ? '<1 分钟' : '时长待补充'
}

function truncateLabel(label: string) {
  return label.length > 6 ? `${label.slice(0, 6)}…` : label
}

function formatValue(value: number) {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1)
}
