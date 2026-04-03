import type { DiffHunk, DiffLine, FileChangeStatus, FileDiff } from '@domain'

/** git diff の raw 出力を FileDiff[] にパースする */
export function parseDiffOutput(raw: string): FileDiff[] {
  if (!raw.trim()) return []

  const diffs: FileDiff[] = []
  const fileSections = raw.split(/^diff --git /m).filter((s) => s.length > 0)

  for (const section of fileSections) {
    diffs.push(parseFileSection(section))
  }

  return diffs
}

function parseFileSection(section: string): FileDiff {
  const lines = section.split('\n')

  // ファイルパスを抽出: "a/path b/path"
  const headerMatch = lines[0]?.match(/^a\/(.+?) b\/(.+)$/)
  const oldPath = headerMatch?.[1] ?? ''
  const newPath = headerMatch?.[2] ?? ''

  // バイナリ判定
  const isBinary = lines.some((l) => l.startsWith('Binary files'))

  // ステータス判定
  const status = detectChangeStatus(lines)

  // リネーム判定
  const isRenamed = status === 'renamed'

  // ハンクのパース
  const hunks: DiffHunk[] = isBinary ? [] : parseHunks(lines)

  return {
    filePath: newPath,
    oldFilePath: isRenamed ? oldPath : undefined,
    status,
    hunks,
    isBinary,
  }
}

function detectChangeStatus(lines: string[]): FileChangeStatus {
  for (const line of lines) {
    if (line.startsWith('new file mode')) return 'added'
    if (line.startsWith('deleted file mode')) return 'deleted'
    if (line.startsWith('rename from') || line.startsWith('similarity index')) return 'renamed'
    if (line.startsWith('copy from')) return 'copied'
  }
  return 'modified'
}

function parseHunks(lines: string[]): DiffHunk[] {
  const hunks: DiffHunk[] = []
  let currentHunk: DiffHunk | null = null

  for (const line of lines) {
    const hunkMatch = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*)/)
    if (hunkMatch) {
      if (currentHunk) hunks.push(currentHunk)
      currentHunk = {
        oldStart: parseInt(hunkMatch[1], 10),
        oldLines: parseInt(hunkMatch[2] ?? '1', 10),
        newStart: parseInt(hunkMatch[3], 10),
        newLines: parseInt(hunkMatch[4] ?? '1', 10),
        header: line,
        lines: [],
      }
      continue
    }

    if (!currentHunk) continue

    if (line.startsWith('+')) {
      currentHunk.lines.push(createDiffLine('add', line.slice(1)))
    } else if (line.startsWith('-')) {
      currentHunk.lines.push(createDiffLine('delete', line.slice(1)))
    } else if (line.startsWith(' ') || line === '') {
      // diff 出力の終端空行はスキップ
      if (line === '' && currentHunk.lines.length > 0) continue
      currentHunk.lines.push(createDiffLine('context', line.startsWith(' ') ? line.slice(1) : line))
    }
  }

  if (currentHunk) hunks.push(currentHunk)

  // 行番号を再計算
  for (const hunk of hunks) {
    assignLineNumbers(hunk)
  }

  return hunks
}

function createDiffLine(type: DiffLine['type'], content: string): DiffLine {
  return { type, content }
}

function assignLineNumbers(hunk: DiffHunk): void {
  let oldLine = hunk.oldStart
  let newLine = hunk.newStart

  for (const line of hunk.lines) {
    switch (line.type) {
      case 'context':
        line.oldLineNumber = oldLine++
        line.newLineNumber = newLine++
        break
      case 'delete':
        line.oldLineNumber = oldLine++
        break
      case 'add':
        line.newLineNumber = newLine++
        break
    }
  }
}
