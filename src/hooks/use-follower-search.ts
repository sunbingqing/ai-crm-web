import { useMemo, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import type { ComboboxRoot } from '@base-ui/react/combobox'
import type { SearchableSelectOption } from '@/components/filters/SearchableSelect'
import { searchUsers, type UserVO } from '@/services/member'

function formatUserLabel(user: UserVO) {
  if (user.phone) {
    return `${user.username} · ${user.phone}`
  }

  return user.username
}

type FollowerOption = SearchableSelectOption & {
  followerId?: string
  user?: UserVO
}

const ALL_FOLLOWER_OPTION: FollowerOption = {
  key: 'all-followers',
  label: '全部跟进人',
  description: '查看所有成员的会话',
}

interface UseFollowerSearchOptions {
  onResetPage: () => void
  initialFollowerId?: string
  initialFollowerName?: string
}

function buildInitialOption(followerId?: string, followerName?: string) {
  if (followerId != null && followerName) {
    return {
      key: `member-${followerId}`,
      label: followerName,
      followerId,
    }
  }
  return ALL_FOLLOWER_OPTION
}

export function useFollowerSearch({ onResetPage, initialFollowerId, initialFollowerName }: UseFollowerSearchOptions) {
  const [initialOption] = useState(() => buildInitialOption(initialFollowerId, initialFollowerName))
  const [keyword, setKeyword] = useState(initialOption.label)
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<FollowerOption>(initialOption)

  const effectiveKeyword = useMemo(() => {
    const trimmed = keyword.trim()
    return trimmed === selected.label ? '' : trimmed
  }, [keyword, selected.label])

  const query = useInfiniteQuery({
    queryKey: ['session-review', 'members', effectiveKeyword],
    queryFn: ({ pageParam = 1 }) =>
      searchUsers({ keyword: effectiveKeyword, current: pageParam, size: 8 }),
    enabled: open,
    placeholderData: (previousData) => previousData,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const current = Number(lastPage.current ?? 1)
      const totalPages = Number(lastPage.pages ?? 1)
      return current < totalPages ? current + 1 : undefined
    },
  })

  const options = useMemo<FollowerOption[]>(() => {
    const users = query.data?.pages.flatMap((page) => page.records ?? []) ?? []
    return [
      ALL_FOLLOWER_OPTION,
      ...users.map((user) => ({
        key: `member-${user.id}`,
        label: formatUserLabel(user),
        description: user.phone || '暂无手机号',
        followerId: user.id,
        user,
      })),
    ]
  }, [query.data?.pages])

  function handleInputValueChange(value: string, details: ComboboxRoot.ChangeEventDetails) {
    setKeyword(value)
    if (details.reason === 'input-change' || details.reason === 'input-clear' || details.reason === 'clear-press') {
      setSelected(ALL_FOLLOWER_OPTION)
      onResetPage()
    }
  }

  function handleValueChange(member: FollowerOption | null) {
    const next = member ?? ALL_FOLLOWER_OPTION
    setSelected(next)
    setKeyword(next.label)
    setOpen(false)
    onResetPage()
  }

  return {
    keyword,
    setKeyword,
    open,
    setOpen,
    selected,
    options,
    query,
    handleInputValueChange,
    handleValueChange,
  }
}
