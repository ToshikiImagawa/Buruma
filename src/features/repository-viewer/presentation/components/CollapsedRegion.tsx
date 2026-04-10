interface CollapsedRegionProps {
  lineCount: number
  onExpand: () => void
}

export function CollapsedRegion({ lineCount, onExpand }: CollapsedRegionProps) {
  return (
    <button
      type="button"
      className="flex w-full items-center justify-center border-y border-dashed border-border/50 bg-muted/20 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/40"
      onClick={onExpand}
    >
      ... {lineCount} 行省略 ...
    </button>
  )
}
