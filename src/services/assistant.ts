import api from '@/lib/api'

export interface CallAnalysisPoint {
  label: string
  value: number
}

export interface CallAnalysisChart {
  id: string
  title: string
  type: 'line' | 'bar'
  xLabel?: string
  yLabel?: string
  data: CallAnalysisPoint[]
}

export interface CallAnalysisMetric {
  label: string
  value: string
  helperText?: string
}

export interface CallAnalysisTableColumn {
  key: string
  title: string
}

export type CallAnalysisTableValue = string | number | null

export type CallAnalysisTableRow = Record<string, CallAnalysisTableValue | undefined>

export interface CallAnalysisTable {
  columns: CallAnalysisTableColumn[]
  rows: CallAnalysisTableRow[]
}

export interface CallAnalysisSession {
  sessionId: number
  customerId?: number
  customerName?: string
  customerPhone?: string
  callerId?: number
  callerName?: string
  startTime?: string
  endTime?: string
  messageCount: number
  durationMinutes: number
  excerpt?: string
  concludeSummary?: string
  customerIntent?: string
  followStage?: string
  customerObjections: string[]
  customerTags: string[]
  nextFollowTime?: string
  nextFollowAction?: string
  nextFollowStatus?: string
  qualityScore?: number
  qualityLevel?: string
  qualityDimensionScore?: Record<string, number>
  analysisStrengths?: string
  analysisImprovements?: string
  analysisNextSuggestions?: string
  analysisSuggestedScript?: string
  concludedAt?: string
}

export type CallAnalysisBlockType = 'summary' | 'metrics' | 'chart' | 'table' | 'sessions' | 'text' | 'list'

export interface CallAnalysisBlock {
  id: string
  type: CallAnalysisBlockType
  title?: string
  description?: string
  content?: string
  items: string[]
  metrics: CallAnalysisMetric[]
  chart?: CallAnalysisChart
  table?: CallAnalysisTable
  sessions: CallAnalysisSession[]
}

export interface CallAnalysisResult {
  title: string
  summary: string
  query: string
  scopeDescription: string
  matchedSessionCount: number
  matchedMessageCount: number
  totalDurationMinutes: number
  averageDurationMinutes: number
  highlights: string[]
  effectiveFilters?: CallAnalysisFilters
  blocks: CallAnalysisBlock[]
  charts: CallAnalysisChart[]
  sessions: CallAnalysisSession[]
}

export interface CallAnalysisFilters {
  startDate?: string
  endDate?: string
  scopeDescription?: string
  summary?: string
  callerId?: number
  callerName?: string
  customerId?: number
  customerName?: string
  sessionLimit?: number
  analysisIntent?: string
  time?: CallAnalysisFilterField
  caller?: CallAnalysisFilterField
  customer?: CallAnalysisFilterField
  sessionLimitField?: CallAnalysisFilterField
  analysisIntentField?: CallAnalysisFilterField
}

export interface CallAnalysisFilterField {
  value?: string
  source?: string
}

export interface CallAnalysisRequest {
  query: string
  startDate?: string
  endDate?: string
  callerId?: number
  customerId?: number
  sessionLimit?: number
  previousFilters?: CallAnalysisFilters
}

interface RawCallAnalysisMetric extends CallAnalysisMetric {}

interface RawCallAnalysisChart extends Omit<CallAnalysisChart, 'xLabel' | 'yLabel'> {
  xLabel?: string
  yLabel?: string
  xlabel?: string
  ylabel?: string
}

interface RawCallAnalysisTable extends Omit<CallAnalysisTable, 'rows'> {
  rows?: Array<Record<string, unknown>>
}

interface RawCallAnalysisSession extends Omit<CallAnalysisSession, 'customerObjections' | 'customerTags'> {
  customerObjections?: unknown
  customerTags?: unknown
}

interface RawCallAnalysisBlock extends Omit<CallAnalysisBlock, 'chart' | 'table' | 'sessions' | 'metrics' | 'items'> {
  items?: string[]
  metrics?: RawCallAnalysisMetric[]
  chart?: RawCallAnalysisChart
  table?: RawCallAnalysisTable
  sessions?: RawCallAnalysisSession[]
}

interface RawCallAnalysisResult extends Omit<CallAnalysisResult, 'charts' | 'sessions' | 'blocks'> {
  charts?: RawCallAnalysisChart[]
  sessions?: RawCallAnalysisSession[]
  blocks?: RawCallAnalysisBlock[]
}

type AnalysisMode = 'overview' | 'task_metric' | 'priority' | 'risk' | 'member' | 'irrelevant'

export function analyzeCallSessions(data: CallAnalysisRequest, signal?: AbortSignal) {
  return api
    .post<unknown, RawCallAnalysisResult>('/call-session/analysis', data, { signal, timeout: 300000 })
    .then(normalizeAnalysisResult)
}

function normalizeAnalysisResult(result: RawCallAnalysisResult): CallAnalysisResult {
  let normalized: CallAnalysisResult = {
    ...result,
    title: result.title ?? '通话分析',
    summary: result.summary ?? '',
    query: result.query ?? '',
    scopeDescription: result.scopeDescription ?? '',
    matchedSessionCount: Number(result.matchedSessionCount ?? 0),
    matchedMessageCount: Number(result.matchedMessageCount ?? 0),
    totalDurationMinutes: Number(result.totalDurationMinutes ?? 0),
    averageDurationMinutes: Number(result.averageDurationMinutes ?? 0),
    highlights: result.highlights ?? [],
    effectiveFilters: result.effectiveFilters,
    charts: normalizeCharts(result.charts),
    sessions: normalizeSessions(result.sessions),
    blocks: [],
  }

  if (shouldUseClientFallback(normalized)) {
    normalized = {
      ...normalized,
      title: normalized.title && !/无数据/.test(normalized.title) ? normalized.title : '通话分析',
      summary: buildFallbackSummary(normalized),
      highlights: buildFallbackHighlights(normalized),
    }
  }

  const normalizedBlocks = normalizeBlocks(result.blocks, normalized)
  normalized.blocks = normalizedBlocks.length > 0 ? normalizedBlocks : deriveBlocks(normalized)
  return normalized
}

function normalizeCharts(charts?: RawCallAnalysisChart[]) {
  return (charts ?? []).map((chart) => ({
    ...chart,
    xLabel: chart.xLabel ?? chart.xlabel,
    yLabel: chart.yLabel ?? chart.ylabel,
    data: (chart.data ?? []).map((point) => ({
      label: point.label,
      value: Number.isFinite(point.value) ? point.value : 0,
    })),
  }))
}

function normalizeSessions(sessions?: RawCallAnalysisSession[]) {
  return (sessions ?? []).map((session) => ({
    ...session,
    messageCount: Number(session.messageCount ?? 0),
    durationMinutes: Number(session.durationMinutes ?? 0),
    customerObjections: toStringArray(session.customerObjections),
    customerTags: toStringArray(session.customerTags),
    qualityDimensionScore: normalizeScoreMap(session.qualityDimensionScore),
  }))
}

function normalizeBlocks(rawBlocks: RawCallAnalysisBlock[] | undefined, analysis: CallAnalysisResult) {
  const blocks = (rawBlocks ?? [])
    .map((block) => normalizeBlock(block))
    .filter((block) => hasRenderableContent(block))

  if (blocks.length === 0) {
    return []
  }

  const summaryBlock = buildSummaryBlock(analysis)
  const hasSummary = blocks.some((block) => block.type === 'summary')

  return blocks.map((block) =>
    block.type === 'summary'
      ? {
          ...block,
          title: block.title ?? summaryBlock.title,
          description: block.description ?? summaryBlock.description,
          content: analysis.summary || block.content,
          items: analysis.highlights.length > 0 ? analysis.highlights : block.items,
        }
      : block,
  ).concat(hasSummary ? [] : [summaryBlock]).sort((left, right) => blockOrder(left.type) - blockOrder(right.type))
}

function normalizeBlock(block: RawCallAnalysisBlock): CallAnalysisBlock {
  return {
    id: block.id ?? `${block.type ?? 'block'}-${Math.random().toString(36).slice(2, 8)}`,
    type: block.type ?? 'text',
    title: block.title,
    description: block.description,
    content: block.content,
    items: block.items ?? [],
    metrics: block.metrics ?? [],
    chart: block.chart
      ? {
          ...block.chart,
          xLabel: block.chart.xLabel ?? block.chart.xlabel,
          yLabel: block.chart.yLabel ?? block.chart.ylabel,
          data: (block.chart.data ?? []).map((point) => ({
            label: point.label,
            value: Number.isFinite(point.value) ? point.value : 0,
          })),
        }
      : undefined,
    table: block.table
      ? {
          columns: block.table.columns ?? [],
          rows: (block.table.rows ?? []).map((row) => normalizeTableRow(row)),
        }
      : undefined,
    sessions: normalizeSessions(block.sessions),
  }
}

function hasRenderableContent(block: CallAnalysisBlock) {
  return Boolean(
    block.content
      || block.items.length > 0
      || block.metrics.length > 0
      || block.chart
      || block.table?.rows.length
      || block.sessions.length > 0,
  )
}

function deriveBlocks(analysis: CallAnalysisResult) {
  const mode = detectMode(analysis.query)
  const blocks: CallAnalysisBlock[] = [buildSummaryBlock(analysis)]

  if (mode === 'irrelevant') {
    blocks[0] = {
      ...blocks[0],
      title: '提示',
      content: '我是销售通话分析助手，主要帮助您分析通话记录、识别风险客户和关注成员。请尝试提出分析类问题。',
      items: ['此问题与通话记录分析无关'],
    }
    return blocks
  }

  blocks.push(buildMetricsBlock(analysis, mode))

  if (mode === 'priority') {
    const table = buildPriorityTable(analysis.sessions)
    if (table.rows.length > 0) {
      blocks.push({
        id: 'priority-customers',
        type: 'table',
        title: '建议优先处理的客户',
        description: '优先展示最近有明确跟进价值的客户',
        items: [],
        metrics: [],
        table,
        sessions: [],
      })
    }
    return blocks
  }

  if (mode === 'risk') {
    const table = buildRiskTable(analysis.sessions)
    if (table.rows.length > 0) {
      blocks.push({
        id: 'risk-sessions',
        type: 'table',
        title: '近期待关注的风险会话',
        description: '优先关注低意向、存在异议或跟进动作不足的会话',
        items: [],
        metrics: [],
        table,
        sessions: [],
      })
    }
    return blocks
  }

  if (mode === 'member') {
    blocks.push(...analysis.charts.map(toChartBlock))
    const table = buildMemberTable(analysis.sessions)
    if (table.rows.length > 0) {
      blocks.push({
        id: 'member-attention',
        type: 'table',
        title: '建议关注的成员',
        description: '基于当前命中的会话样本做快速判断',
        items: [],
        metrics: [],
        table,
        sessions: [],
      })
    }
    return blocks
  }

  blocks.push(...analysis.charts.map(toChartBlock))
  if (shouldShowSessions(analysis.query) && analysis.sessions.length > 0) {
    blocks.push({
      id: 'sessions',
      type: 'sessions',
      title: '匹配到的通话记录',
      description: '仅展示最近命中的部分会话',
      items: [],
      metrics: [],
      sessions: analysis.sessions.slice(0, 6),
    })
  }
  return blocks
}

function buildSummaryBlock(analysis: CallAnalysisResult): CallAnalysisBlock {
  const isTaskMetric = analysis.effectiveFilters?.analysisIntent === 'task_metric'
  return {
    id: 'summary',
    type: 'summary',
    title: isTaskMetric ? '指标结果' : '分析结论',
    content: analysis.summary || (isTaskMetric ? '已完成指标查询，但暂时没有可展示的摘要。' : '已完成通话分析，但暂时没有可展示的摘要。'),
    items: analysis.highlights,
    metrics: [],
    sessions: [],
  }
}

function buildMetricsBlock(analysis: CallAnalysisResult, mode: AnalysisMode): CallAnalysisBlock {
  let metrics: CallAnalysisMetric[]

  if (mode === 'task_metric') {
    metrics = analysis.blocks.find((block) => block.type === 'metrics' && block.metrics.length > 0)?.metrics ?? [
      metric('匹配任务', `${analysis.matchedSessionCount}`, '当前命中的跟进任务数'),
    ]
  } else if (mode === 'priority') {
    metrics = [
      metric('匹配通话', `${analysis.matchedSessionCount}`, '当前命中的通话场次'),
      metric('涉及客户', `${countDistinct(analysis.sessions.map((session) => session.customerName || `${session.customerId ?? ''}`))}`, '去重后的客户数量'),
      metric('高意向会话', `${analysis.sessions.filter((session) => session.customerIntent === '高').length}`, '如果后端总结已完成会更准确'),
      metric('明确跟进', `${analysis.sessions.filter((session) => Boolean(session.nextFollowAction)).length}`, '已有下一步动作的会话'),
    ]
  } else if (mode === 'risk') {
    metrics = [
      metric('风险会话', `${analysis.sessions.filter((session) => computeRiskScore(session) > 0).length}`, '基于意向、异议和改进建议'),
      metric('低意向会话', `${analysis.sessions.filter((session) => session.customerIntent === '低').length}`, '客户意向偏低'),
      metric('低分会话', `${analysis.sessions.filter((session) => (session.qualityScore ?? 100) < 70).length}`, '质量评分低于 70'),
      metric('已总结会话', `${analysis.sessions.filter((session) => Boolean(session.concludedAt)).length}`, '有总结维度可供判断'),
    ]
  } else if (mode === 'member') {
    metrics = [
      metric('参与成员', `${countDistinct(analysis.sessions.map((session) => session.callerName || `${session.callerId ?? ''}`))}`, '当前范围内有过通话的成员'),
      metric('风险会话', `${analysis.sessions.filter((session) => computeRiskScore(session) > 0).length}`, '需要重点复盘的通话'),
      metric('平均质量', formatAverageQuality(analysis.sessions), '基于已生成总结的会话'),
      metric('已总结会话', `${analysis.sessions.filter((session) => Boolean(session.concludedAt)).length}`, '可用于质量判断的样本'),
    ]
  } else {
    metrics = [
      metric('通话场次', `${analysis.matchedSessionCount}`),
      metric('消息条数', `${analysis.matchedMessageCount}`),
      metric('总时长', formatDurationMetric(analysis.totalDurationMinutes, analysis.matchedSessionCount)),
      metric('平均时长', formatAverageMetric(analysis.averageDurationMinutes, analysis.matchedSessionCount)),
    ]
  }

  return {
    id: 'metrics',
    type: 'metrics',
    title: '关键指标',
    metrics,
    items: [],
    sessions: [],
  }
}

function metric(label: string, value: string, helperText?: string): CallAnalysisMetric {
  return { label, value, helperText }
}

function toChartBlock(chart: CallAnalysisChart): CallAnalysisBlock {
  return {
    id: chart.id,
    type: 'chart',
    title: chart.title,
    description: `${chart.xLabel || '维度'} / ${chart.yLabel || '数值'}`,
    chart,
    items: [],
    metrics: [],
    sessions: [],
  }
}

function buildPriorityTable(sessions: CallAnalysisSession[]): CallAnalysisTable {
  const customerMap = new Map<string, {
    customer: string
    owner: string
    lastContact: string
    intent: string
    stage: string
    reason: string
    action: string
    score: number
    timestamp: number
  }>()

  sessions.forEach((session) => {
    const customer = session.customerName || `客户#${session.customerId ?? session.sessionId}`
    const score = computePriorityScore(session)
    const timestamp = new Date(session.startTime ?? 0).getTime() || 0
    const current = customerMap.get(customer)

    const next = {
      customer,
      owner: session.callerName || '待分配',
      lastContact: formatDateTime(session.startTime),
      intent: session.customerIntent || '待判断',
      stage: session.followStage || '待补充',
      reason: buildPriorityReasonFromSession(session),
      action: buildPriorityActionFromSession(session),
      score,
      timestamp,
    }

    if (!current || score > current.score || timestamp > current.timestamp) {
      customerMap.set(customer, next)
    }
  })

  return {
    columns: [
      { key: 'customer', title: '客户' },
      { key: 'owner', title: '负责成员' },
      { key: 'lastContact', title: '最近通话' },
      { key: 'intent', title: '客户意向' },
      { key: 'stage', title: '跟进阶段' },
      { key: 'reason', title: '优先原因' },
      { key: 'action', title: '建议动作' },
    ],
    rows: [...customerMap.values()]
      .sort((left, right) => right.score - left.score || right.timestamp - left.timestamp)
      .slice(0, 8)
      .map(({ score: _score, timestamp: _timestamp, ...row }) => row),
  }
}

function buildRiskTable(sessions: CallAnalysisSession[]): CallAnalysisTable {
  return {
    columns: [
      { key: 'customer', title: '客户' },
      { key: 'owner', title: '负责成员' },
      { key: 'time', title: '通话时间' },
      { key: 'stage', title: '跟进阶段' },
      { key: 'signal', title: '风险信号' },
      { key: 'action', title: '建议动作' },
    ],
    rows: sessions
      .map((session) => ({
        customer: session.customerName || `客户#${session.customerId ?? session.sessionId}`,
        owner: session.callerName || '未知成员',
        time: formatDateTime(session.startTime),
        stage: session.followStage || '待补充',
        signal: buildRiskSignalText(session),
        action: session.analysisNextSuggestions || session.nextFollowAction || '优先复盘客户异议并补充下一步推进动作',
        score: computeRiskScore(session),
        timestamp: new Date(session.startTime ?? 0).getTime() || 0,
      }))
      .sort((left, right) => right.score - left.score || right.timestamp - left.timestamp)
      .slice(0, 8)
      .map(({ score: _score, timestamp: _timestamp, ...row }) => row),
  }
}

function buildMemberTable(sessions: CallAnalysisSession[]): CallAnalysisTable {
  const memberMap = new Map<string, {
    member: string
    calls: number
    riskCalls: number
    qualityTotal: number
    qualityCount: number
    attentionScore: number
  }>()

  sessions.forEach((session) => {
    const member = session.callerName || `成员#${session.callerId ?? session.sessionId}`
    const current = memberMap.get(member) ?? {
      member,
      calls: 0,
      riskCalls: 0,
      qualityTotal: 0,
      qualityCount: 0,
      attentionScore: 0,
    }

    current.calls += 1
    if (computeRiskScore(session) > 0) {
      current.riskCalls += 1
    }
    if (typeof session.qualityScore === 'number') {
      current.qualityTotal += session.qualityScore
      current.qualityCount += 1
    }
    current.attentionScore = current.riskCalls * 20
      + (current.qualityCount > 0 && current.qualityTotal / current.qualityCount < 80 ? 8 : 0)
      + (current.calls <= 1 ? 3 : 0)

    memberMap.set(member, current)
  })

  return {
    columns: [
      { key: 'member', title: '成员' },
      { key: 'calls', title: '通话数' },
      { key: 'riskCalls', title: '风险会话' },
      { key: 'quality', title: '平均质量' },
      { key: 'reason', title: '关注原因' },
      { key: 'action', title: '建议动作' },
    ],
    rows: [...memberMap.values()]
      .sort((left, right) => right.attentionScore - left.attentionScore || right.calls - left.calls)
      .slice(0, 8)
      .map((item) => {
        const averageQuality = item.qualityCount > 0
          ? (item.qualityTotal / item.qualityCount).toFixed(1)
          : '待补充'

        return {
          member: item.member,
          calls: item.calls,
          riskCalls: item.riskCalls,
          quality: averageQuality,
          reason: buildMemberReason(item.riskCalls, item.qualityCount > 0 ? item.qualityTotal / item.qualityCount : undefined, item.calls),
          action: item.riskCalls > 0 ? '优先复盘风险会话，强化异议承接和推进动作' : '继续观察跟进质量和客户转化节奏',
        }
      }),
  }
}

function detectMode(query: string): AnalysisMode {
  const normalized = query.replaceAll(/\s+/g, '')
  if (isTaskMetricQuery(normalized)) {
    return 'task_metric'
  }
  if (normalized.includes('优先处理') || normalized.includes('优先跟进') || normalized.includes('重点客户')) {
    return 'priority'
  }
  if (normalized.includes('风险会话') || normalized.includes('风险客户') || normalized.includes('异常会话')) {
    return 'risk'
  }
  if ((normalized.includes('成员') || normalized.includes('销售')) && normalized.includes('关注')) {
    return 'member'
  }
  if (normalized.includes('通话') || normalized.includes('会话') || normalized.includes('客户')) {
    return 'overview'
  }
  return 'irrelevant'
}

function isTaskMetricQuery(normalized: string) {
  const followTaskRelated = normalized.includes('跟进') || normalized.includes('待办') || normalized.includes('任务')
  if (!followTaskRelated) return false
  if (
    normalized.includes('哪些')
    || normalized.includes('哪几个')
    || normalized.includes('列表')
    || normalized.includes('明细')
    || normalized.includes('详情')
  ) {
    return false
  }

  if (
    normalized.includes('逾期跟进')
    || normalized.includes('跟进逾期')
    || normalized.includes('待跟进')
    || normalized.includes('今日待跟进')
    || normalized.includes('今天要跟进')
    || normalized.includes('未完成跟进')
    || normalized.includes('已完成跟进')
  ) {
    return true
  }

  const countQuestion = normalized.includes('多少')
    || normalized.includes('几个')
    || normalized.includes('几项')
    || normalized.includes('数量')
    || normalized.includes('统计')
    || normalized.endsWith('数')
  const taskStatus = normalized.includes('逾期')
    || normalized.includes('过期')
    || normalized.includes('未完成')
    || normalized.includes('已完成')
    || normalized.includes('今天')
    || normalized.includes('今日')
    || normalized.includes('待办')
    || normalized.includes('任务')
  return countQuestion && taskStatus
}

function shouldShowClientFallback(result: CallAnalysisResult) {
  if (result.matchedSessionCount <= 0) {
    return false
  }
  return /无数据|未提供|无法分析|无法进行分析|补充至少/.test(
    `${result.title} ${result.summary} ${result.highlights.join(' ')}`,
  )
}

function shouldUseClientFallback(result: CallAnalysisResult) {
  return shouldShowClientFallback(result)
}

function shouldShowSessions(query: string) {
  const normalized = query.replaceAll(/\s+/g, '')
  return normalized.includes('明细')
    || normalized.includes('记录')
    || normalized.includes('原文')
    || normalized.includes('会话内容')
    || normalized.includes('具体会话')
}

function buildFallbackSummary(result: CallAnalysisResult) {
  const topChart = result.charts.find((chart) => chart.type === 'bar' && chart.data.length > 0)
  const trendChart = result.charts.find((chart) => chart.type === 'line' && chart.data.length > 0)
  const topItem = topChart?.data[0]
  const activeDays = trendChart?.data.filter((item) => item.value > 0).length ?? 0
  const durationNote = result.totalDurationMinutes === 0 && result.matchedSessionCount > 0
    ? '当前会话结束时间不完整，时长统计暂时偏低。'
    : ''

  return [
    `本次分析命中 ${result.matchedSessionCount} 场通话，共 ${result.matchedMessageCount} 条对话内容。`,
    topItem ? `${topChart?.title || '当前分布'}里最活跃的是 ${topItem.label}。` : '',
    activeDays > 0 ? `统计周期内共有 ${activeDays} 天发生了通话。` : '',
    durationNote,
  ].filter(Boolean).join('')
}

function buildFallbackHighlights(result: CallAnalysisResult) {
  const topChart = result.charts.find((chart) => chart.type === 'bar' && chart.data.length > 0)
  const topItem = topChart?.data[0]
  const highlights = [
    `匹配通话数：${result.matchedSessionCount}`,
    `消息条数：${result.matchedMessageCount}`,
    topItem ? `最活跃对象：${topItem.label}` : '',
    result.totalDurationMinutes === 0 && result.matchedSessionCount > 0
      ? '部分会话缺少结束时间，时长指标需谨慎解读'
      : '',
  ].filter(Boolean)

  return highlights.length > 0 ? highlights : result.highlights
}

function normalizeTableRow(row: Record<string, unknown>): CallAnalysisTableRow {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key,
      typeof value === 'number' || typeof value === 'string' ? value : value == null ? null : String(value),
    ]),
  )
}

function normalizeScoreMap(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined
  }

  const entries = Object.entries(value).map(([key, score]) => [key, Number(score)])
  return Object.fromEntries(entries.filter((entry) => Number.isFinite(entry[1])))
}

function toStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.length > 0)
  }

  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === 'string' && item.length > 0)
        : []
    } catch {
      return [value]
    }
  }

  return []
}

function computePriorityScore(session: CallAnalysisSession) {
  let score = 0
  if (session.customerIntent === '高') score += 35
  if (session.customerIntent === '中') score += 20
  if (session.customerIntent === '低') score += 8
  if (session.nextFollowAction) score += 20
  if (session.followStage && ['方案介绍', '报价谈判', '跟进回访'].includes(session.followStage)) score += 15
  if (session.customerObjections.length > 0) score += 8
  if (session.startTime && isToday(session.startTime)) score += 8
  score += Math.min(session.messageCount, 18) / 3
  return score
}

function computeRiskScore(session: CallAnalysisSession) {
  let score = 0
  if (session.customerIntent === '低') score += 25
  if (session.followStage === '已流失') score += 25
  if ((session.qualityScore ?? 100) < 70) score += 20
  if (session.customerObjections.length > 0) score += 10
  if (session.analysisImprovements) score += 10
  if (session.endTime && session.durationMinutes <= 1) score += 5
  return score
}

function buildPriorityReasonFromSession(session: CallAnalysisSession) {
  const reasons = [
    session.customerIntent === '高' ? '客户意向高' : '',
    session.followStage ? `当前阶段：${session.followStage}` : '',
    session.customerObjections.length > 0 ? `待处理异议：${session.customerObjections.slice(0, 2).join('、')}` : '',
    session.concludeSummary ? truncate(session.concludeSummary, 28) : '',
  ].filter(Boolean)

  return reasons.length > 0 ? reasons.join('；') : '近期已有沟通，建议尽快确认下一步'
}

function buildPriorityActionFromSession(session: CallAnalysisSession) {
  if (session.nextFollowAction) {
    return session.nextFollowTime ? `${session.nextFollowTime}：${session.nextFollowAction}` : session.nextFollowAction
  }
  if (session.customerObjections.length > 0) {
    return '先承接客户异议，再锁定下一次沟通时间'
  }
  if (session.customerIntent === '高') {
    return '优先推进下一步成交动作'
  }
  return '补充客户需求信息并确认后续安排'
}

function buildRiskSignalText(session: CallAnalysisSession) {
  const signals = [
    session.customerIntent === '低' ? '客户意向低' : '',
    session.followStage === '已流失' ? '已进入流失阶段' : '',
    (session.qualityScore ?? 100) < 70 ? '质量评分偏低' : '',
    session.customerObjections.length > 0 ? `存在异议：${session.customerObjections.slice(0, 2).join('、')}` : '',
    session.analysisImprovements ? truncate(session.analysisImprovements, 30) : '',
    session.endTime && session.durationMinutes <= 1 ? '会话时长偏短' : '',
  ].filter(Boolean)

  return signals.length > 0 ? signals.join('；') : '当前未识别到明显风险信号'
}

function buildMemberReason(riskCalls: number, averageQuality: number | undefined, calls: number) {
  const reasons = [
    riskCalls > 0 ? `风险会话 ${riskCalls} 场` : '',
    typeof averageQuality === 'number' && averageQuality < 70 ? '平均质量偏低' : '',
    typeof averageQuality === 'number' && averageQuality >= 70 && averageQuality < 80 ? '质量波动需关注' : '',
    calls <= 1 ? '样本偏少' : '',
  ].filter(Boolean)

  return reasons.length > 0 ? reasons.join('；') : '近期活跃，建议持续观察转化'
}

function countDistinct(values: string[]) {
  return new Set(values.filter(Boolean)).size
}

function formatAverageQuality(sessions: CallAnalysisSession[]) {
  const scores = sessions
    .map((session) => session.qualityScore)
    .filter((score): score is number => typeof score === 'number')

  if (scores.length === 0) {
    return '待补充'
  }

  return (scores.reduce((total, score) => total + score, 0) / scores.length).toFixed(1)
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

function formatDurationMetric(totalMinutes: number, sessionCount: number) {
  if (sessionCount > 0 && totalMinutes === 0) return '待补充'
  return `${totalMinutes} 分钟`
}

function formatAverageMetric(averageMinutes: number, sessionCount: number) {
  if (sessionCount > 0 && averageMinutes === 0) return '待补充'
  return `${averageMinutes.toFixed(1)} 分钟`
}

function truncate(text: string, maxChars: number) {
  return text.length > maxChars ? `${text.slice(0, maxChars)}…` : text
}

function isToday(value: string) {
  const date = new Date(value)
  const now = new Date()
  return date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate()
}

function blockOrder(type: CallAnalysisBlockType) {
  switch (type) {
    case 'summary':
      return 0
    case 'metrics':
      return 1
    case 'chart':
      return 2
    case 'table':
      return 3
    case 'sessions':
      return 4
    case 'text':
      return 5
    case 'list':
      return 6
    default:
      return 99
  }
}
