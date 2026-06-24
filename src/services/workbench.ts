import api from '@/lib/api'
import type { SessionReviewItem } from './session-review'
import {
  isRecord,
  normalizeNextFollowTask,
  normalizeScoreMap,
  readField,
  toBoolean,
  toIdString,
  toNumber,
  toOptionalNumber,
  toOptionalString,
  toStringArray,
  toSessionId,
} from './session-review'

export interface WorkbenchRiskRequest {
  orgId: string
  startTime: number
  endTime: number
}

export interface TeamCoachRequest extends WorkbenchRiskRequest {
  queryType?: 'ALL' | 'ATTENTION'
}

export interface EmployeePerformanceRequest {
  orgId: string
  startTime: number
  endTime: number
  current?: number
  size?: number
  userId?: string
}

export interface WorkbenchRiskSummary {
  riskSessionCount: number
  attentionPersonCount: number
}

export interface WorkbenchAttentionPerson {
  userId: string
  userName?: string
  phone?: string
  attention?: boolean
  totalSessions: number
  riskSessions: number
  riskRatio: number
  followTaskCount: number
  followTaskDoneCount: number
  followTaskDoneRatio: number
  overdueTaskCount: number
  overdueRatio: number
}

type RawRecord = Record<string, unknown>

export interface PeriodStats {
  customerCallCount: number
  followTaskCount: number
  followTaskDoneCount: number
  followTaskDoneRatio: number
  overdueTaskCount: number
  overdueRatio: number
  callCount: number
  avgCallDuration: number
}

export interface TeamCoachInfo {
  totalUsers: number
  attentionPersonCount: number
  current: PeriodStats
  previous: PeriodStats
  offset: PeriodStats
}

export function getTeamCoachInfo(params: TeamCoachRequest) {
  return api
    .post<unknown, RawRecord>('/workbench/team-coach', params)
    .then((info) => ({
      totalUsers: toNumber(info.totalUsers),
      attentionPersonCount: toNumber(info.attentionPersonCount),
      current: normalizePeriodStats(info.current),
      previous: normalizePeriodStats(info.previous),
      offset: normalizePeriodStats(info.offset),
    }))
}

function normalizePeriodStats(stats: unknown): PeriodStats {
  const record = isRecord(stats) ? stats : {}
  return {
    customerCallCount: toNumber(readField(record, 'customerCallCount', 'customer_call_count')),
    followTaskCount: toNumber(readField(record, 'followTaskCount', 'follow_task_count')),
    followTaskDoneCount: toNumber(readField(record, 'followTaskDoneCount', 'follow_task_done_count')),
    followTaskDoneRatio: toNumber(readField(record, 'followTaskDoneRatio', 'follow_task_done_ratio')),
    overdueTaskCount: toNumber(readField(record, 'overdueTaskCount', 'overdue_task_count')),
    overdueRatio: toNumber(readField(record, 'overdueRatio', 'overdue_ratio')),
    callCount: toNumber(readField(record, 'callCount', 'call_count')),
    avgCallDuration: toNumber(readField(record, 'avgCallDuration', 'avg_call_duration')),
  }
}

export function getWorkbenchRiskSummary(params: WorkbenchRiskRequest) {
  return api
    .post<unknown, RawRecord>('/workbench/risk-summary', params)
    .then((summary) => ({
      riskSessionCount: toNumber(readField(summary, 'riskSessionCount', 'risk_session_count')),
      attentionPersonCount: toNumber(readField(summary, 'attentionPersonCount', 'attention_person_count')),
    }))
}

export function getWorkbenchRiskSessions(params: WorkbenchRiskRequest) {
  return api
    .post<unknown, unknown>('/workbench/risk-sessions', params)
    .then((result) => (
      Array.isArray(result)
        ? result.filter(isRecord).map(normalizeRiskSession)
        : []
    ))
}

export function getWorkbenchAttentionPersons(params: WorkbenchRiskRequest) {
  return api
    .post<unknown, unknown>('/workbench/attention-persons', params)
    .then((result) => (
      Array.isArray(result)
        ? result.filter(isRecord).map(normalizeAttentionPerson)
        : []
    ))
}

export function getEmployeePerformance(params: EmployeePerformanceRequest) {
  return api
    .post<unknown, RawRecord>('/workbench/persons', params)
    .then((result) => {
      const records = Array.isArray(result.records)
        ? result.records.filter(isRecord).map(normalizeAttentionPerson)
        : []
      return {
        records,
        total: toNumber(result.total),
        current: toNumber(result.current),
        pages: toNumber(result.pages),
      }
    })
}

function normalizeRiskSession(session: RawRecord): SessionReviewItem {
  return {
    sessionId: toSessionId(session.sessionId),
    risk: toBoolean(session.risk),
    callerName: toOptionalString(session.callerName),
    customerName: toOptionalString(session.customerName),
    customerPhone: toOptionalString(session.customerPhone),
    startTime: toOptionalString(session.startTime),
    duration: toOptionalString(session.duration),
    status: toOptionalString(session.status),
    concludeSummary: toOptionalString(session.concludeSummary),
    concludeCustomerIntent: toOptionalString(session.concludeCustomerIntent),
    concludeFollowStage: toOptionalString(session.concludeFollowStage),
    concludeCustomerObjections: toStringArray(session.concludeCustomerObjections),
    concludeCustomerTags: toStringArray(session.concludeCustomerTags),
    concludeNextFollowTask: normalizeNextFollowTask(session.concludeNextFollowTask),
    qualityScore: toOptionalNumber(session.qualityScore),
    qualityLevel: toOptionalString(session.qualityLevel),
    qualityDimensionScore: normalizeScoreMap(session.qualityDimensionScore),
    analysisStrengths: toOptionalString(session.analysisStrengths),
    analysisImprovements: toOptionalString(session.analysisImprovements),
    analysisNextSuggestions: toOptionalString(session.analysisNextSuggestions),
    analysisSuggestedScript: toOptionalString(session.analysisSuggestedScript),
    concludedAt: toOptionalString(session.concludedAt),
  }
}

function normalizeAttentionPerson(person: RawRecord): WorkbenchAttentionPerson {
  return {
    userId: toIdString(readField(person, 'userId', 'user_id')),
    attention: toBoolean(readField(person, 'attention')),
    userName: toOptionalString(readField(person, 'userName', 'user_name')),
    phone: toOptionalString(person.phone),
    totalSessions: toNumber(readField(person, 'totalSessions', 'total_sessions')),
    riskSessions: toNumber(readField(person, 'riskSessions', 'risk_sessions')),
    riskRatio: toNumber(readField(person, 'riskRatio', 'risk_ratio')),
    followTaskCount: toNumber(readField(person, 'followTaskCount', 'follow_task_count')),
    followTaskDoneCount: toNumber(readField(person, 'followTaskDoneCount', 'follow_task_done_count')),
    followTaskDoneRatio: toNumber(readField(person, 'followTaskDoneRatio', 'follow_task_done_ratio')),
    overdueTaskCount: toNumber(readField(person, 'overdueTaskCount', 'overdue_task_count')),
    overdueRatio: toNumber(readField(person, 'overdueRatio', 'overdue_ratio')),
  }
}
