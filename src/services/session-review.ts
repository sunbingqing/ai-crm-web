import api from '@/lib/api'
import type { PageResult } from './common'

export interface NextFollowTask {
  followTime?: string
  followAction?: string
  status?: string
}

export interface SessionReviewSummary {
  totalSessions: number
  riskSessions: number
  overdueTasks: number
}

export interface SessionReviewItem {
  sessionId: string
  callerName?: string
  customerName?: string
  customerPhone?: string
  risk?: boolean
  startTime?: string
  duration?: string
  status?: string
  concludeSummary?: string
  concludeCustomerIntent?: string
  concludeFollowStage?: string
  concludeCustomerObjections: string[]
  concludeCustomerTags: string[]
  concludeNextFollowTask?: NextFollowTask
  qualityScore?: number
  qualityLevel?: string
  qualityDimensionScore?: Record<string, number>
  analysisStrengths?: string
  analysisImprovements?: string
  analysisNextSuggestions?: string
  analysisSuggestedScript?: string
  concludedAt?: string
}

export interface SessionTranscriptMessage {
  speaker?: string
  content: string
  time?: string
}

export interface SessionReviewDetail extends SessionReviewItem {
  transcriptMessages: SessionTranscriptMessage[]
  originalText?: string
}

export interface SessionReviewTranscript {
  transcriptMessages: SessionTranscriptMessage[]
  originalText?: string
  total: number
  size: number
  current: number
  pages: number
}

export type SessionSearchType = 'ALL' | 'RISK' | 'OVERDUE'

export interface SessionReviewSearchParams {
  followerId?: string
  searchType?: SessionSearchType
  current?: number
  size?: number
}

export interface SessionReviewTranscriptSearchParams {
  sessionId: string
  current?: number
  size?: number
}

interface RawSessionReviewItem
  extends Omit<SessionReviewItem, 'sessionId' | 'concludeCustomerObjections' | 'concludeCustomerTags' | 'qualityDimensionScore' | 'concludeNextFollowTask'> {
  sessionId?: unknown
  concludeCustomerObjections?: unknown
  concludeCustomerTags?: unknown
  qualityDimensionScore?: unknown
  concludeNextFollowTask?: unknown
}

type RawSessionReviewDetail = RawSessionReviewItem & Record<string, unknown>
type RawSessionReviewTranscript = PageResult<unknown> | Record<string, unknown> | unknown[]

export function getSessionReviewSummary(followerId?: string) {
  return api
    .post<unknown, SessionReviewSummary>('/workbench/summary', { followerId })
    .then((summary) => ({
      totalSessions: Number(summary.totalSessions ?? 0),
      riskSessions: Number(summary.riskSessions ?? 0),
      overdueTasks: Number(summary.overdueTasks ?? 0),
    }))
}

export function searchSessionReviews(params: SessionReviewSearchParams) {
  return api
    .post<unknown, PageResult<RawSessionReviewItem>>('/workbench/search', {
      followerId: params.followerId,
      searchType: params.searchType ?? 'ALL',
      current: params.current ?? 1,
      size: params.size ?? 10,
    })
    .then((page) => ({
      ...page,
      records: (page.records ?? []).map(normalizeSessionReviewItem),
    }))
}

export function getSessionReviewDetail(sessionId: string) {
  return api
    .post<unknown, RawSessionReviewDetail>('/call-session/detail', { sessionId })
    .then(normalizeSessionReviewDetail)
}

export function getSessionReviewTranscript(params: SessionReviewTranscriptSearchParams) {
  return api
    .post<unknown, RawSessionReviewTranscript>('/call-session/messages', {
      sessionId: params.sessionId,
      current: params.current ?? 1,
      size: params.size ?? 20,
    })
    .then(normalizeSessionReviewTranscript)
}

function normalizeSessionReviewItem(session: RawSessionReviewItem): SessionReviewItem {
  return {
    ...session,
    sessionId: toSessionId(session.sessionId),
    risk: toBoolean(session.risk),
    concludeCustomerObjections: toStringArray(session.concludeCustomerObjections),
    concludeCustomerTags: toStringArray(session.concludeCustomerTags),
    concludeNextFollowTask: normalizeNextFollowTask(session.concludeNextFollowTask),
    qualityDimensionScore: normalizeScoreMap(session.qualityDimensionScore),
    qualityScore: toOptionalNumber(session.qualityScore),
  }
}

export function toSessionId(value: unknown) {
  if (typeof value === 'string' && value.trim()) {
    return value.trim()
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }

  return ''
}

function normalizeSessionReviewDetail(detail: RawSessionReviewDetail): SessionReviewDetail {
  return {
    ...normalizeSessionReviewItem(detail),
    transcriptMessages: extractTranscriptMessages(detail),
    originalText: extractOriginalText(detail),
  }
}

function normalizeSessionReviewTranscript(data: RawSessionReviewTranscript): SessionReviewTranscript {
  const payload = (Array.isArray(data) ? { records: data } : data) as Record<string, unknown>
  const records = extractTranscriptSource(payload)

  return {
    transcriptMessages: toTranscriptMessages(records),
    originalText: extractOriginalText(payload),
    total: Number(readField(payload, 'total') ?? (Array.isArray(records) ? records.length : 0)),
    size: Number(readField(payload, 'size') ?? (Array.isArray(records) ? records.length : 0)),
    current: Number(readField(payload, 'current', 'pageNum', 'page') ?? 1),
    pages: Number(readField(payload, 'pages', 'totalPages') ?? 1),
  }
}

export function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .map((item) => item.trim())
  }

  if (typeof value !== 'string') {
    return []
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return []
  }

  const parsed = tryParseJson(trimmed)
  if (Array.isArray(parsed)) {
    return parsed
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .map((item) => item.trim())
  }

  return trimmed
    .split(/[，,、]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function normalizeScoreMap(value: unknown) {
  const normalizedValue = typeof value === 'string' ? tryParseJson(value) : value
  if (!normalizedValue || typeof normalizedValue !== 'object' || Array.isArray(normalizedValue)) {
    return undefined
  }

  const entries = Object.entries(normalizedValue)
    .map(([key, score]) => [key.trim(), Number(score)] as const)
    .filter(([key, score]) => key && Number.isFinite(score))

  return entries.length > 0 ? Object.fromEntries(entries) : undefined
}

export function normalizeNextFollowTask(value: unknown): NextFollowTask | undefined {
  const normalizedValue = typeof value === 'string' ? tryParseJson(value) ?? value : value

  if (!isRecord(normalizedValue)) {
    return undefined
  }

  const followTime = toOptionalString(Reflect.get(normalizedValue, 'followTime'))
  const followAction = toOptionalString(Reflect.get(normalizedValue, 'followAction'))
  const status = toOptionalString(Reflect.get(normalizedValue, 'status'))

  if (!followTime && !followAction && !status) {
    return undefined
  }

  return {
    followTime,
    followAction,
    status,
  }
}

function extractTranscriptMessages(detail: Record<string, unknown>): SessionTranscriptMessage[] {
  const source = extractTranscriptSource(detail)
  return toTranscriptMessages(source)
}

function extractTranscriptSource(detail: Record<string, unknown>) {
  const keys = [
    'transcriptMessages',
    'transcript',
    'messages',
    'records',
    'messageList',
    'dialogueList',
    'sessionMessages',
    'sessionMessageList',
  ]

  for (const key of keys) {
    const candidate = Reflect.get(detail, key)
    if (candidate) {
      return candidate
    }
  }

  return []
}

function toTranscriptMessages(value: unknown): SessionTranscriptMessage[] {
  const normalizedValue = typeof value === 'string' ? tryParseJson(value) ?? value : value
  if (!Array.isArray(normalizedValue)) {
    return []
  }

  return normalizedValue
    .map(normalizeTranscriptMessage)
    .filter((message): message is SessionTranscriptMessage => message != null)
}

function normalizeTranscriptMessage(value: unknown): SessionTranscriptMessage | null {
  if (typeof value === 'string') {
    const content = value.trim()
    return content ? { content } : null
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  const content = firstString(value, ['content', 'text', 'message', 'transcript', 'sentence'])
  if (!content) {
    return null
  }

  return {
    speaker: normalizeSpeaker(firstString(value, ['speaker', 'role', 'senderType', 'senderName', 'talker', 'name'])),
    content,
    time: extractTranscriptTime(value),
  }
}

function normalizeSpeaker(value?: string) {
  if (!value) {
    return undefined
  }

  const normalized = value.trim().toUpperCase()
  if (['CUSTOMER', 'CLIENT', 'USER'].includes(normalized)) {
    return '客户'
  }
  if (['SALES', 'AGENT', 'STAFF', 'FOLLOWER', 'ASSISTANT'].includes(normalized)) {
    return '销售'
  }
  return value.trim()
}

function extractTranscriptTime(value: object) {
  const timeOffset = Reflect.get(value, 'timeOffset')
  if (typeof timeOffset === 'string' && timeOffset.trim()) {
    const ms = Number(timeOffset)
    if (Number.isFinite(ms)) {
      const totalSeconds = Math.floor(ms / 1000)
      const mins = Math.floor(totalSeconds / 60)
      const secs = totalSeconds % 60
      return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    }
  }
  return undefined
}

function extractOriginalText(detail: Record<string, unknown>) {
  return firstNonEmptyString([
    detail.originalText,
    detail.transcriptText,
    detail.rawText,
    detail.originalContent,
    detail.sessionContent,
    detail.sessionText,
  ])
}

function firstString(value: object, keys: string[]) {
  for (const key of keys) {
    const current = Reflect.get(value, key)
    if (typeof current === 'string' && current.trim()) {
      return current.trim()
    }
  }

  return undefined
}

function firstNonEmptyString(values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return undefined
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function readField(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    if (record[key] != null) {
      return record[key]
    }
  }
  return undefined
}

export function toNumber(value: unknown) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

export function toIdString(value: unknown) {
  if (value == null) return ''
  const str = String(value).trim()
  return str
}

export function toOptionalNumber(value: unknown) {
  if (value == null || value === '') {
    return undefined
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function toOptionalString(value: unknown) {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || undefined
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  return undefined
}

export function toBoolean(value: unknown) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return value.toLowerCase() === 'true' || value === '1'
  if (typeof value === 'number') return value === 1
  return false
}

export function tryParseJson(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return undefined
  }

  try {
    return JSON.parse(trimmed) as unknown
  } catch {
    return undefined
  }
}
