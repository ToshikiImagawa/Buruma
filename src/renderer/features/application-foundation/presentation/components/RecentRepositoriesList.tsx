import { Folder, Pin, Trash2 } from 'lucide-react'
import { Button } from '@/renderer/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/renderer/components/ui/card'
import { useRepositorySelectorViewModel } from '../use-repository-selector-viewmodel'

export function RecentRepositoriesList() {
  const { recentRepositories, openByPath, removeRecent, pin } = useRepositorySelectorViewModel()

  if (recentRepositories.length === 0) {
    return <div className="text-center text-muted-foreground py-8">最近開いたリポジトリはありません</div>
  }

  const sortedRepositories = [...recentRepositories].sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1
    }
    return new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime()
  })

  return (
    <div className="space-y-2">
      {sortedRepositories.map((repo) => (
        <Card key={repo.path} className="hover:bg-accent/50 transition-colors">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <button
                onClick={() => openByPath(repo.path)}
                className="flex items-center gap-2 flex-1 text-left hover:underline"
              >
                <Folder className="h-4 w-4" />
                <span>{repo.name}</span>
                {repo.pinned && <Pin className="h-3 w-3 text-primary" />}
              </button>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => pin(repo.path, !repo.pinned)}
                  aria-label={repo.pinned ? 'ピン解除' : 'ピン留め'}
                >
                  <Pin className={`h-4 w-4 ${repo.pinned ? 'fill-current text-primary' : ''}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => removeRecent(repo.path)}
                  aria-label="履歴から削除"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <p className="text-xs text-muted-foreground truncate">{repo.path}</p>
            <p className="text-xs text-muted-foreground mt-1">
              最終アクセス: {new Date(repo.lastAccessed).toLocaleString('ja-JP')}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
