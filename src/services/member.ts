import api from '@/lib/api'
import { encryptPassword } from '@/lib/utils'
import type { PageResult } from './common'

export interface UserVO {
  id: string
  phone: string
  username: string
  userType: number
  status: number
  created?: string
}

export interface CreateUserRequest {
  phone: string
  password: string
  username?: string
}

export interface UpdatePasswordRequest {
  newPassword: string
}

export interface UpdateSelfPasswordRequest {
  oldPassword: string
  newPassword: string
}

export interface UserSearchParams {
  keyword?: string
  current?: number
  size?: number
}

export function getMembers() {
  return api.get<unknown, UserVO[]>('/org/users')
}

export function createMember(data: CreateUserRequest) {
  return api.post<unknown, void>('/org/users', {
    ...data,
    password: encryptPassword(data.password),
  })
}

export function updateMemberPassword(userId: string, data: UpdatePasswordRequest) {
  return api.put<unknown, void>(`/org/users/${userId}/password`, {
    newPassword: encryptPassword(data.newPassword),
  })
}

export function updateSelfPassword(data: UpdateSelfPasswordRequest) {
  return api.post<unknown, void>('/org/users/self/password', {
    oldPassword: encryptPassword(data.oldPassword),
    newPassword: encryptPassword(data.newPassword),
  })
}

export function deleteMember(userId: string) {
  return api.delete<unknown, void>(`/org/users/${userId}`)
}

export function updateMemberStatus(userId: string, status: number) {
  return api.put<unknown, void>(`/org/users/${userId}/status`, null, {
    params: { status },
  })
}

export function searchUsers(params: UserSearchParams) {
  const keyword = params.keyword?.trim() ?? ''
  const isPhoneKeyword = /^[\d+\-()\s]+$/.test(keyword) && keyword.length > 0

  return api.post<unknown, PageResult<UserVO>>('/org/users/search', {
    current: params.current ?? 1,
    size: params.size ?? 8,
    username: isPhoneKeyword ? undefined : keyword || undefined,
    phone: isPhoneKeyword ? keyword.replace(/\s+/g, '') : undefined,
  }).then((page) => ({
    ...page,
    records: (page.records ?? []).map((user) => ({
      ...user,
      id: String(user.id ?? ''),
    })),
  }))
}
