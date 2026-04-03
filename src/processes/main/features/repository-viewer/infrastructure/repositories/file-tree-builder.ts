import type { FileChangeStatus, FileTreeNode } from '@domain'

/** git ls-tree の出力と status 情報からファイルツリーを構築する */
export function buildFileTree(
  lsTreeOutput: string,
  statusMap: Map<string, FileChangeStatus>,
  rootName: string,
): FileTreeNode {
  const root: FileTreeNode = {
    name: rootName,
    path: '',
    type: 'directory',
    children: [],
  }

  const filePaths = lsTreeOutput
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  for (const filePath of filePaths) {
    insertPath(root, filePath, statusMap.get(filePath))
  }

  // ディレクトリを再帰的にソート（ディレクトリ優先、名前順）
  sortTree(root)

  return root
}

function insertPath(root: FileTreeNode, filePath: string, changeStatus?: FileChangeStatus): void {
  const parts = filePath.split('/')
  let current = root

  for (let i = 0; i < parts.length; i++) {
    const name = parts[i]
    const isFile = i === parts.length - 1
    const currentPath = parts.slice(0, i + 1).join('/')

    if (!current.children) current.children = []

    let existing = current.children.find((c) => c.name === name)
    if (!existing) {
      existing = {
        name,
        path: currentPath,
        type: isFile ? 'file' : 'directory',
        children: isFile ? undefined : [],
        changeStatus: isFile ? changeStatus : undefined,
      }
      current.children.push(existing)
    }

    if (!isFile) {
      current = existing
    }
  }
}

function sortTree(node: FileTreeNode): void {
  if (!node.children) return

  node.children.sort((a, b) => {
    // ディレクトリ優先
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  for (const child of node.children) {
    sortTree(child)
  }
}
