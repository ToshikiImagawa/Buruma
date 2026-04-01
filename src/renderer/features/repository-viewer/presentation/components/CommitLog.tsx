import { useCallback, useEffect, useRef } from 'react'
import type { CommitSummary } from '@shared/domain'
import { Input } from '@renderer/components/ui/input'
import { Search } from 'lucide-react'
import { useCommitLogViewModel } from '../use-commit-log-viewmodel'

interface CommitLogProps {
  worktreePath: string
  onCommitSelect: (hash: string) => void
}

/** グラフ文字を色分けして表示する */
function GraphColumn({ graphLine }: { graphLine?: string }) {
  if (!graphLine) return null

  // 最初の行のみ表示（コミット行の装飾）
  const firstLine = graphLine.split('\n')[0] ?? ''
  if (!firstLine.trim()) return null

  return (
    <span className="shrink-0 whitespace-pre font-mono text-xs leading-tight text-muted-foreground">
      {firstLine.split('').map((ch, i) => {
        if (ch === '*')
          return (
            <span key={i} className="text-yellow-500 font-bold">
              {ch}
            </span>
          )
        if (ch === '|')
          return (
            <span key={i} className="text-blue-400">
              {ch}
            </span>
          )
        if (ch === '/' || ch === '\\')
          return (
            <span key={i} className="text-green-400">
              {ch}
            </span>
          )
        return <span key={i}>{ch}</span>
      })}
    </span>
  )
}

function CommitItem({ commit, selected, onClick }: { commit: CommitSummary; selected: boolean; onClick: () => void }) {
  const date = new Date(commit.date)
  const dateStr = date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })

  return (
    <button
      className={`flex w-full items-start gap-1 rounded px-2 py-1.5 text-left text-sm hover:bg-accent ${
        selected ? 'bg-accent' : ''
      }`}
      onClick={onClick}
    >
      <GraphColumn graphLine={commit.graphLine} />
      <div className="flex-1 min-w-0">
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

  useEffect(() => {
    loadCommits(worktreePath)
  }, [worktreePath, loadCommits])

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el || loading || !hasMore) return
    const { scrollTop, scrollHeight, clientHeight } = el
    if (scrollHeight - scrollTop - clientHeight < 100) {
      loadMore(worktreePath)
    }
  }, [loading, hasMore, loadMore, worktreePath])

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
      <div ref={scrollRef} className="flex-1 overflow-auto p-1" onScroll={handleScroll}>
        {commits.length === 0 && !loading ? (
          <p className="px-3 py-4 text-center text-sm text-muted-foreground">コミットがありません</p>
        ) : (
          <div className="space-y-0.5">
            {commits.map((commit) => (
              <CommitItem
                key={commit.hash}
                commit={commit}
                selected={commit.hash === selectedHash}
                onClick={() => {
                  selectCommit(worktreePath, commit.hash)
                  onCommitSelect(commit.hash)
                }}
              />
            ))}
          </div>
        )}
        {loading && <p className="px-3 py-2 text-center text-xs text-muted-foreground">読み込み中...</p>}
      </div>
    </div>
  )
}
