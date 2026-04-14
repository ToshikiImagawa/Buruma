import type { FileChangeStatus } from '@domain'
import { FileEdit, FilePlus, FileSymlink, FileX } from 'lucide-react'

export function FileChangeIcon({ status }: { status: FileChangeStatus }) {
  switch (status) {
    case 'added':
      return <FilePlus className="h-3.5 w-3.5 text-green-500" />
    case 'modified':
      return <FileEdit className="h-3.5 w-3.5 text-yellow-500" />
    case 'deleted':
      return <FileX className="h-3.5 w-3.5 text-red-500" />
    case 'renamed':
    case 'copied':
      return <FileSymlink className="h-3.5 w-3.5 text-blue-500" />
  }
}
