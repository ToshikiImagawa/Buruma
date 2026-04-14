import { useCallback, useState } from 'react'
import type { BranchInfo } from '@domain'
import type { KeyboardEvent, WheelEvent } from 'react'
import { cn } from '@lib/utils'
import { Check, ChevronsUpDown, GitBranch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export interface BranchComboboxProps {
  localBranches: BranchInfo[]
  remoteBranches?: BranchInfo[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  allowFreeInput?: boolean
  disabled?: boolean
  className?: string
}

export function BranchCombobox({
  localBranches,
  remoteBranches = [],
  value,
  onValueChange,
  placeholder = 'ブランチを選択...',
  allowFreeInput = false,
  disabled = false,
  className,
}: BranchComboboxProps) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const allBranches = [...localBranches, ...remoteBranches]
  const hasExactMatch = allBranches.some((b) => b.name === inputValue)
  const showFreeInput = allowFreeInput && inputValue && !hasExactMatch

  const handleSelect = (prefixedValue: string) => {
    // cmdk の value にはグループプレフィックス (local: / remote:) が付いているので除去
    const branchName = prefixedValue.replace(/^(?:local|remote):/, '')
    onValueChange(branchName)
    setOpen(false)
    setInputValue('')
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!allowFreeInput || !inputValue || hasExactMatch) return
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      onValueChange(inputValue)
      setOpen(false)
      setInputValue('')
    }
  }

  // Dialog の react-remove-scroll が Popover Portal 内の wheel イベントをバブリングでブロックするため手動処理
  const handleWheel = useCallback((e: WheelEvent<HTMLDivElement>) => {
    e.stopPropagation()
    e.currentTarget.scrollTop += e.deltaY
  }, [])

  const displayValue = value || undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn('h-8 w-full justify-between text-sm font-normal', className)}
        >
          <span className="flex items-center gap-1.5 truncate">
            <GitBranch className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            {displayValue ?? <span className="text-muted-foreground">{placeholder}</span>}
          </span>
          <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={true}>
          <CommandInput
            placeholder="ブランチを検索..."
            value={inputValue}
            onValueChange={setInputValue}
            onKeyDown={handleKeyDown}
          />
          <CommandList className="overscroll-contain" onWheel={handleWheel}>
            <CommandEmpty>ブランチが見つかりません</CommandEmpty>
            {localBranches.length > 0 && (
              <CommandGroup heading="Local">
                {localBranches.map((branch) => (
                  <CommandItem key={`local:${branch.name}`} value={`local:${branch.name}`} onSelect={handleSelect}>
                    <Check className={cn('mr-1.5 h-3.5 w-3.5', value === branch.name ? 'opacity-100' : 'opacity-0')} />
                    <span className="truncate">{branch.name}</span>
                    {branch.isHead && <span className="ml-auto text-xs text-muted-foreground">HEAD</span>}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {remoteBranches.length > 0 && (
              <CommandGroup heading="Remote">
                {remoteBranches.map((branch) => (
                  <CommandItem key={`remote:${branch.name}`} value={`remote:${branch.name}`} onSelect={handleSelect}>
                    <Check className={cn('mr-1.5 h-3.5 w-3.5', value === branch.name ? 'opacity-100' : 'opacity-0')} />
                    <span className="truncate">{branch.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {showFreeInput && (
              <CommandGroup forceMount>
                <CommandItem forceMount value={inputValue} onSelect={() => handleSelect(inputValue)}>
                  「{inputValue}」を使用
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
