import { useCallback, useEffect, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface CopyButtonProps {
  text: string
  className?: string
}

export function CopyButton({ text, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  const handleCopy = useCallback(() => {
    navigator.clipboard
      .writeText(text)
      .then(() => setCopied(true))
      .catch(() => console.warn('[CopyButton] clipboard write failed'))
  }, [text])

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={handleCopy}
          className={
            className ??
            'mt-1 self-start rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover/msg:opacity-100'
          }
          aria-label="コピー"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </TooltipTrigger>
      <TooltipContent>{copied ? 'コピーしました' : 'コピー'}</TooltipContent>
    </Tooltip>
  )
}
