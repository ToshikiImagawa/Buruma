import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CommitSummary } from '@shared/domain'
import { Input } from '@renderer/components/ui/input'
import { computeGraphLayout } from '@shared/lib/graph'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Search } from 'lucide-react'
import { useCommitLogViewModel } from '../use-commit-log-viewmodel'
import { BranchGraphCanvas, LANE_WIDTH } from './BranchGraphCanvas'

interface CommitLogProps {
  worktreePath: string
  onCommitSelect: (hash: string) => void
}

const ITEM_HEIGHT = 52

function CommitItem({
  commit,
  selected,
  onClick,
  graphPadding,
}: {
  commit: CommitSummary
  selected: boolean
  onClick: () => void
  graphPadding: number
}) {
  const date = new Date(commit.date)
  const dateStr = date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })

  return (
    <button
      className={`flex w-full items-start gap-1 rounded py-1.5 pr-2 text-left text-sm hover:bg-accent ${
        selected ? 'bg-accent' : ''
      }`}
      style={{ paddingLeft: `${graphPadding}px` }}
      onClick={onClick}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-medium">{commit.message}</span>
          <span className="shrink-0 text-xs text-muted-foreground">{dateStr}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-mono">{commit.hashShort}</span>
          <span className="truncate">{commit.author}</span>
        </div>
      </div>
    </button>
  )
}

export function CommitLog({ worktreePath, onCommitSelect }: CommitLogProps) {
  const { commits, hasMore, loading, selectedCommit, loadCommits, loadMore, selectCommit, setSearch } =
    useCommitLogViewModel()
  const scrollRef = useRef<HTMLDivElement>(null)
  const selectedHash = selectedCommit?.hash ?? null
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)

  const graphLayout = useMemo(() => computeGraphLayout(commits), [commits])
  const graphPadding = (graphLayout.maxLane + 1) * LANE_WIDTH + LANE_WIDTH

  const virtualizer = useVirtualizer({
    count: commits.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 10,
  })

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
              totalHeight={virtualizer.getTotalSize()}
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
}
