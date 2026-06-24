import api from '@/lib/api'
import type { PageResult } from './common'

export interface CallSeatVO {
  id: string
  account: string
  password: string
  employeeId: string
  employeeName: string
  employeePhone: string
}

export interface SearchCallSeatRequest {
  account?: string
  employeeId?: string
  current?: number
  size?: number
}

export interface SaveCallSeatRequest {
  account: string
  password: string
  employeeId: string
}

export interface UpdateCallSeatRequest {
  id: string
  account: string
  password: string
  employeeId: string
}

export function searchCallSeats(params: SearchCallSeatRequest) {
  return api.post<unknown, PageResult<CallSeatVO>>('/org/call-seat/list', {
    current: params.current ?? 1,
    size: params.size ?? 8,
    account: params.account || undefined,
    employeeId: params.employeeId || undefined,
  }).then((page) => ({
    ...page,
    records: (page.records ?? []).map((seat) => ({
      ...seat,
      id: String(seat.id ?? ''),
      employeeId: String(seat.employeeId ?? ''),
    })),
  }))
}

export function createCallSeat(data: SaveCallSeatRequest) {
  return api.post<unknown, void>('/org/call-seat/save', {
    ...data,
    employeeId: data.employeeId,
    password: data.password,
  })
}

export function updateCallSeat(data: UpdateCallSeatRequest) {
  return api.post<unknown, void>('/org/call-seat/update', {
    id: data.id,
    account: data.account,
    employeeId: data.employeeId,
    password: data.password,
  })
}

export function deleteCallSeat(id: string) {
  return api.post<unknown, void>('/org/call-seat/delete', { id })
}
