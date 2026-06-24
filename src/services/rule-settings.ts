/*
 * @Author: sunbingqing
 * @Date: 2026-05-21
 * @Description: 规则设置接口
 * @Copyright: ©2021 杭州杰竞科技有限公司 版权所有
 */
import api from '@/lib/api'

export interface IntentOption {
  id: string | number
  name: string
  description: string
  enabled: boolean
  type?: string
}

export function getIntentOptions() {
  return api.post<unknown, IntentOption[]>('/org/intent-options/list')
}

function cleanId(id: string | number): number | string | undefined {
  const str = String(id)
  return /^\d+$/.test(str) ? str : undefined
}

export function saveIntentOptions(options: IntentOption[]) {
  return api.post<unknown, void>('/org/intent-options/save', {
    options: options.map((o) => ({ ...o, id: cleanId(o.id) })),
  })
}

export interface ObjectionOption {
  id: string | number
  name: string
  description: string
  enabled: boolean
  type?: string
}

export function getObjectionOptions() {
  return api.post<unknown, ObjectionOption[]>('/org/objection-options/list')
}

export function saveObjectionOptions(options: ObjectionOption[]) {
  return api.post<unknown, void>('/org/objection-options/save', {
    options: options.map((o) => ({ ...o, id: cleanId(o.id) })),
  })
}

export interface FollowUpStage {
  id: string | number
  name: string
  description: string
  enabled: boolean
  type?: string
  sequence: number
}

export function getFollowUpStages() {
  return api.post<unknown, FollowUpStage[]>('/org/follow-stages/list')
}

export function saveFollowUpStages(stages: FollowUpStage[]) {
  return api.post<unknown, void>('/org/follow-stages/save', {
    stages: stages.map((s) => ({ ...s, id: cleanId(s.id) })),
  })
}

export interface ProfileOption {
  id?: number
  type?: string
  option: string
  description: string
  suggestion?: string
  enabled: boolean
}

export interface ProfileDimension {
  dimension: string
  enabled: boolean
  type?: string
  options: ProfileOption[]
}

export interface ProfileOptionItem {
  type?: string
  option: string
  description: string
  suggestion?: string
  enabled: boolean
}

export interface DimensionItem {
  type?: string
  dimension: string
  enabled: boolean
  options: ProfileOptionItem[]
}

export function getProfileDimensions() {
  return api.post<unknown, ProfileDimension[]>('/org/profile-dimensions/list')
}

export function saveProfileDimensions(dimensions: DimensionItem[]) {
  return api.post<unknown, void>('/org/profile-dimensions/save', { dimensions })
}

export interface ScoringDimension {
  id: string | number
  name: string
  description: string
  enabled: boolean
  type?: string
}

export function getScoringDimensions() {
  return api.post<unknown, ScoringDimension[]>('/org/scoring-dimensions/list')
}

export function saveScoringDimensions(dimensions: ScoringDimension[]) {
  return api.post<unknown, void>('/org/scoring-dimensions/save', {
    dimensions: dimensions.map((d) => ({ ...d, id: cleanId(d.id) })),
  })
}

export interface OrgConfigVO {
  code: string
  value: string
}

export function getOrgConfig(code: string) {
  return api.post<unknown, OrgConfigVO>('/org/config/get', { code })
}

export function saveOrgConfig(code: string, value: string) {
  return api.post<unknown, void>('/org/config/save', { code, value })
}

export interface BatchConfigVO {
  code: string
  value: string
  configs: Record<string, string>
}

export function batchGetOrgConfig(codes: string[]) {
  return api.post<unknown, BatchConfigVO>('/org/config/batch-get', { codes })
}

export function batchSaveOrgConfig(configs: Record<string, string>) {
  return api.post<unknown, void>('/org/config/batch-save', { configs })
}
