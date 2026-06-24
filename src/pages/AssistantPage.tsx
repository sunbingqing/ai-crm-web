/*
 * @Author: sunbingqing
 * @Date: 2026-05-09 14:36:11
 * @LastEditors: sunbingqing
 * @LastEditTime: 2026-05-13 11:33:34
 * @Description: AI 助手页面
 * @Copyright: ©2021 杭州杰竞科技有限公司 版权所有
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { AssistantAnalysisCard } from '@/components/assistant/AssistantAnalysisCard'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Bot,
  LoaderCircle,
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  Trash2,
  User,
} from 'lucide-react'
import { cn, formatTime, generateId } from '@/lib/utils'
import {
  analyzeCallSessions,
  type CallAnalysisFilters,
  type CallAnalysisResult,
} from '@/services/assistant'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content?: string
  analysis?: CallAnalysisResult
  timestamp: number
}

interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: number
}

const PRESET_QUESTIONS = [
  { id: '1', text: '近 7 天有哪些风险会话？' },
  { id: '2', text: '哪些成员需要我关注？' },
]

export default function AssistantPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState('')
  const abortRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [activeConversation?.messages.length, scrollToBottom])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      abortRef.current?.abort()
    }
  }, [])

  const { mutateAsync: runAnalysis, isPending } = useMutation({
    mutationFn: async ({
      query,
      previousFilters,
    }: {
      query: string
      previousFilters?: CallAnalysisFilters
    }) => {
      abortRef.current?.abort()
      abortRef.current = new AbortController()
      return analyzeCallSessions({ query, previousFilters }, abortRef.current.signal)
    },
  })

  useEffect(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 160) + 'px'
    }
  }, [inputValue])

  function createNewConversation() {
    setActiveId(null)
    setInputValue('')
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  async function handleSend(content: string) {
    const trimmed = content.trim()
    if (!trimmed || isPending) return

    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      content: trimmed,
      // eslint-disable-next-line react-hooks/purity
      timestamp: Date.now(),
    }

    let convId = activeId
    if (!convId) {
      convId = generateId()
      const newConv: Conversation = {
        id: convId,
        title: trimmed.length > 24 ? trimmed.slice(0, 24) + '...' : trimmed,
        messages: [userMsg],
        // eslint-disable-next-line react-hooks/purity
        createdAt: Date.now(),
      }
      setConversations((prev) => [newConv, ...prev])
      setActiveId(convId)
    } else {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? {
                ...c,
                title: c.messages.length === 0
                  ? (trimmed.length > 24 ? trimmed.slice(0, 24) + '...' : trimmed)
                  : c.title,
                messages: [...c.messages, userMsg],
              }
            : c,
        ),
      )
    }

    const targetConvId = convId
    setInputValue('')

    try {
      const previousFilters = conversations
        .find((conv) => conv.id === targetConvId)
        ?.messages.slice()
        .reverse()
        .find((msg) => msg.analysis?.effectiveFilters)
        ?.analysis?.effectiveFilters

      const analysis = await runAnalysis({ query: trimmed, previousFilters })
      if (!mountedRef.current) return
      const aiMsg: Message = {
        id: generateId(),
        role: 'assistant',
        content: analysis.summary,
        analysis,
        // eslint-disable-next-line react-hooks/purity
        timestamp: Date.now(),
      }
      setConversations((prev) =>
        prev.map((c) =>
          c.id === targetConvId ? { ...c, messages: [...c.messages, aiMsg] } : c,
        ),
      )
    } catch (error) {
      if (!mountedRef.current || axios.isCancel(error)) return
      const aiMsg: Message = {
        id: generateId(),
        role: 'assistant',
        content: error instanceof Error ? error.message : '分析失败，请稍后再试',
        // eslint-disable-next-line react-hooks/purity
        timestamp: Date.now(),
      }
      setConversations((prev) =>
        prev.map((c) =>
          c.id === targetConvId ? { ...c, messages: [...c.messages, aiMsg] } : c,
        ),
      )
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend(inputValue)
    }
  }

  function handleDeleteConversation(e: React.MouseEvent, convId: string) {
    e.stopPropagation()
    setConversations((prev) => prev.filter((c) => c.id !== convId))
    if (activeId === convId) {
      setActiveId(null)
    }
  }

  function handleSelectConversation(convId: string) {
    setActiveId(convId)
  }

  return (
    <div className="flex h-[calc(100vh-3.25rem)]">
      <aside className="flex w-64 shrink-0 flex-col border-r bg-background">
        <div className="border-b p-3">
          <Button className="w-full" onClick={createNewConversation}>
            <Plus className="mr-2 h-4 w-4" />
            新建对话
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <MessageSquare className="mb-2 h-8 w-8 opacity-50" />
              <p className="text-xs">暂无历史对话</p>
            </div>
          ) : (
            <div className="space-y-0.5 p-2">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={cn(
                    'group relative',
                    activeId === conv.id && 'rounded-md bg-muted',
                  )}
                >
                  <Button
                    variant="ghost"
                    className={cn(
                      'h-auto w-full justify-start gap-2 px-3 py-2.5 text-left font-normal',
                      activeId !== conv.id && 'hover:bg-muted',
                    )}
                    onClick={() => handleSelectConversation(conv.id)}
                  >
                    <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate">{conv.title}</span>
                    <span className="shrink-0 text-[10px] text-muted-foreground/60">
                      {formatTime(conv.createdAt)}
                    </span>
                  </Button>
                  <Trash2
                    className="absolute right-2 top-1/2 hidden h-3.5 w-3.5 shrink-0 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-destructive group-hover:block"
                    onClick={(e) => handleDeleteConversation(e, conv.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {!activeConversation ? (
          <div className="flex flex-1 flex-col items-center justify-start px-6 pt-16">
            <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h1 className="mb-2 text-2xl font-bold">AI 通话分析助手</h1>
            <p className="mb-8 text-center text-sm text-muted-foreground">
              直接提问即可拉取符合条件的通话记录，按问题返回摘要、表格和图表
            </p>
            <div className="grid w-full max-w-2xl gap-3 md:grid-cols-3">
              {PRESET_QUESTIONS.map((q) => (
                <Button
                  key={q.id}
                  variant="outline"
                  className="h-auto justify-start gap-2 px-4 py-3 text-left font-normal"
                  onClick={() => {
                    void handleSend(q.text)
                  }}
                  disabled={isPending}
                >
                  <Sparkles className="h-4 w-4 shrink-0 text-primary" />
                  <span className="line-clamp-2">{q.text}</span>
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {activeConversation.messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  发送消息开始对话
                </div>
              ) : (
                <div className="mx-auto max-w-5xl space-y-6">
                  {activeConversation.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn('flex gap-3', msg.role === 'user' && 'flex-row-reverse')}
                    >
                      <div
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                          msg.role === 'assistant' ? 'bg-primary/10' : 'bg-muted',
                        )}
                      >
                        {msg.role === 'assistant' ? (
                          <Bot className="h-4 w-4 text-primary" />
                        ) : (
                          <User className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>

                      <div className={cn('min-w-0', msg.analysis ? 'w-full max-w-4xl' : 'max-w-[75%]')}>
                        {msg.analysis ? (
                          <AssistantAnalysisCard
                            analysis={msg.analysis}
                            onSend={(query) => {
                              void handleSend(query)
                            }}
                          />
                        ) : (
                          <div
                            className={cn(
                              'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                              msg.role === 'assistant'
                                ? 'bg-muted'
                                : 'bg-primary text-primary-foreground',
                            )}
                          >
                            <MessageText text={msg.content || ''} />
                          </div>
                        )}
                      </div>

                      <span className="mt-auto text-[10px] text-muted-foreground/60">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  ))}

                  {isPending && (
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
                      </div>
                      <div className="flex items-center rounded-2xl bg-muted px-4 py-3">
                        <span className="text-sm text-muted-foreground">正在分析通话记录并生成图表...</span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>
        )}

        <div className="border-t p-4">
          <div className="mx-auto flex max-w-4xl items-end gap-2">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value)
                const el = e.target
                el.style.height = 'auto'
                el.style.height = Math.min(el.scrollHeight, 160) + 'px'
              }}
              onKeyDown={handleKeyDown}
              placeholder="例如：帮我看下哪些成员需要我关注，或者近 7 天有哪些风险会话？"
              disabled={isPending}
              rows={2}
              className="min-h-[56px] flex-1 resize-none"
            />
            <Button
              size="icon"
              onClick={() => {
                void handleSend(inputValue)
              }}
              disabled={!inputValue.trim() || isPending}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MessageText({ text }: { text: string }) {
  return (
    <>
      {text.split('\n').map((line, i) => (
        <span key={i}>
          {i > 0 && <br />}
          {line
            .split(/(\*\*[^*]+\*\*)/g)
            .map((part, j) =>
              part.startsWith('**') && part.endsWith('**') ? (
                <strong key={j}>{part.slice(2, -2)}</strong>
              ) : (
                <span key={j}>{part}</span>
              ),
            )}
        </span>
      ))}
    </>
  )
}
