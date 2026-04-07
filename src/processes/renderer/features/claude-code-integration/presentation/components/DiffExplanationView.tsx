import { useCallback, useState } from 'react'
import { cn } from '@lib/utils'
import { Button } from '@renderer/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@renderer/components/ui/tooltip'
import { Check, Copy } from 'lucide-react'

interface DiffExplanationViewProps {
  explanation: string
}

export function DiffExplanationView({ explanation }: DiffExplanationViewProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(explanation)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [explanation])

  if (!explanation) {
    return null
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-end">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{copied ? 'コピー済み' : 'コピー'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div
        className={cn(
          'overflow-auto rounded-md border border-border bg-muted/30 p-3',
          'prose prose-sm dark:prose-invert max-w-none',
        )}
      >
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{explanation}</pre>
      </div>
    </div>
  )
}
