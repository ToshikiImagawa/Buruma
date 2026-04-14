import { useCallback, useEffect, useState } from 'react'
import type { ThreeWayContent } from '@domain'
import Editor, { DiffEditor } from '@monaco-editor/react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ThreeWayMergeViewProps {
  threeWayContent: ThreeWayContent | null
  onResolve: (content: string) => void
}

export function ThreeWayMergeView({ threeWayContent, onResolve }: ThreeWayMergeViewProps) {
  const [resultContent, setResultContent] = useState('')

  // コンテンツが変更されたら結果エディタを更新
  useEffect(() => {
    if (threeWayContent) {
      setResultContent(threeWayContent.merged)
    }
  }, [threeWayContent])

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      setResultContent(value)
    }
  }, [])

  const handleApplyResolution = useCallback(() => {
    onResolve(resultContent)
  }, [onResolve, resultContent])

  if (!threeWayContent) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        コンテンツを読み込み中...
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <Tabs defaultValue="diff" className="flex flex-1 flex-col">
        <TabsList className="w-fit">
          <TabsTrigger value="base" className="text-xs">
            Base
          </TabsTrigger>
          <TabsTrigger value="diff" className="text-xs">
            Ours vs Theirs (Diff)
          </TabsTrigger>
          <TabsTrigger value="result" className="text-xs">
            Result
          </TabsTrigger>
        </TabsList>

        <TabsContent value="base" className="flex-1">
          <Editor
            height="100%"
            defaultLanguage="plaintext"
            value={threeWayContent.base}
            theme="vs-dark"
            options={{
              readOnly: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 13,
            }}
          />
        </TabsContent>

        <TabsContent value="diff" className="flex-1">
          <DiffEditor
            height="100%"
            original={threeWayContent.ours}
            modified={threeWayContent.theirs}
            originalLanguage="plaintext"
            modifiedLanguage="plaintext"
            theme="vs-dark"
            options={{
              readOnly: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 13,
              renderSideBySide: true,
            }}
          />
        </TabsContent>

        <TabsContent value="result" className="flex-1">
          <Editor
            height="100%"
            defaultLanguage="plaintext"
            value={resultContent}
            theme="vs-dark"
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 13,
            }}
          />
        </TabsContent>
      </Tabs>

      <div className="flex justify-end p-2">
        <Button size="sm" onClick={handleApplyResolution}>
          Apply Resolution
        </Button>
      </div>
    </div>
  )
}
