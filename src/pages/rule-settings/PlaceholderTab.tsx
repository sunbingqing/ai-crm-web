/*
 * @Author: sunbingqing
 * @Date: 2026-05-21
 * @Description: 开发中占位组件
 * @Copyright: ©2021 杭州杰竞科技有限公司 版权所有
 */

interface PlaceholderTabProps {
  label: string
}

export function PlaceholderTab({ label }: PlaceholderTabProps) {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      {label}设置（开发中）
    </div>
  )
}
