import { useCallback, useEffect, useState } from 'react'
import type { FileTreeNode } from '@shared/domain'
import { ChevronDown, ChevronRight, File, Folder } from 'lucide-react'
import { useFileTreeViewModel } from '../use-file-tree-viewmodel'

interface FileTreeProps {
  worktreePath: string
  onFileSelect: (filePath: string) => void
}

function TreeNode({
  node,
  depth,
  onFileSelect,
  expandedPaths,
  toggleExpand,
}: {
  node: FileTreeNode
  depth: number
  onFileSelect: (path: string) => void
  expandedPaths: Set<string>
  toggleExpand: (path: string) => void
}) {
  const isExpanded = expandedPaths.has(node.path)
  const paddingLeft = `${depth * 16 + 4}px`

  if (node.type === 'directory') {
    return (
      <>
        <button
          className="flex w-full items-center gap-1 rounded px-1 py-0.5 text-sm hover:bg-accent"
          style={{ paddingLeft }}
          onClick={() => toggleExpand(node.path)}
        >
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
          <Folder className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{node.name}</span>
        </button>
        {isExpanded &&
          node.children?.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              onFileSelect={onFileSelect}
              expandedPaths={expandedPaths}
              toggleExpand={toggleExpand}
            />
          ))}
      </>
    )
  }

  let statusClass = ''
  if (node.changeStatus === 'added') statusClass = 'text-green-500'
  else if (node.changeStatus === 'modified') statusClass = 'text-yellow-500'
  else if (node.changeStatus === 'deleted') statusClass = 'text-red-500'

  return (
    <button
      className={`flex w-full items-center gap-1 rounded px-1 py-0.5 text-sm hover:bg-accent ${statusClass}`}
      style={{ paddingLeft: `${depth * 16 + 20}px` }}
      onClick={() => onFileSelect(node.path)}
    >
      <File className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{node.name}</span>
    </button>
  )
}

export function FileTree({ worktreePath, onFileSelect }: FileTreeProps) {
  const { tree, loading, loadTree } = useFileTreeViewModel()
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadTree(worktreePath)
  }, [worktreePath, loadTree])

  const toggleExpand = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }, [])

  if (loading && !tree) {
    return <div className="p-4 text-sm text-muted-foreground">読み込み中...</div>
  }

  if (!tree || !tree.children || tree.children.length === 0) {
    return <div className="p-4 text-sm text-muted-foreground">ファイルがありません</div>
  }

  return (
    <div className="flex-1 overflow-auto p-1">
      {tree.children.map((child) => (
        <TreeNode
          key={child.path}
          node={child}
          depth={0}
          onFileSelect={onFileSelect}
          expandedPaths={expandedPaths}
          toggleExpand={toggleExpand}
        />
      ))}
    </div>
  )
}
