import { useCallback, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Send, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface CommandInputProps {
  onSubmit: (command: string) => void
  onCancel?: () => void
  disabled?: boolean
  isCommandRunning?: boolean
}

export function CommandInput({ onSubmit, onCancel, disabled, isCommandRunning }: CommandInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const compositionEndTimeRef = useRef(0)

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed) return
    onSubmit(trimmed)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    textareaRef.current?.focus()
  }, [value, onSubmit])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key !== 'Enter' || e.shiftKey) return
      if (e.nativeEvent.isComposing || Date.now() - compositionEndTimeRef.current < 300) return
      e.preventDefault()
      handleSubmit()
    },
    [handleSubmit],
  )

  const handleCompositionEnd = useCallback(() => {
    compositionEndTimeRef.current = Date.now()
  }, [])

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`
  }

  return (
    <div className="border-t p-2">
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <textarea
          ref={textareaRef}
          className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="メッセージを入力...（Shift+Enter で改行）"
          rows={1}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onCompositionEnd={handleCompositionEnd}
          disabled={disabled || isCommandRunning}
        />
        {isCommandRunning ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="destructive"
                className="h-9 w-9 shrink-0"
                onClick={onCancel}
                aria-label="中断"
              >
                <Square className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>中断</TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={handleSubmit}
                disabled={disabled || !value.trim()}
                aria-label="送信"
              >
                <Send className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>送信</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  )
}
