import { useRef, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSymlinkSettingsViewModel } from '../use-symlink-settings-viewmodel'

interface SymlinkSettingsSectionProps {
  repoPath: string | null
}

export function SymlinkSettingsSection({ repoPath }: SymlinkSettingsSectionProps) {
  const { config, addPattern, removePattern } = useSymlinkSettingsViewModel(repoPath)
  const [newPattern, setNewPattern] = useState('')
  const composingRef = useRef(false)

  const handleAdd = () => {
    if (!newPattern.trim()) return
    addPattern(newPattern.trim())
    setNewPattern('')
  }

  if (!repoPath) return null

  return (
    <div>
      <Label>シンボリックリンク対象パターン</Label>
      <p className="text-xs text-muted-foreground mt-1">
        ワークツリー作成時にメインワークツリーからシンボリックリンクを作成する glob パターン
      </p>
      <div className="mt-2 space-y-2">
        {config?.patterns.map((pattern, i) => (
          <div key={pattern} className="flex items-center gap-2">
            <code className="flex-1 rounded bg-muted px-2 py-1 text-sm">{pattern}</code>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removePattern(i)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <Input
            placeholder="例: node_modules"
            value={newPattern}
            onChange={(e) => setNewPattern(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !composingRef.current && handleAdd()}
            onCompositionStart={() => {
              composingRef.current = true
            }}
            onCompositionEnd={() =>
              requestAnimationFrame(() => {
                composingRef.current = false
              })
            }
            className="flex-1"
          />
          <Button size="sm" onClick={handleAdd} disabled={!newPattern.trim()}>
            追加
          </Button>
        </div>
      </div>
      {config && (
        <p className="text-xs text-muted-foreground mt-2">
          設定ソース: {config.source === 'repo' ? 'リポジトリローカル (.buruma/symlink.json)' : 'アプリデフォルト'}
        </p>
      )}
    </div>
  )
}
