import api from '@/lib/api'
import { encryptPassword } from '@/lib/utils'

export interface LoginParams {
  phone: string
  password: string
}

export interface LoginResult {
  token: string
  userType: number
  username: string
  orgId: string
  orgName?: string
}

export interface OrgInfoResult {
  orgId: string
  orgName: string
  services: string[] | null
}

export function login(params: LoginParams) {
  return api.post<unknown, LoginResult>('/auth/login', {
    ...params,
    password: encryptPassword(params.password),
    platform: 'WEB',
  })
}

export function logout() {
  return api.post('/auth/logout')
}

export function getOrgInfo(orgId: string) {
  return api.post<unknown, OrgInfoResult>('/auth/org-info', { id: orgId })
}
