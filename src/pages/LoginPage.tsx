import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  ChevronRight,
  Eye,
  EyeOff,
  Globe2,
  LockKeyhole,
  Phone,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { login as loginApi } from '@/services/auth'

const workspaceOptions = [
  { title: 'Global Revenue', detail: '销售运营与管理层' },
  { title: 'Enterprise Pods', detail: '企业销售团队' },
  { title: 'Founder Desk', detail: '创始人管线视图' },
]

const cockpitMetrics = [
  { label: 'Commit forecast', value: '$8.4M', detail: 'Global pipeline' },
  { label: 'AI actions', value: '46', detail: '22 ready to approve' },
  { label: 'Risk deals', value: '9', detail: '$1.18M exposed' },
]

export default function LoginPage() {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
    <main className="login-shell flex items-center px-4 py-6 sm:px-6 lg:px-10">
      <section className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[minmax(360px,0.72fr)_minmax(0,1.12fr)]">
        <div className="login-panel p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="brand-mark">
                <Sparkles className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">AI Sales Assistant Pro</p>
                <p className="text-xs text-muted-foreground">Revenue intelligence cockpit</p>
              </div>
            </div>
            <div className="rounded-lg border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              Private beta
            </div>
          </div>

          <div className="mt-14">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ShieldCheck className="size-4" />
              Enterprise revenue operations
            </div>
            <h1 className="mt-4 max-w-sm text-4xl font-semibold leading-tight">
              登录你的 AI 销售中枢
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
              汇总线索、机会、对话与客户信号，让团队每天知道最该推进什么。
            </p>
          </div>

          <div className="mt-7 grid grid-cols-2 rounded-lg border bg-muted/55 p-1">
            <button
              type="button"
              className="rounded-md bg-card px-3 py-2 text-sm font-semibold shadow-sm"
            >
              密码登录
            </button>
            <button
              type="button"
              className="rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              企业 SSO
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-semibold">
                账号 / 手机号
              </label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="phone"
                  placeholder="请输入账号"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-11 pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-semibold">
                密码
              </label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="输入你的密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 px-9"
                  required
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  aria-label={showPassword ? '隐藏密码' : '显示密码'}
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="h-11 w-full justify-between" disabled={isPending}>
              <span>{isPending ? '正在进入工作台...' : '进入工作台'}</span>
              <ArrowRight className="size-4" />
            </Button>
          </form>

          <div className="mt-10">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Common workspaces</p>
              <button type="button" className="text-xs font-semibold text-foreground hover:underline">
                管理
              </button>
            </div>
            <div className="space-y-2">
              {workspaceOptions.map((workspace) => (
                <button
                  key={workspace.title}
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg border bg-card px-3 py-3 text-left transition-colors hover:border-foreground/25 hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <div className="icon-tile">
                    <Building2 className="size-4" />
                  </div>
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-sm">{workspace.title}</strong>
                    <span className="block truncate text-xs text-muted-foreground">{workspace.detail}</span>
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="panel-strong hidden min-h-[720px] overflow-hidden lg:block">
          <div className="soft-grid flex h-full flex-col p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-white/58">
                  <Globe2 className="size-4" />
                  Live revenue command
                </div>
                <h2 className="mt-3 text-3xl font-semibold">今日销售态势</h2>
              </div>
              <Button variant="outline" className="border-white/15 bg-white/10 text-white hover:bg-white/15 hover:text-white">
                <Zap className="size-4" />
                12 条提醒
              </Button>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3">
              {cockpitMetrics.map((metric) => (
                <div key={metric.label} className="rounded-lg border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
                  <p className="text-xs text-white/58">{metric.label}</p>
                  <p className="mt-4 mono-stat text-3xl">{metric.value}</p>
                  <p className="mt-2 text-xs text-white/55">{metric.detail}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 grid flex-1 gap-4 xl:grid-cols-[1fr_0.9fr]">
              <div className="space-y-4">
                <div className="glass-panel p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">Northstar Bio · Enterprise</p>
                      <p className="mt-1 text-xs text-white/55">客户意图雷达</p>
                    </div>
                    <Badge variant="outline" className="border-white/15 bg-white/10 text-white">
                      Hot
                    </Badge>
                  </div>
                  <div className="mt-5 space-y-4">
                    {[
                      ['Fit', '92'],
                      ['Intent', '88'],
                      ['Urgency', '74'],
                      ['Risk', '31'],
                    ].map(([label, value]) => (
                      <div key={label} className="grid grid-cols-[72px_1fr_34px] items-center gap-3">
                        <span className="text-xs text-white/55">{label}</span>
                        <div className="h-2 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full rounded-full bg-white" style={{ width: `${value}%` }} />
                        </div>
                        <span className="mono-stat text-sm">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-panel p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-white text-foreground">
                      <BadgeCheck className="size-5" />
                    </div>
                    <div>
                      <p className="font-semibold">AI Call Coach</p>
                      <p className="mt-1 text-xs text-white/58">下一场会议 · 26 分钟后</p>
                      <p className="mt-4 text-sm leading-6 text-white/70">
                        建议先确认 CFO 预算窗口，再用 3 个月回本模型回应价格异议。
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-5">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">AI 识别的关键动作</p>
                  <span className="text-xs text-white/58">Auto-prioritized</span>
                </div>
                <div className="mt-5 space-y-3">
                  {[
                    '生成 CFO 版本 ROI 摘要',
                    '安排风险复盘并补充安全材料',
                    '建议经理介入多线程沟通',
                    '确认法务审批窗口',
                  ].map((action, index) => (
                    <div key={action} className="rounded-lg border border-white/10 bg-white/10 px-3 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex size-7 items-center justify-center rounded-md bg-white text-xs font-semibold text-foreground">
                          {index + 1}
                        </span>
                        <p className="text-sm">{action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
