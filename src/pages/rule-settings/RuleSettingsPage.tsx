/*
 * @Author: sunbingqing
 * @Date: 2026-05-21
 * @Description: 规则设置页面
 * @Copyright: ©2021 杭州杰竞科技有限公司 版权所有
 */

import { useState, type FC } from 'react'
import { cn } from '@/lib/utils'
import { CustomerIntentTab } from './CustomerIntentTab'
import { CustomerObjectionTab } from './CustomerObjectionTab'
import { FollowUpStageTab } from './FollowUpStageTab'
import { CustomerTagTab } from './CustomerTagTab'
import { SessionQualityTab } from './SessionQualityTab'
import { RiskSessionTab } from './RiskSessionTab'
import { AttentionMembersTab } from './AttentionMembersTab'

const TABS = [
  { key: 'intent', label: '客户意向' },
  { key: 'follow-stage', label: '跟进阶段' },
  { key: 'objection', label: '客户异议' },
  { key: 'tag', label: '客户标签' },
  { key: 'quality', label: '会话质量' },
  { key: 'risk', label: '风险会话' },
  { key: 'attention', label: '关注成员' },
] as const

type TabKey = (typeof TABS)[number]['key']

const TAB_CONTENT: Record<TabKey, FC> = {
  intent: CustomerIntentTab,
  'follow-stage': FollowUpStageTab,
  objection: CustomerObjectionTab,
  tag: CustomerTagTab,
  quality: SessionQualityTab,
  risk: RiskSessionTab,
  attention: AttentionMembersTab,
}

export default function RuleSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('intent')

  const Content = TAB_CONTENT[activeTab]

  return (
    <div className="flex h-full">
      <nav className="flex w-40 shrink-0 flex-col border-r bg-muted/30 py-4">
        <div className="px-3 pb-2 text-xs font-medium text-muted-foreground">
          规则分类
        </div>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
              activeTab === tab.key
                ? 'bg-accent font-medium text-foreground'
                : 'text-muted-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto p-6">
        <Content />
      </div>
    </div>
  )
}
