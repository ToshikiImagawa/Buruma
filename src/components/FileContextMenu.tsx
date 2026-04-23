import type { OpenFileInDefaultAppUseCase, OpenInEditorUseCase } from '@/features/application-foundation/di-tokens'
import type { ReactNode } from 'react'
import { useResolve } from '@lib/di'
import { Code, ExternalLink } from 'lucide-react'
import { OpenFileInDefaultAppUseCaseToken, OpenInEditorUseCaseToken } from '@/features/application-foundation/di-tokens'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from './ui/context-menu'

interface FileContextMenuProps {
  filePath: string
  children: ReactNode
}

export function FileContextMenu({ filePath, children }: FileContextMenuProps) {
  const openInDefaultApp = useResolve<OpenFileInDefaultAppUseCase>(OpenFileInDefaultAppUseCaseToken)
  const openInEditor = useResolve<OpenInEditorUseCase>(OpenInEditorUseCaseToken)

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => openInDefaultApp.invoke(filePath)}>
          <ExternalLink className="mr-2 h-4 w-4" />
          デフォルトアプリで開く
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => openInEditor.invoke(filePath)}>
          <Code className="mr-2 h-4 w-4" />
          エディタで開く
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
