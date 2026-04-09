import { useState } from 'react'
import { Button } from '@renderer/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@renderer/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@renderer/components/ui/popover'
import { useRepositorySelectorViewModel } from '@renderer/features/application-foundation/presentation/use-repository-selector-viewmodel'
import { Check, ChevronsUpDown, Folder, FolderOpen, Pin } from 'lucide-react'

export function RepositorySwitcher() {
  const { recentRepositories, currentRepository, openByPath, openWithDialog } = useRepositorySelectorViewModel()
  const [open, setOpen] = useState(false)

  const sortedRepositories = [...recentRepositories].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime()
  })

  const handleSelect = (path: string) => {
    if (path !== currentRepository?.path) {
      openByPath(path)
    }
    setOpen(false)
  }

  const handleOpenDialog = () => {
    openWithDialog()
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
          className="h-8 gap-1.5 px-2 text-sm font-semibold"
        >
          <Folder className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="max-w-[160px] truncate">{currentRepository?.name ?? 'リポジトリ未選択'}</span>
          <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command>
          <CommandInput placeholder="リポジトリを検索..." />
          <CommandList>
            <CommandEmpty>リポジトリが見つかりません</CommandEmpty>
            {sortedRepositories.length > 0 && (
              <CommandGroup heading="最近開いたリポジトリ">
                {sortedRepositories.map((repo) => {
                  const isCurrent = currentRepository?.path === repo.path
                  return (
                    <CommandItem
                      key={repo.path}
                      value={`${repo.name} ${repo.path}`}
                      onSelect={() => handleSelect(repo.path)}
                    >
                      <Check className={`h-3.5 w-3.5 ${isCurrent ? 'opacity-100' : 'opacity-0'}`} />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="flex items-center gap-1 truncate">
                          {repo.name}
                          {repo.pinned && <Pin className="h-3 w-3 shrink-0 text-primary" />}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">{repo.path}</span>
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}
            <CommandSeparator />
            <CommandGroup>
              <CommandItem value="__open_dialog__" onSelect={handleOpenDialog}>
                <FolderOpen className="h-3.5 w-3.5" />
                <span>リポジトリを開く...</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
