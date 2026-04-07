import { useCallback, useEffect, useRef, useState } from 'react'
import type { FileDiff } from '@domain'
import type { PanelImperativeHandle } from 'react-resizable-panels'
import type { CommitLogHandle } from './CommitLog'
import { Button } from '@renderer/components/ui/button'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@renderer/components/ui/resizable'
import { Separator } from '@renderer/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@renderer/components/ui/tooltip'
import { CherryPickDialog } from '@renderer/features/advanced-git-operations/presentation/components/cherry-pick-dialog'
import { ConflictResolver } from '@renderer/features/advanced-git-operations/presentation/components/conflict-resolver'
import { StashManager } from '@renderer/features/advanced-git-operations/presentation/components/stash-manager'
import { TagManager } from '@renderer/features/advanced-git-operations/presentation/components/tag-manager'
// cross-feature 参照: タグデータを props 経由で CommitLog に渡すために advanced-git-operations の ViewModel を使用。
// 将来的に repository-viewer 側にタグ取得を統合する場合はこの import を置き換える。
import { useTagViewModel } from '@renderer/features/advanced-git-operations/presentation/use-tag-viewmodel'
import { BranchOperations } from '@renderer/features/basic-git-operations/presentation/components/branch-operations'
import { CommitForm } from '@renderer/features/basic-git-operations/presentation/components/commit-form'
import { PushPullButtons } from '@renderer/features/basic-git-operations/presentation/components/push-pull-buttons'
import { StagingArea } from '@renderer/features/basic-git-operations/presentation/components/staging-area'
import { useBranchOpsViewModel } from '@renderer/features/basic-git-operations/presentation/use-branch-ops-viewmodel'
import { ClaudeSessionPanel } from '@renderer/features/claude-code-integration/presentation/components'
import { useWorktreeDetailViewModel } from '@renderer/features/worktree-management/presentation/use-worktree-detail-viewmodel'
import {
  Archive,
  Bookmark,
  Bot,
  FileText,
  FolderOpen,
  GitCommit,
  GitMerge,
  GitPullRequest,
  List,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  SplitSquareVertical,
  Tag,
} from 'lucide-react'
import { useBranchListViewModel } from '../use-branch-list-viewmodel'
import { useDiffViewMode } from '../use-diff-view-mode'
import { useStatusViewModel } from '../use-status-viewmodel'
import { CommitDetailView } from './CommitDetailView'
import { CommitLog } from './CommitLog'
import { DiffView } from './DiffView'
import { FileTree } from './FileTree'
import { MultiFileDiffPanel } from './MultiFileDiffPanel'

export function RepositoryDetailPanel() {
  const { selectedWorktree } = useWorktreeDetailViewModel()
  const { status, loadStatus } = useStatusViewModel()
  const { branches, loadBranches } = useBranchListViewModel()
  const { tags, tagList } = useTagViewModel()
  const { resetToCommit } = useBranchOpsViewModel()

  const commitLogRef = useRef<CommitLogHandle>(null)
  const branchPanelRef = useRef<PanelImperativeHandle>(null)
  const [branchPanelCollapsed, setBranchPanelCollapsed] = useState(false)

  // Status tab state
  const [statusFilePath, setStatusFilePath] = useState<string | null>(null)
  const [statusFileStaged, setStatusFileStaged] = useState(false)
  const { mode: statusViewMode, setMode: setStatusViewMode } = useDiffViewMode('hunk')
  const [allDiffs, setAllDiffs] = useState<FileDiff[]>([])
  const [statusSelectedFiles, setStatusSelectedFiles] = useState<Set<string>>(new Set())

  // Commits tab state
  const [selectedCommitHash, setSelectedCommitHash] = useState<string | null>(null)
  const [commitFilePath, setCommitFilePath] = useState<string | undefined>(undefined)

  // Files tab state
  const [treeFilePath, setTreeFilePath] = useState<string | null>(null)

  const [conflictOperation, setConflictOperation] = useState<'merge' | 'rebase' | 'cherry-pick' | null>(null)
  const [cherryPickOpen, setCherryPickOpen] = useState(false)
  const [cherryPickHash, setCherryPickHash] = useState('')

  const worktreePath = selectedWorktree?.path ?? ''

  const loadAllDiffs = useCallback(async () => {
    if (!worktreePath) return
    const [unstagedResult, stagedResult] = await Promise.all([
      window.electronAPI.git.diff({ worktreePath }),
      window.electronAPI.git.diffStaged({ worktreePath }),
    ])
    const diffs: FileDiff[] = []
    if (unstagedResult.success) diffs.push(...unstagedResult.data)
    if (stagedResult.success) diffs.push(...stagedResult.data)
    setAllDiffs(diffs)
  }, [worktreePath])

  useEffect(() => {
    if (worktreePath) {
      loadStatus(worktreePath)
      loadBranches(worktreePath)
      tagList(worktreePath)
    }
  }, [worktreePath, loadStatus, loadBranches, tagList])

  useEffect(() => {
    if (statusViewMode === 'hunk' && worktreePath) {
      loadAllDiffs()
    }
  }, [statusViewMode, worktreePath, loadAllDiffs])

  const handleRefresh = useCallback(() => {
    if (worktreePath) {
      loadStatus(worktreePath)
      loadBranches(worktreePath)
      tagList(worktreePath)
      commitLogRef.current?.refresh()
      if (statusViewMode === 'hunk') {
        loadAllDiffs()
      }
    }
  }, [worktreePath, loadStatus, loadBranches, tagList, statusViewMode, loadAllDiffs])

  const handleStatusFileSelect = useCallback((filePath: string, staged: boolean) => {
    setStatusFilePath(filePath)
    setStatusFileStaged(staged)
  }, [])

  const handleCommitSelect = useCallback((hash: string) => {
    setSelectedCommitHash(hash)
    setCommitFilePath(undefined)
  }, [])

  const handleCommitFileSelect = useCallback((filePath: string) => {
    setCommitFilePath(filePath)
  }, [])

  const handleConflict = useCallback((operationType: 'merge' | 'rebase' | 'cherry-pick') => {
    setConflictOperation(operationType)
  }, [])

  const handleConflictDismiss = useCallback(() => {
    setConflictOperation(null)
    handleRefresh()
  }, [handleRefresh])

  const handleTreeFileSelect = useCallback((filePath: string) => {
    setTreeFilePath(filePath)
  }, [])

  const handleBranchClick = useCallback((hash: string) => {
    commitLogRef.current?.scrollToHash(hash)
  }, [])

  if (!selectedWorktree) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">ワークツリーを選択してください</p>
      </div>
    )
  }

  if (conflictOperation) {
    return (
      <ConflictResolver
        worktreePath={worktreePath}
        operationType={conflictOperation}
        onComplete={handleConflictDismiss}
        onAbort={handleConflictDismiss}
      />
    )
  }

  return (
    <Tabs defaultValue="status" className="flex h-full flex-col">
      <div className="border-b px-3">
        <TabsList className="h-9">
          <TabsTrigger value="status" className="gap-1 text-xs">
            <FileText className="h-3.5 w-3.5" />
            ステータス
          </TabsTrigger>
          <TabsTrigger value="commits" className="gap-1 text-xs">
            <GitCommit className="h-3.5 w-3.5" />
            コミット
          </TabsTrigger>
          <TabsTrigger value="files" className="gap-1 text-xs">
            <FolderOpen className="h-3.5 w-3.5" />
            ファイル
          </TabsTrigger>
          <TabsTrigger value="refs" className="gap-1 text-xs">
            <Bookmark className="h-3.5 w-3.5" />
            リファレンス
          </TabsTrigger>
          <TabsTrigger value="claude" className="gap-1 text-xs">
            <Bot className="h-3.5 w-3.5" />
            Claude
          </TabsTrigger>
        </TabsList>
      </div>

      <div className="flex-1 overflow-hidden">
        <TabsContent value="status" className="mt-0 h-full">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={33} minSize={10}>
              <div className="h-full overflow-auto">
                <StagingArea
                  worktreePath={selectedWorktree.path}
                  staged={status?.staged ?? []}
                  unstaged={status?.unstaged ?? []}
                  untracked={status?.untracked ?? []}
                  onRefresh={handleRefresh}
                  onFileSelect={handleStatusFileSelect}
                  onSelectionChange={setStatusSelectedFiles}
                />
                <Separator />
                <CommitForm
                  worktreePath={selectedWorktree.path}
                  hasStagedFiles={(status?.staged.length ?? 0) > 0}
                  onCommitted={handleRefresh}
                />
                <Separator />
                <div className="p-2">
                  <PushPullButtons
                    worktreePath={selectedWorktree.path}
                    currentBranch={branches?.local.find((b) => b.isHead)}
                    onRefresh={handleRefresh}
                  />
                </div>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={67} minSize={10}>
              <div className="flex h-full flex-col overflow-hidden">
                <TooltipProvider delayDuration={300}>
                  <div className="flex shrink-0 items-center gap-1 border-b px-2 py-1">
                    <span className="flex-1 text-xs text-muted-foreground">差分表示</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={statusViewMode === 'hunk' ? 'secondary' : 'ghost'}
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => setStatusViewMode('hunk')}
                        >
                          <List className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>ハンク表示</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={statusViewMode === 'monaco' ? 'secondary' : 'ghost'}
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => setStatusViewMode('monaco')}
                        >
                          <SplitSquareVertical className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Monaco 表示</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>
                <div className="min-h-0 flex-1">
                  {statusViewMode === 'hunk' ? (
                    <MultiFileDiffPanel
                      worktreePath={selectedWorktree.path}
                      diffs={
                        statusSelectedFiles.size > 0
                          ? allDiffs.filter((d) => statusSelectedFiles.has(d.filePath))
                          : allDiffs
                      }
                    />
                  ) : statusFilePath ? (
                    <DiffView
                      worktreePath={selectedWorktree.path}
                      filePath={statusFilePath}
                      staged={statusFileStaged}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-sm text-muted-foreground">ファイルを選択して差分を表示</p>
                    </div>
                  )}
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </TabsContent>

        <TabsContent value="commits" className="mt-0 h-full">
          <TooltipProvider delayDuration={300}>
            <div className="flex h-full">
              {/* 常時表示の縦アイコンバー */}
              <div className="flex shrink-0 flex-col items-center gap-1 border-r px-1 py-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() =>
                        branchPanelCollapsed ? branchPanelRef.current?.expand() : branchPanelRef.current?.collapse()
                      }
                    >
                      {branchPanelCollapsed ? (
                        <PanelLeftOpen className="h-4 w-4" />
                      ) : (
                        <PanelLeftClose className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {branchPanelCollapsed ? 'ブランチパネルを開く' : 'ブランチパネルを閉じる'}
                  </TooltipContent>
                </Tooltip>
                <Separator className="my-0.5" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => branchPanelRef.current?.expand()}
                    >
                      <GitMerge className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">マージ（ブランチパネルを表示）</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => branchPanelRef.current?.expand()}
                    >
                      <GitPullRequest className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">リベース（ブランチパネルを表示）</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => branchPanelRef.current?.expand()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">新規ブランチ（ブランチパネルを表示）</TooltipContent>
                </Tooltip>
              </div>
              {/* メインコンテンツ */}
              <ResizablePanelGroup direction="horizontal" className="flex-1">
                <ResizablePanel
                  defaultSize={20}
                  minSize={10}
                  collapsible={true}
                  collapsedSize={0}
                  panelRef={branchPanelRef}
                  onResize={(size) => setBranchPanelCollapsed(size.asPercentage === 0)}
                >
                  <div className="h-full overflow-auto">
                    <BranchOperations
                      worktreePath={selectedWorktree.path}
                      currentBranch={selectedWorktree.branch ?? ''}
                      localBranches={branches?.local ?? []}
                      remoteBranches={branches?.remote ?? []}
                      hasDirtyFiles={selectedWorktree.isDirty}
                      onRefresh={handleRefresh}
                      onConflict={handleConflict}
                      onBranchClick={handleBranchClick}
                    />
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={30} minSize={10}>
                  <div className="flex h-full flex-col">
                    <div className="flex items-center border-b px-2 py-1">
                      <span className="text-xs font-semibold text-muted-foreground">コミット履歴</span>
                    </div>
                    <div className="flex-1 overflow-auto">
                      <CommitLog
                        ref={commitLogRef}
                        worktreePath={selectedWorktree.path}
                        onCommitSelect={handleCommitSelect}
                        onCherryPick={(hash) => {
                          setCherryPickHash(hash)
                          setCherryPickOpen(true)
                        }}
                        onReset={(hash, mode) => {
                          if (mode === 'hard') {
                            const confirmed = window.confirm(
                              'Hard リセットを実行すると、未コミッ��の変更が全て失われます。実行しますか？',
                            )
                            if (!confirmed) return
                          }
                          resetToCommit(selectedWorktree.path, hash, mode)
                          handleRefresh()
                        }}
                        branches={branches}
                        tags={tags}
                      />
                    </div>
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={50} minSize={10}>
                  <div className="h-full overflow-hidden">
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
                </ResizablePanel>
              </ResizablePanelGroup>
            </div>
          </TooltipProvider>
        </TabsContent>

        <TabsContent value="files" className="mt-0 h-full">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={33} minSize={10}>
              <div className="h-full overflow-auto">
                <FileTree worktreePath={selectedWorktree.path} onFileSelect={handleTreeFileSelect} />
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={67} minSize={10}>
              <div className="h-full overflow-hidden">
                {treeFilePath ? (
                  <DiffView worktreePath={selectedWorktree.path} filePath={treeFilePath} />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-sm text-muted-foreground">ファイルを選択して差分を表示</p>
                  </div>
                )}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </TabsContent>

        <TabsContent value="refs" className="mt-0 h-full">
          <RefsTab worktreePath={selectedWorktree.path} />
        </TabsContent>

        <TabsContent value="claude" className="mt-0 h-full">
          <ClaudeSessionPanel worktreePath={selectedWorktree.path} onCommandCompleted={handleRefresh} />
        </TabsContent>
      </div>

      <CherryPickDialog
        worktreePath={selectedWorktree.path}
        open={cherryPickOpen}
        onOpenChange={(open) => {
          setCherryPickOpen(open)
          if (!open) setCherryPickHash('')
        }}
        onConflict={() => handleConflict('cherry-pick')}
        defaultCommitHash={cherryPickHash}
      />
    </Tabs>
  )
}

function RefsTab({ worktreePath }: { worktreePath: string }) {
  const [view, setView] = useState<'stash' | 'tags'>('stash')

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1 border-b px-3 py-1">
        <Button
          variant={view === 'stash' ? 'secondary' : 'ghost'}
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={() => setView('stash')}
        >
          <Archive className="h-3.5 w-3.5" />
          スタッシュ
        </Button>
        <Button
          variant={view === 'tags' ? 'secondary' : 'ghost'}
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={() => setView('tags')}
        >
          <Tag className="h-3.5 w-3.5" />
          タグ
        </Button>
      </div>
      <div className="flex-1 overflow-auto">
        {view === 'stash' ? <StashManager worktreePath={worktreePath} /> : <TagManager worktreePath={worktreePath} />}
      </div>
    </div>
  )
}
