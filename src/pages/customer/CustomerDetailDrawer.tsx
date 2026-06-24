import type { ReactNode } from 'react'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  getCustomerDetail,
  getCustomerFollowTasks,
  editCustomerName,
  type CustomerVO,
  type CustomerFollowTaskVO,
} from '@/services/customer'
import { Pill } from '@/pages/session-review/Pill'
import { IntentBadge } from '@/pages/session-review/IntentBadge'
import { formatFollowTime, formatFollowStatus } from '@/pages/session-review/format'
import { useAuth } from '@/contexts/AuthContext'

type DrawerTab = 'ai' | 'history'

const TAB_OPTIONS: Array<{ key: DrawerTab; label: string }> = [
  { key: 'ai', label: 'AI 洞察' },
  { key: 'history', label: '历史跟进记录' },
]

const TAG_LIMIT = 5

function followStatusTone(status?: string): 'muted' | 'primary' | 'destructive' {
  if (status === 'DONE') return 'primary'
  if (status === 'OVERDUE') return 'destructive'
  return 'muted'
}

interface CustomerDetailDrawerProps {
  open: boolean
  customer: CustomerVO | null
  onOpenChange: (open: boolean) => void
}

export function CustomerDetailDrawer({ open, customer, onOpenChange }: CustomerDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<DrawerTab>('ai')
  const { userType } = useAuth()
  const canEdit = userType != null && userType >= 2

  const detailQuery = useQuery({
    queryKey: ['customer-detail', customer?.id ?? 'empty'],
    queryFn: () => {
      if (!customer) throw new Error('缺少客户 ID')
      return getCustomerDetail(customer.id)
    },
    enabled: open && customer != null,
  })

  const followTasksQuery = useQuery({
    queryKey: ['customer-follow-tasks', customer?.id ?? 'empty'],
    queryFn: () => {
      if (!customer) throw new Error('缺少客户 ID')
      return getCustomerFollowTasks(customer.id)
    },
    enabled: open && customer != null && activeTab === 'history',
  })

  const detail = detailQuery.data ?? customer

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen)
    if (!nextOpen) {
      setActiveTab('ai')
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="gap-0 p-0"
        style={{ width: 'min(78vw, 58rem)', maxWidth: 'min(78vw, 58rem)' }}
      >
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle className="text-lg font-semibold">客户详情</SheetTitle>
        </SheetHeader>

        {detailQuery.isLoading && !detailQuery.data ? (
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <DrawerSkeleton />
          </div>
        ) : detailQuery.isError ? (
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <ErrorBlock message="客户详情加载失败，请稍后重试" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            <BasicInfoCard detail={detail} customerId={customer?.id ?? ''} canEdit={canEdit} />
            <FollowPlanCard nextFollowTask={detail?.nextFollowTask} />
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="px-5 pt-4 pb-3">
                <div className="flex w-fit items-center gap-1 rounded-lg bg-muted p-1">
                  {TAB_OPTIONS.map((tab) => (
                    <Button
                      key={tab.key}
                      type="button"
                      variant={activeTab === tab.key ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setActiveTab(tab.key)}
                      className={cn(
                        'rounded-md px-3',
                        activeTab === tab.key && 'shadow-sm',
                      )}
                    >
                      {tab.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="border-t px-5 pb-5 pt-5">
                {activeTab === 'ai' && <AiInsightsTab detail={detail} />}
                {activeTab === 'history' && (
                  <HistoryTab
                    followSummary={detail?.followSummary}
                    followTasks={followTasksQuery.data ?? []}
                    isLoading={followTasksQuery.isLoading && !followTasksQuery.data}
                    isError={followTasksQuery.isError}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

function BasicInfoCard({ detail, customerId, canEdit }: { detail: CustomerVO | null; customerId: string; canEdit: boolean }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const queryClient = useQueryClient()

  const editMutation = useMutation({
    mutationFn: (name: string) => editCustomerName(customerId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-detail', customerId] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success('客户名称已修改')
    },
    onError: (err: Error) => {
      toast.error(err.message || '修改失败，请稍后重试')
    },
  })

  function openDialog() {
    setNameValue(detail?.name ?? '')
    setDialogOpen(true)
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = nameValue.trim()
    if (!trimmed) return
    if (trimmed !== detail?.name) {
      editMutation.mutate(trimmed)
    }
    setDialogOpen(false)
  }

  const objections = detail?.objections ?? []
  const tags = detail?.tags ?? []

  return (
    <section className="rounded-xl border bg-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        {canEdit ? (
          <button
            type="button"
            onClick={openDialog}
            className="flex items-center gap-1.5 text-xl font-bold hover:text-primary transition-colors"
          >
            <span>{detail?.name || '未命名客户'}</span>
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        ) : (
          <span className="text-xl font-bold">{detail?.name || '未命名客户'}</span>
        )}
        <span className="text-sm text-muted-foreground">{detail?.phone}</span>
        <IntentBadge value={detail?.intentLevel} />
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground shrink-0">跟进阶段</span>
        <Pill value={detail?.followStage} />
      </div>

      {objections.length > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground shrink-0">客户异议</span>
          <div className="flex flex-wrap gap-2">
            {objections.map((o) => (
              <Pill key={o} tone="destructive" value={o} />
            ))}
          </div>
        </div>
      )}

      {tags.length > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground shrink-0">客户标签</span>
          <TagsSection tags={tags} />
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>修改客户名称</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <Input
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              placeholder="请输入客户名称"
              maxLength={20}
              autoFocus
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={editMutation.isPending || !nameValue.trim()}>
                {editMutation.isPending ? '保存中...' : '保存'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  )
}

function TagsSection({ tags }: { tags: string[] }) {
  const [expanded, setExpanded] = useState(false)
  const visibleTags = expanded ? tags : tags.slice(0, TAG_LIMIT)
  const hasMore = tags.length > TAG_LIMIT

  return (
    <div className="flex flex-wrap gap-2">
      {visibleTags.map((t) => (
        <Pill key={t} value={t} />
      ))}
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? (
            <>
              收起 <ChevronUp className="h-3 w-3" />
            </>
          ) : (
            <>
              展开 <ChevronDown className="h-3 w-3" />
            </>
          )}
        </button>
      )}
    </div>
  )
}

function FollowPlanCard({ nextFollowTask }: { nextFollowTask?: CustomerFollowTaskVO }) {
  if (!nextFollowTask?.followAction) return null

  return (
    <section className="rounded-xl border bg-card p-5 space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="text-base font-semibold">当前跟进计划</h3>
        <Pill tone={followStatusTone(nextFollowTask.status)} value={formatFollowStatus(nextFollowTask.status)} />
      </div>
      <div className="space-y-2">
        <FollowField label="跟进时间" value={formatFollowTime(nextFollowTask.followTime)} />
        <FollowField label="跟进动作" value={nextFollowTask.followAction} />
      </div>
    </section>
  )
}

function AiInsightsTab({ detail }: { detail: CustomerVO | null }) {
  const hasStrategy = !!(detail?.strategyConclusion || detail?.strategyDescription || detail?.strategyFocus)
  const hasCommunication = !!(detail?.communicationClaim || detail?.communicationScript)

  if (!hasStrategy && !hasCommunication) {
    return <TabEmptyState message="暂无 AI 洞察数据" />
  }

  return (
    <div className="space-y-4">
      {hasStrategy && (
        <TabSection title="转化策略方案">
          <InsightField label="策略结论" value={detail?.strategyConclusion} highlight />
          <InsightField label="策略说明" value={detail?.strategyDescription} />
          <InsightField label="推进重点" value={detail?.strategyFocus} accent />
        </TabSection>
      )}

      {hasCommunication && (
        <TabSection title="沟通话术建议">
          <InsightField label="沟通主张" value={detail?.communicationClaim} />
          <InsightField label="话术示例" value={detail?.communicationScript} plain />
        </TabSection>
      )}
    </div>
  )
}

function HistoryTab({
  followSummary,
  followTasks,
  isLoading,
  isError,
}: {
  followSummary?: string
  followTasks: CustomerFollowTaskVO[]
  isLoading: boolean
  isError: boolean
}) {
  if (isLoading) {
    return <DrawerSkeleton />
  }
  if (isError) {
    return <ErrorBlock message="跟进记录加载失败，请稍后重试" />
  }

  return (
    <div className="space-y-4">
      {followSummary && (
        <TabSection title="跟进总结">
          <div className="rounded-xl bg-muted/30 px-4 py-3">
            <p className="text-sm leading-7 whitespace-pre-wrap text-foreground">{followSummary}</p>
          </div>
        </TabSection>
      )}

      <TabSection title="历史跟进记录">
        {followTasks.length === 0 ? (
          <TabEmptyState message="暂无跟进记录" />
        ) : (
          <div className="space-y-3">
            {followTasks.map((task) => (
              <div
                key={task.id}
                className="rounded-xl border bg-card px-4 py-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-2">
                    <span className="inline-flex w-fit items-center rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                      {formatFollowTime(task.followTime)}
                    </span>
                    <p className="text-sm leading-7 whitespace-pre-wrap text-foreground">
                      {task.followAction || '暂无'}
                    </p>
                  </div>
                  <Pill tone={followStatusTone(task.status)} value={formatFollowStatus(task.status)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </TabSection>
    </div>
  )
}

function FollowField({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium">{value || '暂无'}</span>
    </div>
  )
}

function InsightField({
  label,
  value,
  highlight,
  accent,
  plain,
}: {
  label: string
  value?: string
  highlight?: boolean
  accent?: boolean
  plain?: boolean
}) {
  if (!value) {
    return (
      <div className="grid gap-3 md:grid-cols-[96px_1fr]">
        <span className="pt-1 text-sm text-muted-foreground">{label}</span>
        <div className="rounded-xl border border-dashed bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
          暂无
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-3 md:grid-cols-[96px_1fr] md:items-start">
      <span className="pt-1 text-sm text-muted-foreground">{label}</span>
      <p
        className={cn(
          'rounded-xl border px-4 py-3 text-sm leading-7 whitespace-pre-wrap break-words text-foreground',
          highlight && 'border-primary/15 bg-primary/5 font-semibold',
          accent && 'border-orange-200 bg-orange-50/80 font-semibold dark:border-orange-900/60 dark:bg-orange-950/20',
          !highlight && !accent && !plain && 'border-border/80 bg-muted/25',
          plain && 'border-border/80 bg-background',
        )}
      >
        {value}
      </p>
    </div>
  )
}

interface TabSectionProps {
  title: string
  children: ReactNode
}

function TabSection({ title, children }: TabSectionProps) {
  return (
    <section className="space-y-4 rounded-xl border bg-background p-5">
      <h3 className="text-base font-semibold">{title}</h3>
      {children}
    </section>
  )
}

function TabEmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed bg-muted/15 px-4 py-8 text-center text-sm text-muted-foreground">
      {message}
    </div>
  )
}

function ErrorBlock({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-8 text-center text-sm text-destructive">
      {message}
    </div>
  )
}

function DrawerSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border p-5">
        <div className="space-y-4">
          <Skeleton className="h-5 w-28 rounded-md" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>
      <div className="rounded-xl border p-5">
        <Skeleton className="h-5 w-28 rounded-md" />
        <Skeleton className="mt-4 h-20 w-full rounded-2xl" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
