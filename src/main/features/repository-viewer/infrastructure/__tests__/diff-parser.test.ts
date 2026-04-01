import { describe, expect, it } from 'vitest'
import { parseDiffOutput } from '../repositories/diff-parser'

describe('parseDiffOutput', () => {
  it('空の diff 出力は空配列を返す', () => {
    expect(parseDiffOutput('')).toEqual([])
    expect(parseDiffOutput('  ')).toEqual([])
  })

  it('単一ファイルの変更をパースする', () => {
    const raw = `diff --git a/src/main.ts b/src/main.ts
index abc1234..def5678 100644
--- a/src/main.ts
+++ b/src/main.ts
@@ -1,3 +1,4 @@
 import { app } from 'electron'
+import { BrowserWindow } from 'electron'

 app.whenReady()
`

    const result = parseDiffOutput(raw)

    expect(result).toHaveLength(1)
    expect(result[0].filePath).toBe('src/main.ts')
    expect(result[0].status).toBe('modified')
    expect(result[0].isBinary).toBe(false)
    expect(result[0].hunks).toHaveLength(1)

    const hunk = result[0].hunks[0]
    expect(hunk.oldStart).toBe(1)
    expect(hunk.oldLines).toBe(3)
    expect(hunk.newStart).toBe(1)
    expect(hunk.newLines).toBe(4)

    // 行の検証
    const addLine = hunk.lines.find((l) => l.type === 'add')
    expect(addLine?.content).toBe("import { BrowserWindow } from 'electron'")
    expect(addLine?.newLineNumber).toBe(2)
    expect(addLine?.oldLineNumber).toBeUndefined()
  })

  it('新規ファイルをパースする', () => {
    const raw = `diff --git a/src/new-file.ts b/src/new-file.ts
new file mode 100644
index 0000000..abc1234
--- /dev/null
+++ b/src/new-file.ts
@@ -0,0 +1,2 @@
+export const foo = 1
+export const bar = 2
`

    const result = parseDiffOutput(raw)

    expect(result).toHaveLength(1)
    expect(result[0].filePath).toBe('src/new-file.ts')
    expect(result[0].status).toBe('added')
    expect(result[0].hunks[0].lines).toHaveLength(2)
    expect(result[0].hunks[0].lines[0].newLineNumber).toBe(1)
    expect(result[0].hunks[0].lines[1].newLineNumber).toBe(2)
  })

  it('削除ファイルをパースする', () => {
    const raw = `diff --git a/src/old-file.ts b/src/old-file.ts
deleted file mode 100644
index abc1234..0000000
--- a/src/old-file.ts
+++ /dev/null
@@ -1,2 +0,0 @@
-export const foo = 1
-export const bar = 2
`

    const result = parseDiffOutput(raw)

    expect(result).toHaveLength(1)
    expect(result[0].filePath).toBe('src/old-file.ts')
    expect(result[0].status).toBe('deleted')
    expect(result[0].hunks[0].lines).toHaveLength(2)
    expect(result[0].hunks[0].lines[0].oldLineNumber).toBe(1)
  })

  it('リネームファイルをパースする', () => {
    const raw = `diff --git a/src/old-name.ts b/src/new-name.ts
similarity index 100%
rename from src/old-name.ts
rename to src/new-name.ts
`

    const result = parseDiffOutput(raw)

    expect(result).toHaveLength(1)
    expect(result[0].filePath).toBe('src/new-name.ts')
    expect(result[0].oldFilePath).toBe('src/old-name.ts')
    expect(result[0].status).toBe('renamed')
  })

  it('バイナリファイルをパースする', () => {
    const raw = `diff --git a/image.png b/image.png
index abc1234..def5678 100644
Binary files a/image.png and b/image.png differ
`

    const result = parseDiffOutput(raw)

    expect(result).toHaveLength(1)
    expect(result[0].filePath).toBe('image.png')
    expect(result[0].isBinary).toBe(true)
    expect(result[0].hunks).toHaveLength(0)
  })

  it('複数ファイルの diff をパースする', () => {
    const raw = `diff --git a/src/a.ts b/src/a.ts
index abc1234..def5678 100644
--- a/src/a.ts
+++ b/src/a.ts
@@ -1,2 +1,3 @@
 line1
+added
 line2
diff --git a/src/b.ts b/src/b.ts
new file mode 100644
index 0000000..abc1234
--- /dev/null
+++ b/src/b.ts
@@ -0,0 +1 @@
+new content
`

    const result = parseDiffOutput(raw)

    expect(result).toHaveLength(2)
    expect(result[0].filePath).toBe('src/a.ts')
    expect(result[0].status).toBe('modified')
    expect(result[1].filePath).toBe('src/b.ts')
    expect(result[1].status).toBe('added')
  })

  it('複数ハンクをパースする', () => {
    const raw = `diff --git a/src/main.ts b/src/main.ts
index abc1234..def5678 100644
--- a/src/main.ts
+++ b/src/main.ts
@@ -1,3 +1,4 @@
 line1
+added1
 line2
 line3
@@ -10,3 +11,4 @@
 line10
+added2
 line11
 line12
`

    const result = parseDiffOutput(raw)

    expect(result).toHaveLength(1)
    expect(result[0].hunks).toHaveLength(2)
    expect(result[0].hunks[0].oldStart).toBe(1)
    expect(result[0].hunks[1].oldStart).toBe(10)
  })

  it('行番号が正しく計算される', () => {
    const raw = `diff --git a/src/main.ts b/src/main.ts
index abc1234..def5678 100644
--- a/src/main.ts
+++ b/src/main.ts
@@ -5,4 +5,5 @@
 context1
-deleted
+added1
+added2
 context2
`

    const result = parseDiffOutput(raw)
    const lines = result[0].hunks[0].lines

    // context1: old=5, new=5
    expect(lines[0]).toMatchObject({ type: 'context', oldLineNumber: 5, newLineNumber: 5 })
    // deleted: old=6
    expect(lines[1].type).toBe('delete')
    expect(lines[1].oldLineNumber).toBe(6)
    expect(lines[1].newLineNumber).toBeUndefined()
    // added1: new=6
    expect(lines[2].type).toBe('add')
    expect(lines[2].oldLineNumber).toBeUndefined()
    expect(lines[2].newLineNumber).toBe(6)
    // added2: new=7
    expect(lines[3].type).toBe('add')
    expect(lines[3].oldLineNumber).toBeUndefined()
    expect(lines[3].newLineNumber).toBe(7)
    // context2: old=7, new=8
    expect(lines[4]).toMatchObject({ type: 'context', oldLineNumber: 7, newLineNumber: 8 })
  })
})
