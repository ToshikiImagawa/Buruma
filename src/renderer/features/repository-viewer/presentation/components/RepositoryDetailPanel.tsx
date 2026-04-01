import { useCallback, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { Separator } from '@renderer/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import { useWorktreeDetailViewModel } from '@renderer/features/worktree-management/presentation/use-worktree-detail-viewmodel'
import { Circle, FileText, FolderOpen, GitBranch, GitCommit, Info } from 'lucide-react'
import { BranchList } from './BranchList'
import { CommitDetailView } from './CommitDetailView'
import { CommitLog } from './CommitLog'
import { DiffView } from './DiffView'
import { FileTree } from './FileTree'
import { StatusView } from './StatusView'

export function RepositoryDetailPanel() {
  const { selectedWorktree } = useWorktreeDetailViewModel()
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null)
  const [selectedFileStaged, setSelectedFileStaged] = useState(false)
  const [selectedCommitHash, setSelectedCommitHash] = useState<string | null>(null)
  const [commitFilePath, setCommitFilePath] = useState<string | undefined>(undefined)

  const handleStatusFileSelect = useCallback((filePath: string, staged: boolean) => {
    setSelectedFilePath(filePath)
    setSelectedFileStaged(staged)
    setSelectedCommitHash(null)
    setCommitFilePath(undefined)
  }, [])

  const handleCommitSelect = useCallback((hash: string) => {
    setSelectedCommitHash(hash)
    setSelectedFilePath(null)
    setCommitFilePath(undefined)
  }, [])

  const handleCommitFileSelect = useCallback((filePath: string) => {
    setCommitFilePath(filePath)
  }, [])

  const handleTreeFileSelect = useCallback((filePath: string) => {
    setSelectedFilePath(filePath)
    setSelectedFileStaged(false)
    setSelectedCommitHash(null)
    setCommitFilePath(undefined)
  }, [])

  if (!selectedWorktree) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">ワークツリーを選択してください</p>
      </div>
    )
  }

  const displayName = selectedWorktree.path.split('/').pop() ?? selectedWorktree.path

  return (
    <Tabs defaultValue="info" className="flex h-full flex-col">
      <div className="border-b px-3">
        <TabsList className="h-9">
          <TabsTrigger value="info" className="gap-1 text-xs">
            <Info className="h-3.5 w-3.5" />
            情報
          </TabsTrigger>
          <TabsTrigger value="status" className="gap-1 text-xs">
            <FileText className="h-3.5 w-3.5" />
            ステータス
          </TabsTrigger>
          <TabsTrigger value="commits" className="gap-1 text-xs">
            <GitCommit className="h-3.5 w-3.5" />
            コミット
          </TabsTrigger>
          <TabsTrigger value="branches" className="gap-1 text-xs">
            <GitBranch className="h-3.5 w-3.5" />
            ブランチ
          </TabsTrigger>
          <TabsTrigger value="files" className="gap-1 text-xs">
            <FolderOpen className="h-3.5 w-3.5" />
            ファイル
          </TabsTrigger>
        </TabsList>
      </div>

      <div className="flex-1 overflow-hidden">
        <TabsContent value="info" className="mt-0 h-full overflow-auto">
          <InfoTab displayName={displayName} worktree={selectedWorktree} />
        </TabsContent>

        <TabsContent value="status" className="mt-0 h-full">
          <div className="flex h-full">
            <div className="w-1/3 min-w-[200px] border-r overflow-auto">
              <StatusView worktreePath={selectedWorktree.path} onFileSelect={handleStatusFileSelect} />
            </div>
            <div className="flex-1 overflow-hidden">
              {selectedFilePath && !selectedCommitHash ? (
                <DiffView
                  worktreePath={selectedWorktree.path}
                  filePath={selectedFilePath}
                  staged={selectedFileStaged}
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-muted-foreground">ファイルを選択して差分を表示</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="commits" className="mt-0 h-full">
          <div className="flex h-full">
            <div className="w-1/3 min-w-[200px] border-r overflow-auto">
              <CommitLog worktreePath={selectedWorktree.path} onCommitSelect={handleCommitSelect} />
            </div>
            <div className="flex-1 overflow-hidden">
              {selectedCommitHash ? (
                <div className="flex h-full flex-col">
                  <div className="shrink-0 max-h-[40%] overflow-auto border-b">
                    <CommitDetailView
                      worktreePath={selectedWorktree.path}
                      commitHash={selectedCommitHash}
                      onFileSelect={handleCommitFileSelect}
                    />
                  </div>
                  {commitFilePath ? (
                    <div className="flex-1 min-h-0">
                      <DiffView
                        worktreePath={selectedWorktree.path}
                        filePath={commitFilePath}
                        commitHash={selectedCommitHash}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-1 items-center justify-center">
                      <p className="text-sm text-muted-foreground">ファイルを選択して差分を表示</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-muted-foreground">コミットを選択して詳細を表示</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="branches" className="mt-0 h-full">
          <BranchList worktreePath={selectedWorktree.path} />
        </TabsContent>

        <TabsContent value="files" className="mt-0 h-full">
          <div className="flex h-full">
            <div className="w-1/3 min-w-[200px] border-r overflow-auto">
              <FileTree worktreePath={selectedWorktree.path} onFileSelect={handleTreeFileSelect} />
            </div>
            <div className="flex-1 overflow-hidden">
              {selectedFilePath && !selectedCommitHash ? (
                <DiffView worktreePath={selectedWorktree.path} filePath={selectedFilePath} />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-muted-foreground">ファイルを選択して差分を表示</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </div>
    </Tabs>
  )
}

function InfoTab({
  displayName,
  worktree,
}: {
  displayName: string
  worktree: {
    path: string
    branch: string | null
    head: string
    headMessage: string
    isDirty: boolean
    isMain: boolean
  }
}) {
  return (
    <div className="space-y-4 p-4">
      <div>
        <h2 className="text-lg font-semibold">{displayName}</h2>
        <p className="text-sm text-muted-foreground">{worktree.path}</p>
      </div>
      <Separator />
      <div className="grid gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <GitBranch className="h-4 w-4" />
              ブランチ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">
              {worktree.branch ?? <span className="text-muted-foreground">detached HEAD</span>}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <GitCommit className="h-4 w-4" />
              HEAD
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-sm">{worktree.head}</p>
            <p className="mt-1 text-xs text-muted-foreground">{worktree.headMessage}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <FolderOpen className="h-4 w-4" />
              ステータス
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {worktree.isDirty ? (
                <>
                  <Circle className="h-2.5 w-2.5 fill-orange-500 text-orange-500" />
                  <span className="text-sm">未コミットの変更あり</span>
                </>
              ) : (
                <>
                  <Circle className="h-2.5 w-2.5 fill-green-500 text-green-500" />
                  <span className="text-sm">クリーン</span>
                </>
              )}
            </div>
            {worktree.isMain && <p className="mt-2 text-xs text-muted-foreground">メインワークツリー</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
