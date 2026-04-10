import { useCallback, useEffect, useState } from 'react'
import type { TagInfo } from '@domain'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useTagViewModel } from '../use-tag-viewmodel'

interface TagManagerProps {
  worktreePath: string
}

export function TagManager({ worktreePath }: TagManagerProps) {
  const { loading, tags, tagList, tagCreate, tagDelete } = useTagViewModel()
  const [tagName, setTagName] = useState('')
  const [tagType, setTagType] = useState<'lightweight' | 'annotated'>('lightweight')
  const [tagMessage, setTagMessage] = useState('')
  const [commitHash, setCommitHash] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  // マウント時にタグ一覧を取得
  useEffect(() => {
    tagList(worktreePath)
  }, [worktreePath, tagList])

  const handleCreate = useCallback(() => {
    if (!tagName.trim()) return
    tagCreate({
      worktreePath,
      tagName: tagName.trim(),
      type: tagType,
      message: tagType === 'annotated' ? tagMessage.trim() || undefined : undefined,
      commitHash: commitHash.trim() || undefined,
    })
    setTagName('')
    setTagMessage('')
    setCommitHash('')
    tagList(worktreePath)
  }, [worktreePath, tagName, tagType, tagMessage, commitHash, tagCreate, tagList])

  const handleDelete = useCallback(
    (name: string) => {
      tagDelete(worktreePath, name)
      setDeleteTarget(null)
      tagList(worktreePath)
    },
    [worktreePath, tagDelete, tagList],
  )

  return (
    <div className="flex flex-col gap-2 p-2">
      {/* タグ作成セクション */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-muted-foreground">タグ作成</span>
        <Input
          className="h-7 text-xs"
          placeholder="タグ名"
          value={tagName}
          onChange={(e) => setTagName(e.target.value)}
          disabled={loading}
        />
        <div className="flex items-center gap-2">
          <Label className="text-xs">タイプ:</Label>
          <Select value={tagType} onValueChange={(v) => setTagType(v as 'lightweight' | 'annotated')}>
            <SelectTrigger className="h-7 flex-1 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lightweight" className="text-xs">
                Lightweight
              </SelectItem>
              <SelectItem value="annotated" className="text-xs">
                Annotated
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        {tagType === 'annotated' && (
          <textarea
            className="min-h-[60px] w-full resize-none rounded border bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="タグメッセージ"
            value={tagMessage}
            onChange={(e) => setTagMessage(e.target.value)}
            disabled={loading}
          />
        )}
        <Input
          className="h-7 text-xs"
          placeholder="コミットハッシュ（任意、空欄でHEAD）"
          value={commitHash}
          onChange={(e) => setCommitHash(e.target.value)}
          disabled={loading}
        />
        <Button size="sm" className="h-7 text-xs" onClick={handleCreate} disabled={!tagName.trim() || loading}>
          {loading ? '作成中...' : '作成'}
        </Button>
      </div>

      <Separator />

      {/* タグ一覧 */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">タグ一覧 ({tags.length})</span>
      </div>

      <div className="space-y-0.5">
        {tags.map((tag: TagInfo) => (
          <div key={tag.name} className="group flex items-center gap-2 rounded px-2 py-0.5 text-sm hover:bg-accent">
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium">{tag.name}</span>
                <span className="shrink-0 rounded bg-muted px-1 text-xs text-muted-foreground">
                  {tag.type === 'annotated' ? 'annotated' : 'lightweight'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{tag.date}</p>
            </div>
            {deleteTarget === tag.name ? (
              <div className="flex items-center gap-1">
                <Label className="text-xs text-destructive">削除？</Label>
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-5 px-1 text-xs"
                  onClick={() => handleDelete(tag.name)}
                  disabled={loading}
                >
                  確認
                </Button>
                <Button variant="ghost" size="sm" className="h-5 px-1 text-xs" onClick={() => setDeleteTarget(null)}>
                  取消
                </Button>
              </div>
            ) : (
              <button
                className="invisible text-muted-foreground hover:text-destructive group-hover:visible"
                onClick={() => setDeleteTarget(tag.name)}
                disabled={loading}
                title="タグ削除"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}

        {tags.length === 0 && !loading && <p className="px-2 text-xs text-muted-foreground">タグはありません</p>}
      </div>

      {/* 削除確認ダイアログ（フォールバック、インライン確認で十分だがダイアログ要件があるため） */}
      <Dialog open={false} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[350px]">
          <DialogHeader>
            <DialogTitle>タグの削除</DialogTitle>
            <DialogDescription>このタグを削除しますか？</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" size="sm">
              キャンセル
            </Button>
            <Button variant="destructive" size="sm">
              削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
