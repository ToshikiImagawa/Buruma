import { useState } from 'react'
import { Button } from '@renderer/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@renderer/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@renderer/components/ui/popover'
import { useWorktreeDetailViewModel } from '@renderer/features/worktree-management/presentation/use-worktree-detail-viewmodel'
import { useWorktreeListViewModel } from '@renderer/features/worktree-management/presentation/use-worktree-list-viewmodel'
import { Check, ChevronsUpDown, GitBranch, Star } from 'lucide-react'

interface WorktreeSwitcherProps {
  onWorktreeSelected?: () => void
}

export function WorktreeSwitcher({ onWorktreeSelected }: WorktreeSwitcherProps) {
  const { worktrees, selectWorktree } = useWorktreeListViewModel()
  const { selectedWorktree } = useWorktreeDetailViewModel()
  const [open, setOpen] = useState(false)

  const label = selectedWorktree
    ? (selectedWorktree.branch ?? `(detached) ${selectedWorktree.head}`)
    : 'ワークツリー未選択'

  const handleSelect = (path: string) => {
    if (path !== selectedWorktree?.path) {
      selectWorktree(path)
      onWorktreeSelected?.()
    }
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          role="combobox"
          aria-expanded={open}
          disabled={worktrees.length === 0}
          className="h-8 gap-1.5 px-2 text-sm font-medium"
        >
          <GitBranch className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="max-w-[200px] truncate">{label}</span>
          <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command>
          <CommandInput placeholder="ワークツリーを検索..." />
          <CommandList>
            <CommandEmpty>ワークツリーが見つかりません</CommandEmpty>
            <CommandGroup heading="ワークツリー">
              {worktrees.map((wt) => {
                const isSelected = selectedWorktree?.path === wt.path
                const displayBranch = wt.branch ?? `(detached) ${wt.head}`
                return (
                  <CommandItem
                    key={wt.path}
                    value={`${displayBranch} ${wt.path}`}
                    onSelect={() => handleSelect(wt.path)}
                  >
                    <Check className={`h-3.5 w-3.5 ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="flex items-center gap-1 truncate">
                        {displayBranch}
                        {wt.isMain && <Star className="h-3 w-3 shrink-0 text-primary" />}
                        {wt.isDirty && <span className="text-xs text-amber-500">●</span>}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">{wt.path}</span>
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
