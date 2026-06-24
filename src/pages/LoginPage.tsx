/*
 * @Author: sunbingqing
 * @Date: 2026-05-09 14:36:11
 * @LastEditors: sunbingqing
 * @LastEditTime: 2026-05-09 14:36:11
 * @Description: 管理员登录页面
 * @Copyright: ©2021 杭州杰竞科技有限公司 版权所有
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { login as loginApi } from '@/services/auth'

export default function LoginPage() {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const { mutate, isPending } = useMutation({
    mutationFn: loginApi,
    onSuccess: (result) => {
      login(result)
      if (result.userType === 1) {
        navigate('/', { replace: true })
      } else {
        navigate('/session-review', { replace: true })
      }
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : '登录失败')
    },
  })

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    mutate({ phone, password })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 rounded-lg border p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">用户登录</h1>
          <p className="text-sm text-muted-foreground">
            请输入账号和密码
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium">
              账号
            </label>
            <Input
              id="phone"
              placeholder="请输入账号"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              密码
            </label>
            <Input
              id="password"
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? '登录中...' : '登录'}
          </Button>
        </form>
      </div>
    </div>
  )
}
