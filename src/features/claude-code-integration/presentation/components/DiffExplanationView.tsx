import { CopyButton } from '@/components/copy-button'
import { MarkdownContent } from '@/components/markdown-content'
import { TooltipProvider } from '@/components/ui/tooltip'

interface DiffExplanationViewProps {
  explanation: string
}

export function DiffExplanationView({ explanation }: DiffExplanationViewProps) {
  if (!explanation) {
    return null
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-end">
          <CopyButton
            text={explanation}
            className="rounded p-1 text-muted-foreground transition-opacity hover:bg-muted hover:text-foreground"
          />
        </div>
        <div className="overflow-auto rounded-md border border-border bg-muted/30 p-3 text-sm">
          <MarkdownContent content={explanation} />
        </div>
      </div>
    </TooltipProvider>
  )
}
