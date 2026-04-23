import { useCallback, useRef, useState } from 'react'
import { PRESET_MODELS } from '@domain'
import { cn } from '@lib/utils'
import { Check, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface ModelSelectorProps {
  value: string
  onChange: (model: string) => void
  disabled?: boolean
}

export function ModelSelector({ value, onChange, disabled }: ModelSelectorProps) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const displayLabel = PRESET_MODELS.find((m) => m.id === value)?.label ?? value

  const handleSelect = useCallback(
    (modelId: string) => {
      onChange(modelId)
      setOpen(false)
      setInputValue('')
    },
    [onChange],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && inputValue.trim()) {
        e.preventDefault()
        handleSelect(inputValue.trim())
      }
    },
    [inputValue, handleSelect],
  )

  return (
    <Popover
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (isOpen) {
          setTimeout(() => inputRef.current?.focus(), 0)
        } else {
          setInputValue('')
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-7 w-45 justify-between text-xs"
          disabled={disabled}
        >
          <span className="truncate">{displayLabel}</span>
          <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-55 p-0" align="end">
        <div className="p-2">
          <Input
            ref={inputRef}
            placeholder="モデル ID を入力..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-7 text-xs"
          />
        </div>
        <div className="border-t px-1 py-1">
          <p className="px-2 py-1 text-[10px] font-medium text-muted-foreground">プリセット</p>
          {PRESET_MODELS.map((model) => (
            <button
              key={model.id}
              className={cn(
                'flex w-full items-center rounded-sm px-2 py-1.5 text-xs hover:bg-accent hover:text-accent-foreground',
                value === model.id && 'bg-accent',
              )}
              onClick={() => handleSelect(model.id)}
            >
              <Check className={cn('mr-2 h-3 w-3', value === model.id ? 'opacity-100' : 'opacity-0')} />
              <span>{model.label}</span>
              <span className="ml-auto text-[10px] text-muted-foreground">{model.id}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
