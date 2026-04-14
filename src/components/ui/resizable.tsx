import { createContext, useContext } from 'react'
import { cn } from '@lib/utils'
import { GripHorizontal, GripVertical } from 'lucide-react'
import { Group, Panel, Separator } from 'react-resizable-panels'

// react-resizable-panels v4 は `orientation` prop を使用するが、
// shadcn/ui 標準の `direction` API と互換性を保つためラッパーで変換している。
// ResizableHandle がハンドル形状を切り替えられるよう、direction を Context で伝搬する。
const PanelGroupDirectionContext = createContext<'horizontal' | 'vertical'>('horizontal')

const ResizablePanelGroup = ({
  className,
  direction = 'horizontal',
  ...props
}: Omit<React.ComponentProps<typeof Group>, 'orientation'> & {
  direction?: 'horizontal' | 'vertical'
}) => (
  <PanelGroupDirectionContext.Provider value={direction}>
    <Group
      orientation={direction}
      className={cn('flex h-full w-full data-[panel-group-direction=vertical]:flex-col', className)}
      {...props}
    />
  </PanelGroupDirectionContext.Provider>
)

const ResizablePanel = Panel

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof Separator> & {
  withHandle?: boolean
}) => {
  const direction = useContext(PanelGroupDirectionContext)
  const isVertical = direction === 'vertical'

  return (
    <Separator
      className={cn(
        'relative flex items-center justify-center bg-border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1',
        isVertical
          ? 'h-px w-full after:absolute after:inset-x-0 after:top-1/2 after:h-1 after:-translate-y-1/2'
          : 'h-full w-px after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2',
        className,
      )}
      {...props}
    >
      {withHandle && (
        <div
          className={cn(
            'z-10 flex items-center justify-center rounded-sm border bg-border',
            isVertical ? 'h-3 w-4' : 'h-4 w-3',
          )}
        >
          {isVertical ? <GripHorizontal className="h-2.5 w-2.5" /> : <GripVertical className="h-2.5 w-2.5" />}
        </div>
      )}
    </Separator>
  )
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
