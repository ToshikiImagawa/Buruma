import { useState } from 'react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Send } from 'lucide-react'

interface CommandInputProps {
  onSubmit: (command: string) => void
  disabled?: boolean
}

export function CommandInput({ onSubmit, disabled }: CommandInputProps) {
  const [value, setValue] = useState('')

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (!trimmed) return
    onSubmit(trimmed)
    setValue('')
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        className="h-8 flex-1 text-sm"
        placeholder="Claude Code に指示を入力..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
          }
        }}
        disabled={disabled}
      />
      <Button size="icon" className="h-8 w-8" onClick={handleSubmit} disabled={disabled || !value.trim()}>
        <Send className="h-4 w-4" />
      </Button>
    </div>
  )
}
