import type { BranchList, TagInfo } from '@domain'
import { describe, expect, it } from 'vitest'
import { buildRefMap } from '../ref-map'

describe('buildRefMap', () => {
  it('branches が null でも空の Map を返す', () => {
    const result = buildRefMap(null, [])
    expect(result.size).toBe(0)
  })

  it('ローカルブランチを正しくマッピングする', () => {
    const branches: BranchList = {
      current: 'main',
      local: [
        { name: 'main', hash: 'aaa111', isHead: true },
        { name: 'feature', hash: 'bbb222', isHead: false },
      ],
      remote: [],
    }
    const result = buildRefMap(branches, [])

    const main = result.get('aaa111')
    expect(main).toBeDefined()
    expect(main!.localBranches).toEqual(['main'])
    expect(main!.isHead).toBe(true)

    const feature = result.get('bbb222')
    expect(feature).toBeDefined()
    expect(feature!.localBranches).toEqual(['feature'])
    expect(feature!.isHead).toBe(false)
  })

  it('リモートブランチを正しくマッピングする', () => {
    const branches: BranchList = {
      current: 'main',
      local: [],
      remote: [{ name: 'origin/main', hash: 'aaa111', isHead: false }],
    }
    const result = buildRefMap(branches, [])

    const ref = result.get('aaa111')
    expect(ref).toBeDefined()
    expect(ref!.remoteBranches).toEqual(['origin/main'])
    expect(ref!.localBranches).toEqual([])
  })

  it('タグを正しくマッピングする', () => {
    const tags: TagInfo[] = [
      { name: 'v1.0.0', hash: 'ccc333', date: '2026-01-01', type: 'annotated', message: 'Release' },
    ]
    const result = buildRefMap(null, tags)

    const ref = result.get('ccc333')
    expect(ref).toBeDefined()
    expect(ref!.tags).toEqual(['v1.0.0'])
  })

  it('同一ハッシュに複数の ref をマージする', () => {
    const branches: BranchList = {
      current: 'main',
      local: [{ name: 'main', hash: 'aaa111', isHead: true }],
      remote: [{ name: 'origin/main', hash: 'aaa111', isHead: false }],
    }
    const tags: TagInfo[] = [{ name: 'v1.0.0', hash: 'aaa111', date: '2026-01-01', type: 'lightweight' }]
    const result = buildRefMap(branches, tags)

    const ref = result.get('aaa111')
    expect(ref).toBeDefined()
    expect(ref!.localBranches).toEqual(['main'])
    expect(ref!.remoteBranches).toEqual(['origin/main'])
    expect(ref!.tags).toEqual(['v1.0.0'])
    expect(ref!.isHead).toBe(true)
  })

  it('ref がないハッシュは Map に含まれない', () => {
    const branches: BranchList = {
      current: 'main',
      local: [{ name: 'main', hash: 'aaa111', isHead: true }],
      remote: [],
    }
    const result = buildRefMap(branches, [])
    expect(result.has('zzz999')).toBe(false)
  })
})
