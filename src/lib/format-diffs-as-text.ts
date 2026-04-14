import type { FileDiff } from '@domain'

export function formatDiffsAsText(diffs: FileDiff[]): string {
  return diffs
    .map((file) => {
      const header = `--- ${file.oldFilePath ?? file.filePath}\n+++ ${file.filePath}`
      const hunks = file.hunks
        .map((hunk) => {
          const lines = hunk.lines.map((line) => {
            switch (line.type) {
              case 'add':
                return `+${line.content}`
              case 'delete':
                return `-${line.content}`
              default:
                return ` ${line.content}`
            }
          })
          return `${hunk.header}\n${lines.join('\n')}`
        })
        .join('\n')
      return `${header}\n${hunks}`
    })
    .join('\n')
}
