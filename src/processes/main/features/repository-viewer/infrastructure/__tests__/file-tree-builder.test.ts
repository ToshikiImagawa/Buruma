import { describe, expect, it } from 'vitest'
import { buildFileTree } from '../repositories/file-tree-builder'

describe('buildFileTree', () => {
  it('空の ls-tree 出力でルートのみ返す', () => {
    const result = buildFileTree('', new Map(), 'repo')

    expect(result.name).toBe('repo')
    expect(result.type).toBe('directory')
    expect(result.children).toEqual([])
  })

  it('フラットなファイルリストからツリーを構築する', () => {
    const lsTree = 'README.md\npackage.json\nsrc/main.ts'
    const result = buildFileTree(lsTree, new Map(), 'repo')

    // src/ (dir), README.md (file), package.json (file) = 3 children
    expect(result.children).toHaveLength(3)

    // ディレクトリ優先でソート
    expect(result.children![0].name).toBe('src')
    expect(result.children![0].type).toBe('directory')
    // ファイルは名前順ソート（localeCompare）
    const fileNames = result.children!.slice(1).map((c) => c.name)
    expect(fileNames).toContain('README.md')
    expect(fileNames).toContain('package.json')
  })

  it('深いネストのディレクトリを構築する', () => {
    const lsTree = 'src/main/features/app/index.ts'
    const result = buildFileTree(lsTree, new Map(), 'repo')

    const src = result.children![0]
    expect(src.name).toBe('src')
    expect(src.type).toBe('directory')

    const main = src.children![0]
    expect(main.name).toBe('main')
    expect(main.type).toBe('directory')

    const features = main.children![0]
    expect(features.name).toBe('features')

    const app = features.children![0]
    expect(app.name).toBe('app')

    const indexTs = app.children![0]
    expect(indexTs.name).toBe('index.ts')
    expect(indexTs.type).toBe('file')
    expect(indexTs.path).toBe('src/main/features/app/index.ts')
  })

  it('変更ファイルに changeStatus が付与される', () => {
    const lsTree = 'src/a.ts\nsrc/b.ts\nsrc/c.ts'
    const statusMap = new Map<string, import('@domain').FileChangeStatus>([
      ['src/a.ts', 'modified'],
      ['src/c.ts', 'added'],
    ])

    const result = buildFileTree(lsTree, statusMap, 'repo')
    const src = result.children![0]

    expect(src.children![0].name).toBe('a.ts')
    expect(src.children![0].changeStatus).toBe('modified')
    expect(src.children![1].name).toBe('b.ts')
    expect(src.children![1].changeStatus).toBeUndefined()
    expect(src.children![2].name).toBe('c.ts')
    expect(src.children![2].changeStatus).toBe('added')
  })

  it('ディレクトリ優先・名前順でソートされる', () => {
    const lsTree = 'z.txt\na.txt\nsrc/main.ts\nlib/util.ts'
    const result = buildFileTree(lsTree, new Map(), 'repo')

    // ディレクトリ: lib, src → ファイル: a.txt, z.txt
    expect(result.children![0].name).toBe('lib')
    expect(result.children![1].name).toBe('src')
    expect(result.children![2].name).toBe('a.txt')
    expect(result.children![3].name).toBe('z.txt')
  })

  // --- エッジケース ---

  it('深いネスト（10階層）のディレクトリを構築する', () => {
    const deepPath = Array.from({ length: 10 }, (_, i) => `d${i}`).join('/') + '/file.ts'
    let node = buildFileTree(deepPath, new Map(), 'repo')
    for (let i = 0; i < 10; i++) {
      expect(node.children).toHaveLength(1)
      node = node.children![0]
      expect(node.name).toBe(`d${i}`)
      expect(node.type).toBe('directory')
    }
    expect(node.children).toHaveLength(1)
    expect(node.children![0].name).toBe('file.ts')
    expect(node.children![0].type).toBe('file')
  })

  it('同名のファイルとディレクトリが異なるパスに存在する', () => {
    const lsTree = 'src/index.ts\nlib/index.ts'
    const result = buildFileTree(lsTree, new Map(), 'repo')

    expect(result.children).toHaveLength(2) // lib, src
    expect(result.children![0].name).toBe('lib')
    expect(result.children![1].name).toBe('src')
    expect(result.children![0].children![0].name).toBe('index.ts')
    expect(result.children![1].children![0].name).toBe('index.ts')
  })

  it('ルートに単一ファイルのみ', () => {
    const result = buildFileTree('README.md', new Map(), 'repo')
    expect(result.children).toHaveLength(1)
    expect(result.children![0].name).toBe('README.md')
    expect(result.children![0].type).toBe('file')
    expect(result.children![0].path).toBe('README.md')
  })
})
