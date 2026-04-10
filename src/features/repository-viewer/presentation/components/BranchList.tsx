import { useEffect } from 'react'
import { GitBranch, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { useBranchListViewModel } from '../use-branch-list-viewmodel'

interface BranchListProps {
  worktreePath: string
}

export function BranchList({ worktreePath }: BranchListProps) {
  const { branches, loading, search, loadBranches, setSearch } = useBranchListViewModel()

  useEffect(() => {
    loadBranches(worktreePath)
  }, [worktreePath, loadBranches])

  if (loading && !branches) {
    return <div className="p-4 text-sm text-muted-foreground">読み込み中...</div>
  }

  if (!branches) {
    return <div className="p-4 text-sm text-muted-foreground">ブランチを取得できません</div>
  }

  const filterBranches = (items: typeof branches.local) => {
    if (!search) return items
    return items.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()))
  }

  const filteredLocal = filterBranches(branches.local)
  const filteredRemote = filterBranches(branches.remote)

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-8 pl-8 text-sm"
            placeholder="ブランチを検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="flex-1 overflow-auto p-2">
        {filteredLocal.length > 0 && (
          <div>
            <h3 className="px-2 py-1 text-xs font-semibold text-muted-foreground">ローカル ({filteredLocal.length})</h3>
            <div className="space-y-0.5">
              {filteredLocal.map((branch) => (
                <div
                  key={branch.name}
                  className={`flex items-center gap-2 rounded px-2 py-1 text-sm ${
                    branch.isHead ? 'bg-accent font-medium' : ''
                  }`}
                >
                  <GitBranch className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{branch.name}</span>
                  {branch.isHead && <span className="ml-auto shrink-0 text-xs text-muted-foreground">HEAD</span>}
                </div>
              ))}
            </div>
          </div>
        )}
        {filteredLocal.length > 0 && filteredRemote.length > 0 && <Separator className="my-2" />}
        {filteredRemote.length > 0 && (
          <div>
            <h3 className="px-2 py-1 text-xs font-semibold text-muted-foreground">
              リモート ({filteredRemote.length})
            </h3>
            <div className="space-y-0.5">
              {filteredRemote.map((branch) => (
                <div key={branch.name} className="flex items-center gap-2 rounded px-2 py-1 text-sm">
                  <GitBranch className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{branch.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
