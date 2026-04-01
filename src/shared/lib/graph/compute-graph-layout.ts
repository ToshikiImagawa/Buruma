import type { GraphLayout, GraphNode } from './types'

interface CommitInput {
  hash: string
  parents: string[]
}

/**
 * コミット配列からブランチグラフのレーンレイアウトを計算する
 * コミットは新しい順（トップダウン）で渡される前提
 */
export function computeGraphLayout(commits: CommitInput[]): GraphLayout {
  if (commits.length === 0) {
    return { nodes: [], maxLane: 0, hashToIndex: new Map() }
  }

  const nodes: GraphNode[] = []
  const hashToIndex = new Map<string, number>()

  // activeLanes[i] = そのレーンで次に期待するコミットハッシュ（null = 空きレーン）
  const activeLanes: (string | null)[] = []

  let maxLane = 0

  for (let i = 0; i < commits.length; i++) {
    const commit = commits[i]
    hashToIndex.set(commit.hash, i)

    // このコミットが既にレーンに予約されているか探す
    let lane = activeLanes.indexOf(commit.hash)

    if (lane === -1) {
      // 予約されていない → 空きレーンを探すか新規レーンを追加
      lane = activeLanes.indexOf(null)
      if (lane === -1) {
        lane = activeLanes.length
        activeLanes.push(null)
      }
    }

    // このコミットのレーンをクリア
    activeLanes[lane] = null

    // 同じハッシュを持つ他のレーンもクリア（マージ先が複数レーンに現れる場合）
    for (let j = 0; j < activeLanes.length; j++) {
      if (j !== lane && activeLanes[j] === commit.hash) {
        activeLanes[j] = null
      }
    }

    // 親コミットのレーン割り当て
    const parentLanes: number[] = []

    for (let p = 0; p < commit.parents.length; p++) {
      const parentHash = commit.parents[p]

      if (p === 0) {
        // first parent → 同じレーンを引き継ぐ
        activeLanes[lane] = parentHash
        parentLanes.push(lane)
      } else {
        // second+ parent → 空きレーンを探すか新規レーン
        let parentLane = activeLanes.indexOf(parentHash)
        if (parentLane === -1) {
          parentLane = activeLanes.indexOf(null)
          if (parentLane === -1) {
            parentLane = activeLanes.length
            activeLanes.push(null)
          }
          activeLanes[parentLane] = parentHash
        }
        parentLanes.push(parentLane)
      }
    }

    if (lane > maxLane) maxLane = lane
    for (const pl of parentLanes) {
      if (pl > maxLane) maxLane = pl
    }

    nodes.push({
      hash: commit.hash,
      parents: commit.parents,
      lane,
      parentLanes,
    })
  }

  return { nodes, maxLane, hashToIndex }
}
