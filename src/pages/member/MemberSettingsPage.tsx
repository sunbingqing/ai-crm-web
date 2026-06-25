/*
 * @Author: sunbingqing
 * @Date: 2026-05-09 14:36:11
 * @LastEditors: sunbingqing
 * @LastEditTime: 2026-05-21 10:24:04
 * @Description: 成员设置 - 管理机构内的成员账号，支持搜索与分页
 * @Copyright: ©2021 杭州杰竞科技有限公司 版权所有
 */

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTableSection } from '@/components/data/DataTableSection'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { format } from 'date-fns'
import { type UserVO, searchUsers } from '@/services/member'
import { Plus, Pencil, Trash2, Search, UserMinus, UserCheck } from 'lucide-react'
import { AddMemberDialog } from './AddMemberDialog'
import { EditPasswordDialog } from './EditPasswordDialog'
import { DeleteMemberDialog } from './DeleteMemberDialog'
import { ResignMemberDialog } from './ResignMemberDialog'

const PAGE_SIZE = 8

export default function MemberSettingsPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')

  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [resignOpen, setResignOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserVO | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchKeyword(keyword.trim())
      setCurrentPage(1)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [keyword])

  const memberQuery = useQuery({
    queryKey: ['members', { keyword: searchKeyword, currentPage }],
    queryFn: () =>
      searchUsers({
        keyword: searchKeyword || undefined,
        current: currentPage,
        size: PAGE_SIZE,
      }),
    placeholderData: (previousData) => previousData,
  })

  const members = memberQuery.data?.records ?? []
  const totalCount = Number(memberQuery.data?.total ?? 0)
  const pageCount = memberQuery.data?.pages ?? 1

  useEffect(() => {
    if (currentPage <= pageCount) {
      return
    }

    const timer = window.setTimeout(() => {
      setCurrentPage(pageCount)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [currentPage, pageCount])

  const showTableLoading = memberQuery.isLoading && !memberQuery.data

  return (
    <div className="page-shell">
      <div className="toolbar-band">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索成员姓名或手机号"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            新增成员
          </Button>
        </div>
      </div>

      <DataTableSection
        title="成员列表"
        total={totalCount}
        currentPage={currentPage}
        pageCount={pageCount}
        onPageChange={setCurrentPage}
      >
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>姓名</TableHead>
                <TableHead>手机号</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {showTableLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={5} className="px-6 py-4">
                      <Skeleton className="h-10 w-full rounded-md" />
                    </TableCell>
                  </TableRow>
                ))
              ) : memberQuery.isError ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-6 py-10 text-center">
                    <p className="mb-3 text-destructive">成员列表加载失败，请稍后重试</p>
                    <Button variant="outline" size="sm" onClick={() => memberQuery.refetch()}>
                      重试
                    </Button>
                  </TableCell>
                </TableRow>
              ) : members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-6 py-10 text-center text-muted-foreground">
                    {searchKeyword ? '未找到匹配的成员' : '暂无成员'}
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.username || '-'}</TableCell>
                    <TableCell>{member.phone}</TableCell>
                    <TableCell>
                      {member.status === 1 ? (
                        <span className="text-success-foreground">在职</span>
                      ) : (
                        <span className="text-muted-foreground">离职</span>
                      )}
                    </TableCell>
                    <TableCell>{member.created ? format(new Date(Number(member.created)), 'yyyy-MM-dd HH:mm') : '-'}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(member)
                          setEditOpen(true)
                        }}
                      >
                        <Pencil className="mr-1 h-3.5 w-3.5" />
                        修改密码
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(member)
                          setResignOpen(true)
                        }}
                      >
                        {member.status === 1 ? (
                          <>
                            <UserMinus className="mr-1 h-3.5 w-3.5" />
                            离职
                          </>
                        ) : (
                          <>
                            <UserCheck className="mr-1 h-3.5 w-3.5" />
                            启用
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          setSelectedUser(member)
                          setDeleteOpen(true)
                        }}
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        删除
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DataTableSection>

      <AddMemberDialog open={addOpen} onOpenChange={setAddOpen} />
      <EditPasswordDialog open={editOpen} user={selectedUser} onOpenChange={setEditOpen} />
      <DeleteMemberDialog open={deleteOpen} user={selectedUser} onOpenChange={setDeleteOpen} />
      <ResignMemberDialog open={resignOpen} user={selectedUser} onOpenChange={setResignOpen} />
    </div>
  )
}
