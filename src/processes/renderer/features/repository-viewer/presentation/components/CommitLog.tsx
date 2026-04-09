import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import type { BranchList, CommitSummary, TagInfo } from '@domain'
import type { RefInfo } from '../ref-map'
import { computeGraphLayout } from '@lib/graph'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@renderer/components/ui/context-menu'
import { Input } from '@renderer/components/ui/input'
import { useVirtualizer } from '@tanstack/react-virtual'
import { GitBranch, Search, Tag } from 'lucide-react'
import { buildRefMap } from '../ref-map'
import { useCommitLogViewModel } from '../use-commit-log-viewmodel'
import { BranchGraphCanvas, LANE_WIDTH } from './BranchGraphCanvas'

interface CommitLogProps {
  worktreePath: string
  onCommitSelect: (hash: string) => void
  onCherryPick?: (hash: string) => void
  onReset?: (hash: string, mode: 'soft' | 'mixed' | 'hard') => void
  branches: BranchList | null
  tags: TagInfo[]
}

export interface CommitLogHandle {
  scrollToHash: (hash: string) => void
  refresh: () => void
}

const ITEM_HEIGHT = 52
const MAX_BADGES = 3

function RefBadges({ refInfo }: { refInfo: RefInfo }) {
  const badges: { label: string; className: string; icon?: 'branch' | 'tag' }[] = []

  if (refInfo.isHead) {
    badges.push({ label: 'HEAD', className: 'bg-yellow-600 text-white' })
  }
  for (const name of refInfo.localBranches) {
    badges.push({ label: name, className: 'bg-green-900/50 text-green-300 border border-green-700', icon: 'branch' })
  }
  for (const name of refInfo.remoteBranches) {
    badges.push({ label: name, className: 'bg-blue-900/50 text-blue-300 border border-blue-700', icon: 'branch' })
  }
  for (const name of refInfo.tags) {
    badges.push({ label: name, className: 'bg-orange-900/50 text-orange-300 border border-orange-700', icon: 'tag' })
  }

  if (badges.length === 0) return null

  const visible = badges.slice(0, MAX_BADGES)
  const overflow = badges.length - MAX_BADGES

  return (
    <span className="inline-flex min-w-0 items-center gap-1 overflow-hidden">
      {visible.map((badge) => (
        <span
          key={badge.label}
          className={`inline-flex items-center gap-0.5 rounded px-1 text-[10px] leading-tight shrink-0 ${badge.className}`}
        >
          {badge.icon === 'branch' && <GitBranch className="h-2.5 w-2.5" />}
          {badge.icon === 'tag' && <Tag className="h-2.5 w-2.5" />}
          {badge.label}
        </span>
      ))}
      {overflow > 0 && <span className="text-[10px] text-muted-foreground">+{overflow}</span>}
    </span>
  )
}

function CommitItem({
  commit,
  selected,
  onClick,
  graphPadding,
  refInfo,
  onCherryPick,
  onReset,
}: {
  commit: CommitSummary
  selected: boolean
  onClick: () => void
  graphPadding: number
  refInfo?: RefInfo
  onCherryPick?: (hash: string) => void
  onReset?: (hash: string, mode: 'soft' | 'mixed' | 'hard') => void
}) {
  const date = new Date(commit.date)
  const dateStr = date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <button
          className={`flex w-full items-start gap-1 rounded py-1.5 pr-2 text-left text-sm hover:bg-accent ${
            selected ? 'bg-accent' : ''
          }`}
          style={{ paddingLeft: `${graphPadding}px` }}
          onClick={onClick}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-medium">{commit.message}</span>
              <span className="shrink-0 text-xs text-muted-foreground ml-auto">{dateStr}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {refInfo && <RefBadges refInfo={refInfo} />}
              <span className="font-mono">{commit.hashShort}</span>
              <span className="truncate">{commit.author}</span>
            </div>
          </div>
        </button>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => onCherryPick?.(commit.hash)} disabled={!onCherryPick}>
          {commit.hashShort} をチェリーピック
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger>{commit.hashShort} までリセット</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem onClick={() => onReset?.(commit.hash, 'soft')} disabled={!onReset}>
              Soft（変更をステージに保持）
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onReset?.(commit.hash, 'mixed')} disabled={!onReset}>
              Mixed（変更をワーキングツリーに保持）
            </ContextMenuItem>
            <ContextMenuItem
              className="text-destructive"
              onClick={() => onReset?.(commit.hash, 'hard')}
              disabled={!onReset}
            >
              Hard（変更を破棄）
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>
  )
}

export const CommitLog = forwardRef<CommitLogHandle, CommitLogProps>(function CommitLog(
  { worktreePath, onCommitSelect, onCherryPick, onReset, branches, tags },
  ref,
) {
  const { commits, hasMore, loading, selectedCommit, loadCommits, loadMore, selectCommit, setSearch } =
    useCommitLogViewModel()
  const scrollRef = useRef<HTMLDivElement>(null)
  const selectedHash = selectedCommit?.hash ?? null
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)

  const graphLayout = useMemo(() => computeGraphLayout(commits), [commits])
  const graphPadding = (graphLayout.maxLane + 1) * LANE_WIDTH + LANE_WIDTH
  const refMap = useMemo(() => buildRefMap(branches, tags), [branches, tags])

  const virtualizer = useVirtualizer({
    count: commits.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 10,
  })

  useImperativeHandle(
    ref,
    () => ({
      scrollToHash(hash: string) {
        const index = commits.findIndex((c) => c.hash === hash)
        if (index >= 0) {
          virtualizer.scrollToIndex(index, { align: 'center' })
        }
      },
      refresh() {
        loadCommits(worktreePath)
      },
    }),
    [commits, virtualizer, loadCommits, worktreePath],
  )

  useEffect(() => {
    loadCommits(worktreePath)
  }, [worktreePath, loadCommits])

  // コンテナサイズの取得
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height)
      }
    })
    observer.observe(el)
    setContainerHeight(el.clientHeight)
    return () => observer.disconnect()
  }, [])

  // スクロール追跡
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => setScrollTop(el.scrollTop)
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  // 仮想スクロール末尾に達したらページネーション
  const virtualItems = virtualizer.getVirtualItems()
  const lastItem = virtualItems[virtualItems.length - 1]

  useEffect(() => {
    if (!lastItem) return
    if (lastItem.index >= commits.length - 5 && hasMore && !loading) {
      loadMore(worktreePath)
    }
  }, [lastItem, commits.length, hasMore, loading, loadMore, worktreePath])

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value)
      loadCommits(worktreePath)
    },
    [setSearch, loadCommits, worktreePath],
  )

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input className="h-8 pl-8 text-sm" placeholder="コミットを検索..." onChange={handleSearchChange} />
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-auto" style={{ position: 'relative' }}>
        {commits.length === 0 && !loading ? (
          <p className="px-3 py-4 text-center text-sm text-muted-foreground">コミットがありません</p>
        ) : (
          <>
            <BranchGraphCanvas
              layout={graphLayout}
              rowHeight={ITEM_HEIGHT}
              scrollTop={scrollTop}
              containerHeight={containerHeight}
              refMap={refMap}
            />
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
              }}
            >
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const commit = commits[virtualItem.index]
                return (
                  <div
                    key={commit.hash}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    <CommitItem
                      commit={commit}
                      selected={commit.hash === selectedHash}
                      graphPadding={graphPadding}
                      refInfo={refMap.get(commit.hash)}
                      onCherryPick={onCherryPick}
                      onReset={onReset}
                      onClick={() => {
                        selectCommit(worktreePath, commit.hash)
                        onCommitSelect(commit.hash)
                      }}
                    />
                  </div>
                )
              })}
            </div>
          </>
        )}
        {loading && <p className="px-3 py-2 text-center text-xs text-muted-foreground">読み込み中...</p>}
      </div>
    </div>
  )
})
