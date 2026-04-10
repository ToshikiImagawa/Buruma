import { describe, expect, it } from 'vitest'
import { computeGraphLayout } from '../compute-graph-layout'

describe('computeGraphLayout', () => {
  it('空配列で空のレイアウトを返す', () => {
    const result = computeGraphLayout([])
    expect(result.nodes).toEqual([])
    expect(result.maxLane).toBe(0)
  })

  it('線形コミットはレーン 0 に収まる', () => {
    const commits = [
      { hash: 'c3', parents: ['c2'] },
      { hash: 'c2', parents: ['c1'] },
      { hash: 'c1', parents: [] },
    ]
    const result = computeGraphLayout(commits)

    expect(result.nodes.map((n) => n.lane)).toEqual([0, 0, 0])
    expect(result.maxLane).toBe(0)
  })

  it('ブランチでレーンが分岐する', () => {
    const commits = [
      { hash: 'c3', parents: ['c1'] },
      { hash: 'c2', parents: ['c1'] },
      { hash: 'c1', parents: [] },
    ]
    const result = computeGraphLayout(commits)

    expect(result.nodes[0].lane).toBe(0)
    expect(result.nodes[1].lane).toBe(1)
    expect(result.nodes[2].lane).toBe(0)
  })

  it('マージコミットで複数の親レーンを持つ', () => {
    const commits = [
      { hash: 'merge', parents: ['c2', 'c1'] },
      { hash: 'c2', parents: ['base'] },
      { hash: 'c1', parents: ['base'] },
      { hash: 'base', parents: [] },
    ]
    const result = computeGraphLayout(commits)
    const mergeNode = result.nodes[0]

    // 2つの親は異なるレーンに配置
    const parentActualLanes = mergeNode.parents.map((ph) => {
      const idx = result.hashToIndex.get(ph)!
      return result.nodes[idx].lane
    })
    expect(parentActualLanes[0]).not.toBe(parentActualLanes[1])
  })

  it('hashToIndex が正しくマッピングされる', () => {
    const commits = [
      { hash: 'abc', parents: ['def'] },
      { hash: 'def', parents: [] },
    ]
    const result = computeGraphLayout(commits)
    expect(result.hashToIndex.get('abc')).toBe(0)
    expect(result.hashToIndex.get('def')).toBe(1)
  })

  it('親が表示範囲外のコミットも処理できる', () => {
    const commits = [{ hash: 'c2', parents: ['c1'] }]
    const result = computeGraphLayout(commits)
    expect(result.nodes[0].lane).toBe(0)
  })

  // --- 線の途切れ・レーン不整合の検出テスト ---

  it('first parent のレーンは一貫して継承される（線形チェーン）', () => {
    const commits = [
      { hash: 'A', parents: ['B'] },
      { hash: 'B', parents: ['C'] },
      { hash: 'C', parents: ['D'] },
      { hash: 'D', parents: [] },
    ]
    const result = computeGraphLayout(commits)
    expect(result.nodes.map((n) => n.lane)).toEqual([0, 0, 0, 0])
  })

  it('ブランチとマージで main ラインが同じレーンに留まる', () => {
    // E merges D(main) and C(branch)
    const commits = [
      { hash: 'E', parents: ['D', 'C'] },
      { hash: 'D', parents: ['B'] },
      { hash: 'C', parents: ['B'] },
      { hash: 'B', parents: ['A'] },
      { hash: 'A', parents: [] },
    ]
    const result = computeGraphLayout(commits)

    // E-D-B-A は全て同じレーン（main ライン）
    const mainLane = result.nodes[0].lane
    expect(result.nodes[1].lane).toBe(mainLane) // D
    expect(result.nodes[3].lane).toBe(mainLane) // B
    expect(result.nodes[4].lane).toBe(mainLane) // A

    // C は別レーン
    expect(result.nodes[2].lane).not.toBe(mainLane)
  })

  it('並行ブランチは別レーンに分離される', () => {
    // 2つの独立したブランチが同じ base から分岐
    const commits = [
      { hash: 'D', parents: ['C'] },
      { hash: 'B', parents: ['A'] },
      { hash: 'C', parents: ['base'] },
      { hash: 'A', parents: ['base'] },
      { hash: 'base', parents: [] },
    ]
    const result = computeGraphLayout(commits)

    // D-C は同じレーン、B-A は同じレーン、互いに別レーン
    expect(result.nodes[0].lane).toBe(result.nodes[2].lane) // D-C
    expect(result.nodes[1].lane).toBe(result.nodes[3].lane) // B-A
    expect(result.nodes[0].lane).not.toBe(result.nodes[1].lane) // D != B
  })

  it('マージ後にブランチレーンが解放される', () => {
    const commits = [
      { hash: 'F', parents: ['E'] },
      { hash: 'E', parents: ['D', 'C'] },
      { hash: 'D', parents: ['B'] },
      { hash: 'C', parents: ['B'] },
      { hash: 'B', parents: ['A'] },
      { hash: 'A', parents: [] },
    ]
    const result = computeGraphLayout(commits)

    const mainLane = result.nodes[0].lane
    expect(result.nodes[1].lane).toBe(mainLane) // E
    expect(result.nodes[2].lane).toBe(mainLane) // D
    expect(result.nodes[4].lane).toBe(mainLane) // B
    expect(result.nodes[5].lane).toBe(mainLane) // A
  })

  it('同じ parent を持つ複数の子でレーンが正しく分離される', () => {
    // main2, feat2 が共に merge の親で、共に base に合流
    const commits = [
      { hash: 'merge', parents: ['main2', 'feat2'] },
      { hash: 'main2', parents: ['main1'] },
      { hash: 'feat2', parents: ['feat1'] },
      { hash: 'main1', parents: ['base'] },
      { hash: 'feat1', parents: ['base'] },
      { hash: 'base', parents: [] },
    ]
    const result = computeGraphLayout(commits)

    // main2 と feat2 は別レーン
    expect(result.nodes[1].lane).not.toBe(result.nodes[2].lane)
    // main2-main1 は同じレーン
    expect(result.nodes[1].lane).toBe(result.nodes[3].lane)
    // feat2-feat1 は同じレーン
    expect(result.nodes[2].lane).toBe(result.nodes[4].lane)
  })

  it('親の実際のレーンが正しく参照できる（parentLanes ズレ防止）', () => {
    // C の parent が A で、B の parent も A。A は 1 つのレーンのみ。
    const commits = [
      { hash: 'C', parents: ['A'] },
      { hash: 'B', parents: ['A'] },
      { hash: 'A', parents: [] },
    ]
    const result = computeGraphLayout(commits)

    // A の実際のレーンを取得
    const aIdx = result.hashToIndex.get('A')!
    const aLane = result.nodes[aIdx].lane

    // C と B の parent の実際のレーンは両方 A のレーン
    for (const node of [result.nodes[0], result.nodes[1]]) {
      for (const parentHash of node.parents) {
        const parentIdx = result.hashToIndex.get(parentHash)
        if (parentIdx !== undefined) {
          // 親は実在し、アクセスできる
          expect(result.nodes[parentIdx].lane).toBe(aLane)
        }
      }
    }
  })
})
