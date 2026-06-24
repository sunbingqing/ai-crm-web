import api from '@/lib/api'
import type { PageResult } from './common'

export interface CustomerVO {
  id: string
  phone: string
  name: string
  created: string
  followStage: string
  intentLevel: string
  tags: string[]
  objections: string[]
  strategyConclusion: string
  strategyDescription: string
  strategyFocus: string
  communicationClaim: string
  communicationScript: string
  followSummary: string
  analyzedAt: string
  lastCallTime?: string
  nextFollowTask?: CustomerFollowTaskVO
}

export interface CustomerFollowTaskVO {
  id: string
  followTime: string
  followAction: string
  status: string
}

export interface CustomerQueryRequest {
  phone?: string
  name?: string
  current?: number
  size?: number
  queryType?: string
}

export function searchCustomers(params: CustomerQueryRequest) {
  return api.post<unknown, PageResult<CustomerVO>>('/customer/search', {
    current: params.current ?? 1,
    size: params.size ?? 20,
    phone: params.phone || undefined,
    name: params.name || undefined,
    queryType: params.queryType ?? 'ALL',
  })
}

export function getCustomerDetail(customerId: string) {
  return api.post<unknown, CustomerVO>('/customer/detail', { customerId })
}

export function getCustomerFollowTasks(customerId: string) {
  return api.post<unknown, CustomerFollowTaskVO[]>('/customer/follow-tasks', { customerId })
}

export function editCustomerName(customerId: string, name: string) {
  return api.post<unknown, null>('/customer/edit', { customerId, name })
}
